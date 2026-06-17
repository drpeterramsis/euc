export const roleLabels: Record<string, string> = {
  super_admin: 'مشرف عام',
  team_admin: 'قائد سبط',
  member: 'عضو',
};

export const getRoleLabel = (role: string) => {
  return roleLabels[role] || 'غير معروف';
};

export const getRoleEmoji = (role: string) => {
  switch (role) {
    case 'super_admin': return '👑';
    case 'team_admin': return '🛡️';
    default: return '👤';
  }
};

export const getRoleColor = (role: string) => {
  switch (role) {
    case 'super_admin': return '#8E44AD';
    case 'team_admin': return '#2980B9';
    default: return '#7F8C8D';
  }
};
