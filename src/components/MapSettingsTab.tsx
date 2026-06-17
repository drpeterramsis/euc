import React, { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { notify } from '../utils/toastMessages';
import { useDraggable, useDroppable, DndContext, DragOverlay } from '@dnd-kit/core';

const MAP_ZONES = [
  { id: 'north-coast',   label: 'الشمال الساحلي' },
  { id: 'far-north',     label: 'أقصى الشمال' },
  { id: 'north-center',  label: 'شمال الوسط' },
  { id: 'north-east',    label: 'الشمال الشرقي' },
  { id: 'center-west',   label: 'غرب الوسط' },
  { id: 'center',        label: 'الوسط' },
  { id: 'center-east',   label: 'شرق الأردن شمال' },
  { id: 'center-south',  label: 'جنوب الوسط' },
  { id: 'south-center',  label: 'وسط الجنوب' },
  { id: 'south',         label: 'الجنوب' },
  { id: 'east-jordan',   label: 'شرق الأردن جنوب' },
  { id: 'scattered',     label: 'مدن منتشرة (لاوي)' },
];

const DraggableTribeChip: React.FC<{ tribe: any }> = ({ tribe }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: tribe.id,
    data: { tribe },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: '8px 12px',
        backgroundColor: tribe.color || '#D4AF37',
        color: '#fff',
        borderRadius: '20px',
        fontSize: '14px',
        fontFamily: "'Tajawal', sans-serif",
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      {tribe.symbol} {tribe.name}
    </div>
  );
}

const DroppableZone: React.FC<{ zone: any, assignedTribe: any, onRemove: (tribeId: string) => void }> = ({ zone, assignedTribe, onRemove }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: zone.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: '80px',
        backgroundColor: isOver ? '#FFF8E7' : '#FFFDF5',
        border: `2px ${isOver ? 'solid' : 'dashed'} ${isOver ? '#D4AF37' : '#C9A96E'}`,
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: '13px', color: '#8B7355', fontFamily: "'Tajawal', sans-serif", textAlign: 'center' }}>
        {zone.label}
      </span>
      {assignedTribe && (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: assignedTribe.color || '#D4AF37',
              color: '#fff',
              borderRadius: '20px',
              fontSize: '12px',
              fontFamily: "'Tajawal', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {assignedTribe.symbol} {assignedTribe.name}
          </div>
          <button
            onClick={() => onRemove(assignedTribe.id)}
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              backgroundColor: '#E74C3C',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default function MapSettingsTab() {
  const [teams, setTeams] = useState<any[]>([]);
  const [activeDragTribe, setActiveDragTribe] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase.from('teams').select('*');
    if (data) setTeams(data);
  };

  const handleDragStart = (event: any) => {
    setActiveDragTribe(event.active.data.current.tribe);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveDragTribe(null);

    if (over) {
      setTeams(prev => prev.map(t => 
        t.id === active.id ? { ...t, map_region: over.id } : t
      ));
    }
  };

  const handleRemoveTribe = (tribeId: string) => {
    setTeams(prev => prev.map(t => 
      t.id === tribeId ? { ...t, map_region: null } : t
    ));
  };

  const handleSaveMap = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setIsLoading(true);

    try {
      for (const team of teams) {
         await supabase.from('teams').update({ map_region: team.map_region || null }).eq('id', team.id);
      }
      notify.custom('تم حفظ توزيع الأسباط بنجاح', 'success');
    } catch (e) {
      notify.custom('حدث خطأ أثناء حفظ التوزيع', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const unassignedTribes = teams.filter(t => !t.map_region);

  return (
    <div style={{ padding: '16px', backgroundColor: '#FFFDF5', borderRadius: '16px', border: '1px solid #E8D5A3' }}>
      <h3 style={{ fontFamily: "'Cinzel', serif", color: '#8B4513', fontSize: '20px', marginBottom: '8px' }}>توزيع الأسباط على الخريطة</h3>
      <p style={{ color: '#8B7355', fontSize: '13px', fontFamily: "'Tajawal', sans-serif", marginBottom: '24px' }}>
        اسحب كل سبط وضعه في موقعه الجغرافي الصحيح على خريطة كنعان
      </p>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ marginBottom: '24px', minHeight: '50px', padding: '16px', backgroundColor: '#FFF8E7', borderRadius: '12px', border: '1px solid #E8D5A3', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {unassignedTribes.length === 0 && <span style={{ color: '#B8A88A', fontSize: '13px' }}>جميع الأسباط موزعة</span>}
          {unassignedTribes.map(tribe => (
            <DraggableTribeChip key={tribe.id} tribe={tribe} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {MAP_ZONES.map(zone => (
            <DroppableZone
              key={zone.id}
              zone={zone}
              assignedTribe={teams.find(t => t.map_region === zone.id)}
              onRemove={handleRemoveTribe}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDragTribe ? (
            <div style={{ padding: '8px 12px', backgroundColor: activeDragTribe.color || '#D4AF37', color: '#fff', borderRadius: '20px', fontSize: '14px', fontFamily: "'Tajawal', sans-serif", display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>
              {activeDragTribe.symbol} {activeDragTribe.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <button
        onClick={handleSaveMap}
        disabled={isLoading}
        style={{
          padding: '12px 24px',
          backgroundColor: '#D4AF37',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontFamily: "'Tajawal', sans-serif",
          fontSize: '16px',
          fontWeight: 700,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          width: '100%',
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? 'جاري الحفظ...' : '💾 حفظ التوزيع'}
      </button>
    </div>
  );
}
