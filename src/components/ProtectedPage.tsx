import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedPageProps {
  pageKey: string;
  children: React.ReactNode;
  currentUser: any;
}

export default function ProtectedPage({ pageKey, children, currentUser }: ProtectedPageProps) {
  const { canView, loading } = usePermissions(currentUser);

  if (!currentUser) return null;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: '#D4AF37' }}>جاري التحقق من الصلاحيات...</div>;

  if (!canView(pageKey)) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '60vh', gap: '16px', fontFamily: "'Tajawal', sans-serif",
      }}>
        <div style={{ fontSize: '64px' }}>🔒</div>
        <h2 style={{ color: '#8B4513', fontSize: '24px', margin: 0 }}>
          غير مسموح بالدخول
        </h2>
        <p style={{ color: '#8B7355', margin: 0 }}>
          ليس لديك صلاحية لعرض هذه الصفحة
        </p>
        <button onClick={() => window.history.back()} style={{
          marginTop: '16px',
          padding: '10px 24px',
          backgroundColor: '#D4AF37', color: '#fff',
          border: 'none', borderRadius: '8px',
          fontFamily: "'Tajawal', sans-serif",
          fontSize: '14px', cursor: 'pointer',
        }}>
          ← العودة
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
