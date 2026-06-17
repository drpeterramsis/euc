import { getSupabase } from '../lib/supabase';
import { DB } from '../config/dbSchema';

export async function loginUser(username: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('خطأ في الاتصال بقاعدة البيانات');

    const { data, error } = await supabase
      .from(DB.users.table)
      .select('*')
      .eq(DB.users.username, username.trim().toLowerCase())
      .single();

    if (error || !data) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    if (data[DB.users.password] !== password) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    return { success: true, user: data };

  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getCurrentUser(userId: string) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(DB.users.table)
    .select('*')
    .eq(DB.users.id, userId)
    .single();

  if (error) return null;
  return data;
}
