import React, { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { notify } from '../utils/toastMessages';
import EditUserModal from './EditUserModal';
import { updateUser, deleteUser } from '../services/userService';

interface AllUsersTabProps {
  currentUser?: any;
}

export default function AllUsersTab({ currentUser }: AllUsersTabProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');
  const [showPasswords, setShowPasswords] = useState(false);
  const [sortBy, setSortBy] = useState('team_id');
  const [sortDir, setSortDir] = useState('asc');
  
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const [usersRes, teamsRes] = await Promise.all([
        supabase.from('users').select('*').order('team_id'),
        supabase.from('teams').select('*'),
      ]);
      
      if (usersRes.error) throw usersRes.error;
      if (teamsRes.error) throw teamsRes.error;
      
      setUsers(usersRes.data || []);
      setTeams(teamsRes.data || []);
    } catch (err) {
      notify.custom('❌ فشل تحميل المستخدمين', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async (userId: string, updateData: any) => {
    try {
      await updateUser(userId, updateData);
      notify.custom('✅ تم تحديث بيانات العضو', 'success');
      setEditingUser(null);
      await fetchAllData();
    } catch (err: any) {
      notify.custom(`❌ ${err.message}`, 'error');
    }
  };

  const handleDelete = async (user: any) => {
    if (user.role === 'super_admin') {
      notify.custom('❌ لا يمكن حذف السوبر أدمن', 'error');
      return;
    }
    if (!window.confirm(`هل تريد حذف "${user.name}"؟`)) return;

    setLoading(true);
    try {
      await deleteUser(user.id);
      notify.custom('✅ تم حذف العضو', 'success');
      await fetchAllData();
    } catch (err: any) {
      notify.custom(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter + Search
  const filtered = users.filter(u => {
    const matchSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchTeam = filterTeam === 'all' || u.team_id === filterTeam;
    return matchSearch && matchRole && matchTeam;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const getTeamName = (teamId: string) =>
    teams.find(t => t.id === teamId)?.name || '—';

  const getTeamColor = (teamId: string) =>
    teams.find(t => t.id === teamId)?.color || '#D4AF37';

  const getRoleBadge = (role: string) => {
    const map: any = {
      super_admin: { label: 'سوبر أدمن', emoji: '👑', color: '#D4AF37' },
      team_admin:  { label: 'قائد السبط',  emoji: '🛡️', color: '#2980B9' },
      member:      { label: 'عضو',       emoji: '⚔️', color: '#27AE60' },
    };
    return map[role] || { label: role, emoji: '👤', color: '#888' };
  };

  const handleSort = (col: string) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const exportCSV = () => {
    const headers = ['الاسم', 'اسم المستخدم', 'الدور', 'السبط'];
    const rows = sorted.map(u => [
      u.name, u.username,
      u.role, getTeamName(u.team_id),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kan3an_users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify.custom('✅ تم تصدير بيانات المستخدمين', 'success');
  };

  const SortIcon = ({ col }: { col: string }) => 
    sortBy === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ↕';

  return (
    <div style={{ direction: 'rtl' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px',
      }}>
        <h3 style={{
          fontFamily: "'Cinzel', serif", fontSize: '18px',
          color: '#8B4513', margin: 0,
        }}>
          📋 جميع مستخدمي اللعبة
        </h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Export */}
          <button onClick={exportCSV} style={{
            padding: '7px 14px', borderRadius: '8px',
            border: '1.5px solid #27AE60',
            backgroundColor: '#F0FFF4', color: '#27AE60',
            fontFamily: "'Tajawal', sans-serif",
            fontSize: '13px', cursor: 'pointer',
          }}>
            📊 تصدير CSV
          </button>
          {/* Refresh */}
          <button onClick={fetchAllData} style={{
            padding: '7px 14px', borderRadius: '8px',
            border: '1.5px solid #D4AF37',
            backgroundColor: '#FFFDF5', color: '#8B4513',
            fontFamily: "'Tajawal', sans-serif",
            fontSize: '13px', cursor: 'pointer',
          }}>
            🔄 تحديث
          </button>
        </div>
      </div>

      {/* ── Stats Summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'إجمالي المستخدمين', value: users.length, color: '#8B4513' },
          { label: 'تفاعل السجل', value: users.length, color: '#27AE60' },
          { label: 'الأدمن', value: users.filter(u => u.role === 'super_admin').length, color: '#D4AF37' },
          { label: 'مديري الأسباط', value: users.filter(u => u.role === 'team_admin').length, color: '#2980B9' },
          { label: 'الأعضاء', value: users.filter(u => u.role === 'member').length, color: '#7F8C8D' },
        ].map(stat => (
          <div key={stat.label} style={{
            padding: '8px 14px', borderRadius: '8px',
            backgroundColor: '#FFF8E7',
            border: `1.5px solid ${stat.color}33`,
            textAlign: 'center', minHeight: '80px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '20px', fontWeight: 700, color: stat.color,
            }}>
              {stat.value}
            </div>
            <div style={{
              fontFamily: "'Tajawal', sans-serif",
              fontSize: '11px', color: '#8B7355',
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          type="text" placeholder="🔍 بحث بالاسم أو اسم المستخدم..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full md:flex-1 p-2 border-2 border-[#D4AF37] rounded-lg bg-[#FFFDF5] text-sm focus:outline-none"
        />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="w-full md:w-auto p-2 border-2 border-[#D4AF37] rounded-lg bg-[#FFFDF5] text-sm focus:outline-none">
          <option value="all">كل الأدوار</option>
          <option value="super_admin">👑 سوبر أدمن</option>
          <option value="team_admin">🛡️ قائد السبط</option>
          <option value="member">⚔️ عضو</option>
        </select>
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
          className="w-full md:w-auto p-2 border-2 border-[#D4AF37] rounded-lg bg-[#FFFDF5] text-sm focus:outline-none">
          <option value="all">كل الأسباط</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* ── Users Table & Mobile Cards ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#D4AF37' }}>
          جاري التحميل...
        </div>
      ) : (
        <>
          {/* Mobile Card List (< 768px) */}
          <div className="md:hidden flex flex-col gap-3">
            {sorted.length === 0 ? (
              <div className="text-center p-8 text-[#B8A88A] bg-[#FFF8E7] rounded-xl border border-[#E8D5A3]">
                لا يوجد مستخدمون مطابقون للبحث
              </div>
            ) : sorted.map((user) => {
              const badge = getRoleBadge(user.role);
              const teamColor = getTeamColor(user.team_id);
              return (
                <div key={user.id} className="bg-[#FFF8E7] border border-[#E8D5A3] rounded-xl p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-2 h-full" style={{ backgroundColor: teamColor }}></div>
                   
                   <div className="flex justify-between items-start">
                     <div className="flex gap-3 items-center w-[calc(100%-40px)]">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0" style={{ backgroundColor: badge.color }}>
                          {user.name?.charAt(0) || badge.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[#2C1810] text-sm truncate">{user.name || '—'}</h4>
                          <p className="text-xs text-[#8B7355] font-mono truncate mt-0.5" dir="ltr">@{user.username}</p>
                        </div>
                     </div>
                   </div>

                   <div className="flex flex-wrap gap-2 pr-2">
                     <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '2px 8px', borderRadius: '12px',
                        backgroundColor: badge.color + '22',
                        color: badge.color, fontSize: '11px', fontWeight: 700,
                        border: `1px solid ${badge.color}44`,
                      }}>
                        {badge.emoji} {badge.label}
                      </span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '2px 8px', borderRadius: '12px',
                        backgroundColor: '#FFFDF5',
                        border: `1px solid ${teamColor}40`,
                        color: '#2C1810', fontSize: '11px', fontWeight: 600
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: teamColor }}/>
                        {getTeamName(user.team_id)}
                      </span>
                   </div>

                   <div className="flex gap-2 justify-end mt-2 pr-2 border-t border-[#F0E6C8] pt-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-1.5 px-3 rounded-lg text-xs font-bold text-[#8B4513] bg-[#FFFDF5] border border-[#D4AF37] hover:bg-[#D4AF37] transition-colors"
                      >
                         تعديل ✏️
                      </button>
                      {user.role !== 'super_admin' && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-1.5 px-3 rounded-lg text-xs font-bold text-[#E74C3C] bg-[#FFF5F5] border border-[#E74C3C] hover:bg-[#E74C3C] transition-colors"
                        >
                           حذف 🗑️
                        </button>
                      )}
                   </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table (>= 768px) */}
          <div className="hidden md:block overflow-x-hidden rounded-lg border border-[#E8D5A3]">
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            fontFamily: "'Tajawal', sans-serif",
            backgroundColor: '#FFF8E7',
            tableLayout: 'fixed'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#E8D5A3' }}>
                {[
                  { key: 'name', label: 'الاسم الكامل', width: '25%' },
                  { key: 'username',  label: 'اسم المستخدم', width: '20%' },
                  { key: 'role',      label: 'الدور', width: '15%' },
                  { key: 'team_id',   label: 'السبط', width: '20%' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      width: col.width,
                      padding: '10px 12px',
                      textAlign: 'right',
                      fontWeight: 700, fontSize: '13px',
                      color: '#8B4513', cursor: 'pointer',
                      borderBottom: '2px solid #D4AF37',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {col.label}<SortIcon col={col.key} />
                  </th>
                ))}
                  <th style={{
                      width: '20%',
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontWeight: 700, fontSize: '13px',
                      color: '#8B4513', 
                      borderBottom: '2px solid #D4AF37',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                  }}>
                    الإجراءات
                  </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{
                    textAlign: 'center', padding: '30px',
                    color: '#B8A88A', fontSize: '14px',
                  }}>
                    لا يوجد مستخدمون مطابقون للبحث
                  </td>
                </tr>
              ) : sorted.map((user, i) => {
                const badge = getRoleBadge(user.role);
                const teamColor = getTeamColor(user.team_id);
                return (
                  <tr
                    key={user.id}
                    style={{
                      backgroundColor: i % 2 === 0 ? '#FFFDF5' : '#FFF8E7',
                      borderBottom: '1px solid #F0E6C8',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF3D0'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#FFFDF5' : '#FFF8E7'}
                  >
                    <td style={{ padding: '10px 12px', fontSize: '14px', color: '#2C1810', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name || '—'}
                    </td>
                    <td style={{ padding: '10px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <code style={{
                        backgroundColor: '#F0E6C8', padding: '2px 8px',
                        borderRadius: '4px', fontSize: '13px',
                        color: '#8B4513', fontFamily: 'monospace',
                      }}>
                        {user.username}
                      </code>
                    </td>
                    <td style={{ padding: '10px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 10px', borderRadius: '12px',
                        backgroundColor: badge.color + '22',
                        color: badge.color, fontSize: '12px', fontWeight: 700,
                        border: `1px solid ${badge.color}44`,
                        whiteSpace: 'nowrap',
                      }}>
                        {badge.emoji} {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                      }}>
                        <span style={{
                          width: '10px', height: '10px', borderRadius: '50%',
                          backgroundColor: teamColor, flexShrink: 0,
                        }}/>
                        <span style={{ fontSize: '13px', color: '#2C1810', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getTeamName(user.team_id)}
                        </span>
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {/* Edit */}
                        <button
                          onClick={() => setEditingUser(user)}
                          title="تعديل"
                          style={{
                            padding: '5px 10px', borderRadius: '6px',
                            border: '1.5px solid #D4AF37',
                            backgroundColor: '#FFF8E7', color: '#8B4513',
                            cursor: 'pointer', fontSize: '13px',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#D4AF37'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFF8E7'}
                        >
                          ✏️
                        </button>
                        {/* Delete */}
                        {user.role !== 'super_admin' && (
                          <button
                            onClick={() => handleDelete(user)}
                            title="حذف"
                            style={{
                              padding: '5px 10px', borderRadius: '6px',
                              border: '1.5px solid #E74C3C',
                              backgroundColor: '#FFF5F5', color: '#E74C3C',
                              cursor: 'pointer', fontSize: '13px',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E74C3C'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFF5F5'}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{
            padding: '10px', fontSize: '12px',
            color: '#B8A88A', fontFamily: "'Tajawal', sans-serif",
            textAlign: 'right', backgroundColor: '#FFFDF5'
          }}>
            عرض {sorted.length} من {users.length} مستخدم
          </div>
        </div>
        </>
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          teams={teams}
          onClose={() => setEditingUser(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
