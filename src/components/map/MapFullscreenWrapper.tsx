import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';

interface MapFullscreenWrapperProps {
  children: React.ReactNode;
}

export default function MapFullscreenWrapper({ children }: MapFullscreenWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (isFullscreen) {
    return (
      <div 
        className="fixed inset-0 z-[9999] bg-[#1a0a00] flex flex-col"
      >
        <button 
          onClick={() => setIsFullscreen(false)}
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 10000,
            background: 'rgba(26, 10, 0, 0.85)',
            border: '2px solid #D4AF37',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D4AF37',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
          title="إغلاق الشاشة الكاملة"
          aria-label="إغلاق الشاشة الكاملة"
        >
          <X size={24} />
        </button>

        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button 
            onClick={() => setIsFullscreen(false)}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1a0a00]/80 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors"
            title="إنهاء وضع ملء الشاشة (Esc)"
          >
            <Minimize2 size={24} />
          </button>
        </div>
        <div className="flex-1 w-full h-full p-4 sm:p-8">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-2 right-2 z-10 pointer-events-auto">
        <button 
          onClick={() => setIsFullscreen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FFFDF5] border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#FFF8E7] transition-colors shadow-sm"
          title="عرض ملء الشاشة"
        >
          <Maximize2 size={20} />
        </button>
      </div>
      {children}
    </div>
  );
}

