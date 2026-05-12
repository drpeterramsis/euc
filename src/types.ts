export type Role = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: Role;
}

export const THEME = {
  white: '#FFFFFF',
  black: '#000000',
  accent: '#FFBF00',
};
