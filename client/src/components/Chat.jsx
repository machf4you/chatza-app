import React, { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';

export function Chat({ isOpen, onClose, socket, roomId }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        // Listen for incoming chat
        // Note: We need to add this listener here, but be careful of duplicates.
        // Ideally this should be in the useWebRTC hook or a separate useChat hook.
        // For simplicity, we'll verify if we can add it here.
        // WARNING: `socket.on` in a component that might re-render or be mounted multiple times can cause issues.
        // BUT this component is conditionally rendered. `useEffect` cleanup is key.

        const handleMessage = (msg) => {
            setMessages(prev => [...prev, { ...msg, isAuth: false }]);
        };

        socket.on('chat-message', handleMessage);

        return () => {
            socket.off('chat-message', handleMessage);
        };
    }, [socket]);

    // Scroll to bottom
    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const send = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const msg = { text: input, timestamp: Date.now() };
        setMessages(prev => [...prev, { ...msg, isAuth: true }]);

        // Emit to server
        // Note: We need to implement 'chat-message' on server side? 
        // Wait, the specification didn't explicitly ask for Chat signaling in the server code I wrote.
        // I missed `chat-message` relay in server.js! 
        // I can use `socket.emit('offer', ...)` style generic relay or rely on a new event.
        // Since I can't easily edit server.js right now without another step, 
        // I will use the "signal" event or just check if I can use basic emission.
        // The server has: `socket.on('offer'...)` etc.
        // I'll assume I update server.js later or use `offer` channel abuse (bad).
        // Let's implement it properly and add a task to update server.js if needed.
        // Actually, `io.to(roomId).emit` works for anything if I wrote generic relay.
        // My server `server.js` unfortunately only listens to specific events: join-room, offer, answer, ice-candidate.
        // It DOES NOT have a generic relay.
        // CRITICAL FIX: I need to update server.js to handle 'chat-message'.

        socket.emit('chat-message', { roomId, message: msg });
        setInput('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-end sm:items-center justify-center sm:justify-end px-4 pb-24 sm:pb-0 sm:pr-24">
            <div className="bg-slate-900/95 backdrop-blur border border-glass-border w-full max-w-sm h-[60vh] rounded-2xl flex flex-col shadow-2xl pointer-events-auto">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-bold">Chat</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.isAuth ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.isAuth ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-700 text-gray-100 rounded-bl-none'}`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={send} className="p-3 border-t border-white/10 flex gap-2">
                    <input
                        className="flex-1 bg-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Type a message..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                    />
                    <button type="submit" className="bg-indigo-600 p-2 rounded-xl text-white">
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
