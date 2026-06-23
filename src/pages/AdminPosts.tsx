import React from 'react';
import Admin from './AdminPage';

// ─────────────────────────────────────────────
// FILE: src/pages/AdminPosts.tsx
// PURPOSE: Admin view pre-set to the Gallery / Posts management tab.
// ─────────────────────────────────────────────

export default function AdminPosts() {
  return <Admin initialTab="media" />;
}
