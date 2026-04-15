import React, { useMemo } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import VideoGrid from "./VideoGrid";

import { getBrandConfig } from "../brands.js";

function buildInviteUrl(roomId) {
  const LAN_HOST = import.meta.env.VITE_LAN_HOST || "192.168.1.21";
  const u = new URL(window.location.href);

  const brand = getBrandConfig();
  u.pathname = "/";
  u.search = "?room=" + roomId;
  if (brand.key !== "chatza") {
    u.searchParams.set("brand", brand.key);
  }

  if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
    u.hostname = LAN_HOST;
  }
  return u.toString();
}

export function VideoRoom({ roomId, onLeave }) {
  const {
    localStream,
    remoteStreams,
    iceState,
    signalingConnected,
    messages,
    sendMessage,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
  } = useWebRTC(roomId);

  const inviteUrl = useMemo(() => buildInviteUrl(roomId), [roomId]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 999999,
      }}
    >
      <VideoGrid
        localStream={localStream}
        remoteStreams={remoteStreams}
        iceState={iceState}
        signalingConnected={signalingConnected}
        inviteUrl={inviteUrl}
        messages={messages}
        sendMessage={sendMessage}
        startScreenShare={startScreenShare}
        stopScreenShare={stopScreenShare}
        isScreenSharing={isScreenSharing}
        onLeave={onLeave}
        copyInvite={() => {
          try {
            navigator.clipboard?.writeText(inviteUrl);
          } catch {}
        }}
      />
    </div>
  );
}

export default VideoRoom;
