/*
-- Ensure building_types table has these columns:
-- ALTER TABLE building_types ADD COLUMN IF NOT EXISTS name_en VARCHAR(100);
-- ALTER TABLE building_types ADD COLUMN IF NOT EXISTS exclusion_radius INT DEFAULT 50;
-- ALTER TABLE building_types ADD COLUMN IF NOT EXISTS max_per_team INT DEFAULT 3;
-- ALTER TABLE building_types ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#D4AF37';
-- ALTER TABLE building_types ADD COLUMN IF NOT EXISTS icon VARCHAR(10);

-- RLS: only super_admin can insert/update/delete building_types
DROP POLICY IF EXISTS "super_admin_manage_building_types" ON building_types;
CREATE POLICY "super_admin_manage_building_types" ON building_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );
*/

import { getSupabase } from '../lib/supabase';

export type NewBuildingTypeInput = {
  name: string
  name_en?: string
  icon: string
  cost: number
  max_per_team: number | null
  color: string
  exclusion_radius: number
  prerequisites?: string | null
  category?: string | null
}

// Arabic and Unicode Nomarlizer helper to ensure resilient string comparisons
function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFC')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export async function fetchAllBuildingTypes() {
  const supabase = getSupabase();
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('building_types')
    .select('*')
    .order('cost', { ascending: true });
    
  if (error) {
    console.warn('[fetchAllBuildingTypes] Database error or missing prerequisites column:', error.message);
    throw error;
  }
  
  console.log('[fetchAllBuildingTypes] Currently fetched building types objects:', JSON.stringify(data, null, 2));

  // Fetch current prerequisites map from game_settings to avoid missing column issues on live Supabase
  let prereqMap: Record<string, string> = {};

  // 1. Try loading from localStorage first as the robust master copy
  try {
    const local = localStorage.getItem('building_prerequisites');
    if (local) {
      prereqMap = JSON.parse(local);
    }
  } catch (localErr) {
    console.warn('[fetchAllBuildingTypes] localStorage load skipped:', localErr);
  }

  // 2. Try loading from game_settings database if it exists
  try {
    const { data: gsData } = await supabase
      .from('game_settings')
      .select('*')
      .eq('key', 'building_prerequisites')
      .maybeSingle();
    if (gsData && gsData.value) {
      const dbMap = JSON.parse(gsData.value);
      prereqMap = { ...prereqMap, ...dbMap };
    }
  } catch (err) {
    console.warn('[fetchAllBuildingTypes] game_settings table omitted (expected if table missing):', err);
  }

  // Self-heal/Bootstrap the newly requested types on-the-fly if they don't exist
  const requiredNewTypes = [
    { name: 'خيمة', name_en: 'Tent', icon: '⛺', cost: 1, max_per_team: null, color: '#D4AF37', exclusion_radius: 10 },
    { name: 'بئر ماء', name_en: 'Water Well', icon: '🪣', cost: 2, max_per_team: null, color: '#2E79B4', exclusion_radius: 10 },
    { name: 'مذبح حجرى', name_en: 'Stone Altar', icon: '🪨', cost: 3, max_per_team: 2, color: '#888', exclusion_radius: 10 },
    { name: 'حقل', name_en: 'Field', icon: '🌾', cost: 1, max_per_team: null, color: '#FFD700', exclusion_radius: 10 },
    { name: 'ارض زراعية', name_en: 'Farmland', icon: '🚜', cost: 2, max_per_team: null, color: '#228B22', exclusion_radius: 10 },
    { name: 'ارض صحراوية', name_en: 'Desert Land', icon: '🏜️', cost: 1, max_per_team: null, color: '#E3C565', exclusion_radius: 10 },
    { name: 'ارض صخرية', name_en: 'Rocky Land', icon: '⛰️', cost: 1, max_per_team: null, color: '#808080', exclusion_radius: 10 },
    { name: 'ارض رعوية', name_en: 'Pasture Land', icon: '🌱', cost: 1, max_per_team: null, color: '#2ecc71', exclusion_radius: 10 },
    
    // Standard Road Varieties
    { name: 'طريق أفقى', name_en: 'Horizontal Road', icon: '🛣️↔️', cost: 1, max_per_team: null, color: '#D2B48C', exclusion_radius: 10 },
    { name: 'طريق عمودى', name_en: 'Vertical Road', icon: '🛣️↕️', cost: 1, max_per_team: null, color: '#D2B48C', exclusion_radius: 10 },
    { name: 'زاوية طريق شمال غرب', name_en: 'Road NW Corner', icon: '🛣️↖️', cost: 1, max_per_team: null, color: '#D2B48C', exclusion_radius: 10 },
    { name: 'زاوية طريق شمال شرق', name_en: 'Road NE Corner', icon: '🛣️↗️', cost: 1, max_per_team: null, color: '#D2B48C', exclusion_radius: 10 },
    { name: 'زاوية طريق جنوب غرب', name_en: 'Road SW Corner', icon: '🛣️↙️', cost: 1, max_per_team: null, color: '#D2B48C', exclusion_radius: 10 },
    { name: 'زاوية طريق جنوب شرق', name_en: 'Road SE Corner', icon: '🛣️↘️', cost: 1, max_per_team: null, color: '#D2B48C', exclusion_radius: 10 },

    // Stone Road Varieties
    { name: 'طريق صخرى أفقى', name_en: 'Horizontal Stone Road', icon: '🪨↔️', cost: 1, max_per_team: null, color: '#777', exclusion_radius: 10 },
    { name: 'طريق صخري عمودى', name_en: 'Vertical Stone Road', icon: '🪨↕️', cost: 1, max_per_team: null, color: '#777', exclusion_radius: 10 },
    { name: 'زاوية طريق صخري شمال غرب', name_en: 'Stone Road NW Corner', icon: '🪨↖️', cost: 1, max_per_team: null, color: '#777', exclusion_radius: 10 },
    { name: 'زاوية طريق صخري شمال شرق', name_en: 'Stone Road NE Corner', icon: '🪨↗️', cost: 1, max_per_team: null, color: '#777', exclusion_radius: 10 },
    { name: 'زاوية طريق صخري جنوب غرب', name_en: 'Stone Road SW Corner', icon: '🪨↙️', cost: 1, max_per_team: null, color: '#777', exclusion_radius: 10 },
    { name: 'زاوية طريق صخري جنوب شرق', name_en: 'Stone Road SE Corner', icon: '🪨↘️', cost: 1, max_per_team: null, color: '#777', exclusion_radius: 10 },

    { name: 'منزل حجرى صغير', name_en: 'Small Stone House', icon: '🏠', cost: 5, max_per_team: 3, color: '#8B4513', exclusion_radius: 10 },
    { name: 'رقعة مياة', name_en: 'Water Patch', icon: '💧', cost: 1, max_per_team: null, color: '#5dade2', exclusion_radius: 10 },
    { name: 'شجرة', name_en: 'Tree', icon: '🌲', cost: 1, max_per_team: null, color: '#228B22', exclusion_radius: 10 },
    
    // Core Livestock
    { name: 'بقرة', name_en: 'Cow', icon: '🐄', cost: 2, max_per_team: 5, color: '#333', exclusion_radius: 10 },
    { name: 'خروف', name_en: 'Sheep', icon: '🐑', cost: 2, max_per_team: 5, color: '#FFF', exclusion_radius: 10 },
    { name: 'طيور', name_en: 'Birds', icon: '🐦', cost: 1, max_per_team: 10, color: '#58D68D', exclusion_radius: 10 },
    
    // 9 New Domestic Animals requested by user
    { name: 'فرخة', name_en: 'Chicken', icon: '🐔', cost: 1, max_per_team: 20, color: '#FFD700', exclusion_radius: 10 },
    { name: 'ارنب', name_en: 'Rabbit', icon: '🐇', cost: 1, max_per_team: 20, color: '#C0C0C0', exclusion_radius: 10 },
    { name: 'معزة', name_en: 'Goat', icon: '🐐', cost: 2, max_per_team: 15, color: '#D3D3D3', exclusion_radius: 10 },
    { name: 'حصان', name_en: 'Horse', icon: '🐎', cost: 3, max_per_team: 10, color: '#8B4513', exclusion_radius: 10 },
    { name: 'حمار', name_en: 'Donkey', icon: '🫏', cost: 2, max_per_team: 10, color: '#A9A9A9', exclusion_radius: 10 },
    { name: 'خنزير', name_en: 'Pig', icon: '🐖', cost: 2, max_per_team: 10, color: '#FFC0CB', exclusion_radius: 10 },
    { name: 'بط', name_en: 'Duck', icon: '🦆', cost: 1, max_per_team: 20, color: '#ADD8E6', exclusion_radius: 10 },
    { name: 'كلب', name_en: 'Dog', icon: '🐕', cost: 1, max_per_team: 10, color: '#D4AF37', exclusion_radius: 10 },
    { name: 'قطة', name_en: 'Cat', icon: '🐈', cost: 1, max_per_team: 10, color: '#FFA500', exclusion_radius: 10 },

    // Oriented Walls
    { name: 'سور أفقى', name_en: 'Horizontal Wall', icon: '🧱➖', cost: 2, max_per_team: null, color: '#808080', exclusion_radius: 10 },
    { name: 'سور رأسى', name_en: 'Vertical Wall', icon: '🧱｜', cost: 2, max_per_team: null, color: '#808080', exclusion_radius: 10 },
    { name: 'سور', name_en: 'Wall', icon: '🧱', cost: 2, max_per_team: null, color: '#808080', exclusion_radius: 10 },

    { name: 'بوابة', name_en: 'Gate', icon: '🚪', cost: 3, max_per_team: 2, color: '#5D4037', exclusion_radius: 10 },
    { name: 'قصر', name_en: 'Palace', icon: '🏰', cost: 50, max_per_team: 1, color: '#FFD700', exclusion_radius: 10 }
  ];

  let rawList = data || [];

  // Filter out any type containing Port/الميناء/ميناء
  rawList = rawList.filter((bt: any) => {
    const nameStr = (bt.name || '').toLowerCase();
    const nameEnStr = (bt.name_en || '').toLowerCase();
    return !nameStr.includes('ميناء') && !nameEnStr.includes('port') && !nameEnStr.includes('harbor');
  });

  // Background database cleanup if Port/ميناء exists in full database list
  if (data && data.length > 0) {
    const portRecord = data.find((bt: any) => {
      const nameStr = (bt.name || '').toLowerCase();
      const nameEnStr = (bt.name_en || '').toLowerCase();
      return nameStr.includes('ميناء') || nameEnStr.includes('port') || nameEnStr.includes('harbor');
    });
    if (portRecord) {
      supabase.from('building_types').delete().eq('id', portRecord.id).then(({ error }) => {
        if (!error) console.log('[fetchAllBuildingTypes] Auto-deleted old port entry from Supabase database.');
      });
    }
  }
  
  // Self-heal: identify which are missing (strictly matching by normalized Arabic name to prevent duplicate keys)
  const missingTypes = requiredNewTypes.filter(req => 
    !rawList.some((existing: any) => normalizeString(existing.name) === normalizeString(req.name))
  );

  if (missingTypes.length > 0) {
    try {
      console.log('[fetchAllBuildingTypes] Detected missing required building types. Attempting resilient DB seeding:', missingTypes.map(m => m.name));
      
      // Step 1: Insert item-by-item to fully isolate any specific failures or duplicates
      for (const item of missingTypes) {
        try {
          // A. Try insertion with full schema
          const fullRes = await supabase.from('building_types').insert(item).select();
          if (fullRes.error) {
            // Check if it was a duplicate key to avoid noisy logging
            if (fullRes.error.message?.includes('duplicate key') || fullRes.error.code === '23505') {
              console.log(`[fetchAllBuildingTypes] "${item.name}" already exists under db constraints.`);
              continue;
            }

            // B. Try without exclusion_radius
            const { exclusion_radius, ...saferItem } = item;
            const saferRes = await supabase.from('building_types').insert(saferItem).select();
            
            if (saferRes.error) {
              if (saferRes.error.message?.includes('duplicate key') || saferRes.error.code === '23505') {
                continue;
              }
              // C. Try bare minimum columns required
              const minItem = { name: item.name, icon: item.icon, cost: item.cost };
              const finalRes = await supabase.from('building_types').insert(minItem).select();
              if (finalRes.error) {
                if (!finalRes.error.message?.includes('duplicate key') && finalRes.error.code !== '23505') {
                  console.error(`[fetchAllBuildingTypes] Progressive seed failed for "${item.name}":`, finalRes.error.message);
                }
              } else {
                console.log(`[fetchAllBuildingTypes] Successfully seeded building "${item.name}" (minimum schema)`);
              }
            } else {
              console.log(`[fetchAllBuildingTypes] Successfully seeded building "${item.name}" (no exclusion_radius)`);
            }
          } else {
            console.log(`[fetchAllBuildingTypes] Successfully seeded building "${item.name}" (full schema)`);
          }
        } catch (singleItemErr) {
          console.error(`[fetchAllBuildingTypes] Exception while seeding single building "${item.name}":`, singleItemErr);
        }
      }

      // Re-fetch to load ALL building types with valid database IDs
      const { data: refetched, error: refetchErr } = await supabase
        .from('building_types')
        .select('*')
        .order('cost', { ascending: true });
        
      if (refetched) {
        rawList = refetched;
      } else {
        console.error('[fetchAllBuildingTypes] Failed to re-fetch after seeding:', refetchErr?.message);
      }
    } catch (insertError) {
      console.error('[fetchAllBuildingTypes] Unexpected error during self-heal db insertion:', insertError);
    }
  }

  // Map each record to include prerequisites, merging db column value if any with game_settings map
  return rawList.map((bt: any) => ({
    ...bt,
    prerequisites: bt.prerequisites || prereqMap[bt.id] || prereqMap[bt.name] || null
  }));
}

