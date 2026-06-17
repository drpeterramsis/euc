import { getSupabase } from '../lib/supabase';
import { DB } from '../config/dbSchema';

export async function fetchTeamMembers(team_id: string) {
  const supabase = getSupabase();
  if(!supabase) return [];
  const { data, error } = await supabase
    .from('users')
    .select('id, name, username, role')
    .eq('team_id', team_id)
    .order('role', { ascending: true });
  if (error) return [];
  return data ?? [];
}

function cleanAndNormalize(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .replace(/[أإآإآأٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/^سبط\s+/, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

export async function fetchTeamsWithStats() {
  const supabase = getSupabase();
  if (!supabase) return [];

  // Query teams, users and land_tiles in parallel
  const [teamsRes, usersRes, tilesRes] = await Promise.all([
    supabase.from(DB.teams.table).select('*').order(DB.teams.name),
    supabase.from(DB.users.table).select('id, team_id'),
    supabase.from('land_tiles').select('id, team_id'),
  ]);

  if (teamsRes.error) throw new Error(teamsRes.error.message);

  const canonicalTribes = [
    { name: 'سبط رأوبين', name_en: 'Reuben', color: '#E74C3C', symbol: '🌊', map_region: 'reuben' },
    { name: 'سبط شمعون', name_en: 'Simeon', color: '#8E44AD', symbol: '👂', map_region: 'simeon' },
    { name: 'سبط يهوذا', name_en: 'Judah', color: '#F39C12', symbol: '🦁', map_region: 'judah' },
    { name: 'سبط يساكر', name_en: 'Issachar', color: '#27AE60', symbol: '⚖️', map_region: 'issachar' },
    { name: 'سبط زبولون', name_en: 'Zebulun', color: '#16A085', symbol: '⚓', map_region: 'zebulun' },
    { name: 'سبط دان', name_en: 'Dan', color: '#2C3E50', symbol: '🐍', map_region: 'dan' },
    { name: 'سبط نفتالي', name_en: 'Naphtali', color: '#D35400', symbol: '🦌', map_region: 'naphtali' },
    { name: 'سبط جاد', name_en: 'Gad', color: '#7F8C8D', symbol: '⚔️', map_region: 'gad' },
    { name: 'سبط أشير', name_en: 'Asher', color: '#C0392B', symbol: '🌿', map_region: 'asher' },
    { name: 'سبط أفرايم', name_en: 'Ephraim', color: '#1ABC9C', symbol: '🍇', map_region: 'ephraim' },
    { name: 'سبط بنيامين', name_en: 'Benjamin', color: '#8B4513', symbol: '🐺', map_region: 'benjamin' },
    { name: 'سبط منسى', name_en: 'Manasseh', color: '#34495E', symbol: '🪵', map_region: 'manasseh' }
  ];

  let teamsListFromDb = teamsRes.data ?? [];
  let needsRequery = false;

  // De-duplicate teams in database (keep first occurrence of each canonical English name, remove the rest)
  const seenEn = new Set<string>();
  const duplicatesToRemove: string[] = [];
  for (const t of teamsListFromDb) {
    const en = (t.name_en || '').toLowerCase();
    if (seenEn.has(en)) {
      duplicatesToRemove.push(t.id);
    } else {
      seenEn.add(en);
    }
  }

  if (duplicatesToRemove.length > 0) {
    for (const dupId of duplicatesToRemove) {
      await supabase.from(DB.teams.table).delete().eq('id', dupId);
    }
    // Requery so the teams list is clean
    const requery = await supabase.from(DB.teams.table).select('*').order(DB.teams.name);
    teamsListFromDb = requery.data ?? [];
    needsRequery = true;
  }

  const isSynced = teamsListFromDb.length === canonicalTribes.length && teamsListFromDb.every((t: any) => {
    const canonical = canonicalTribes.find(c => 
      c.name_en.toLowerCase() === (t.name_en || '').toLowerCase()
    );
    return canonical && t.name === canonical.name && t.symbol === canonical.symbol && t.color === canonical.color && t.map_region === canonical.map_region;
  });

  if (!isSynced) {
    for (const canon of canonicalTribes) {
      const existing = teamsListFromDb.find((t: any) => {
        const en = (t.name_en || '').toLowerCase();
        const ar = cleanAndNormalize(t.name || '');
        const canonEn = canon.name_en.toLowerCase();
        const canonAr = cleanAndNormalize(canon.name);

        if (canonEn === 'ephraim' && en === 'joseph') return true;
        return en === canonEn || ar === canonAr;
      });

      if (existing) {
        if (
          existing.name !== canon.name ||
          existing.name_en !== canon.name_en ||
          existing.color !== canon.color ||
          existing.symbol !== canon.symbol ||
          existing.map_region !== canon.map_region
        ) {
          await supabase.from(DB.teams.table).update({
            name: canon.name,
            name_en: canon.name_en,
            color: canon.color,
            symbol: canon.symbol,
            map_region: canon.map_region
          }).eq('id', existing.id);
          needsRequery = true;
        }
      } else {
        await supabase.from(DB.teams.table).insert({
          name: canon.name,
          name_en: canon.name_en,
          color: canon.color,
          symbol: canon.symbol,
          map_region: canon.map_region,
          points: 0,
          points_total: 0,
          points_spent: 0
        });
        needsRequery = true;
      }
    }

    // Clean extraneous teams
    for (const t of teamsListFromDb) {
      const en = (t.name_en || '').toLowerCase();
      const isExpected = canonicalTribes.some(c => 
        c.name_en.toLowerCase() === en || 
        (c.name_en === 'Ephraim' && en === 'joseph')
      );
      if (!isExpected) {
        await supabase.from(DB.teams.table).delete().eq('id', t.id);
        needsRequery = true;
      }
    }

    if (needsRequery) {
      const requery = await supabase.from(DB.teams.table).select('*').order(DB.teams.name);
      teamsListFromDb = requery.data ?? [];
    }
  }

  const usersList = usersRes.data ?? [];
  const tilesList = tilesRes.data ?? [];

  return (teamsListFromDb).map((team: any) => {
    // In-memory filter for maximum reliability across database states
    const memberCount = usersList.filter((u: any) => u.team_id === team.id).length;
    const landsCount = tilesList.filter((tile: any) => tile.team_id === team.id).length;
    
    const pointsTotal = team[DB.teams.pointsTotal] ?? team[DB.teams.points] ?? 0;
    const pointsSpent = team[DB.teams.pointsSpent] ?? 0;

    // Maintain backwards compatibility with places expecting .users and .land_tiles counts nested arrays:
    const mockUsers = [{ count: memberCount }];
    const mockLandTiles = [{ count: landsCount }];

    return {
      ...team,
      users: mockUsers,
      land_tiles: mockLandTiles,
      memberCount,
      landsCount,
      pointsTotal,
      pointsSpent,
      points: pointsTotal, // KEEP synced to avoid discrepancy between points & points_total
      pointsAvailable: pointsTotal - pointsSpent,
    };
  });
}

export async function fetchSingleTeamWithMembers(teamId: string) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const [teamRes, membersRes] = await Promise.all([
    supabase.from(DB.teams.table).select('*').eq(DB.teams.id, teamId).single(),
    supabase.from(DB.users.table).select('*')
      .eq(DB.users.teamId, teamId).order(DB.users.name),
  ]);

  if (teamRes.error)    throw new Error(teamRes.error.message);
  if (membersRes.error) throw new Error(membersRes.error.message);

  const team    = teamRes.data;
  const members = membersRes.data ?? [];

  const pointsTotal = team[DB.teams.pointsTotal] ?? team[DB.teams.points] ?? 0;
  const pointsSpent = team[DB.teams.pointsSpent] ?? 0;

  return {
    ...team,
    members,
    memberCount:     members.length,
    pointsTotal,
    pointsSpent,
    pointsAvailable: pointsTotal - pointsSpent,
  };
}

export async function saveAllMapRegions(assignments: { teamId: string, region: string }[]) {
  const supabase = getSupabase();
  if (!supabase) return false;

  const results = await Promise.all(
    assignments.map(({ teamId, region }) =>
      supabase
        .from(DB.teams.table)
        .update({ [DB.teams.mapRegion]: region })
        .eq(DB.teams.id, teamId)
    )
  );

  const failed = results.filter(r => r.error);
  if (failed.length > 0) {
    throw new Error(`فشل حفظ ${failed.length} سبط: ${failed[0].error?.message}`);
  }

  return true;
}

