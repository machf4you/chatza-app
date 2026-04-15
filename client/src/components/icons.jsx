import React from "react";

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function MicIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" {...props}>
      <path {...common} d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" />
      <path {...common} d="M19 11a7 7 0 0 1-14 0" />
      <path {...common} d="M12 18v3" />
      <path {...common} d="M8 21h8" />
    </svg>
  );
}

export function MicOffIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" {...props}>
      <path {...common} d="M9 9v2a3 3 0 0 0 4.8 2.4" />
      <path {...common} d="M15 9V6a3 3 0 0 0-5.1-2.1" />
      <path {...common} d="M19 11a7 7 0 0 1-3 5.7" />
      <path {...common} d="M5 11a7 7 0 0 0 9 6.7" />
      <path {...common} d="M12 18v3" />
      <path {...common} d="M8 21h8" />
      <path {...common} d="M4 4l16 16" />
    </svg>
  );
}

export function CamIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" {...props}>
      <path {...common} d="M4 7h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
      <path {...common} d="M16 10l6-3v10l-6-3" />
    </svg>
  );
}

export function CamOffIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" {...props}>
      <path {...common} d="M4 7h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6" />
      <path {...common} d="M2 9v6a2 2 0 0 0 2 2" />
      <path {...common} d="M16 10l6-3v10l-4-2" />
      <path {...common} d="M4 4l16 16" />
    </svg>
  );
}

export function ScreenIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" {...props}>
      <path {...common} d="M4 5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path {...common} d="M8 21h8" />
      <path {...common} d="M12 18v3" />
    </svg>
  );
}

export function PhoneOffIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 13c1.5 1.5 3.5 2.8 5.5 3.4l1.5-1.5a2 2 0 0 1 2.1-.5l2.2.9a2 2 0 0 1 1.2 2.1c-.3 2-2 3.6-4.1 3.6C11 23 1 13 1 4.6 1 2.5 2.6.8 4.6.5a2 2 0 0 1 2.1 1.2l.9 2.2a2 2 0 0 1-.5 2.1L5.6 7.5C6.2 9.5 7.5 11.5 9 13Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M4 4l16 16"
      />
    </svg>
  );
}
