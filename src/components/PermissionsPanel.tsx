import React, { useState, useEffect, useCallback } from 'react';
import {
  loadRolePermissions,
  saveRolePermissions,
  loadUserPermissions,
  saveUserPermissions,
  PAGES,
  ROLES,
} from '../services/permissionsService';
import { notify } from '../utils/toastMessages';

interface PermissionsPanelProps {
  users?: any[];
  teams?: any[];
}

const PAGE_LABELS: Record<string, { label: string, icon: string }> = {
  map:         { label: 'الخريطة',     icon: '🗺️' },
  tribes:      { label: 'الأسباط',     icon: '⚔️' },
  leaderboard: { label: 'لوحة النقاط', icon: '🏆' },
  settings:    { label: 'الإعدادات',   icon: '⚙️' },
};

const ROLE_LABELS: Record<string, { label: string, icon: string }> = {
  member:     { label: 'عضو',       icon: '⚔️' },
  team_admin: { label: 'قائد السبط',  icon: '🛡️' },
};

export default function PermissionsPanel({ users = [] }: PermissionsPanelProps) {

  const [view,          setView]          = useState<'by-role' | 'by-user'>('by-role');
  const [rolePerms,     setRolePerms]     = useState<Record<string, any>>({});
  const [selectedUser,  setSelectedUser]  = useState<any>(null);
  const [userPerms,     setUserPerms]     = useState<Record<string, any>>({});
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [hasChanges,    setHasChanges]    = useState(false);

  // ── Load role permissions on mount ──
  useEffect(() => {
    fetchRolePerms();
  }, []);

  const fetchRolePerms = async () => {
    setLoading(true);
    try {
      const data = await loadRolePermissions();
      setRolePerms(data);
      setHasChanges(false);
      console.log('Loaded role perms:', data);
    } catch (err: any) {
      notify.custom(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Load user permissions when user selected ──
  useEffect(() => {
    if (selectedUser) fetchUserPerms(selectedUser.id);
  }, [selectedUser]);

  const fetchUserPerms = async (userId: string) => {
    setLoading(true);
    try {
      const data = await loadUserPermissions(userId);
      setUserPerms(data);
      setHasChanges(false);
    } catch (err: any) {
       notify.custom(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Toggle role permission ──
  const handleRoleToggle = useCallback((role: string, page: string) => {
    setRolePerms(prev => {
      const updated = {
        ...prev,
        [role]: {
          ...prev[role],
          [page]: !prev[role]?.[page],
        },
      };
      console.log('Updated rolePerms:', updated);
      return updated;
    });
    setHasChanges(true);
  }, []);

  // ── Toggle user permission ──
  const handleUserToggle = useCallback((page: string) => {
    setUserPerms(prev => ({
      ...prev,
      [page]: !prev[page],
    }));
    setHasChanges(true);
  }, []);

  // ── Save role permissions ──
  const handleSaveRolePerms = async () => {
    setSaving(true);
    try {
      console.log('Saving:', rolePerms);
      await saveRolePermissions(rolePerms);

      // Re-fetch to confirm saved
      const confirmed = await loadRolePermissions();
      setRolePerms(confirmed);
      setHasChanges(false);

      console.log('Confirmed saved:', confirmed);
      notify.custom('✅ تم حفظ الصلاحيات بنجاح', 'success');
    } catch (err: any) {
      console.error('Save error:', err);
      notify.custom(`❌ ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Save user permissions ──
  const handleSaveUserPerms = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await saveUserPermissions(selectedUser.id, userPerms);
      setHasChanges(false);
      notify.custom(`✅ تم حفظ صلاحيات ${selectedUser.name || selectedUser.username}`, 'success');
    } catch (err: any) {
      notify.custom(`❌ ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ value, onChange, disabled }: any) => (
    <button
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      style={{
        width: '46px', height: '26px',
        borderRadius: '13px',
        backgroundColor: value ? '#27AE60' : '#DDD',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background 0.25s',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute',
        top: '3px',
        left: value ? '3px' : '23px', // RTL mode
        width: '20px', height: '20px',
        borderRadius: '50%',
        backgroundColor: '#fff',
        transition: 'left 0.25s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        display: 'block',
      }}/>
    </button>
  );

  if (loading) return (
    <div style={{
      textAlign: 'center', padding: '32px',
      color: '#D4AF37',
      fontFamily: "'Tajawal', sans-serif",
    }}>
      جاري تحميل الصلاحيات...
    </div>
  );

  return (
    <div style={{ direction: 'rtl' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '16px',
        flexWrap: 'wrap', gap: '10px',
      }}>
        <h3 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '17px', color: '#8B4513', margin: 0,
        }}>
          🔐 إدارة الصلاحيات
        </h3>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: 'by-role', label: '👥 حسب الدور' },
            { key: 'by-user', label: '👤 حسب المستخدم' },
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => { setView(btn.key as 'by-role'|'by-user'); setHasChanges(false); }}
              style={{
                padding: '7px 14px', borderRadius: '8px',
                border: `1.5px solid #D4AF37`,
                backgroundColor: view === btn.key ? '#D4AF37' : '#FFFDF5',
                color: view === btn.key ? '#fff' : '#8B4513',
                fontFamily: "'Tajawal', sans-serif",
                fontSize: '13px', cursor: 'pointer',
                fontWeight: view === btn.key ? 700 : 400,
                transition: 'all 0.15s',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════ BY ROLE VIEW ════════════════ */}
      {view === 'by-role' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {ROLES.map((role) => (
            <div key={role} style={{
              backgroundColor: '#FFFDF5',
              border: '2px solid #E8D5A3',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <div style={{
                fontFamily: "'Tajawal', sans-serif", fontSize: '16px', fontWeight: 700,
                color: '#2C1810', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
                paddingBottom: '12px', borderBottom: '1px solid #F0E6C8'
              }}>
                <span style={{ fontSize: '20px' }}>{ROLE_LABELS[role]?.icon}</span>
                <span>{ROLE_LABELS[role]?.label}</span>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px'
              }}>
                {PAGES.map(page => (
                  <div key={page} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    backgroundColor: '#FFF8E7', padding: '10px 4px', borderRadius: '8px',
                    border: '1px solid #F0E6C8'
                  }}>
                    <span style={{ fontSize: '20px' }}>{PAGE_LABELS[page]?.icon}</span>
                    <span style={{
                      fontFamily: "'Tajawal', sans-serif", fontSize: '11px', fontWeight: 600,
                      color: '#6B5B45', textAlign: 'center', wordBreak: 'break-word'
                    }}>
                      {PAGE_LABELS[page]?.label}
                    </span>
                    <Toggle
                      value={rolePerms[role]?.[page] ?? false}
                      onChange={() => handleRoleToggle(role, page)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Save button */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSaveRolePerms}
              disabled={saving || !hasChanges}
              style={{
                padding: '10px 24px', borderRadius: '8px', border: 'none',
                backgroundColor: (!hasChanges || saving) ? '#E8D5A3' : '#D4AF37',
                color: '#fff',
                fontFamily: "'Tajawal', sans-serif",
                fontSize: '14px', fontWeight: 700,
                cursor: (!hasChanges || saving) ? 'not-allowed' : 'pointer',
                boxShadow: hasChanges ? '0 4px 14px rgba(212,175,55,0.4)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {saving ? '⏳ جاري الحفظ...' : '💾 حفظ الصلاحيات'}
            </button>
          </div>

          {/* Unsaved warning */}
          {hasChanges && (
            <div style={{
              marginTop: '10px', padding: '8px 14px',
              backgroundColor: '#FFF8E7',
              border: '1.5px solid #D4AF37',
              borderRadius: '8px',
              fontFamily: "'Tajawal', sans-serif",
              fontSize: '12px', color: '#8B4513',
            }}>
              ⚠️ يوجد تغييرات غير محفوظة
            </div>
          )}
        </div>
      )}

      {/* ════════════════ BY USER VIEW ════════════════ */}
      {view === 'by-user' && (
        <div style={{ overflowX: 'auto' }}>
          {/* User selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontFamily: "'Tajawal', sans-serif",
              fontSize: '13px', fontWeight: 600,
              color: '#6B5B45', marginBottom: '6px',
            }}>
              اختر المستخدم:
            </label>
            <select
              value={selectedUser?.id ?? ''}
              onChange={e => {
                const u = users.find(u => u.id === e.target.value);
                setSelectedUser(u ?? null);
              }}
              style={{
                width: '100%', padding: '9px 12px',
                borderRadius: '8px', border: '1.5px solid #D4AF37',
                fontFamily: "'Tajawal', sans-serif", fontSize: '14px',
                backgroundColor: '#FFFDF5', color: '#2C1810',
                outline: 'none',
              }}
            >
              <option value="">— اختر مستخدماً —</option>
              {users
                .filter(u => u.role !== 'super_admin')
                .map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.username} (@{u.username}) — {u.role}
                  </option>
                ))
              }
            </select>
          </div>

          {/* User permissions grid */}
          {selectedUser && (
            <div>
              <div style={{
                padding: '10px 14px', marginBottom: '14px',
                backgroundColor: '#FFF3D0', borderRadius: '8px',
                fontFamily: "'Tajawal', sans-serif", fontSize: '13px',
                color: '#8B4513',
              }}>
                🔧 صلاحيات مخصصة لـ <strong>{selectedUser.name || selectedUser.username}</strong>
                <span style={{ fontSize: '11px', color: '#B8A88A', marginRight: '8px' }}>
                  (تتجاوز صلاحيات الدور)
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '10px',
              }}>
                {PAGES.map(page => (
                  <div
                    key={page}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: `1.5px solid ${userPerms[page] ? '#27AE60' : '#E0D5C0'}`,
                      backgroundColor: userPerms[page] ? '#F0FFF4' : '#FAFAFA',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>
                      {PAGE_LABELS[page]?.icon}
                    </span>
                    <span style={{
                      fontFamily: "'Tajawal', sans-serif",
                      fontSize: '13px', fontWeight: 600,
                      color: '#2C1810',
                    }}>
                      {PAGE_LABELS[page]?.label}
                    </span>
                    <Toggle
                      value={userPerms[page] ?? false}
                      onChange={() => handleUserToggle(page)}
                    />
                    <span style={{
                      fontSize: '10px',
                      color: userPerms[page] ? '#27AE60' : '#B8A88A',
                      fontFamily: "'Tajawal', sans-serif",
                    }}>
                      {userPerms[page] ? 'مسموح' : 'ممنوع'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Save user perms */}
              <div style={{
                marginTop: '16px',
                display: 'flex', justifyContent: 'flex-end',
              }}>
                <button
                  onClick={handleSaveUserPerms}
                  disabled={saving || !hasChanges}
                  style={{
                    padding: '10px 24px', borderRadius: '8px', border: 'none',
                    backgroundColor: (!hasChanges || saving) ? '#E8D5A3' : '#D4AF37',
                    color: '#fff',
                    fontFamily: "'Tajawal', sans-serif",
                    fontSize: '14px', fontWeight: 700,
                    cursor: (!hasChanges || saving) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? '⏳ جاري الحفظ...' : '💾 حفظ صلاحيات المستخدم'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'center',
  fontFamily: "'Tajawal', sans-serif",
  fontWeight: 700, fontSize: '13px',
  color: '#8B4513',
  borderBottom: '2px solid #D4AF37',
};

const tdStyle: React.CSSProperties = {
  padding: '12px',
  fontFamily: "'Tajawal', sans-serif",
  fontSize: '14px', color: '#2C1810',
  verticalAlign: 'middle',
};

