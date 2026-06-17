import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export default function LoadingOverlay({ isLoading, message = 'جاري الحفظ...' }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(255, 253, 245, 0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            cursor: 'not-allowed',
            pointerEvents: 'all',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: '60px',
              height: '60px',
              border: '4px solid #F0E6C8',
              borderTop: '4px solid #D4AF37',
              borderRadius: '50%',
            }}
          />
          <div style={{ fontSize: '32px' }}>⚔️</div>
          <div style={{
            fontFamily: "'Tajawal', sans-serif",
            fontSize: '18px',
            fontWeight: 700,
            color: '#8B4513',
            textAlign: 'center',
          }}>
            {message}
          </div>
          <div style={{
            fontFamily: "'Tajawal', sans-serif",
            fontSize: '13px',
            color: '#B8A88A',
          }}>
            يرجى الانتظار...
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
