import React, { useState, useEffect } from "react";
import VideoRoom from "./components/VideoRoom.jsx";
import { Copy, Video, ArrowRight, ShieldCheck, User, Mic, PhoneOff } from "lucide-react";
import { getBrandConfig } from "./brands.js";

function randomRoomId() {
  return Math.random().toString(36).substring(2, 9);
}

function LandingPage() {
  const brand = getBrandConfig();

  useEffect(() => {
    document.title = brand.name;
  }, [brand]);

  const createRoom = () => {
    const newId = randomRoomId();
    const brandParam = brand.key !== "chatza" ? `&brand=${brand.key}` : "";
    window.location.assign(`/?room=${newId}${brandParam}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        color: "#ffffff",
        fontFamily: "'Inter', sans-serif",
        alignItems: "center",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 40px",
          width: "100%",
          maxWidth: 1400,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              background: brand.primaryColor,
              borderRadius: 6,
              padding: "4px 6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Video size={16} color="#000" />
          </div>
          <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: "-0.01em", textTransform: "capitalize" }}>
            {brand.name}
          </span>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          padding: "40px 24px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 640 }}>
          <h1
            style={{
              fontSize: "clamp(48px, 6vw, 64px)",
              fontWeight: 800,
              lineHeight: 1.1,
              margin: "0 0 24px 0",
              letterSpacing: "-0.03em",
            }}
          >
            Click.<br />
            <span style={{ color: brand.primaryColor }}>You're Live.</span>
          </h1>

          <p
            style={{
              color: "#a1a1aa",
              fontSize: "15px",
              lineHeight: 1.6,
              margin: "0 auto 32px",
            }}
          >
            Private 1-to-1 video calls.<br />
            No login. No downloads.
          </p>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <button
              onClick={createRoom}
              style={{
                background: brand.primaryColor,
                color: "#000",
                border: "none",
                padding: "12px 24px",
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Start a Private Call
              <ArrowRight size={18} />
            </button>
            <span style={{ color: "#52525b", fontSize: 12, fontWeight: 500 }}>
              No Account Required
            </span>
          </div>
        </div>

        {/* Visual Mockup Area */}
        <div style={{
          marginTop: 64,
          background: "#131315",
          border: "1px solid #27272a",
          borderRadius: 16,
          padding: 20,
          width: "100%",
          maxWidth: 500,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}>
          <div style={{ display: "flex", gap: 16, height: 260 }}>
            {/* You Box */}
            <div style={{
              flex: 1,
              background: "#27272a",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: brand.accentColor,
                border: `2px solid ${brand.primaryColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <User size={20} color={brand.primaryColor} />
              </div>
              <span style={{ color: "#a1a1aa", fontSize: 13, fontWeight: 500 }}>You</span>
            </div>

            {/* Guest Box */}
            <div style={{
              flex: 1,
              background: "#27272a",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "transparent",
                border: "2px solid #52525b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <User size={20} color="#52525b" />
              </div>
              <span style={{ color: "#a1a1aa", fontSize: 13, fontWeight: 500 }}>Your Guest</span>
            </div>
          </div>

          {/* Mock Controls */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: brand.primaryColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Video size={14} color="#000" />
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: brand.primaryColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mic size={14} color="#000" />
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PhoneOff size={14} color="#fff" />
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div style={{ marginTop: 64, textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 10px 0" }}>Made for one conversation at a time</h2>
          <p style={{ color: "#a1a1aa", fontSize: 13, margin: 0 }}>Simple, private video calls designed to keep things personal.</p>
        </div>
      </main>
    </div>
  );
}

function App() {
   const [currentPath, setCurrentPath] = useState(window.location.pathname + window.location.search);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname + window.location.search);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

 // Route: /?room=XYZ → video call
const params = new URLSearchParams(window.location.search);
const room = params.get("room");

if (room) {
  return (
    <VideoRoom
      roomId={room}
      onLeave={() => {
        window.location.href = "/";
      }}
    />
  );
}

// Default route → landing page
return <LandingPage />;
}

export default App;