import React from 'react';
import Admin from './AdminPage';

// ─────────────────────────────────────────────
// FILE: src/pages/AdminCategories.tsx
// PURPOSE: Admin view pre-set to the Categories management tab.
// ─────────────────────────────────────────────

export default function AdminCategories() {
  return <Admin initialTab="categories" />;
}
