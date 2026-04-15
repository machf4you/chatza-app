import React, { useState } from "react";
import IconButton from "./IconButton";
import { MicIcon, MicOffIcon, CamIcon, CamOffIcon, PhoneOffIcon } from "./icons";

// Simple chat icon (SVG) to avoid lucide
function ChatIcon(props) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
      <path {...common} d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

export function Controls({ onToggleMic, onToggleCam, onToggleChat, onEndCall }) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const handleMic = () => {
    setMicOn((v) => !v);
    onToggleMic();
  };

  const handleCam = () => {
    setCamOn((v) => !v);
    onToggleCam();
  };

  return (
    <div style={{ ...styles.wrap, background: "yellow" }} className="controls-bar glass">
      <div style={styles.row}>
<div style={{ color: "red", fontSize: 12 }}>LIVE CONTROLS</div>

        <IconButton
          title={micOn ? "Mute microphone" : "Unmute microphone"}
          onClick={handleMic}
          state={micOn ? "on" : "off"}
        >
          {micOn ? <MicIcon /> : <MicOffIcon />}
        </IconButton>

        <IconButton
          title={camOn ? "Turn camera off" : "Turn camera on"}
          onClick={handleCam}
          state={camOn ? "on" : "off"}
        >
          {camOn ? <CamIcon /> : <CamOffIcon />}
        </IconButton>

        <IconButton title="Chat" onClick={onToggleChat} state="neutral">
          <ChatIcon />
        </IconButton>

        <IconButton title="END CALL TEST" onClick={onEndCall} state="off">
          <PhoneOffIcon />
        </IconButton>
      </div>
    </div>
  );
}

const styles = {
  // Mobile-first: no wrapping, centered, safe padding
  wrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    padding: "10px 10px calc(10px + env(safe-area-inset-bottom))",
  },
  row: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "nowrap",     // NO WRAPPING
    whiteSpace: "nowrap",   // extra safety
  },
};
