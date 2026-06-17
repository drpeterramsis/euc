export const DB = {
  users: {
    table:     'users',
    id:        'id',
    name:      'name',
    username:  'username',
    password:  'password_hash',
    role:      'role',
    teamId:    'team_id',
    createdAt: 'created_at',
  },
  teams: {
    table:       'teams',
    id:          'id',
    name:        'name',
    color:       'color',
    points:      'points',
    createdAt:   'created_at',
    symbol:      'symbol',
    nameEn:      'name_en',
    description: 'description',
    pointsTotal: 'points_total',
    pointsSpent: 'points_spent',
    mapRegion:   'map_region',
  },
  pointsLog: {
    table:     'points_log',
    id:        'id',
    teamId:    'team_id',
    amount:    'amount',
    type:      'type',
    reason:    'reason',
    addedBy:   'added_by',
    createdAt: 'created_at',
  },
  gameSettings: {
    table:     'game_settings',
    id:        'id',
    key:       'key',
    value:     'value',
    updatedAt: 'updated_at',
  },
  pagePermissions: {
    table:     'page_permissions',
    id:        'id',
    pageKey:   'page_key',
    role:      'role',
    userId:    'user_id',
    canView:   'can_view',
    canEdit:   'can_edit',
    createdAt: 'created_at',
  },
};

export function col(tableSchema: any, key: string) {
  return tableSchema[key] ?? key;
}
