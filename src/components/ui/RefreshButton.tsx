import React from 'react';
import { useRefresh } from '../../context/RefreshContext';
import { RefreshCw } from 'lucide-react';

export default function RefreshButton() {
  const { triggerRefresh, isRefreshing } = useRefresh();

  return (
    <button
      onClick={triggerRefresh}
      title="تحديث"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'transparent',
        border: '1px solid #D4AF37',
        cursor: 'pointer',
        color: '#D4AF37',
        transition: 'background-color 0.2s ease',
      }}
      className="hover:bg-[#D4AF37]/10"
    >
      <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
    </button>
  );
}
