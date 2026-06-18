/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';

export function showToast(message: string, type: 'success' | 'error' | 'info') {
    const event = new CustomEvent('app-toast', { detail: { message, type } });
    window.dispatchEvent(event);
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<any[]>([]);

    useEffect(() => {
        const handler = (e: any) => {
            const id = Date.now() + Math.random();
            const newToast = { ...e.detail, id };
            setToasts(prev => [...prev, newToast]);
            
            // Auto dismiss after 3 seconds
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 3000);
        };
        window.addEventListener('app-toast', handler);
        return () => window.removeEventListener('app-toast', handler);
    }, []);

    const handleDismiss = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            {toasts.map(t => (
                <div 
                    key={t.id} 
                    className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-fade-in-up ${
                        t.type === 'success' 
                            ? 'bg-emerald-900/90 text-emerald-50 border-emerald-500/30' 
                            : t.type === 'error' 
                            ? 'bg-rose-950/90 text-rose-50 border-rose-500/30' 
                            : 'bg-zinc-900/95 text-zinc-50 border-zinc-700/50'
                    }`}
                >
                    <div className="flex items-center gap-3 pr-2">
                        <span className="text-lg">
                            {t.type === 'success' ? '✓' : t.type === 'error' ? '⚠️' : 'ℹ️'}
                        </span>
                        <p className="text-xs font-bold uppercase tracking-wider leading-relaxed">{t.type}</p>
                        <p className="text-xs font-semibold leading-relaxed">{t.message}</p>
                    </div>
                    <button
                        onClick={() => handleDismiss(t.id)}
                        className="flex-shrink-0 text-white/60 hover:text-white p-1 rounded-full transition-colors cursor-pointer text-xs"
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}
