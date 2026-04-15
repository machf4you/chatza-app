import React from "react";

export default function IconButton({
  title,
  onClick,
  state = "neutral", // "on" | "off" | "neutral"
  disabled = false,
  children, // SVG icon
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.btn,
        ...stateStyles[state],
        ...(disabled ? styles.disabled : {}),
      }}
    >
      <span style={styles.iconWrap} aria-hidden="true">
        {children}
      </span>
    </button>
  );
}

const SIZE = 44; // mobile-friendly tap target

const styles = {
  btn: {
    width: SIZE,
    height: SIZE,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.35)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    cursor: "pointer",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
  },
    iconWrap: {
-  width: 20,
-  height: 20,
+  width: 26,
+  height: 26,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
},


  disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

// Color rules:
// on = green, off = red, neutral = grey
const stateStyles = {
  on: {
    background: "rgba(0, 180, 90, 0.22)",
    border: "1px solid rgba(0, 180, 90, 0.55)",
  },
  off: {
    background: "rgba(220, 40, 40, 0.22)",
    border: "1px solid rgba(220, 40, 40, 0.55)",
  },
  neutral: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
};
