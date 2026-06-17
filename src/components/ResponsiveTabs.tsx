import React, { useState, useEffect } from 'react';

interface Tab {
  value: string;
  label: string;
  icon?: string;
}

interface ResponsiveTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (value: string) => void;
}

export default function ResponsiveTabs({ tabs, activeTab, onChange }: ResponsiveTabsProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <div style={{
        width: '100%',
        padding: '8px 0 12px',
        direction: 'rtl',
      }}>
        <select
          value={activeTab}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: '14px',
            fontFamily: "'Tajawal', sans-serif",
            fontWeight: 600,
            color: '#2C1810',
            backgroundColor: '#FFFDF5',
            border: '2px solid #D4AF37',
            borderRadius: '10px',
            outline: 'none',
            cursor: 'pointer',
            direction: 'rtl',
            appearance: 'none',
            WebkitAppearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23D4AF37' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'left 12px center',
            paddingLeft: '36px',
            boxShadow: '0 2px 8px rgba(212,175,55,0.15)',
          }}
        >
          {tabs.map(tab => (
            <option key={tab.value} value={tab.value}>
              {tab.icon} {tab.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '0 0 16px',
      flexWrap: 'wrap',
      direction: 'rtl',
    }}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: activeTab === tab.value
              ? '2px solid #D4AF37'
              : '2px solid #E8D5A3',
            backgroundColor: activeTab === tab.value ? '#D4AF37' : '#FFFDF5',
            color: activeTab === tab.value ? '#fff' : '#8B4513',
            fontFamily: "'Tajawal', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            minHeight: '44px',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
