import { useState, useEffect, useRef } from 'react';

export function usePwaInstall() {
  const deferredPrompt = useRef<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if currently installed
    const checkIfInstalled = () => {
      return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    };
    setIsInstalled(checkIfInstalled());

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPrompt.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      setIsInstalled(e.matches);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt.current = null;
      setCanInstall(false);
    }
  };

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase()) && !(window as any).MSStream;

  return { canInstall, triggerInstall, isInstalled, isIOS };
}
