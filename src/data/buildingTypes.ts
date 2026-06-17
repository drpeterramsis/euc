export interface BuildingTypeSeed {
  name: string;
  name_en: string;
  cost: number;
  icon: string;
  color: string;
  exclusion_radius: number;
  gridX: number;
  gridY: number;
  techLevel: number;
}

export const buildingTypesSeed: BuildingTypeSeed[] = [
  { techLevel: 1, name: 'خيمة', name_en: 'Encampment', gridX: 1, gridY: 1, cost: 50, icon: '⛺', color: '#D2B48C', exclusion_radius: 60 },
  { techLevel: 1, name: 'بئر ماء', name_en: 'Water Well', gridX: 1, gridY: 1, cost: 100, icon: '💧', color: '#4682B4', exclusion_radius: 80 },
  { techLevel: 1, name: 'مذبح حجري', name_en: 'Stone Altar', gridX: 2, gridY: 2, cost: 150, icon: '🪨', color: '#A9A9A9', exclusion_radius: 100 },
  
  { techLevel: 2, name: 'حقل شعير', name_en: 'Barley Field', gridX: 2, gridY: 2, cost: 200, icon: '🌾', color: '#F5DEB3', exclusion_radius: 120 },
  { techLevel: 2, name: 'برج مراقبة', name_en: 'Watchtower', gridX: 1, gridY: 1, cost: 300, icon: '🗼', color: '#8B4513', exclusion_radius: 150 },
  { techLevel: 2, name: 'معصرة زيتون', name_en: 'Olive Press', gridX: 2, gridY: 2, cost: 350, icon: '🏺', color: '#556B2F', exclusion_radius: 120 },
  
  { techLevel: 3, name: 'سور حجري', name_en: 'Stone Wall', gridX: 1, gridY: 3, cost: 500, icon: '🧱', color: '#808080', exclusion_radius: 200 },
  { techLevel: 3, name: 'مخزن حبوب', name_en: 'Granary', gridX: 2, gridY: 2, cost: 600, icon: '🧺', color: '#CD853F', exclusion_radius: 140 },
  { techLevel: 3, name: 'فرن برونز', name_en: 'Bronze Forge', gridX: 2, gridY: 2, cost: 800, icon: '⛏️', color: '#B87333', exclusion_radius: 160 },
  
  { techLevel: 4, name: 'بوابة المدينة', name_en: 'City Gate', gridX: 2, gridY: 1, cost: 1000, icon: '🚪', color: '#654321', exclusion_radius: 220 },
  { techLevel: 4, name: 'ثكنة حراس', name_en: 'Guard Barracks', gridX: 3, gridY: 3, cost: 1200, icon: '🛡️', color: '#8B0000', exclusion_radius: 280 },
  
  { techLevel: 5, name: 'القلعة', name_en: 'Citadel', gridX: 4, gridY: 4, cost: 3000, icon: '🏛️', color: '#708090', exclusion_radius: 400 },
];