export async function updateBuildingTypeCost(id: string, cost: number) {
  const { error } = await getSupabase()
    .from('building_types')
    .update({ cost })
    .eq('id', id);
  if (error) throw error;
}

export async function updateBuildingTypePrerequisites(id: string, prerequisites: string | null) {
  const supabase = getSupabase();
  if (!supabase) return;

  // 1. Fetch current prerequisites map - master copy from localStorage
  let prereqMap: Record<string, string> = {};
  try {
    const local = localStorage.getItem('building_prerequisites');
    if (local) {
      prereqMap = JSON.parse(local);
    }
  } catch (e) {
    console.warn('[updateBuildingTypePrerequisites] Error loading local storage prerequisites:', e);
  }

  // 1b. Try to query database game_settings table
  try {
    const { data: gsData } = await supabase
      .from('game_settings')
      .select('*')
      .eq('key', 'building_prerequisites')
      .maybeSingle();

    if (gsData && gsData.value) {
      try {
        const dbMap = JSON.parse(gsData.value);
        prereqMap = { ...prereqMap, ...dbMap };
      } catch (e) {
        console.warn('[updateBuildingTypePrerequisites] JSON parse error on gs value:', e);
      }
    }
  } catch (err) {
    console.warn('[updateBuildingTypePrerequisites] Failed to parse existing prerequisites from DB:', err);
  }

  // 2. Update map with new prerequisites
  if (prerequisites) {
    prereqMap[id] = prerequisites;
  } else {
    delete prereqMap[id];
  }

  // 3. Save to localStorage FIRST so it is absolutely instant and robust
  try {
    localStorage.setItem('building_prerequisites', JSON.stringify(prereqMap));
  } catch (localStorageErr) {
    console.warn('[updateBuildingTypePrerequisites] Failed to write in localStorage:', localStorageErr);
  }

  // 4. Try updating databases columns safely
  try {
    await supabase
      .from('building_types')
      .update({ prerequisites })
      .eq('id', id);
  } catch (dbErr) {
    console.warn('[updateBuildingTypePrerequisites] Column update skipped (expected if missing column):', dbErr);
  }

  // 5. Try to upsert back to game_settings, catching errors gracefully so that the edit NEVER crashes
  try {
    await supabase
      .from('game_settings')
      .upsert({
        key: 'building_prerequisites',
        value: JSON.stringify(prereqMap)
      }, { onConflict: 'key' });
  } catch (err) {
    console.warn('[updateBuildingTypePrerequisites] game_settings upsert skipped (expected if table missing):', err);
    // Silent success: we survived via localStorage write!
  }
}

export async function deleteBuildingType(id: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  // Cleanup in game_settings
  try {
    const { data: gsData } = await supabase
      .from('game_settings')
      .select('*')
      .eq('key', 'building_prerequisites')
      .maybeSingle();
    if (gsData && gsData.value) {
      const prereqMap = JSON.parse(gsData.value);
      if (prereqMap[id]) {
        delete prereqMap[id];
        await supabase
          .from('game_settings')
          .upsert({
            key: 'building_prerequisites',
            value: JSON.stringify(prereqMap)
          }, { onConflict: 'key' });
      }
    }
  } catch (err) {
    console.warn('[deleteBuildingType] Failed to clean up game_settings prerequisites:', err);
  }

  // Cascade delete in DB should handle map_buildings
  const { error } = await supabase
    .from('building_types')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function addBuildingType(data: NewBuildingTypeInput) {
  const { prerequisites, ...insertPayload } = data;
  
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data: inserted, error } = await supabase
    .from('building_types')
    .insert(insertPayload)
    .select()
    .single();
    
  if (error) throw error;

  if (prerequisites && inserted?.id) {
    await updateBuildingTypePrerequisites(inserted.id, prerequisites);
  }
}
