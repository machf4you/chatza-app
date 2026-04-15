import React, { useEffect, useMemo, useRef, useState } from "react";
import { getBrandConfig } from "../brands.js";

export default function VideoGrid({
  localStream,
  remoteStreams = [], // [{ peerId, stream, name, isHost }]
  iceState,
  signalingConnected,
  hostName = "Mac",
  guestName = "Guest",
  copyInvite,
  inviteUrl,
  messages = [],
  sendMessage,
  layoutMode = "auto",
}) {
  const brand = getBrandConfig();
  const styles = useMemo(() => getStyles(brand), [brand]);
  const localRef = useRef(null);
  const remoteVideoRefs = useRef(new Map()); // peerId -> video element

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [text, setText] = useState("");

  const urlGuest =
    new URLSearchParams(window.location.search).get("guest") || "";
  const isGuestLink = !!urlGuest;

  const [hostNameLocal, setHostNameLocal] = useState(
    localStorage.getItem("chatza_hostName") || hostName
  );

  // host-only prompt/store
  useEffect(() => {
    if (isGuestLink) return;

    const stored = localStorage.getItem("chatza_hostName");
    if (stored) {
      setHostNameLocal(stored);
      return;
    }

    if (!hostName || hostName === "Mac") {
      const n = prompt("Your name?")?.trim();
      const finalName = n || "Mac";
      localStorage.setItem("chatza_hostName", finalName);
      setHostNameLocal(finalName);
    } else {
      localStorage.setItem("chatza_hostName", hostName);
      setHostNameLocal(hostName);
    }
  }, [isGuestLink, hostName]);

  const effectiveHostName = (
    (isGuestLink ? hostName : hostNameLocal) ||
    hostName ||
    "Mac"
  ).trim();

  const myGuestName = (urlGuest || guestName || "Guest").trim();

  const hostLabel = `${effectiveHostName} • Host`;

  // attach local
  useEffect(() => {
    if (localRef.current) {
      localRef.current.srcObject = localStream || null;
      localRef.current.play?.().catch(() => {});
    }
  }, [localStream]);

  // attach remotes
  useEffect(() => {
    for (const p of remoteStreams) {
      const el = remoteVideoRefs.current.get(p.peerId);
      if (el) {
        el.srcObject = p.stream || null;
        el.play?.().catch(() => {});
      }
    }
  }, [remoteStreams]);

  // mic/cam toggle
  useEffect(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => (t.enabled = micOn));
    localStream.getVideoTracks().forEach((t) => (t.enabled = camOn));
  }, [localStream, micOn, camOn]);

  const endCall = () => {
    try {
      localStream?.getTracks()?.forEach((t) => t.stop());
    } catch {}
    window.location.href = "/";
  };

  const handleSend = () => {
    const msg = text.trim();
    if (!msg) return;
    sendMessage?.(msg);
    setText("");
  };

  const handleInvite = () => {
    const g = prompt("Guest name?")?.trim();

    if (inviteUrl) {
      const url = g
        ? `${inviteUrl}${
            inviteUrl.includes("?") ? "&" : "?"
          }guest=${encodeURIComponent(g)}`
        : inviteUrl;

      try {
        navigator.clipboard?.writeText(url);
      } catch {}
      return;
    }

    copyInvite?.();
  };

  // ✅ RULES:
  // Tile 1 = Host
  // Tile 2/3/4 = Guests ordered consistently for everyone (by guest name)
  const tiles = useMemo(() => {
    const rem = (remoteStreams || []).slice();

    const hostPeer = rem.find((p) => p?.isHost) || null;

    const otherPeers = rem
      .filter((p) => p && (!hostPeer || p.peerId !== hostPeer.peerId))
      .map((p) => ({
        ...p,
        name: (p.name && String(p.name).trim()) || "Guest",
      }));

    const t = [];

    if (!isGuestLink) {
      // HOST VIEW
      // Tile 1: Host (local)
      t.push({ kind: "local", key: "host-local", label: hostLabel });

      // Tile 2/3/4: guests sorted by name
      const guests = otherPeers
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));

      for (const p of guests.slice(0, 3)) {
        t.push({
          kind: "remote",
          key: p.peerId,
          peerId: p.peerId,
          label: p.name,
        });
      }
    } else {
      // GUEST VIEW
      // Tile 1: Host (remote)
      if (hostPeer) {
        t.push({
          kind: "remote",
          key: `host-${hostPeer.peerId}`,
          peerId: hostPeer.peerId,
          label: hostLabel,
        });
      } else {
        t.push({ kind: "empty", key: "host-empty", label: hostLabel });
      }

      // Tile 2/3/4: all guests (including me) sorted by name
      const guestTiles = [
        { kind: "local", key: "guest-local", label: myGuestName },
        ...otherPeers.map((p) => ({
          kind: "remote",
          key: p.peerId,
          peerId: p.peerId,
          label: p.name,
        })),
      ].sort((a, b) => String(a.label).localeCompare(String(b.label)));

      for (const g of guestTiles.slice(0, 3)) {
        t.push(g);
      }
    }

    while (t.length < 4) {
      t.push({ kind: "empty", key: `empty-${t.length}`, label: "Empty" });
    }

    return t.slice(0, 4);
  }, [remoteStreams, isGuestLink, hostLabel, myGuestName]);

  // Force 4 screens (2x2 grid) always as requested
  const useGrid4 = true;

  return (
    <div style={styles.wrapper}>
      <div style={styles.stage}>
        <div style={styles.stageInner}>
          {useGrid4 ? (
            <div style={styles.grid4}>
              {tiles.map((tile) => (
                <Tile key={tile.key} label={tile.label} styles={styles}>
                  {tile.kind === "local" ? (
                    <video
                      ref={localRef}
                      autoPlay
                      muted
                      playsInline
                      style={{ ...styles.video, transform: "scaleX(-1)" }}
                    />
                  ) : tile.kind === "remote" ? (
                    <video
                      ref={(el) => {
                        if (!tile.peerId) return;
                        if (!el) {
                          remoteVideoRefs.current.delete(tile.peerId);
                          return;
                        }
                        remoteVideoRefs.current.set(tile.peerId, el);
                      }}
                      autoPlay
                      playsInline
                      style={styles.video}
                    />
                  ) : (
                    <div style={styles.emptyOverlay}>—</div>
                  )}
                </Tile>
              ))}
            </div>
          ) : (
            <div style={styles.row}>
              {tiles.slice(0, 2).map((tile) => (
                <Tile key={tile.key} label={tile.label} styles={styles}>
                  {tile.kind === "local" ? (
                    <video
                      ref={localRef}
                      autoPlay
                      muted
                      playsInline
                      style={{ ...styles.video, transform: "scaleX(-1)" }}
                    />
                  ) : tile.kind === "remote" ? (
                    <video
                      ref={(el) => {
                        if (!tile.peerId) return;
                        if (!el) {
                          remoteVideoRefs.current.delete(tile.peerId);
                          return;
                        }
                        remoteVideoRefs.current.set(tile.peerId, el);
                      }}
                      autoPlay
                      playsInline
                      style={styles.video}
                    />
                  ) : (
                    <div style={styles.emptyOverlay}>—</div>
                  )}
                </Tile>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={styles.chatWrap}>
        <div style={styles.chatBox}>
          <div style={styles.chatMini}>
            {messages.slice(-3).map((m, i) => (
              <div
                key={i}
                style={{
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {m?.name ? `${m.name}: ` : ""}
                {m.message}
              </div>
            ))}
          </div>

          <div style={styles.chatInputRow}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={styles.chatInput}
              placeholder="Message…"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend} style={styles.chatSend}>
              Send
            </button>
          </div>
        </div>
      </div>

      <div style={styles.bottomBar}>
        <button onClick={handleInvite} style={styles.btn}>
          <IconInvite />
        </button>

        <button
          onClick={() => setCamOn((v) => !v)}
          style={camOn ? styles.btnOn : styles.btnOff}
        >
          <IconCam />
        </button>

        <button
          onClick={() => setMicOn((v) => !v)}
          style={micOn ? styles.btnOn : styles.btnOff}
        >
          <IconMic off={!micOn} />
        </button>

        <button onClick={endCall} style={styles.btnEnd}>
          <IconEnd />
        </button>
      </div>
    </div>
  );
}

function Tile({ children, label, styles }) {
  return (
    <div style={styles.cell}>
      <div style={styles.tile}>
        <div style={styles.namePill}>{label}</div>
        {children}
      </div>
    </div>
  );
}

const IconInvite = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M19 8v6M16 11h6" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const IconCam = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="6"
      width="13"
      height="12"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M16 10l5-3v10l-5-3z" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const IconMic = ({ off }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <g transform="translate(0,2)">
      <rect
        x="9"
        y="2"
        width="6"
        height="12"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M5 10a7 7 0 0 0 14 0"
        stroke="currentColor"
        strokeWidth="2"
      />
      {off && <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2" />}
    </g>
  </svg>
);

export const IconEnd = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
    <path
      d="M6.6 10.8c1.6 3.1 3.5 5 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2
      1.3.5 2.7.7 4.2.7.6 0 1 .4 1 1V21c0 .6-.4 1-1 1C10.3 22 2 13.7 2 3
      c0-.6.4-1 1-1h3.9c.6 0 1 .4 1 1 0 1.5.2 2.9.7 4.2.1.4 0 .9-.2 1.2l-2.8 2.4z"
      fill="currentColor"
    />
    <line
      x1="4"
      y1="20"
      x2="20"
      y2="4"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

const getStyles = (brand) => ({
  wrapper: {
    position: "fixed",
    inset: 0,
    background: "black",
    display: "flex",
    flexDirection: "column",
  },
  stage: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    padding: 10,
    minHeight: 0,
  },
  stageInner: {
    width: "100%",
    maxWidth: 1100,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    margin: "0 auto",
    minHeight: 0,
  },
  grid4: {
    width: "100%",
    height: "100%",
    display: "grid",
    gap: 10,
    flex: 1,
    minHeight: 0,
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
  },
  row: {
    width: "100%",
    height: "100%",
    display: "flex",
    gap: 10,
    minHeight: 0,
  },
  cell: {
    padding: 3,
    background: brand.primaryColor,
    borderRadius: 16,
    flex: 1,
    display: "flex",
    minHeight: 0,
  },
  tile: {
    position: "relative",
    width: "100%",
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    background: "black",
    minHeight: 0,
  },
  namePill: {
    position: "absolute",
    left: 12,
    bottom: 12,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.5)",
    color: "white",
    fontSize: 13,
    zIndex: 10,
  },
  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  emptyOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.35)",
    fontSize: 44,
    fontWeight: 700,
    zIndex: 5,
  },
  chatWrap: {
    padding: 12,
    display: "flex",
    justifyContent: "center",
  },
  chatBox: {
    width: "100%",
    maxWidth: 1100,
    background: "#000",
    borderRadius: 18,
    border: "1px solid " + brand.primaryColor,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },
  chatMini: {
    padding: "6px 10px",
    fontSize: 12,
    color: "white",
    background: "#000",
    lineHeight: "16px",
    minHeight: 48,
  },
  chatInputRow: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    background: "#000",
    padding: "8px 10px",
  },
  chatInput: {
    flex: 1,
    background: "#000",
    color: "white",
    border: "none",
    padding: "6px 10px",
    outline: "none",
    fontSize: 14,
  },
  chatSend: {
    padding: "0 20px",
    height: 40,
    border: "none",
    borderRadius: 999,
    background: brand.primaryColor,
    color: "white",
    fontWeight: 700,
    marginLeft: 8,
  },
  bottomBar: {
    height: 74,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  btn: {
    width: 46,
    height: 46,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.1)",
    color: "white",
  },
  btnOn: {
    width: 46,
    height: 46,
    borderRadius: 999,
    border: "none",
    background: brand.primaryColor,
    color: "white",
  },
  btnOff: {
    width: 46,
    height: 46,
    borderRadius: 999,
    border: "none",
    background: "#ef4444",
    color: "white",
  },
  btnEnd: {
    width: 52,
    height: 52,
    borderRadius: 999,
    border: "none",
    background: "#dc2626",
    color: "white",
  },
});
