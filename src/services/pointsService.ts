import { getSupabase } from '../lib/supabase';
import { DB } from '../config/dbSchema';
import { logActivity } from './activityLogService';

// Admin: Deduct points from a team
export async function adminDeductPoints({ teamId, amount, reason, adminId }: any) {
  if (!teamId)           throw new Error('لم يتم تحديد السبط');
  if (!amount || amount < 1) throw new Error('عدد النقاط يجب أن يكون أكبر من صفر');
  if (!reason?.trim())   throw new Error('سبب الخصم مطلوب');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Database connection failed');

  const t = DB.teams;

  // Get current points
  const { data: team, error: fetchErr } = await supabase
    .from(t.table)
    .select('*')
    .eq(t.id, teamId)
    .single();

  if (fetchErr) throw new Error(`فشل جلب السبط: ${fetchErr.message}`);

  const currentTotal = team[t.pointsTotal] ?? team[t.points] ?? 0;
  const currentSpent = team[t.pointsSpent] ?? 0;

  // Deduct from total points, but Ensure spent_points is not exceeding the new total,
  // If it does, we might need to adjust (but we won't for now).
  const newTotal = Math.max(0, currentTotal - Number(amount));

  const res = await supabase
    .from(t.table)
    .update({
      [t.pointsTotal]: newTotal,
      [t.points]:      newTotal,   // keep legacy 'points' in sync
      [t.pointsSpent]: Math.min(currentSpent, newTotal), // prevent spent > total
    })
    .eq(t.id, teamId);

  if (res.error) throw new Error(`فشل تحديث النقاط: ${res.error.message}`);

  // Log to points_log
  const p = DB.pointsLog;
  await supabase.from(p.table).insert([{
    [p.teamId]:   teamId,
    [p.amount]:   -Number(amount),
    [p.type]:     'deduct',
    [p.reason]:   `إجراء إداري: ${reason.trim()}`,
    [p.addedBy]:  adminId ?? null,
  }]);

  // Log to activity_log
  try {
    await logActivity({
      team_id: teamId,
      actor_user_id: adminId || null,
      action_type: 'DEDUCT_POINTS',
      amount: -Number(amount),
      reason: `تم خصم ${amount} نقطة من ميزانية السبط: ${reason.trim()}`
    });
  } catch (errAct) {
    console.warn('[Activity] Failed to log point deduction:', errAct);
  }

  return { success: true, newTotal };
}

// Super Admin: Award points to a team
export async function awardPoints({ teamId, amount, reason, addedBy }: any) {
  if (!teamId)           throw new Error('لم يتم تحديد السبط');
  if (!amount || amount < 1) throw new Error('عدد النقاط يجب أن يكون أكبر من صفر');
  if (!reason?.trim())   throw new Error('سبب المكافأة مطلوب');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Database connection failed');

  const t = DB.teams;

  // Get current points
  const { data: team, error: fetchErr } = await supabase
    .from(t.table)
    .select('*')
    .eq(t.id, teamId)
    .single();

  if (fetchErr) throw new Error(`فشل جلب السبط: ${fetchErr.message}`);

  const currentTotal = team[t.pointsTotal] ?? team[t.points] ?? 0;
  const newTotal     = currentTotal + Number(amount);

  // Update points_total (and legacy 'points' for compatibility)
  let updateErr;
  const res = await supabase
    .from(t.table)
    .update({
      [t.pointsTotal]: newTotal,
      [t.points]:      newTotal,   // keep legacy 'points' in sync
    })
    .eq(t.id, teamId);

  updateErr = res.error;

  // Fallback if SQL hasn't been run yet
  if (updateErr && updateErr.message.includes('does not exist')) {
    console.warn('Falling back to legacy column, please run SQL migration');
    const fallback = await supabase
      .from(t.table)
      .update({ [t.points]: newTotal })
      .eq(t.id, teamId);
    updateErr = fallback.error;
  }

  if (updateErr) throw new Error(`فشل تحديث النقاط: ${updateErr.message}`);

  // Log to points_log
  const p = DB.pointsLog;
  const { error: logErr } = await supabase
    .from(p.table)
    .insert([{
      [p.teamId]:   teamId,
      [p.amount]:   Number(amount),
      [p.type]:     'award',
      [p.reason]:   reason.trim(),
      [p.addedBy]:  addedBy ?? null,
    }]);

  if (logErr) console.warn('Log failed (non-critical):', logErr.message);

  // Log to activity_log
  try {
    await logActivity({
      team_id: teamId,
      actor_user_id: addedBy || null,
      action_type: 'ADD_POINTS',
      amount: Number(amount),
      reason: `تمت إضافة +${amount} نقطة لميزانية السبط: ${reason.trim()}`
    });
  } catch (errAct) {
    console.warn('[Activity] Failed to log point award:', errAct);
  }

  return { success: true, newTotal };
}

