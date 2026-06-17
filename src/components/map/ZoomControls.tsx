import React from 'react';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export default function ZoomControls({ onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  const btnStyle = {
    width: 36, height: 36,
    borderRadius: '50%',
    border: '2px solid #D4AF37',
    background: 'rgba(255,250,235,0.92)',
    color: '#8B6914',
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    fontFamily: 'Cairo, sans-serif',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  } as React.CSSProperties;

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 10,
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      pointerEvents: 'auto',
    }}>
      {[
        { label: '+', fn: onZoomIn,  title: 'تكبير'  },
        { label: '−', fn: onZoomOut, title: 'تصغير'  },
        { label: '↺', fn: onReset,   title: 'إعادة'  },
      ].map(({ label, fn, title }) => (
        <button
          key={label}
          onClick={(e) => { e.stopPropagation(); fn(); }}
          title={title}
          style={btnStyle}
          onMouseDown={e => e.preventDefault()}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
