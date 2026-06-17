import { getSupabase } from '../lib/supabase';
import { spendPoints } from './pointsService';
import { logActivity } from './activityLogService';
import { detectMapBuildingsSchema } from '../utils/schemaInspector';

// ─── Fetch all building types ───
export async function fetchBuildingTypes() {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('building_types')
    .select('*')
    .eq('is_active', true)
    .order('cost');

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Fetch buildings placed by a team ───
export async function fetchTeamBuildings(teamId: string) {
  const supabase = getSupabase();
  if (!supabase) return [];

  const schema = await detectMapBuildingsSchema();
  const { data, error } = await supabase
    .from('map_buildings')
    .select(`
      *,
      building_type:building_types(id, name, name_en, icon, cost, description)
    `)
    .eq(schema.teamCol, teamId);

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Fetch ALL buildings on map (for map view) ───
export async function fetchAllMapBuildings() {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('map_buildings')
    .select(`
      *,
      building_type:building_types(id, name, name_en, icon, cost),
      team:teams(id, name, color, symbol)
    `);

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Reset map functions ───
export async function resetTeamMap(
  teamId: string,
  currentUserId: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  const supabase = getSupabase()

  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', currentUserId)
    .single()

  if (adminUser?.role !== 'super_admin') {
    return { success: false, deletedCount: 0, error: 'غير مصرح' }
  }

  // Count using confirmed team_id column
  const { count } = await supabase
    .from('map_buildings')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId)

  // Delete using confirmed team_id column
  const { error } = await supabase
    .from('map_buildings')
    .delete()
    .eq('team_id', teamId)

  if (error) return { success: false, deletedCount: 0, error: error.message }

  // Log — no point restoration
  await logActivity({
    team_id: teamId,
    actor_user_id: currentUserId,
    action_type: 'SYSTEM',
    amount: 0,
    reason: `تم مسح الخريطة (${count || 0} مبنى) - النقاط محتفظ بها`,
  });

  return { success: true, deletedCount: count || 0 }
}

export async function resetAllMaps(
  currentUserId: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  const supabase = getSupabase()

  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', currentUserId)
    .single()

  if (adminUser?.role !== 'super_admin') {
    return { success: false, deletedCount: 0, error: 'غير مصرح' }
  }

  const { count } = await supabase
    .from('map_buildings')
    .select('id', { count: 'exact', head: true })

  const { error } = await supabase
    .from('map_buildings')
    .delete()
    .not('id', 'is', null)

  if (error) return { success: false, deletedCount: 0, error: error.message }

  await logActivity({
    team_id: null,
    actor_user_id: currentUserId,
    action_type: 'SYSTEM',
    amount: 0,
    reason: `تم مسح جميع الخرائط (${count || 0} مبنى)`,
  });

  return { success: true, deletedCount: count || 0 }
}

export async function deleteBuilding(
  buildingId: string,
  currentUser: { id: string; role: string; team_id: string }
): Promise<boolean> {
  const supabase = getSupabase()

  // Fetch using only confirmed columns
  const { data: building, error } = await supabase
    .from('map_buildings')
    .select('id, team_id, building_type_id, points_spent')
    .eq('id', buildingId)
    .single()

  if (error || !building) throw new Error('المبنى غير موجود')

  const canDelete =
    currentUser.role === 'super_admin' ||
    currentUser.team_id === building.team_id

  if (!canDelete) throw new Error('غير مصرح بهدم هذا المبنى')

  const { error: delError } = await supabase
    .from('map_buildings')
    .delete()
    .eq('id', buildingId)

  if (delError) throw new Error('فشل الهدم: ' + delError.message)

  return true
}

export async function calculateTeamActualSpend(
  teamId: string
): Promise<{ actualSpend: number; buildingCount: number; error?: string }> {
  const supabase = getSupabase()

  // Use confirmed columns only
  const { data, error } = await supabase
    .from('map_buildings')
    .select(`
      id,
      points_spent,
      building_type_id,
      building_types ( cost )
    `)
    .eq('team_id', teamId)

  if (error) {
    // Fallback: use points_spent column directly
    const { data: plain, error: e2 } = await supabase
      .from('map_buildings')
      .select('id, points_spent')
      .eq('team_id', teamId)

    if (e2) return { actualSpend: 0, buildingCount: 0, error: e2.message }

    const totalFromPointsSpent = (plain || []).reduce(
      (sum, b) => sum + Number(b.points_spent || 0), 0
    )
    return {
      actualSpend: totalFromPointsSpent,
      buildingCount: plain?.length || 0
    }
  }

  // Use building_types.cost if available, else fall back to points_spent
  const actualSpend = (data || []).reduce((sum, b: any) => {
    const cost = b.building_types?.cost ?? b.points_spent ?? 0
    return sum + Number(cost)
  }, 0)

  return { actualSpend, buildingCount: data?.length || 0 }
}

export async function getTeamPointsSummary(teamId: string): Promise<{
  totalAwarded: number
  totalSpent: number
  available: number
  actualSpendFromBuildings: number
  discrepancy: number
  buildingCount: number
  error?: string
}> {
  const supabase = getSupabase();
  if (!supabase) return { totalAwarded: 0, totalSpent: 0, available: 0, actualSpendFromBuildings: 0, discrepancy: 0, buildingCount: 0, error: 'Database unavailable' };

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('available_points, total_points, spent_points')
    .eq('id', teamId)
    .single();
  
  if (teamError) return {
    totalAwarded: 0, totalSpent: 0, available: 0,
    actualSpendFromBuildings: 0, discrepancy: 0, buildingCount: 0,
    error: teamError.message
  };
  
  const { actualSpend, buildingCount } = await calculateTeamActualSpend(teamId);
  
  const totalSpent = team?.spent_points || 0;
  const discrepancy = totalSpent - actualSpend;
  
  return {
    totalAwarded: team?.total_points || 0,
    totalSpent,
    available: team?.available_points || 0,
    actualSpendFromBuildings: actualSpend,
    discrepancy,
    buildingCount,
  };
}

export async function syncTeamPoints(
  teamId: string,
  currentUserId: string
): Promise<{ success: boolean; pointsRestored: number; error?: string }> {
  
  const supabase = getSupabase();
  if (!supabase) return { success: false, pointsRestored: 0, error: 'Database unavailable' };

  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', currentUserId)
    .single();
  
  if (adminUser?.role !== 'super_admin') {
    return { success: false, pointsRestored: 0, error: 'غير مصرح' }
  }
  
  const summary = await getTeamPointsSummary(teamId);
  if (summary.error) return { success: false, pointsRestored: 0, error: summary.error };
  
  const orphanedPoints = summary.discrepancy;
  
  if (orphanedPoints <= 0) {
    return { success: true, pointsRestored: 0 };
  }
  
  const { error } = await supabase
    .from('teams')
    .update({
      spent_points: summary.actualSpendFromBuildings,
      available_points: summary.totalAwarded - summary.actualSpendFromBuildings,
    })
    .eq('id', teamId);
  
  if (error) return { success: false, pointsRestored: 0, error: error.message };
  
  await logActivity({
    team_id: teamId,
    actor_user_id: currentUserId,
    action_type: 'ADMIN_ADJUST',
    amount: orphanedPoints,
    reason: `مزامنة النقاط: استعادة ${orphanedPoints} نقطة يتيمة (${summary.buildingCount} مبنى فعلي)`,
  });
  
  return { success: true, pointsRestored: orphanedPoints };
}

// ─── Place a building (deducts points) ───
export async function placeBuilding({
  teamId, buildingTypeId, mapX, mapY,
  mapRegion, nameOverride, placedBy, notes
}: {
  teamId: string;
  buildingTypeId: string;
  mapX?: number;
  mapY?: number;
  mapRegion?: string;
  nameOverride?: string;
  placedBy?: string;
  notes?: string;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database connection failed');

  const { data: bType, error: btErr } = await supabase
    .from('building_types')
    .select('id, name, cost, max_per_team')
    .eq('id', buildingTypeId)
    .single();

  if (btErr || !bType) throw new Error('نوع المبنى غير موجود');

  const schema = await detectMapBuildingsSchema();

  if (bType.max_per_team !== null) {
    const { count } = await supabase
      .from('map_buildings')
      .select('id', { count: 'exact', head: true })
      .eq(schema.teamCol, teamId)
      .eq(schema.typeCol, buildingTypeId);

    if ((count ?? 0) >= bType.max_per_team) {
      throw new Error(`لا يمكن بناء أكثر من ${bType.max_per_team} ${bType.name} لكل سبط`);
    }
  }

  await spendPoints({
    teamId,
    amount:  bType.cost,
    reason:  `بناء ${bType.name}`,
    spentBy: placedBy,
  });

  const { data, error } = await supabase
    .from('map_buildings')
    .insert([{
      [schema.teamCol]: teamId,
      [schema.typeCol]: buildingTypeId,
      [schema.xCol]:    mapX ?? null,
      [schema.yCol]:    mapY ?? null,
      map_region:       mapRegion ?? null,
      name_override:    nameOverride?.trim() || null,
      points_spent:     bType.cost,
      placed_by:        placedBy,
      notes:            notes?.trim() || null,
    }])
    .select(`*, building_type:building_types(*)`)
    .single();

  if (error) throw new Error(`فشل إضافة المبنى: ${error.message}`);
  
  try {
    await logActivity({
      team_id: teamId,
      actor_user_id: placedBy || null,
      action_type: 'SPEND_POINTS',
      amount: -Number(bType.cost),
      reason: `تم بناء ${bType.name} ${nameOverride ? `(${nameOverride})` : ''}`
    });
  } catch (errAct) {
    console.warn('[Activity] Failed to log building placement:', errAct);
  }
  
  return data;
}

export async function removeBuilding(buildingId: string, teamId: string, removedBy: string, userRole?: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database connection failed');

  const { data: building, error: fetchErr } = await supabase
    .from('map_buildings')
    .select('*, building_type:building_types(name, cost), team_id, points_spent')
    .eq('id', buildingId)
    .single();

  if (fetchErr || !building) throw new Error('المبنى غير موجود');
  
  const schema = await detectMapBuildingsSchema();
  const buildingTeamId = building[schema.teamCol] || building.team_id;
  
  const canDelete = userRole === 'super_admin' || 
                    (userRole === 'team_admin' && buildingTeamId === teamId) ||
                    (userRole === 'member' && buildingTeamId === teamId);
                    
  if (!canDelete) throw new Error('غير مصرح بهدم هذا المبنى');

  const { error: delErr } = await supabase
    .from('map_buildings')
    .delete()
    .eq('id', buildingId);

  if (delErr) throw new Error('فشل الهدم: ' + delErr.message);

  const refundAmount = building.points_spent ?? building.building_type?.cost ?? 0;
  if (refundAmount > 0) {
    const { data: team } = await supabase
      .from('teams')
      .select('points_spent')
      .eq('id', teamId)
      .single();

    if (team) {
      await supabase
        .from('teams')
        .update({
          points_spent: Math.max(0, (team.points_spent ?? 0) - refundAmount),
        })
        .eq('id', teamId);
    }

    await supabase.from('points_log').insert([{
      team_id:  teamId,
      amount:   refundAmount,
      type:     'award',
      reason:   `هدم ${building.building_type?.name ?? 'مبنى'} واسترداد النقاط`,
      added_by: removedBy,
    }]);

    await logActivity({
      team_id: teamId,
      actor_user_id: removedBy,
      action_type: 'REFUND_POINTS',
      amount: Number(refundAmount),
      reason: `هدم ${building.building_type?.name ?? 'مبنى'} واسترداد النقاط`
    });
  } else {
    await logActivity({
      team_id: teamId,
      actor_user_id: removedBy,
      action_type: 'SYSTEM',
      amount: 0,
      reason: `هدم ${building.building_type?.name ?? 'مبنى'} (بدون استرداد نقاط)`
    });
  }

  return true;
}

export async function moveBuilding({
  buildingId,
  mapX,
  mapY,
  teamId,
  userId,
}: {
  buildingId: string;
  mapX: number;
  mapY: number;
  teamId: string;
  userId?: string;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database connection failed');

  const schema = await detectMapBuildingsSchema();

  const updateData: any = {
    [schema.xCol]: mapX,
    [schema.yCol]: mapY,
  };
  if (userId) {
    updateData.placed_by = userId;
  }

  const { data, error } = await supabase
    .from('map_buildings')
    .update(updateData)
    .eq('id', buildingId)
    .eq(schema.teamCol, teamId)
    .select('*, building_type:building_types(*)')
    .single();

  if (error) throw new Error(`فشل إعادة تعيين الإحداثيات: ${error.message}`);
  
  await logActivity({
    team_id: teamId,
    actor_user_id: userId || null,
    action_type: 'SYSTEM',
    amount: 0,
    reason: `تم نقل ${data.building_type?.name ?? 'مبنى'}`
  });
  
  return data;
}

export async function updateBuildingName({
  buildingId,
  name,
}: {
  buildingId: string;
  name: string;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database connection failed');

  const { data, error } = await supabase
    .from('map_buildings')
    .update({
      name_override: name.trim() || null,
    })
    .eq('id', buildingId)
    .select('*, building_type:building_types(*)')
    .single();

  if (error) throw new Error(`فشل تعديل الاسم: ${error.message}`);
  return data;
}
