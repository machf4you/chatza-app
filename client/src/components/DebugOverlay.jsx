import React from 'react';

// __BUILD_ID__ is injected by Vite config
const BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'DEV';

export function DebugOverlay({ signalingConnected, iceState, relayForced, connectionState }) {
    return (
        <div className="debug-overlay">
            <div>BUILDZZZ: {BUILD_ID}</div>

            <div style={{ color: signalingConnected ? '#4ade80' : '#ef4444' }}>
                SIG: {signalingConnected ? 'CON' : 'DIS'}
            </div>
            <div>ICE: {iceState}</div>
            <div>CON: {connectionState}</div>
            {relayForced && <div style={{ color: 'orange' }}>RELAY: FORCED</div>}
        </div>
    );
}
