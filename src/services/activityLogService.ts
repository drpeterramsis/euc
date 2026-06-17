import { getSupabase } from '../lib/supabase';

export async function logActivity({
  team_id,
  user_id, // legacy
  actor_user_id,
  action_type,
  description, // legacy
  reason,
  amount = 0,
  metadata,
}: {
  team_id: string | null;
  user_id?: string | null;
  actor_user_id?: string | null;
  action_type: string;
  description?: string;
  reason?: string;
  amount?: number;
  metadata?: any;
}) {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const finalActorUserId = actor_user_id || user_id || null;
    let finalReason = reason || description || '';
    
    let finalActionType = 'SYSTEM';
    const at = String(action_type).toUpperCase();
    if (at === 'POINTS_ADD' || at === 'ADD_POINTS') finalActionType = 'ADD_POINTS';
    else if (at === 'POINTS_DEDUCT' || at === 'DEDUCT_POINTS') finalActionType = 'DEDUCT_POINTS';
    else if (at === 'BUILD' || at === 'SPEND_POINTS') finalActionType = 'SPEND_POINTS';
    else if (at === 'DESTROY' || at === 'REFUND_POINTS') finalActionType = 'REFUND_POINTS';
    else if (at === 'POINTS_SYNC' || at === 'ADMIN_ADJUST') finalActionType = 'ADMIN_ADJUST';
    else finalActionType = 'SYSTEM';

    // Fetch actor details
    let actorName = 'النظام';
    let actorRole = 'system';
    if (finalActorUserId) {
      const { data: u } = await supabase
        .from('users')
        .select('name, role')
        .eq('id', finalActorUserId)
        .maybeSingle();
      if (u) {
        actorName = u.name || actorName;
        actorRole = u.role || actorRole;
      }
    }

    let finalAmount = 0;
    if (amount !== undefined && amount !== null) {
      const parsed = Number(amount);
      if (!isNaN(parsed) && isFinite(parsed)) {
        if (finalActionType === 'DEDUCT_POINTS' || finalActionType === 'SPEND_POINTS') {
          // Store spend/deduct action amounts as negative
          finalAmount = parsed > 0 ? -parsed : parsed;
        } else {
          finalAmount = Math.abs(parsed);
        }
      }
    }

    const payload = {
      team_id: team_id || null,
      action_type: finalActionType,
      amount: finalAmount,
      reason: finalReason.trim() || 'إجراء غير محدد',
      actor_user_id: finalActorUserId,
      actor_name: actorName,
      actor_role: actorRole,
      metadata: metadata || null,
      created_at: new Date().toISOString()
    };

    // Try inserting to singular activity_log first
    const { error } = await supabase
      .from('activity_log')
      .insert(payload);

    if (error) {
      // Check if it's due to non-existent activity_log table
      const isMissingTable = error.message.includes('relation "activity_log" does not exist') ||
                             error.message.includes('does not exist') ||
                             error.code === '42P01';

      if (isMissingTable) {
        console.warn('[ActivityLog] falling back to plural activity_logs table');
        const legacyPayload = {
          team_id: team_id || null,
          user_id: finalActorUserId,
          action_type: finalActionType,
          description: `[${actorName} - ${actorRole}] ${finalReason.trim() || 'إجراء غير محدد'} (${amount !== 0 ? `${amount > 0 ? '+' : ''}${amount} نقطة` : 'لا نقاط'})`,
          created_at: new Date().toISOString()
        };
        const { error: legacyError } = await supabase
          .from('activity_logs')
          .insert(legacyPayload);

        if (legacyError) {
          console.error('[ActivityLog] legacy fallback table insert failed:', legacyError.message);
        }
      } else {
        console.warn('[ActivityLog] failed inserting log, trying fallback without actor_user_id:', error.message);
        
        // Try inserting with actor_user_id cleared (most common foreign key failure source)
        const fallbackActorPayload = {
          ...payload,
          actor_user_id: null
        };
        
        const { error: fallbackActorErr } = await supabase
          .from('activity_log')
          .insert(fallbackActorPayload);
          
          if (fallbackActorErr) {
            console.warn('[ActivityLog] fallback without actor_user_id failed too, trying fallback without team_id either:', fallbackActorErr.message);
            
            // Try inserting with both cleared to guarantee insertion success
            const fallbackAllPayload = {
              ...payload,
              actor_user_id: null,
              team_id: null
            };
            
            const { error: fallbackAllErr } = await supabase
              .from('activity_log')
              .insert(fallbackAllPayload);
              
            if (fallbackAllErr) {
              console.error('[ActivityLog] all fallback attempts failed:', fallbackAllErr.message);
            } else {
              console.log('[ActivityLog] successfully logged activity after stripping both foreign keys.');
            }
          } else {
            console.log('[ActivityLog] successfully logged activity after stripping actor_user_id.');
          }
      }
    } else {
      console.log('[ActivityLog] successfully inserted log to activity_log');
    }
  } catch (err) {
    console.error('[ActivityLog] Exception ignored:', err);
  }
}

