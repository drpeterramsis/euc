import { DB } from '../config/dbSchema';

export const getUser = {
  id:       (u: any) => u?.id                ?? null,
  name:     (u: any) => u?.name              ?? u?.username ?? '—',
  initial:  (u: any) => {
    const n = u?.name ?? u?.username ?? 'K';
    return n.trim()[0]?.toUpperCase() ?? 'K';
  },
  username: (u: any) => u?.username          ?? '—',
  password: (u: any) => u?.password_hash     ?? '—',
  role:     (u: any) => u?.role              ?? 'member',
  teamId:   (u: any) => u?.team_id           ?? null,
  isActive: (u: any) => true,
  roleLabel:(u: any) => {
    const map: any = {
      super_admin: { label: 'مدير النظام', emoji: '👑', color: '#D4AF37' },
      team_admin:  { label: 'قائد السبط',  emoji: '🛡️', color: '#2980B9' },
      member:      { label: 'عضو',       emoji: '⚔️', color: '#27AE60' },
    };
    return map[u?.role] ?? { label: u?.role ?? 'مستخدم', emoji: '👤', color: '#888' };
  },
};

export const getTeam = {
  id:          (t: any) => t?.id            ?? null,
  name:        (t: any) => t?.name          ?? '—',
  color:       (t: any) => t?.color         ?? '#D4AF37',
  symbol:      (t: any) => t?.symbol        ?? '⚔️',
  nameEn:      (t: any) => t?.name_en       ?? '',
  description: (t: any) => t?.description   ?? '',
  pointsTotal: (t: any) => t?.points_total  ?? t?.points ?? 0,
  pointsSpent: (t: any) => t?.points_spent  ?? 0,
  pointsAvail: (t: any) => (t?.points_total ?? t?.points ?? 0) - (t?.points_spent ?? 0),
  mapRegion:   (t: any) => t?.map_region    ?? 'unassigned',
  memberCount: (t: any) => t?.memberCount   ?? 0,
};
