import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  building: any;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete: (building: any) => void;
  onMove: (building: any) => void;
  onRename?: (building: any) => void;
  currentUser: any;
}

export default function BuildingActionMenu({ 
  building, 
  position, 
  onClose, 
  onDelete, 
  onMove, 
  onRename, 
  currentUser 
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canDelete = currentUser?.role === 'super_admin' || 
                    (currentUser?.team_id && currentUser.team_id === building.team_id);

  // Position the context menu carefully so it stays inside viewport bounds
  const x = Math.min(position.x, window.innerWidth - 200);
  const y = Math.min(position.y, window.innerHeight - 150);

  const menuContent = (
    <div style={{
      position: 'fixed',
      top: y,
      left: x,
      background: 'rgba(26,10,0,0.95)',
      border: '1.5px solid #D4AF37',
      borderRadius: '10px',
      padding: '4px 0',
      minWidth: '180px',
      zIndex: 100005,
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      fontFamily: 'Cairo, sans-serif',
      direction: 'rtl'
    }}>
      <div style={{ padding: '10px 16px', fontSize: '14px', color: '#D4AF37', borderBottom: '1px solid #444', fontWeight: 'bold' }}>
        🏗️ {building.name_override || (typeof building.building_type === 'object' ? building.building_type?.name : building.building_type) || 'مبنى'}
      </div>
      
      {!confirmDelete ? (
        <>
            <div 
              style={{ padding: '10px 16px', fontSize: '13px', color: '#F5E6C8', cursor: 'pointer', transition: 'background 0.2s' }} 
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => { onMove(building); onClose(); }}
            >
              📍 نقل المبنى
            </div>
            
            {onRename && (
              <div 
                style={{ padding: '10px 16px', fontSize: '13px', color: '#F5E6C8', cursor: 'pointer', transition: 'background 0.2s' }} 
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => { onRename(building); onClose(); }}
              >
                ✏️ تعديل الاسم / التفاصيل
              </div>
            )}

            {canDelete && (
              <div 
                style={{ padding: '10px 16px', fontSize: '13px', color: '#FF6B6B', cursor: 'pointer', transition: 'background 0.2s' }} 
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,107,107,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => setConfirmDelete(true)}
              >
                🗑️ هدم المبنى
              </div>
            )}
            
            <div 
              style={{ padding: '10px 16px', fontSize: '13px', color: '#8B7355', cursor: 'pointer', borderTop: '1px solid #333', textAlign: 'center' }} 
              onClick={onClose}
            >
              إغلاق
            </div>
        </>
      ) : (
        <div style={{ padding: '12px 16px', fontSize: '13px', color: '#F5E6C8' }}>
            تأكيد هدم {building.name_override || (typeof building.building_type === 'object' ? building.building_type?.name : building.building_type) || 'مبنى'}؟
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
                <button 
                  style={{ color: '#FF6B6B', cursor: 'pointer', background: 'none', border: '1.5px solid #FF6B6B', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold' }} 
                  onClick={() => { onDelete(building); onClose(); }}
                >
                  تأكيد
                </button>
                <button 
                  style={{ color: '#F5E6C8', cursor: 'pointer', background: 'none', border: '1px solid #777', borderRadius: '4px', padding: '2px 8px', fontSize: '11px' }} 
                  onClick={() => setConfirmDelete(false)}
                >
                  إلغاء
                </button>
            </div>
        </div>
      )}
    </div>
  );

  return createPortal(menuContent, document.body);
}
