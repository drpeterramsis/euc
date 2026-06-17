import React, { memo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getSupabase } from '../lib/supabase';
import { getUser } from '../utils/userHelpers';
import { usePermissions } from '../hooks/usePermissions';
import { usePwaInstall } from '../hooks/usePwaInstall';
import LogoutModal from './ui/LogoutModal';

interface SideMenuProps {
  menuOpen: boolean;
  user: any;
  toggleMenu: () => void;
  isDesktop: boolean;
}

export default function SideMenu({ menuOpen, user, toggleMenu, isDesktop }: SideMenuProps) {
  const { canView } = usePermissions(user);
  const navigate    = useNavigate();
  const { canInstall, isInstalled, isIOS, triggerInstall } = usePwaInstall();
  const [showLogout, setShowLogout] = useState(false);

  const displayName = getUser.name(user);
  const initial     = getUser.initial(user);
  const roleInfo    = getUser.roleLabel(user);

  const handleLogoutSuccess = () => {
    toggleMenu();
  };

  const ALL_MENU_ITEMS = [
    ...(user?.role === 'super_admin' ? [
      { to: '/map', label: 'الخريطة', icon: '🗺️', pageKey: 'map' }
    ] : []),
    { to: '/tribes', label: 'الأسباط', icon: '⚔️', pageKey: 'tribes' },
    { to: '/leaderboard', label: 'لوحة الصدارة', icon: '🏆', pageKey: 'leaderboard' },
    { to: '/roadmap', label: 'مخطط الإنشاء', icon: '🗺️', pageKey: 'roadmap' },
    { to: '/activity-log', label: 'سجل الأنشطة', icon: '📜', pageKey: 'activity-log' },
    ...(user?.role === 'team_admin' ? [
      { to: '/buildings', label: 'البناء', icon: '🏗️', pageKey: 'tribes' }
    ] : []),
    { to: '/profile', label: 'الملف الشخصي', icon: '👤', pageKey: 'profile' },
    { to: '/about', label: 'حول كنعان', icon: 'ℹ️', pageKey: 'about' },
    { to: '/settings', label: 'الإعدادات', icon: '⚙️', pageKey: 'settings' },
  ];

  const visibleItems = ALL_MENU_ITEMS.filter(item => canView(item.pageKey));

  return (
    <>
      {showLogout && (
        <LogoutModal onConfirm={handleLogoutSuccess} onCancel={() => setShowLogout(false)} />
      )}

      {/* Mobile Overlay */}
      {!isDesktop && menuOpen && (
        <div
          onClick={toggleMenu}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            zIndex: 998,
            top: '60px',
          }}
        />
      )}
      
      <aside 
        style={{
          position: 'fixed',
          top: '60px',
          right: 0,
          width: '260px',
          height: 'calc(100vh - 60px)',
          backgroundColor: '#FFFDF5',
          borderLeft: '2px solid #D4AF37',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          boxShadow: menuOpen ? '-4px 0 20px rgba(0,0,0,0.1)' : 'none',
          direction: 'rtl',
        }}
      >
        {/* ── User Profile Section ── */}
        <div
          onClick={() => { navigate('/profile'); if (!isDesktop) toggleMenu(); }}
          style={{
            padding: '20px 16px',
            borderBottom: '1.5px solid #E8D5A3',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FFF8E7',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF3D0'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFF8E7'}
        >
          {/* Avatar */}
          <div style={{
            width: '52px', height: '52px',
            borderRadius: '50%',
            backgroundColor: '#D4AF37',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: 700, color: '#fff',
            fontFamily: "'Cinzel', serif",
            boxShadow: '0 4px 12px rgba(212,175,55,0.4)',
          }}>
            {initial}
          </div>

          {/* Full name ← uses 'name' column */}
          <div style={{
            fontFamily: "'Tajawal', sans-serif",
            fontSize: '15px', fontWeight: 700,
            color: '#2C1810', textAlign: 'center',
          }}>
            {displayName}
          </div>

          {/* Role badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '3px 12px', borderRadius: '12px',
            backgroundColor: roleInfo.color + '22',
            border: `1px solid ${roleInfo.color}44`,
            fontSize: '12px', fontWeight: 600,
            color: roleInfo.color,
            fontFamily: "'Tajawal', sans-serif",
          }}>
            {roleInfo.emoji} {roleInfo.label}
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          <div className="grid grid-cols-2 gap-2">
            {visibleItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => { if (!isDesktop) toggleMenu(); }}
                style={({ isActive }) => ({
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '16px 8px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  backgroundColor: isActive ? '#D4AF37' : '#F9F5EC',
                  color: isActive ? '#fff' : '#8B4513',
                  fontFamily: "'Tajawal', sans-serif",
                  transition: 'all 0.15s',
                  boxShadow: isActive ? '0 4px 12px rgba(212,175,55,0.3)' : 'none',
                  border: isActive ? 'none' : '1px solid #E8D5A3'
                })}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-bold">{item.label}</span>
              </NavLink>
            ))}
            
            {/* Logout nav item */}
            <button
              onClick={() => setShowLogout(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '16px 8px',
                borderRadius: '12px',
                backgroundColor: '#FFF0F0',
                color: '#E74C3C',
                fontFamily: "'Tajawal', sans-serif",
                cursor: 'pointer',
                border: '1px solid #FADCDC',
                transition: 'all 0.15s',
              }}
              className="hover:bg-[#FFE5E5]"
            >
              <span className="text-2xl">🚪</span>
              <span className="text-xs font-bold">تسجيل الخروج</span>
            </button>
          </div>
        </nav>

        {/* PWA Install Button */}
        {!isInstalled && (canInstall || isIOS) && (
          <div style={{ padding: '16px', borderTop: '1px solid #F0E6C8' }}>
            {isIOS ? (
              <div style={{
                backgroundColor: '#EAF2F8', padding: '12px', borderRadius: '8px', 
                border: '1px solid #BDC3C7', fontSize: '11px', color: '#2C3E50', 
                fontFamily: "'Tajawal', sans-serif", textAlign: 'center', lineHeight: '1.4'
              }}>
                لتثبيت التطبيق: اضغط على زر المشاركة <span style={{fontSize:'14px'}}>⍐</span> ثم 'إضافة إلى الشاشة الرئيسية'
              </div>
            ) : (
              <button
                onClick={triggerInstall}
                style={{
                  width: '100%', padding: '12px',
                  borderRadius: '8px', border: 'none',
                  backgroundColor: '#D4AF37', color: '#fff',
                  fontFamily: "'Tajawal', sans-serif", fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(212,175,55,0.3)',
                }}
              >
                📲 تثبيت التطبيق
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
