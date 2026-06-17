// src/utils/buildingMapper.ts
// Uses confirmed schema — no guessing

import { getSupabase } from '../lib/supabase'

const supabase = getSupabase()

export interface NormalizedBuilding {
  id: string
  x: number
  y: number
  team_id: string
  building_type_id: string
  building_type: string
  team_color: string
  team_name: string
  points_spent: number
}

export function normalizeBuildingRow(raw: any): NormalizedBuilding {
  // Coordinates: use x, y directly (confirmed columns)
  const x = Number(raw.x ?? raw.map_x ?? 0)
  const y = Number(raw.y ?? raw.map_y ?? 0)

  // building_types join result
  const bt = raw.building_types
  const buildingType =
    (bt && typeof bt === 'object'
      ? bt.name || bt.name_en || bt.name_ar
      : null) ||
    raw.type_name ||
    'default'

  // teams join result
  const teamObj = raw.teams || raw.team
  let teamColor = '#D4AF37'
  let teamName = ''

  if (teamObj) {
    if (Array.isArray(teamObj) && teamObj.length > 0) {
      const first = teamObj[0]
      if (first) {
        teamColor = first.color || first.team_color || '#D4AF37'
        teamName = first.name || ''
      }
    } else if (typeof teamObj === 'object') {
      teamColor = (teamObj as any).color || (teamObj as any).team_color || '#D4AF37'
      teamName = (teamObj as any).name || ''
    }
  }

  if (teamColor === '#D4AF37' && raw.team_color) {
    teamColor = raw.team_color
  }
  if (!teamName && raw.team_name) {
    teamName = raw.team_name
  }

  return {
    id: raw.id || '',
    x,
    y,
    team_id: raw.team_id || '',
    building_type_id: raw.building_type_id || '',
    building_type: buildingType,
    team_color: teamColor,
    team_name: teamName,
    points_spent: Number(raw.points_spent || 0),
  }
}

export function normalizeBuildingList(rows: any[]): NormalizedBuilding[] {
  if (!rows || rows.length === 0) return []
  return rows.map(normalizeBuildingRow)
}

// Build INSERT payload using confirmed column names
export function buildInsertPayload(params: {
  x: number
  y: number
  teamId: string
  buildingTypeId: string
  placedBy: string
  cost: number
}): Record<string, any> {
  return {
    x: params.x,
    y: params.y,
    map_x: params.x,   // also populate map_x/map_y for compatibility
    map_y: params.y,
    team_id: params.teamId,
    building_type_id: params.buildingTypeId,
    placed_by: params.placedBy,
    points_spent: params.cost,
    placed_at: new Date().toISOString(),
  }
}
