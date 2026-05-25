// client/src/hooks/useWebRTC.js
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const getSignalingUrl = () => {
  const envUrl = import.meta.env.VITE_SIGNALING_URL;
  
  // If we are running in production, use the environment variable
  if (import.meta.env.PROD) {
    return envUrl || window.location.origin;
  }

  // In local development:
  // If the window is loaded via localhost or a LAN IP, connect directly to port 3000 on that same host
  const hostname = window.location.hostname;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
  const isLan = hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.startsWith("172.");

  if (isLocalHost || isLan) {
    return `http://${hostname}:3000`;
  }

  // Fallback to the environment variable or localhost
  return envUrl || "http://localhost:3000";
};

const SIGNALING_URL = getSignalingUrl();

const ICE_STUN_URL =
  import.meta.env.VITE_ICE_STUN_URL || "stun:stun.l.google.com:19302";

const ICE_TURN_URL = import.meta.env.VITE_ICE_TURN_URL || "";
const ICE_TURN_USERNAME = import.meta.env.VITE_ICE_TURN_USERNAME || "";
const ICE_TURN_CREDENTIAL = import.meta.env.VITE_ICE_TURN_CREDENTIAL || "";

const FORCE_RELAY =
  String(import.meta.env.VITE_FORCE_RELAY || "").toLowerCase() === "true";

