import { getSupabase } from '../lib/supabase';
import { DB } from '../config/dbSchema';

export async function checkUsernameExists(username: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from(DB.users.table)
    .select(DB.users.id)
    .eq(DB.users.username, username.trim().toLowerCase());

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function addUser(formData: any) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database connection failed');

  const insertObj = {
    [DB.users.name]:     formData.name.trim(),
    [DB.users.username]: formData.username.trim().toLowerCase(),
    [DB.users.password]: formData.password,
    [DB.users.role]:     formData.role,
    [DB.users.teamId]:   formData.team_id,
  };

  const { data, error } = await supabase
    .from(DB.users.table)
    .insert([insertObj])
    .select();

  if (error) {
    throw error;
  }

  return data?.[0];
}

export async function updateUser(userId: string, updates: any) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database connection failed');

  const dbUpdates: any = {};
  if (updates.name     !== undefined) dbUpdates[DB.users.name]     = updates.name;
  if (updates.username !== undefined) dbUpdates[DB.users.username] = updates.username;
  if (updates.password !== undefined) dbUpdates[DB.users.password] = updates.password;
  if (updates.role     !== undefined) dbUpdates[DB.users.role]     = updates.role;
  if (updates.teamId   !== undefined) dbUpdates[DB.users.teamId]   = updates.teamId;

  const { data, error } = await supabase
    .from(DB.users.table)
    .update(dbUpdates)
    .eq(DB.users.id, userId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function deleteUser(userId: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database connection failed');

  const { error } = await supabase
    .from(DB.users.table)
    .delete()
    .eq(DB.users.id, userId);

  if (error) throw error;
  return true;
}

export async function fetchTeamMembers(teamId: string) {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(DB.users.table)
    .select('*')
    .eq(DB.users.teamId, teamId)
    .order(DB.users.name);

  if (error) throw error;
  return data ?? [];
}

export async function fetchAllUsers() {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(DB.users.table)
    .select('*')
    .order(DB.users.teamId);

  if (error) throw error;
  return data ?? [];
}
