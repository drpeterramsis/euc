import { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';

export function usePermissions(currentUser: any) {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    fetchPermissions();
  }, [currentUser?.id, currentUser?.role]);

  const fetchPermissions = async () => {
    // Super admin bypasses all permission checks
    if (currentUser?.role === 'super_admin') {
      setPermissions({
        map: true, tribes: true, leaderboard: true, settings: true,
      });
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      // 1. Role-based permissions
      const { data: rolePerms } = await supabase
        .from('page_permissions')
        .select('page_key, can_view')
        .eq('role', currentUser.role)
        .is('user_id', null);

      // 2. User-specific overrides
      const { data: userPerms } = await supabase
        .from('page_permissions')
        .select('page_key, can_view')
        .eq('user_id', currentUser.id);

      // Merge: start with role, override with user-specific
      const merged: Record<string, boolean> = {};
      (rolePerms ?? []).forEach(p => { merged[p.page_key] = p.can_view; });
      (userPerms ?? []).forEach(p => { merged[p.page_key] = p.can_view; });

      setPermissions(merged);
    } catch (err) {
      console.error('usePermissions error:', err);
      // Fail-safe: give basic access
      setPermissions({ map: true, tribes: true, leaderboard: true });
    } finally {
      setLoading(false);
    }
  };

  const canView = (pageKey: string) => {
    if (currentUser?.role === 'super_admin') return true;
    if (pageKey === 'leaderboard' || pageKey === 'activity-log' || pageKey === 'profile' || pageKey === 'roadmap' || pageKey === 'about') return true;
    return permissions[pageKey] ?? false;
  };

  const canEdit = (pageKey: string) => {
    if (currentUser?.role === 'super_admin') return true;
    if (pageKey === 'leaderboard' || pageKey === 'activity-log' || pageKey === 'profile' || pageKey === 'roadmap' || pageKey === 'about') return true;
    return permissions[pageKey] ?? false;
  };

  return { canView, canEdit, loading, refetch: fetchPermissions };
}
