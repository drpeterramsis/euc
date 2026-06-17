import React, { useState } from 'react';
import { CatalogBuildingIcon } from './CatalogBuildingIcon';

interface BuildingCatalogStripProps {
  buildingTypes: any[];
  myBuildings: any[];
  teamPointsAvailable: number;
  onSelectForPlacement?: (type: any) => void;
  selectedBuildingTypeId?: string | null;
  teamColor?: string;
}

export default function BuildingCatalogStrip({ buildingTypes, myBuildings, teamPointsAvailable, onSelectForPlacement, onCheckPrerequisites, selectedBuildingTypeId, teamColor = '#D4AF37' }: BuildingCatalogStripProps & { onCheckPrerequisites: (type: any) => boolean }) {
  const [activeCategory, setActiveCategory] = useState<string>('الكل');

  // Classification function to derive categories cleanly with Arabic labels
  const getCategory = (type: any): string => {
    if (type.category) return type.category;
    const name = (type.name || '').toLowerCase();
    
    // Roads / طرق
    if (name.includes('طريق') || name.includes('زاوية') || name.includes('ممر')) {
      return 'طرق';
    }
    // Lands / أراضي
    if (name.includes('ارض') || name.includes('رقعة') || name.includes('حقل')) {
      return 'أراضي';
    }
    // Animals / حيوانات
    const animalKeywords = ['بقرة', 'خروف', 'طيور', 'فرخة', 'ارنب', 'معزة', 'حصان', 'حمار', 'خنزير', 'بط', 'كلب', 'قطة', 'دجاج', 'ماشية', 'أغنام'];
    if (animalKeywords.some(keyword => name.includes(keyword)) || ['🐄', '🐑', '🐦', '🐔', '🐇', '🐐', '🐎', '🫏', '🐖', '🦆', '🐕', '🐈'].includes(type.icon)) {
      return 'حيوانات';
    }
    // Buildings/Structures / مباني
    return 'مباني ومنشآت';
  };

  const categories = ['الكل', 'مباني ومنشآت', 'حيوانات', 'أراضي', 'طرق'];

  const filteredTypes = activeCategory === 'الكل'
    ? buildingTypes
    : buildingTypes.filter(type => getCategory(type) === activeCategory);

  return (
    <div style={{
      backgroundColor: '#FFFDF5',
      borderTop: '2px solid #D4AF37',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
      padding: '4px 6px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      {/* Arabic Category Picker Interface */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2px 4px',
        gap: '8px',
        borderBottom: '1px solid #F3EBD3'
      }}>
        {/* Mobile Dropdown UI */}
        <div style={{ flex: 1 }} className="block md:hidden">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '2px solid #D4AF37',
              backgroundColor: '#fff',
              color: '#2C1810',
              fontFamily: "'Cairo', sans-serif",
              fontSize: '13px',
              fontWeight: 'bold',
              outline: 'none'
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'الكل' ? '📂 الكل' : cat === 'مباني ومنشآت' ? '🏛️ مباني ومنشآت' : cat === 'حيوانات' ? '🐄 حيوانات' : cat === 'أراضي' ? '🌾 أراضي' : '🛣️ طرق'}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Segmented Control UI */}
        <div className="hidden md:flex" style={{ gap: '6px', overflowX: 'auto', width: '100%', direction: 'rtl' }}>
          {categories.map(cat => {
            const isActive = cat === activeCategory;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: `1px solid ${isActive ? '#D4AF37' : '#E8D5A3'}`,
                  backgroundColor: isActive ? '#D4AF37' : '#fff',
                  color: isActive ? '#1a0a00' : '#2C1810',
                  fontFamily: "'Cairo', sans-serif",
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat === 'الكل' ? '📂 الكل' : cat === 'مباني ومنشآت' ? '🏛️ منشآت' : cat === 'حيوانات' ? '🐄 حيوانات' : cat === 'أراضي' ? '🌾 أراضي' : '🛣️ طرق'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtered Buildings horizontal strip display */}
      <div style={{
        display: 'flex',
        gap: '6px',
        padding: '6px 0',
        overflowX: 'auto',
        position: 'relative'
      }}>
        {filteredTypes.length === 0 ? (
          <div style={{
            padding: '12px',
            color: '#7f8c8d',
            fontSize: '12px',
            textAlign: 'center',
            width: '100%',
            fontFamily: "'Cairo', sans-serif"
          }}>
            لا توجد عناصر في هذه الفئة حالياً
          </div>
        ) : (
          filteredTypes.map(type => {
            const myCount = myBuildings.filter(b => b.building_type_id === type.id).length;
            const canAfford = teamPointsAvailable >= type.cost;
            const atLimit = type.max_per_team !== null && myCount >= type.max_per_team;
            const isAvailable = canAfford && !atLimit;
            const isSelected = selectedBuildingTypeId === type.id;

            return (
              <div
                key={type.id}
                draggable={isAvailable}
                onClick={() => {
                  const prerequisitesMet = onCheckPrerequisites(type);
                  if (prerequisitesMet && isAvailable && onSelectForPlacement) {
                    onSelectForPlacement(isSelected ? null : type);
                  }
                }}
                onDragStart={(e) => {
                  if (isAvailable) {
                    e.dataTransfer.setData('application/x-building-type-id', type.id);
                  }
                }}
                style={{
                  flex: '0 0 auto',
                  width: '68px',
                  backgroundColor: isSelected ? '#FFF8E7' : '#fff',
                  border: `2px solid ${isSelected ? '#27AE60' : (isAvailable ? '#D4AF37' : '#E8D5A3')}`,
                  borderRadius: '0px',
                  padding: '8px 4px',
                  textAlign: 'center',
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  opacity: isAvailable ? 1 : 0.6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  gap: '4px',
                }}
              >
                {isSelected && (
                  <div style={{ position: 'absolute', top: -6, right: -6, background: '#27AE60', color: '#fff', borderRadius: '0px', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' }}>
                    ✓
                  </div>
                )}
                <CatalogBuildingIcon
                  type={type.type || type.name || type.name_ar || 'default'}
                  teamColor={teamColor}
                  size={48}
                />
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#2C1810', fontFamily: "'Cairo', sans-serif", lineHeight: 1.1 }}>
                  {type.name}
                </div>
                
                <div style={{
                  backgroundColor: '#D4AF37',
                  color: '#1a0a00',
                  padding: '2px 5px',
                  width: '100%',
                  borderRadius: '0px',
                  fontSize: '10px',
                  fontWeight: 800,
                  fontFamily: "'Cairo', sans-serif"
                }}>
                  {type.cost} نقطة
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
