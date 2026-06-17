import { getSupabase } from '../lib/supabase';

export const PAGES = ['map', 'tribes', 'leaderboard', 'settings'];
export const ROLES = ['member', 'team_admin'];

// ─── Load Role Permissions ───
export async function loadRolePermissions() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database connection failed');

  const { data, error } = await supabase
    .from('page_permissions')
    .select('page_key, role, can_view, can_edit')
    .in('role', ROLES)
    .is('user_id', null);

  if (error) throw new Error(`فشل تحميل الصلاحيات: ${error.message}`);

  // Build nested object
  const result: any = {};
  ROLES.forEach(role => {
    result[role] = {};
    PAGES.forEach(page => { result[role][page] = false; });
  });
  (data ?? []).forEach(row => {
    if (result[row.role]) result[row.role][row.page_key] = row.can_view;
  });

  return result;
}

// ─── Save Role Permissions (SELECT then INSERT or UPDATE to bypass DB conflicts) ───
export async function saveRolePermissions(permissions: any) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database connection failed');

  const promises: Promise<any>[] = [];

  for (const role of ROLES) {
    for (const page of PAGES) {
      const canView = permissions[role]?.[page] ?? false;

      // Executed within a small container to run sequentially or parallelized cleanly
      const promise = (async () => {
        // Step 1: Check if the role configuration row exists
        const { data, error: selectErr } = await supabase
          .from('page_permissions')
          .select('id')
          .eq('page_key', page)
          .eq('role', role)
          .is('user_id', null)
          .maybeSingle();

        if (selectErr) throw selectErr;

        if (data) {
          // Step 2a: Update existing record
          const { error: updateErr } = await supabase
            .from('page_permissions')
            .update({
              can_view: canView,
              can_edit: canView,
              updated_at: new Date().toISOString(),
            })
            .eq('id', data.id);
          if (updateErr) throw updateErr;
        } else {
          // Step 2b: Insert new record
          const { error: insertErr } = await supabase
            .from('page_permissions')
            .insert({
              page_key: page,
              role: role,
              user_id: null,
              can_view: canView,
              can_edit: canView,
              updated_at: new Date().toISOString(),
            });
          if (insertErr) throw insertErr;
        }
      })();

      promises.push(promise);
    }
  }

  try {
    await Promise.all(promises);
  } catch (err: any) {
    console.error('Error in saveRolePermissions:', err);
    throw new Error(`فشل حفظ الصلاحيات: ${err.message}`);
  }

  return true;
}

// ─── Load User Permissions ───
export async function loadUserPermissions(userId: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database connection failed');

  const { data, error } = await supabase
    .from('page_permissions')
    .select('page_key, can_view, can_edit')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  const result: any = {};
  PAGES.forEach(page => { result[page] = null; });
  (data ?? []).forEach(row => { result[row.page_key] = row.can_view; });

  return result;
}

// ─── Save User Permissions (SELECT then INSERT or UPDATE to bypass DB conflicts) ───
export async function saveUserPermissions(userId: string, permissions: any) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database connection failed');

  const promises: Promise<any>[] = [];

  for (const page of PAGES) {
    const canView = permissions[page];
    // If not set specifically, skip or delete override
    if (canView === undefined || canView === null) continue;

    const promise = (async () => {
      // Step 1: Check if the user override has already been saved
      const { data, error: selectErr } = await supabase
        .from('page_permissions')
        .select('id')
        .eq('page_key', page)
        .eq('user_id', userId)
        .maybeSingle();

      if (selectErr) throw selectErr;

      if (data) {
        // Step 2a: Update existing override
        const { error: updateErr } = await supabase
          .from('page_permissions')
          .update({
            can_view: canView,
            can_edit: canView,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.id);
        if (updateErr) throw updateErr;
      } else {
        // Step 2b: Insert new override
        const { error: insertErr } = await supabase
          .from('page_permissions')
          .insert({
            page_key: page,
            role: null,
            user_id: userId,
            can_view: canView,
            can_edit: canView,
            updated_at: new Date().toISOString(),
          });
        if (insertErr) throw insertErr;
      }
    })();

    promises.push(promise);
  }

  try {
    await Promise.all(promises);
  } catch (err: any) {
    console.error('Error in saveUserPermissions:', err);
    throw new Error(`فشل حفظ صلاحيات المستخدم: ${err.message}`);
  }

  return true;
}

// ─── Check permissions directly ───
export async function canUserView(user: any, pageKey: string) {
  if (user?.role === 'super_admin') return true;

  const supabase = getSupabase();
  if (!supabase) return false;

  // Check user-specific override first
  const { data: userPerm } = await supabase
    .from('page_permissions')
    .select('can_view')
    .eq('user_id', user.id)
    .eq('page_key', pageKey)
    .single();

  if (userPerm) return userPerm.can_view;

  // Fall back to role permission
  const { data: rolePerm } = await supabase
    .from('page_permissions')
    .select('can_view')
    .eq('role', user.role)
    .eq('page_key', pageKey)
    .is('user_id', null)
    .single();

  return rolePerm?.can_view ?? false;
}