function buildIceServers() {
  const servers = [];
  if (ICE_STUN_URL) servers.push({ urls: ICE_STUN_URL });

  const turnUrls = (ICE_TURN_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (turnUrls.length) {
    servers.push({
      urls: turnUrls,
      username: ICE_TURN_USERNAME,
      credential: ICE_TURN_CREDENTIAL,
    });
  }

  return servers;
}

export function useWebRTC(roomId, { name } = {}) {
  console.log("useWebRTC start", roomId);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]); // [{peerId, stream, name, isHost}]
  const [messages, setMessages] = useState([]);
  const [iceState, setIceState] = useState("new");
  const [signalingConnected, setSignalingConnected] = useState(false);

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);

  const pcsRef = useRef(new Map()); // peerId -> RTCPeerConnection
  const remoteStreamsRef = useRef(new Map()); // peerId -> MediaStream
  const peersRef = useRef(new Map()); // peerId -> { name, isHost }
  const pendingCandidatesRef = useRef(new Map()); // peerId -> ICE[]
  const cleanupRef = useRef(() => { });

  // keep my resolved display name for chat + join-room
  const myNameRef = useRef("Guest");

  const log = (...args) => console.log("[WebRTC]", ...args);
  const warn = (...args) => console.warn("[WebRTC]", ...args);
  const err = (...args) => console.error("[WebRTC]", ...args);

  function syncRemoteStreamsState() {
    const arr = [];
    for (const [peerId, stream] of remoteStreamsRef.current.entries()) {
      const meta = peersRef.current.get(peerId) || {};
      arr.push({ peerId, stream, ...meta });
    }
    setRemoteStreams(arr);
  }

  async function ensureLocalMedia() {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }

  function stopLocalTracks() {
    try {
      localStreamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch { }
    localStreamRef.current = null;
    setLocalStream(null);
  }

  function closePeer(peerId) {
    const pc = pcsRef.current.get(peerId);
    if (pc) {
      try {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.oniceconnectionstatechange = null;
        pc.onsignalingstatechange = null;
        pc.close();
      } catch { }
    }
    pcsRef.current.delete(peerId);
    remoteStreamsRef.current.delete(peerId);
    peersRef.current.delete(peerId);
    pendingCandidatesRef.current.delete(peerId);
    syncRemoteStreamsState();
  }

  function closeAllPeers() {
    for (const peerId of Array.from(pcsRef.current.keys())) closePeer(peerId);
    pcsRef.current = new Map();
  }

  async function addLocalTracksToPC(pc) {
    if (!pc) return;
    const stream = await ensureLocalMedia();
    stream.getTracks().forEach((track) => {
      const alreadyAdded = pc
        .getSenders()
        .some((sender) => sender && sender.track === track);
      if (!alreadyAdded) {
        try {
          pc.addTrack(track, stream);
        } catch { }
      }
    });
  }

  function getOrCreatePendingList(peerId) {
    let list = pendingCandidatesRef.current.get(peerId);
    if (!list) {
      list = [];
      pendingCandidatesRef.current.set(peerId, list);
    }
    return list;
  }

  async function flushPendingCandidates(peerId) {
    const pc = pcsRef.current.get(peerId);
    if (!pc || !pc.remoteDescription) return;

    const list = pendingCandidatesRef.current.get(peerId) || [];
    if (!list.length) return;

    pendingCandidatesRef.current.set(peerId, []);
    for (const c of list) {
      try {
        await pc.addIceCandidate(c);
      } catch (e) {
        warn("Failed to add pending ICE candidate:", peerId, e);
      }
    }
  }

  function createPeerConnection(peerId) {
    if (!peerId) return null;
    if (pcsRef.current.has(peerId)) return pcsRef.current.get(peerId);

    const pc = new RTCPeerConnection({
      iceServers: buildIceServers(),
      iceTransportPolicy: FORCE_RELAY ? "relay" : "all",
    });

    pcsRef.current.set(peerId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("webrtc-ice", {
          roomId,
          to: peerId,
          from: socketRef.current.id,
          candidate: event.candidate,
        });
      }
    };

    // ✅ More reliable: use event.streams[0] if provided
    pc.ontrack = (event) => {
      const incoming = event?.streams?.[0];
      if (incoming) {
        remoteStreamsRef.current.set(peerId, incoming);
      } else {
        // fallback (rare)
        let ms = remoteStreamsRef.current.get(peerId);
        if (!ms) {
          ms = new MediaStream();
          remoteStreamsRef.current.set(peerId, ms);
        }
        ms.addTrack(event.track);
      }
      syncRemoteStreamsState();
    };

    pc.oniceconnectionstatechange = () => {
      setIceState(pc.iceConnectionState || "new");
      log("ICE state:", peerId, pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      log("PC connection state:", peerId, pc.connectionState);
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        closePeer(peerId);
      }
    };

    pc.onsignalingstatechange = () => {
      log("Signaling state:", peerId, pc.signalingState);
    };

    return pc;
  }

  const sendChatMessage = (text) => {
    const socket = socketRef.current;
    if (!socket || !text?.trim()) return;

    const payload = {
      roomId,
      message: text,
      ts: Date.now(),
      from: socket.id,
      name: myNameRef.current || "Guest",
    };

    socket.emit("chat-message", payload);
    setMessages((prev) => [...prev, { ...payload, self: true }]);
  };

  useEffect(() => {
    let canceled = false;

    async function start() {
      if (!SIGNALING_URL) return;
      if (!roomId) return;

      // Resolve my display name (guest param wins, else localStorage host name, else provided name)
      const params = new URLSearchParams(window.location.search);
      const guestParam = (params.get("guest") || "").trim();
      const storedHostName = (localStorage.getItem("chatza_hostName") || "").trim();

      myNameRef.current =
        guestParam || storedHostName || (name || "").trim() || "Mac";

      try {
        await ensureLocalMedia();
        if (canceled) return;
      } catch (e) {
        err("getUserMedia failed:", e);
        return;
      }

      const socket = io(SIGNALING_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
      });
      socketRef.current = socket;

      socket.on("connect", () => console.log("SOCKET CONNECTED", socket.id));
      socket.on("connect_error", (e) =>
        console.log("SOCKET CONNECT ERROR", e?.message || e, e)
      );
      socket.on("disconnect", (r) => console.log("SOCKET DISCONNECT", r));

      socket.on("connect", () => {
        setSignalingConnected(true);
        socket.emit("join-room", { roomId, name: myNameRef.current });
      });

      socket.on("disconnect", () => {
        setSignalingConnected(false);
      });

      // ✅ JOINER OFFERS to existing peers (mesh)
      socket.on("room-peers", async ({ peers }) => {
        if (!Array.isArray(peers)) return;

        for (const p of peers) {
          if (!p?.peerId || p.peerId === socket.id) continue;

          peersRef.current.set(p.peerId, {
            name: p.name || "Guest",
            isHost: !!p.isHost,
          });

          const pc = createPeerConnection(p.peerId);

          // ✅ ensure our tracks are on THIS pc
          await addLocalTracksToPC(pc);

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit("webrtc-offer", {
            roomId,
            to: p.peerId,
            from: socket.id,
            sdp: offer,
          });
        }

        syncRemoteStreamsState();
      });

      socket.on("peer-joined", ({ peerId, name: peerName, isHost }) => {
        if (!peerId || peerId === socket.id) return;

        peersRef.current.set(peerId, {
          name: peerName || "Guest",
          isHost: !!isHost,
        });

        syncRemoteStreamsState();
      });

      socket.on("peer-left", ({ peerId }) => {
        if (!peerId) return;
        warn("Peer left:", peerId);
        closePeer(peerId);
      });

      // ✅ IMPORTANT FIX: Answer path ordering
      socket.on("webrtc-offer", async ({ from, sdp }) => {
        try {
          if (!from || from === socket.id || !sdp?.type) return;

          const pc = createPeerConnection(from);

          // ✅ set remote first
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));

          // ✅ add any queued ICE now that remoteDescription exists
          await flushPendingCandidates(from);

          // ✅ THEN ensure our tracks are attached BEFORE creating answer
          await addLocalTracksToPC(pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("webrtc-answer", {
            roomId,
            to: from,
            from: socket.id,
            sdp: answer,
          });
        } catch (e) {
          err("Error handling webrtc-offer:", e);
        }
      });

      socket.on("webrtc-answer", async ({ from, sdp }) => {
        try {
          if (!from || from === socket.id || !sdp?.type) return;
          const pc = pcsRef.current.get(from);
          if (!pc) return;

          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          await flushPendingCandidates(from);
        } catch (e) {
          err("Error handling webrtc-answer:", e);
        }
      });

      socket.on("webrtc-ice", async ({ from, candidate }) => {
        try {
          if (!from || from === socket.id || !candidate) return;

          const pc = pcsRef.current.get(from);
          const ice = new RTCIceCandidate(candidate);

          if (!pc || !pc.remoteDescription) {
            getOrCreatePendingList(from).push(ice);
            return;
          }

          await pc.addIceCandidate(ice);
        } catch (e) {
          warn("Error adding ICE candidate:", e);
        }
      });

      socket.on("chat-message", (payload) => {
        const from = payload?.from;
        if (from && from === socket.id) return;
        setMessages((prev) => [...prev, payload]);
      });

      cleanupRef.current = () => {
        try {
          socket.off("connect");
          socket.off("disconnect");
          socket.off("room-peers");
          socket.off("peer-joined");
          socket.off("peer-left");
          socket.off("webrtc-offer");
          socket.off("webrtc-answer");
          socket.off("webrtc-ice");
          socket.off("chat-message");
          socket.disconnect();
        } catch { }

        socketRef.current = null;
        closeAllPeers();
        stopLocalTracks();

        remoteStreamsRef.current = new Map();
        peersRef.current = new Map();
        pendingCandidatesRef.current = new Map();
        setRemoteStreams([]);
        setIceState("new");
        setSignalingConnected(false);
      };
    }

    start();

    return () => {
      canceled = true;
      cleanupRef.current?.();
    };
  }, [roomId]);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef(null);

  // Helper to replace video track safely
  async function replaceVideoTrack(newTrack) {
    if (!newTrack) return;

    // 1. Local
    const local = localStreamRef.current;
    if (local) {
      // stop/remove old video track(s) from local stream only if they are screen tracks?
      // Actually, for local preview, we just want to swap them out in the stream object
      // so the UI updates. But we must be careful not to stop the camera track if we want to reuse it later.
      // However, a simple way is: remove old video track from stream, add new one.
      const oldVideoTracks = local.getVideoTracks();
      oldVideoTracks.forEach(t => {
        local.removeTrack(t);
        // Don't stop it if it's the camera track and we want to resume it?
        // Actually, usually we stop camera when sharing screen to save bandwidth/confusion,
        // or we keep it open but just not sending.
        // Let's stop the *current* track if it's being replaced.
        // If we want to resume camera later, we get a NEW camera track.
        t.stop();
      });
      local.addTrack(newTrack);
      // Force state update to refresh UI video element
      setLocalStream(new MediaStream(local.getTracks()));
    }

    // 2. Remotes (Senders)
    for (const pc of pcsRef.current.values()) {
      const senders = pc.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender) {
        try {
          await videoSender.replaceTrack(newTrack);
        } catch (e) {
          warn("replaceTrack failed", e);
        }
      } else {
        // If no video sender (e.g. audio only start), we might need to add one. 
        // But for simplicity, assume video started initially.
        // If we need to add a track:
        // pc.addTrack(newTrack, local);
      }
    }
  }

  async function startScreenShare() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = stream.getVideoTracks()[0];

      screenStreamRef.current = stream;
      setIsScreenSharing(true);

      // If user stops sharing via browser UI
      screenTrack.onended = () => {
        stopScreenShare();
      };

      await replaceVideoTrack(screenTrack);

    } catch (e) {
      console.error("Failed to share screen", e);
    }
  }

  async function stopScreenShare() {
    if (!isScreenSharing) return;

    // Stop screen track
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);

    // Get camera back
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const camTrack = stream.getVideoTracks()[0];

      // Also update audio track if needed, but usually audio persists. 
      // However, getUserMedia returns a new audio track too. 
      // Ideally we only replace video.
      // Let's just get video.
      // await replaceVideoTrack(camTrack);

      // Actually, we might have lost the audio track if we stopped the whole stream above?
      // In replaceVideoTrack above, we did `t.stop()` on old tracks. 

      // Improved logic:
      // When switching to screen: 
      // 1. Get screen stream.
      // 2. Replace sender track.
      // 3. Update local stream for preview.

      // Let's refine replaceVideoTrack to ONLY replace video track and NOT stop audio.

      await replaceVideoTrack(camTrack);

    } catch (e) {
      console.error("Failed to restart camera", e);
    }
  }

  return {
    localStream,
    remoteStreams,
    iceState,
    signalingConnected,
    messages,
    sendMessage: (text) => sendChatMessage(text),
    startScreenShare,
    stopScreenShare,
    isScreenSharing
  };
}
