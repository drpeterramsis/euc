// src/utils/schemaInspector.ts
// COMPLETE REWRITE — schema is known, no detection needed

import { getSupabase } from '../lib/supabase'

export interface MapBuildingsSchema {
  xCol: string
  yCol: string
  typeCol: string
  teamCol: string
  idCol: string
  timestampCol: string
  pointsCol: string
}

// HARDCODED — confirmed from Supabase schema export
export const MAP_BUILDINGS_SCHEMA: MapBuildingsSchema = {
  xCol: 'x',
  yCol: 'y',
  typeCol: 'building_type_id',
  teamCol: 'team_id',
  idCol: 'id',
  timestampCol: 'placed_at',
  pointsCol: 'points_spent',
}

// Keep function signature for compatibility but return hardcoded value
export async function detectMapBuildingsSchema(): Promise<MapBuildingsSchema> {
  return MAP_BUILDINGS_SCHEMA
}

export async function getTableColumns(tableName: string): Promise<string[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(0) // fetch no rows, just schema via error or metadata
  
  // For map_buildings, return known columns
  if (tableName === 'map_buildings') {
    return [
      'id', 'team_id', 'building_type_id',
      'map_x', 'map_y', 'map_region',
      'name_override', 'points_spent',
      'placed_by', 'placed_at', 'notes',
      'x', 'y', 'created_at'
    ]
  }
  
  return []
}