// Helper function to map activity items with fallback points parser
function mapActivityItem(item: any, isLegacy: boolean) {
  const actorName = isLegacy ? (item.user?.name || 'النظام') : (item.actor_name || 'النظام');
  const actorRole = isLegacy ? (item.user?.role || 'system') : (item.actor_role || 'system');
  const reasonText = (isLegacy ? item.description : item.reason) || '';

  // Parse points amount from description / reason
  let finalAmt = Number(item.amount || 0);
  if (finalAmt === 0 && reasonText) {
    // Match pattern like (+50 نقطة) or (-15 نقطة) or (15 نقطة)
    const match = reasonText.match(/\(([-+]?\d+)\s*نقطة\)/);
    if (match && match[1]) {
      finalAmt = Math.abs(Number(match[1]));
    } else {
      // Match words like "خصم 50 نقطة" or "صرف 10 نقاط" or "بناء خيمة (5 نقاط)" or similar
      const subMatch = reasonText.match(/(?:خصم|إضافة|صرف|بناء|هدم|خصم نقاط|إثبات|رصيد)\s*([+-]?\d+)/);
      if (subMatch && subMatch[1]) {
        finalAmt = Math.abs(Number(subMatch[1]));
      }
    }
  }

  // Deduct/spend/build should be negative
  const isDeduction = item.action_type === 'DEDUCT_POINTS' || item.action_type === 'SPEND_POINTS' || item.action_type === 'BUILD' || item.action_type === 'POINTS_DEDUCT';
  if (isDeduction) {
    finalAmt = -Math.abs(finalAmt);
  } else {
    finalAmt = Math.abs(finalAmt);
  }

  return {
    id: item.id,
    team_id: item.team_id,
    action_type: item.action_type,
    amount: finalAmt,
    reason: reasonText,
    actor_user_id: isLegacy ? item.user_id : item.actor_user_id,
    actor_name: actorName,
    actor_role: actorRole,
    created_at: item.created_at,
    team: item.team,
    metadata: item.metadata || null
  };
}

export async function fetchActivities({ teamId }: { teamId?: string } = {}) {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    let query = supabase
      .from('activity_log')
      .select(`
        *,
        team:teams(id, name, symbol)
      `)
      .order('created_at', { ascending: false });

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query.limit(100);
    if (error) {
      const isMissingTable = error.message.includes('relation "activity_log" does not exist') ||
                             error.message.includes('does not exist') ||
                             error.code === '42P01';

      if (isMissingTable) {
        console.warn('[ActivityLog] fetch falling back to legacy activity_logs table');
        let legacyQuery = supabase
          .from('activity_logs')
          .select(`
            *,
            team:teams(id, name, symbol),
            user:users(id, name, role)
          `)
          .order('created_at', { ascending: false });

        if (teamId) {
          legacyQuery = legacyQuery.eq('team_id', teamId);
        }

        const { data: legacyData, error: legacyErr } = await legacyQuery.limit(100);
        if (legacyErr) {
          console.error('[ActivityLog] legacy table fetch failed:', legacyErr.message);
          return [];
        }

        return (legacyData ?? []).map(item => mapActivityItem(item, true));
      }

      console.error('Error fetching activity log:', error);
      return [];
    }
    return (data ?? []).map(item => mapActivityItem(item, false));
  } catch (err) {
    console.error('Exception fetching activity log:', err);
    return [];
  }
}

// For backward compatibility only:
export async function fetchTeamActivityLog(team_id: string) {
  return await fetchActivities({ teamId: team_id });
}
