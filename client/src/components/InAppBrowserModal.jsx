import React from 'react';
import { Copy, Chrome } from 'lucide-react';

export const isInAppBrowser = () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    // Patterns for FB, Insta, WhatsApp, Line, Twitter, etc.
    return (ua.indexOf("FBAN") > -1) ||
        (ua.indexOf("FBAV") > -1) ||
        (ua.indexOf("Instagram") > -1) ||
        (ua.indexOf("WhatsApp") > -1) ||
        (ua.indexOf("Line") > -1) ||
        (ua.indexOf("Twitter") > -1) ||
        (ua.indexOf("wv") > -1 && ua.indexOf("Android") > -1); // Generic Android WebView
};

export function InAppBrowserModal({ onProceed }) {
    const currentUrl = window.location.href;

    const handleCopy = () => {
        navigator.clipboard.writeText(currentUrl).then(() => {
            alert("Link copied!");
        });
    };

    const handleOpenChrome = () => {
        // Android Intent
        // intent://<url>#Intent;scheme=https;package=com.android.chrome;end
        const cleanUrl = currentUrl.replace(/^https?:\/\//, '');
        window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    };

    const isAndroid = /Android/i.test(navigator.userAgent);

    return (
        <div className="iab-modal">
            <div className="glass p-6 rounded-2xl max-w-sm w-full flex flex-col items-center gap-4 border border-red-500/30">
                <h2 className="text-xl font-bold text-white">Open in your browser to join</h2>

                <p className="text-gray-300 text-sm">
                    This link was opened inside an in-app browser.<br />
                    Video calls don’t work reliably here.
                </p>

                <div className="bg-slate-800 p-3 rounded-lg text-left text-sm text-gray-400 w-full mb-2">
                    <p className="font-semibold text-gray-200 mb-1">Please open the link in:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Android:</strong> Chrome</li>
                        <li><strong>iPhone:</strong> Safari (or Chrome)</li>
                    </ul>
                </div>

                <button onClick={handleCopy} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Copy size={18} /> Copy Link
                </button>

                {isAndroid && (
                    <button onClick={handleOpenChrome} className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors">
                        <Chrome size={18} /> Open in Chrome
                    </button>
                )}

                <button onClick={onProceed} className="mt-4 text-xs text-gray-500 underline hover:text-gray-300">
                    Proceed anyway (may fail)
                </button>
            </div>
        </div>
    );
}
