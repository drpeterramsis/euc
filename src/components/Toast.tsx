/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
export function showToast(message: string, type: 'success' | 'error' | 'info') {
    const event = new CustomEvent('app-toast', { detail: { message, type } });
    window.dispatchEvent(event);
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<any[]>([]);

    useEffect(() => {
        const handler = (e: any) => {
            const id = Date.now();
            setToasts(prev => [...prev, { ...e.detail, id }]);
            setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
        };
        window.addEventListener('app-toast', handler);
        return () => window.removeEventListener('app-toast', handler);
    }, []);

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map(t => (
                <div key={t.id} className={`p-4 rounded shadow text-white ${t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-yellow-600'}`}>
                    {t.message}
                </div>
            ))}
        </div>
    );
}

import { useState, useEffect } from 'react';
