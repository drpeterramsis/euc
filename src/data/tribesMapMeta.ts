// Canaan Map Metadata & Layout Rules
// Single source of truth for geography, mappings, and SVG paths.

export const TRIBE_KEYS = [
  'asher', 'naphtali', 'zebulun', 'issachar', 'manasseh', 'gad', 'reuben', 'ephraim', 'benjamin', 'dan', 'judah', 'simeon'
];

export const TRIBE_NAME_TO_KEY: Record<string, string> = {
  'أشير': 'asher',
  'سبط أشير': 'asher',
  'نفتالي': 'naphtali',
  'سبط نفتالي': 'naphtali',
  'زبولون': 'zebulun',
  'سبط زبولون': 'zebulun',
  'يساكر': 'issachar',
  'سبط يساكر': 'issachar',
  'منسى': 'manasseh',
  'سبط منسى': 'manasseh',
  'جاد': 'gad',
  'سبط جاد': 'gad',
  'رأوبين': 'reuben',
  'سبط رأوبين': 'reuben',
  'أفرايم': 'ephraim',
  'أبناء أفرايم': 'ephraim',
  'سبط أفرايم': 'ephraim',
  'بنيامين': 'benjamin',
  'سبط بنيامين': 'benjamin',
  'دان': 'dan',
  'سبط دان': 'dan',
  'يهوذا': 'judah',
  'سبط يهوذا': 'judah',
  'شمعون': 'simeon',
  'سبط شمعون': 'simeon',
  'لاوي': 'levi',
  'سبط لاوي': 'levi',
  'سبط لاوي (تعين للخدمة)': 'levi'
};

export const TRIBE_LABELS_AR: Record<string, string> = {
  asher: 'سبط أشير',
  naphtali: 'سبط نفتالي',
  zebulun: 'سبط زبولون',
  issachar: 'سبط يساكر',
  manasseh: 'سبط منسى',
  gad: 'سبط جاد',
  reuben: 'سبط رأوبين',
  ephraim: 'سبط أفرايم',
  benjamin: 'سبط بنيامين',
  dan: 'سبط دان',
  judah: 'سبط يهوذا',
  simeon: 'سبط شمعون',
  levi: 'سبط لاوي (تعين للخدمة)'
};

// Dual-viewport coordinates matching the 1024x1536 Dropbox map layout perfectly
export const TRIBE_REGIONS_SVG = [
  { id: 'asher', nameAr: 'سبط أشير', color: '#FFD700', symbol: '🌿',
    points: '154,77 320,77 307,430 166,415', labelX: 237, labelY: 246 },
  { id: 'naphtali', nameAr: 'سبط نفتالي', color: '#107C41', symbol: '🦌',
    points: '320,77 538,77 525,307 307,430', labelX: 422, labelY: 215 },
  { id: 'zebulun', nameAr: 'سبط زبولون', color: '#16A085', symbol: '⚓',
    points: '307,430 486,399 474,568 294,584', labelX: 390, labelY: 491 },
  { id: 'issachar', nameAr: 'سبط يساكر', color: '#F39C12', symbol: '⚖️',
    points: '486,399 640,369 627,553 474,568', labelX: 557, labelY: 468 },
  { id: 'dan', nameAr: 'سبط دان', color: '#2C3E50', symbol: '🐍',
    points: '154,415 307,430 294,584 154,614', labelX: 228, labelY: 514 },
  { id: 'manasseh', nameAr: 'سبط منسى', color: '#8E44AD', symbol: '🪵',
    points: '294,584 474,568 461,799 282,814', labelX: 378, labelY: 691 },
  { id: 'ephraim', nameAr: 'سبط أفرايم', color: '#1ABC9C', symbol: '🍇',
    points: '474,568 627,553 614,737 461,799', labelX: 544, labelY: 660 },
  { id: 'benjamin', nameAr: 'سبط بنيامين', color: '#E91E63', symbol: '🐺',
    points: '282,814 461,799 448,937 275,952', labelX: 365, labelY: 875 },
  { id: 'judah', nameAr: 'سبط يهوذا', color: '#673AB7', symbol: '🦁',
    points: '154,614 627,553 614,737 448,937 275,952 154,1152', labelX: 384, labelY: 1044 },
  { id: 'simeon', nameAr: 'سبط شمعون', color: '#795548', symbol: '👂',
    points: '192,1152 448,1121 435,1336 186,1321', labelX: 317, labelY: 1229 },
  { id: 'gad', nameAr: 'سبط جاد', color: '#FF5722', symbol: '⚔️',
    points: '755,307 922,292 909,768 742,783', labelX: 832, labelY: 537 },
  { id: 'reuben', nameAr: 'سبط رأوبين', color: '#E74C3C', symbol: '🌊',
    points: '742,783 909,768 896,1106 736,1121', labelX: 819, labelY: 944 }
];

export const tribeIdToKey = (id: string): string => {
  return TRIBE_NAME_TO_KEY[id] ?? id;
};

// Embedded exact SVG outline drawn details from Dropbox (simplified/cleaned)
export const MAP_SVG_VIEWBOX = "0 0 1024 1536";
