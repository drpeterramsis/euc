import React from 'react';
import { motion } from 'framer-motion';
import { CatalogBuildingIcon } from '../catalog/CatalogBuildingIcon';
import { useNavigate } from 'react-router-dom';

interface PrerequisiteWarningModalProps {
  onClose: () => void;
  targetBuilding: {
    name: string;
    icon?: string;
    type?: string;
    cost: number;
    prerequisites?: string | null;
  };
  missingPrereq: {
    id: string;
    name: string;
    icon?: string;
    type?: string;
    cost: number;
  };
  teamColor?: string;
}

export default function PrerequisiteWarningModal({
  onClose,
  targetBuilding,
  missingPrereq,
  teamColor = '#D4AF37'
}: PrerequisiteWarningModalProps) {
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'Cairo, sans-serif',
      direction: 'rtl'
    }}>
      {/* Semi-transparent Backdrop */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(44, 24, 16, 0.65)',
          backdropFilter: 'blur(3px)'
        }} 
        onClick={onClose} 
      />

      {/* Warning Box */}
      <motion.div 
        initial={{ scale: 0.9, y: 15, opacity: 0 }} 
        animate={{ scale: 1, y: 0, opacity: 1 }} 
        exit={{ scale: 0.9, y: 15, opacity: 0 }}
        style={{
          position: 'relative',
          backgroundColor: '#FFFDF5',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '420px',
          padding: '24px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
          border: '3px solid #E74C3C',
          textAlign: 'center'
        }}
      >
        {/* Top Warning Alert Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 16px',
          borderRadius: '24px',
          backgroundColor: '#FDE8E8',
          border: '1.2px solid #E74C3C',
          color: '#E74C3C',
          fontSize: '13px',
          fontWeight: 'bold',
          marginBottom: '16px'
        }}>
          ⚠️ تتابع تشييد غير مكتمل الشروط
        </div>

        {/* Dynamic Core Graphical Connection of Progression */}
        <div style={{
          backgroundColor: '#FFF8E7',
          border: '1px border #E8D5A3',
          borderRadius: '12px',
          padding: '16px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '18px',
          boxShadow: 'inset 0 2px 4px rgba(139, 69, 19, 0.03)'
        }}>
          {/* Missing Building Box */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: '1 1 0',
            maxWidth: '120px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#fff',
              border: '2px dashed #E74C3C',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(231,76,60,0.1)',
              position: 'relative',
              padding: '6px'
            }}>
              <CatalogBuildingIcon 
                type={missingPrereq.type || missingPrereq.name || 'default'} 
                teamColor="#7F8C8D" 
                size={52} 
              />
              <span style={{
                position: 'absolute',
                top: -5,
                right: -5,
                fontSize: '14px',
                background: '#E74C3C',
                color: '#fff',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                ✕
              </span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#C0392B', marginTop: '6px', textAlign: 'center', lineHeight: 1.1 }}>
              {missingPrereq.name}
            </span>
            <span style={{ fontSize: '10px', color: '#7F8C8D', fontWeight: 'bold' }}>
              ({missingPrereq.cost} ن.)
            </span>
          </div>

          {/* Connection Arc */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '20px', color: '#E74C3C' }}>⬅️</span>
            <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#CD853F', marginTop: '4px' }}>بوابة البداية</span>
          </div>

          {/* Target Building Box */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: '1 1 0',
            maxWidth: '120px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#fff',
              border: '2px solid #95A5A6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.6,
              padding: '6px'
            }}>
              <CatalogBuildingIcon 
                type={targetBuilding.type || targetBuilding.name || 'default'} 
                teamColor={teamColor} 
                size={52} 
              />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2C1810', marginTop: '6px', textAlign: 'center', lineHeight: 1.1 }}>
              {targetBuilding.name}
            </span>
            <span style={{ fontSize: '10px', color: '#7F8C8D', fontWeight: 'bold' }}>
              ({targetBuilding.cost} ن.)
            </span>
          </div>
        </div>

        {/* Text Details explaining why */}
        <h3 style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#8B4513',
          margin: '0 0 8px 0',
          fontFamily: 'Cairo'
        }}>
          أولاً: يرجى تمهيد وتشييد [{missingPrereq.name}]
        </h3>
        
        <p style={{
          fontSize: '13px',
          color: '#5C4033',
          lineHeight: '1.5',
          margin: '0 0 20px 0',
          textAlign: 'justify',
          textJustify: 'inter-word'
        }}>
          لا يمكن لسبطكم وضع أساسات <strong>[{targetBuilding.name}]</strong> على الخريطة في هذا الوقت قبل تأمين بنية <strong>[{missingPrereq.name}]</strong> لإرساء مقومات الحياة والتنسيق اللوجستي للقرية أولاً.
        </p>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button 
            type="button"
            onClick={onClose}
            style={{
              padding: '11px',
              border: 'none',
              backgroundColor: '#E74C3C',
              color: '#fff',
              borderRadius: '8px',
              fontFamily: 'Cairo',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(231,76,60,0.2)'
            }}
          >
            ✓ حسناً، فهمت
          </button>
          
          <button 
            type="button"
            onClick={() => {
              onClose();
              navigate('/roadmap');
            }}
            style={{
              padding: '10px',
              border: '1.5px solid #D4AF37',
              backgroundColor: '#FFFDF5',
              color: '#8B4513',
              borderRadius: '8px',
              fontFamily: 'Cairo',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🗺️ عرض مخطط الانشاء والإرشاد الكامل
          </button>
        </div>
      </motion.div>
    </div>
  );
}