// Team Admin: Spend points (on map building)
export async function spendPoints({ teamId, amount, reason, spentBy }: any) {
  if (!teamId)           throw new Error('لم يتم تحديد السبط');
  if (!amount || amount < 1) throw new Error('النقاط يجب أن تكون أكبر من صفر');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Database connection failed');

  const t = DB.teams;

  const { data: team, error: fetchErr } = await supabase
    .from(t.table)
    .select('*')
    .eq(t.id, teamId)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const total     = team[t.pointsTotal] ?? team[t.points] ?? 0;
  const spent     = team[t.pointsSpent] ?? 0;
  const available = total - spent;

  if (Number(amount) > available) {
    throw new Error(`النقاط غير كافية — المتاح: ${available} نقطة`);
  }

  const newSpent = spent + Number(amount);

  let updateErr;
  const res = await supabase
    .from(t.table)
    .update({ [t.pointsSpent]: newSpent })
    .eq(t.id, teamId);
    
  updateErr = res.error;
  
  if (updateErr && updateErr.message.includes('does not exist')) {
     console.warn('Falling back to legacy logic (ignoring spent), please run SQL migration');
     const newPoints = total - Number(amount);
     const fallback = await supabase
       .from(t.table)
       .update({ [t.points]: newPoints })
       .eq(t.id, teamId);
     updateErr = fallback.error;
  }

  if (updateErr) throw new Error(updateErr.message);

  // Log to points_log
  const p = DB.pointsLog;
  const { error: logErr } = await supabase.from(p.table).insert([{
    [p.teamId]:  teamId,
    [p.amount]:  -Number(amount),
    [p.type]:    'spend',
    [p.reason]:  reason?.trim() ?? 'بناء على الخريطة',
    [p.addedBy]: spentBy ?? null,
  }]);
  
  if (logErr) console.warn('Log failed (non-critical):', logErr.message);

  // Log to activity_log (if not a standard building placement, to avoid double count logs)
  if (!reason?.startsWith('بناء ')) {
    try {
      await logActivity({
        team_id: teamId,
        actor_user_id: spentBy || null,
        action_type: 'SPEND_POINTS',
        amount: -Number(amount),
        reason: reason?.trim() || 'صرف نقاط'
      });
    } catch (errAct) {
      console.warn('[Activity] Failed to log points spend:', errAct);
    }
  }

  return { success: true, newAvailable: available - Number(amount) };
}

// Fetch team points summary
export async function fetchTeamPoints(teamId: string) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const t = DB.teams;

  const { data, error } = await supabase
    .from(t.table)
    .select('*')
    .eq(t.id, teamId)
    .single();

  if (error) throw new Error(error.message);

  const total     = data[t.pointsTotal] ?? data[t.points] ?? 0;
  const spent     = data[t.pointsSpent] ?? 0;

  return {
    name:      data[t.name],
    total,
    spent,
    available: total - spent,
  };
}

export async function deductTeamPoints(teamId: string, amount: number) {
  return await spendPoints({ teamId, amount, reason: 'بناء على الخريطة', spentBy: null });
}

export async function fetchAvailablePoints(teamId: string) {
  const points = await fetchTeamPoints(teamId);
  return points?.available ?? 0;
}

// Fetch points log for a team
export async function fetchPointsLog(teamId: string) {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('points_log')
    .select('*, added_by_user:users(name, username)')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}
