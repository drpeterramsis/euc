import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

interface BuildingPopupProps {
  building: any;
  x: number;
  y: number;
  onClose: () => void;
  onMove: (building: any) => void;
  onDelete: (building: any) => void;
  canEdit: boolean;
}

export default function BuildingPopup({ building, x, y, onClose, onMove, onDelete, canEdit }: BuildingPopupProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const bt = building.building_type;
  if (!bt) return null;

  const date = new Date(building.placed_at).toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const content = (
    <>
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 99998, cursor: 'default'
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          left: Math.min(window.innerWidth - 290, Math.max(10, x)),
          top: Math.min(window.innerHeight - 200, Math.max(10, y)),
          backgroundColor: '#FFFDF5',
          border: '2px solid #D4AF37',
          borderRadius: '10px',
          padding: '12px',
          width: '260px',
          zIndex: 99999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          direction: 'rtl',
          fontFamily: "'Tajawal', sans-serif"
        }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 4, left: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✖</button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ fontSize: '32px' }}>{bt.icon}</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#2C1810', fontWeight: 'bold' }}>
              {building.name_override || bt.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', marginTop: '2px' }}>
              {building.team && (
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: building.team.color || '#D4AF37' }} />
              )}
              <span style={{ color: '#8B7355' }}>
                {building.team?.name || 'مجهول'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#FFF8E7', padding: '8px', borderRadius: '8px', fontSize: '12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ color: '#8B7355' }}>التكلفة:</span>
            <span style={{ fontWeight: 'bold', color: '#27AE60' }}>{building.points_spent} نقطة</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#8B7355' }}>تاريخ التأسيس:</span>
            <span style={{ fontWeight: 'bold', color: '#2C1810' }}>{date}</span>
          </div>
          {building.notes && (
            <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #E8D5A3', color: '#6B5B45' }}>
              ملاحظات: {building.notes}
            </div>
          )}
        </div>

        {canEdit && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <button
              onClick={() => { onClose(); onMove(building); }}
              title="تحريك"
              style={{
                flex: 1, padding: '6px', backgroundColor: '#D4AF37', color: '#fff',
                border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
                fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              📍
            </button>
            <button
              onClick={() => { onClose(); onDelete(building); }}
              title="هدم"
              style={{
                flex: 1, padding: '6px', backgroundColor: '#E74C3C22', color: '#C0392B',
                border: '1px solid #E74C3Caa', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
                fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              🗑️
            </button>
          </div>
        )}
      </motion.div>
    </>
  );

  return createPortal(content, document.body);
}
