import React, { useState, useEffect } from 'react';
import { loadSession } from '../utils/session';

export const NotificationManager = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [status, setStatus] = useState<'idle' | 'enabled' | 'denied' | 'error'>('idle');

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) return;
    
    // Check after login (session check)
    if (!loadSession()) return;

    checkStatus();
  }, []);

  const checkStatus = async () => {
    const permission = Notification.permission;
    if (permission === 'denied') {
      setStatus('denied');
      return;
    }
    
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    
    if (permission === 'granted' && sub) {
      setStatus('enabled');
    } else if (permission === 'default' || (permission === 'granted' && !sub)) {
      setShowPrompt(true);
    }
  };

  const enableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        setShowPrompt(false);
        return;
      }
      
      const res = await fetch('/api/push/vapidPublicKey');
      const { publicKey } = await res.json();
      
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });
      
      const session = loadSession();
      if (session) {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.userId, subscription: sub }),
        });
      }
      
      setStatus('enabled');
      setShowPrompt(false);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50">
      <h3 className="font-bold mb-2">Enable Notifications</h3>
      <p className="text-sm mb-4">Stay updated with conference announcements.</p>
      {status === 'denied' ? (
        <p className="text-red-500 text-sm">Notifications are blocked in browser settings.</p>
      ) : (
        <button 
          onClick={enableNotifications}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Enable Notifications
        </button>
      )}
    </div>
  );
};
