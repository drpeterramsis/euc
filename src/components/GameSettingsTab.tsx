import React, { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { notify } from '../utils/toastMessages';
import { 
  fetchAllBuildingTypes, 
  updateBuildingTypeCost, 
  updateBuildingTypePrerequisites, 
  deleteBuildingType, 
  addBuildingType, 
  NewBuildingTypeInput 
} from '../services/buildingTypeService';
import LoadingOverlay from './LoadingOverlay';

const GAME_SETTINGS_FIELDS = [
  {
    section: '👥 قواعد الفرق والسبط',
    fields: [
      { key: 'max_members',      label: 'أقصى عدد أعضاء لكل سبط', default: '20' },
      { key: 'max_lands',        label: 'أقصى عدد أراضٍ لكل سبط', default: '50' },
    ]
  },
  {
    section: '📅 توقيت وجدول اللعبة',
    fields: [
      { key: 'game_start',       label: 'تاريخ بداية اللعبة',  type: 'date' },
      { key: 'game_end',         label: 'تاريخ نهاية اللعبة',  type: 'date' },
    ]
  },
];

export default function GameSettingsTab() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [gameActive, setGameActive] = useState(true);
  const [dbBuildingTypes, setDbBuildingTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // New Building State with Category
  const [newType, setNewType] = useState<NewBuildingTypeInput>({ 
    name: '', 
    name_en: '', 
    icon: '', 
    cost: 0, 
    max_per_team: 3, 
    color: '#D4AF37', 
    exclusion_radius: 50,
    category: ''
  });
  
  const [selectedPrereqBuildingId, setSelectedPrereqBuildingId] = useState<string | null>(null);
  
  // Categorization Management States
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([
    { id: '1', name: 'مباني ومنشآت' },
    { id: '2', name: 'حيوانات' },
    { id: '3', name: 'أراضي' },
    { id: '4', name: 'طرق' }
  ]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState('الكل');

  // Inline Building Edit States
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Accordion Expand/Collapse states for vertical stacked mobile view
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    catalog: true,
    add_new: true,
    prereqs: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getCategory = (type: any): string => {
    if (type.category) return type.category;
    return 'أخرى';
  };

  useEffect(() => {
    fetchSettings();
    loadCatalog();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('catalog_categories')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) {
        setCategories(data);
      }
    } catch (e) {
      console.warn('DB categories query skipped:', e);
    }
  };

  const handleAddCategory = async (name: string) => {
    if (!name.trim()) return;
    const supabase = getSupabase();
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('catalog_categories')
        .insert({ name: name.trim() })
        .select()
        .single();
      if (error) {
        if (error.message?.includes('duplicate') || error.code === '23505') {
          notify.custom('❌ هذا التصنيف موجود بالفعل', 'error');
        } else {
          notify.custom('❌ خطأ في إضافة التصنيف', 'error');
        }
      } else {
        notify.custom('✅ تم إضافة التصنيف بنجاح', 'success');
        await fetchCategories();
      }
    } catch (e) {
      notify.custom('❌ خطأ في الإضافة', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async (id: string, oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) {
      setEditingCategoryId(null);
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('catalog_categories')
        .update({ name: newName.trim() })
        .eq('id', id);
      if (error) {
        notify.custom('❌ خطأ في تعديل اسم التصنيف', 'error');
      } else {
        // Cascade update category text inside building_types to preserve sync
        const { error: updateItemsErr } = await supabase
          .from('building_types')
          .update({ category: newName.trim() })
          .eq('category', oldName);
        if (updateItemsErr) {
          console.warn('Error updating item categories text:', updateItemsErr);
        }
        notify.custom('✅ تم تعديل التصنيف بنجاح والمنشآت المرتبطة به', 'success');
        setEditingCategoryId(null);
        await fetchCategories();
        await loadCatalog(); 
      }
    } catch (e) {
      notify.custom('❌ خطأ غير متوقع', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const isUsed = dbBuildingTypes.some(bt => {
      const cat = getCategory(bt);
      return cat === name;
    });
    if (isUsed) {
      notify.custom('⚠️ لا يمكن حذف هذا التصنيف لأنه مستخدم حالياً في منشآت الكتالوج', 'error');
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف تصنيف "${name}"؟`)) return;
    const supabase = getSupabase();
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('catalog_categories')
        .delete()
        .eq('id', id);
      if (error) {
        notify.custom('❌ خطأ في حذف التصنيف', 'error');
      } else {
        notify.custom('✅ تم حذف التصنيف بنجاح', 'success');
        await fetchCategories();
      }
    } catch (e) {
      notify.custom('❌ خطأ غير متوقع', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setIsLoading(true);

    const parsed: Record<string, string> = {};
    try {
      const keys = ['game_active'];
      keys.forEach(k => {
        const val = localStorage.getItem(`game_setting_${k}`);
        if (val !== null) {
          parsed[k] = val;
          if (k === 'game_active') setGameActive(val === 'true');
        }
      });
      setSettings(prev => ({ ...prev, ...parsed }));
    } catch (e) {
      console.warn(e);
    }

    try {
      const { data } = await supabase.from('game_settings').select('*');
      if (data) {
        const dbParsed: Record<string, string> = {};
        data.forEach(s => {
          dbParsed[s.key] = s.value;
          localStorage.setItem(`game_setting_${s.key}`, s.value);
          if (s.key === 'game_active') setGameActive(s.value === 'true');
        });
        setSettings(prev => ({ ...prev, ...dbParsed }));
      }
    } catch(e) {
      console.warn('Game settings table fetch skipped:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCatalog = async () => {
    setIsLoading(true);
    try {
      const types = await fetchAllBuildingTypes();
      setDbBuildingTypes(types || []);
      if (types && types.length > 0 && !selectedPrereqBuildingId) {
        setSelectedPrereqBuildingId(types[0].id);
      }
    } catch (e) {
      notify.custom('❌ خطأ في تحميل الكتالوج', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    setIsLoading(true);
    try {
      localStorage.setItem(`game_setting_${key}`, value);

      try {
        const { error } = await supabase
          .from('game_settings')
          .upsert({ key, value });
        if (error) {
          console.warn('DB upsert error, saved locally:', error);
        }
      } catch (dbErr) {
        console.warn('DB upsert error, saved locally:', dbErr);
      }

      setSettings(prev => ({ ...prev, [key]: value }));
      notify.custom('تم تحديث الإعداد بنجاح ✅', 'success');
    } catch (e: any) {
      setSettings(prev => ({ ...prev, [key]: value }));
      notify.custom('تم تحديث الإعداد بنجاح ✅ (محفوظ محلياً)', 'success');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCost = async (id: string, cost: number) => {
    setIsLoading(true);
    try {
      await updateBuildingTypeCost(id, cost);
      setDbBuildingTypes(prev => prev.map(bt => bt.id === id ? { ...bt, cost } : bt));
      notify.custom('✅ تم تحديث التكلفة', 'success');
    } catch (e) {
      notify.custom('❌ خطأ في التحديث', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePrereq = async (targetId: string, prereqId: string, currentPrereqs: string | null) => {
    setIsLoading(true);
    try {
      let prereqList = currentPrereqs ? currentPrereqs.split(',').map(s => s.trim()).filter(Boolean) : [];
      if (prereqList.includes(prereqId)) {
        prereqList = prereqList.filter(id => id !== prereqId);
      } else {
        prereqList.push(prereqId);
      }
      const updatedStr = prereqList.length > 0 ? prereqList.join(',') : null;
      await updateBuildingTypePrerequisites(targetId, updatedStr);
      setDbBuildingTypes(prev => prev.map(bt => bt.id === targetId ? { ...bt, prerequisites: updatedStr } : bt));
      notify.custom('✅ تم تحديث شروط البناء المسبقة', 'success');
    } catch (e: any) {
      notify.custom('❌ فشل تعديل الشروط: ' + e.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل تريد حذف ${name}؟ سيتم حذف جميع مبانيه من الخريطة.`)) return;
    setIsLoading(true);
    try {
      await deleteBuildingType(id);
      setDbBuildingTypes(prev => prev.filter(bt => bt.id !== id));
      notify.custom(`تم حذف ${name} من الكتالوج`, 'success');
    } catch (e) {
      notify.custom('❌ خطأ في الحذف', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveItemEdit = async (id: string) => {
    if (!editName.trim()) {
      notify.custom('⚠️ الاسم بالعربية مطلوب', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase
          .from('building_types')
          .update({
            name: editName.trim(),
            name_en: editNameEn.trim() || null,
            category: editCategory || null
          })
          .eq('id', id);
        if (error) throw error;
      }
      setDbBuildingTypes(prev => prev.map(bt => bt.id === id ? {
        ...bt,
        name: editName.trim(),
        name_en: editNameEn.trim() || null,
        category: editCategory || null
      } : bt));
      setEditingItemId(null);
      notify.custom('✅ تم حفظ التعديلات بنجاح', 'success');
    } catch (e: any) {
      notify.custom('❌ فشل حفظ التعديلات: ' + e.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditingItem = (bt: any) => {
    setEditingItemId(bt.id);
    setEditName(bt.name || '');
    setEditNameEn(bt.name_en || '');
    setEditCategory(bt.category || '');
  };

  const handleAddBuildingType = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await addBuildingType({
        name: newType.name,
        name_en: newType.name_en || undefined,
        icon: newType.icon,
        cost: newType.cost,
        max_per_team: newType.max_per_team,
        color: newType.color,
        exclusion_radius: newType.exclusion_radius,
        category: newType.category || null
      });
      notify.custom(`تمت إضافة ${newType.name} للكتالوج ✅`, 'success');
      setNewType({ name: '', name_en: '', icon: '', cost: 0, max_per_team: 3, color: '#D4AF37', exclusion_radius: 50, category: '' });
      setIsAdding(false);
      await loadCatalog();
    } catch (e) {
      notify.custom('❌ خطأ في الإضافة', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const activePrereqBuilding = dbBuildingTypes.find(bt => bt.id === selectedPrereqBuildingId);
  const activePrereqsArray = activePrereqBuilding?.prerequisites
    ? activePrereqBuilding.prerequisites.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  return (
    <div style={{ padding: '10px', backgroundColor: '#FFFDF5', borderRadius: '12px', border: '1px solid #E8D5A3', direction: 'rtl', fontFamily: 'Cairo' }}>
      <LoadingOverlay isLoading={isLoading} message="جاري معالجة إعدادات وقواعد اللعبة..." />
      
      <h3 style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700, color: '#8B4513', fontSize: '18px', marginBottom: '16px', textAlign: 'center' }}>
        🎮 لوحة إعدادات اللعبة وإدارة الكتالوج
      </h3>

      {/* SECTION 1: قواعد وتوقيت اللعبة (General Settings) */}
      <div style={{ marginBottom: '14px' }}>
        <button
          onClick={() => toggleSection('general')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: '#8B4513',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            outline: 'none',
            fontFamily: 'Cairo'
          }}
        >
          <span>⚙️ قواعد وتقاويم اللعبة ونشاطها</span>
          <span>{expandedSections.general ? '▲' : '▼'}</span>
        </button>

        {expandedSections.general && (
          <div style={{ padding: '12px', backgroundColor: '#FFF9E8', borderRadius: '0 0 8px 8px', border: '1px solid #E8D5A3', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: gameActive ? '#F0FFF4' : '#FFF5F5', borderRadius: '8px', border: `1px solid ${gameActive ? '#68D391' : '#FC8181'}` }}>
              <span style={{ fontWeight: 600, fontSize: '12px', color: gameActive ? '#2D6A2D' : '#8B0000', textAlign: 'center' }}>
                حالة اللاعبين: {gameActive ? '🟢 اللعبة نشطة ومتاحة للجميع' : '🔴 اللعبة متوقفة للصيانة والتحضير'}
              </span>
              <button 
                onClick={async () => {
                  const nextActive = !gameActive;
                  setGameActive(nextActive);
                  await updateSetting('game_active', String(nextActive));
                }}
                style={{ padding: '6px 12px', backgroundColor: gameActive ? '#FC8181' : '#68D391', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '12px', alignSelf: 'center' }}
              >
                {gameActive ? 'إيقاف اللعبة ومزامنتها' : 'تفعيل اللعبة ونشرها'}
              </button>
            </div>

            {GAME_SETTINGS_FIELDS.map(section => (
              <div key={section.section} style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E8D5A3' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#8B4513', marginBottom: '10px' }}>{section.section}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {section.fields.map(field => (
                    <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: '#6B5B45', fontWeight: 'bold' }}>{field.label}</label>
                      <input
                        type={field.type || 'number'}
                        value={settings[field.key] ?? field.default}
                        onBlur={(e) => updateSetting(field.key, e.target.value)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettings(prev => ({ ...prev, [field.key]: val }));
                        }}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #D4AF37', backgroundColor: '#FFFDF5', fontSize: '12px', color: '#2C1810', outline: 'none', fontFamily: 'Cairo' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: كتالوج وتكاليف مباني ومنشآت اللعبة (Catalog Settings) */}
      <div style={{ marginBottom: '14px' }}>
        <button
          onClick={() => toggleSection('catalog')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: '#8B4513',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            outline: 'none',
            fontFamily: 'Cairo'
          }}
        >
          <span>🗂️ كتالوج المنشآت وتكاليفها وتصنيفاتها ({dbBuildingTypes.length})</span>
          <span>{expandedSections.catalog ? '▲' : '▼'}</span>
        </button>

        {expandedSections.catalog && (
          <div style={{ padding: '12px', backgroundColor: '#FFF9E8', borderRadius: '0 0 8px 8px', border: '1px solid #E8D5A3', borderTop: 'none' }}>
            <p style={{ fontSize: '11px', color: '#6B5B45', marginBottom: '10px', textAlign: 'center' }}>تعديل الأسماء، الفئات، التكاليف، وحذف منشآت غير صالحة من الكتالوج.</p>
            
            {/* Category dropdown filter */}
            <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #E8D5A3' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#8B4513' }}>🔍 تصنيف المنشأة للتمرير والمطالعة:</label>
              <select
                value={selectedCatalogCategory}
                onChange={(e) => setSelectedCatalogCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1.5px solid #D4AF37',
                  backgroundColor: '#fff',
                  color: '#2C1810',
                  outline: 'none',
                  fontFamily: 'Cairo',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <option value="الكل">📂 الكل ({dbBuildingTypes.length})</option>
                <option value="أخرى">❓ أخرى/غير مصنف ({dbBuildingTypes.filter(t => getCategory(t) === 'أخرى').length})</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>
                    📁 {c.name} ({dbBuildingTypes.filter(t => getCategory(t) === c.name).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Management Sub-section */}
            <div style={{ marginBottom: '16px', padding: '10px', backgroundColor: '#FFFDF5', borderRadius: '8px', border: '1.5px dashed #D4AF37' }}>
              <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: '#8B4513', marginBottom: '8px' }}>📂 إدارة وتخصيص تصنيفات الكتالوج</h5>
              
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="اسم التصنيف الجديد..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #D4AF37',
                    fontFamily: 'Cairo',
                    fontSize: '12px',
                    flex: 1
                  }}
                />
                <button
                  onClick={() => {
                    handleAddCategory(newCategoryName);
                    setNewCategoryName('');
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#8B4513',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: 'Cairo',
                    fontSize: '11px'
                  }}
                >
                  ➕ إضافة
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                {categories.map(c => {
                  const isUsed = dbBuildingTypes.some(bt => getCategory(bt) === c.name);
                  const isEditingCat = editingCategoryId === c.id;
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.15)' }}>
                      {isEditingCat ? (
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1.5px solid #D4AF37',
                            fontFamily: 'Cairo',
                            fontSize: '12px',
                            flex: 1
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#2C1810' }}>
                          📄 {c.name} {isUsed ? '(مستعمل)' : ''}
                        </span>
                      )}

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {isEditingCat ? (
                          <>
                            <button
                              onClick={() => handleEditCategory(c.id, c.name, editingCategoryName)}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' }}
                              title="حفظ"
                            >
                              💾
                            </button>
                            <button
                              onClick={() => setEditingCategoryId(null)}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' }}
                              title="إلغاء"
                            >
                              ❌
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingCategoryId(c.id);
                              setEditingCategoryName(c.name);
                            }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' }}
                            title="تعديل"
                          >
                            ✏️
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          disabled={isUsed}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: isUsed ? 'not-allowed' : 'pointer',
                            opacity: isUsed ? 0.3 : 1,
                            fontSize: '13px'
                          }}
                          title="حذف"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Building Items list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingLeft: '4px' }}>
              {dbBuildingTypes
                .filter(bt => selectedCatalogCategory === 'الكل' || getCategory(bt) === selectedCatalogCategory)
                .map(bt => {
                  const isEditing = editingItemId === bt.id;
                  return (
                    <div key={bt.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', borderRadius: '8px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '22px' }}>{bt.icon}</span>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #D4AF37', fontFamily: 'Cairo', fontSize: '11px', width: '100%', background: '#fff' }}
                                placeholder="الاسم بالعربية"
                              />
                              <input
                                type="text"
                                value={editNameEn}
                                onChange={(e) => setEditNameEn(e.target.value)}
                                style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #D4AF37', fontFamily: 'Cairo', fontSize: '11px', width: '100%', background: '#fff' }}
                                placeholder="الاسم بالإنجليزية (إختياري)"
                              />
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #D4AF37', fontFamily: 'Cairo', fontSize: '11px', width: '100%', background: '#fff' }}
                              >
                                <option value="">أخرى (بلا تصنيف)</option>
                                {categories.map(c => (
                                  <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <>
                              <span style={{ fontWeight: 'bold', color: '#2C1810', fontSize: '12px' }}>{bt.name}</span>
                              {bt.name_en && <span style={{ fontSize: '10px', color: '#8B7355', direction: 'ltr', textAlign: 'right' }}>{bt.name_en}</span>}
                              <span style={{ fontSize: '9px', color: '#8B7355', fontWeight: 'semibold', marginTop: '2px' }}>التصنيف: {getCategory(bt)}</span>
                            </>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <span style={{ fontSize: '10px', color: '#8B7355' }}>التكلفة:</span>
                            <input 
                              type="number" 
                              min="0" 
                              value={bt.cost} 
                              onBlur={(e) => handleUpdateCost(bt.id, Number(e.target.value))} 
                              onChange={(e) => setDbBuildingTypes(prev => prev.map(t => t.id === bt.id ? {...t, cost: Number(e.target.value)} : t))} 
                              style={{ width: '48px', border: '1px solid #D4AF37', borderRadius: '4px', padding: '2px 4px', textAlign: 'center', background: '#fff', fontFamily: 'Cairo', fontSize: '11px' }} 
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '4px' }}>
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveItemEdit(bt.id)}
                                  style={{ border: 'none', background: '#27AE60', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  حفظ
                                </button>
                                <button
                                  onClick={() => setEditingItemId(null)}
                                  style={{ border: 'none', background: '#7F8C8D', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  إلغاء
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={() => startEditingItem(bt)} 
                                  style={{ border: 'none', background: 'rgba(212,175,55,0.2)', color: '#8B4513', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  📝 تعديل
                                </button>
                                <button 
                                  onClick={() => handleDelete(bt.id, bt.name)} 
                                  style={{ fontSize: '14px', cursor: 'pointer', background: 'transparent', border: 'none', padding: '2px' }}
                                  title="حذف النوع"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: إضافة منشأة جديدة (Add New Building) */}
      <div style={{ marginBottom: '14px' }}>
        <button
          onClick={() => toggleSection('add_new')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: '#8B4513',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            outline: 'none',
            fontFamily: 'Cairo'
          }}
        >
          <span>➕ إضافة منشأة أو مبنى جديد في الكتالوج</span>
          <span>{expandedSections.add_new ? '▲' : '▼'}</span>
        </button>

        {expandedSections.add_new && (
          <div style={{ padding: '12px', backgroundColor: '#FFF9E8', borderRadius: '0 0 8px 8px', border: '1px solid #E8D5A3', borderTop: 'none' }}>
            <p style={{ fontSize: '11px', color: '#6B5B45', marginBottom: '10px', textAlign: 'center' }}>سجّل كائنًا/بناية أو معلماً على خريطة ألعاب كنعان.</p>
            
            <form onSubmit={handleAddBuildingType} style={{ border: '1px solid rgba(212,175,55,0.25)', borderRadius: '8px', padding: '10px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6B5B45', display: 'block', marginBottom: '2px' }}>الاسم بالعربية *</label>
                <input type="text" placeholder="مثال: مستودع أسلحة" required value={newType.name} onChange={(e) => setNewType({...newType, name: e.target.value})} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.4)', background: '#fff', fontFamily: 'Cairo', fontSize: '12px' }} />
              </div>
              
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6B5B45', display: 'block', marginBottom: '2px' }}>الاسم بالإنجليزية (اختياري)</label>
                <input type="text" placeholder="مثال: Armory" value={newType.name_en || ''} onChange={(e) => setNewType({...newType, name_en: e.target.value})} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.4)', background: '#fff', fontFamily: 'Cairo', fontSize: '12px' }} />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6B5B45', display: 'block', marginBottom: '2px' }}>التصنيف الكتالوجي *</label>
                <select
                  value={newType.category || ''}
                  onChange={(e) => setNewType({ ...newType, category: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.4)', background: '#fff', fontFamily: 'Cairo', fontSize: '12px' }}
                >
                  <option value="">أخرى (بلا تصنيف)</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6B5B45', display: 'block', marginBottom: '2px' }}>إيموجي المنشأة *</label>
                <input type="text" maxLength={4} placeholder="🏹" required value={newType.icon} onChange={(e) => setNewType({...newType, icon: e.target.value})} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.4)', background: '#fff', fontFamily: 'Cairo', fontSize: '12px' }} />
              </div>
              
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6B5B45', display: 'block', marginBottom: '2px' }}>التكلفة (نقاط السبط) *</label>
                <input type="number" min="0" required placeholder="التكلفة" value={newType.cost} onChange={(e) => setNewType({...newType, cost: Number(e.target.value)})} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.4)', background: '#fff', fontFamily: 'Cairo', fontSize: '12px' }} />
              </div>
              
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6B5B45', display: 'block', marginBottom: '2px' }}>الحد الأقصى لكل سبط (إفتراضياً: ٣)</label>
                <input type="number" min="1" placeholder="مثال: 3" value={newType.max_per_team || ''} onChange={(e) => setNewType({...newType, max_per_team: e.target.value ? Number(e.target.value) : null})} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.4)', background: '#fff', fontFamily: 'Cairo', fontSize: '12px' }} />
              </div>

              <button type="submit" style={{ marginTop: '4px', background: '#8B4513', color: '#fff', fontWeight: 'bold', padding: '10px 14px', borderRadius: '6px', width: '100%', cursor: 'pointer', border: 'none', fontSize: '12px' }}>➕ إضافة للكتالوج والتشغيل</button>
            </form>
          </div>
        )}
      </div>

      {/* SECTION 4: شروط وتتابع البناء (Prerequisites) */}
      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={() => toggleSection('prereqs')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: '#8B4513',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            outline: 'none',
            fontFamily: 'Cairo'
          }}
        >
          <span>📜 شروط ومخطط توالي البناء والتحديات</span>
          <span>{expandedSections.prereqs ? '▲' : '▼'}</span>
        </button>

        {expandedSections.prereqs && (
          <div style={{ padding: '12px', backgroundColor: '#FFF9E8', borderRadius: '0 0 8px 8px', border: '1px solid #E8D5A3', borderTop: 'none' }}>
            <p style={{ fontSize: '11px', color: '#6B5B45', marginBottom: '10px', textAlign: 'center' }}>المنشآت المشروطة لتوفير مخطط متناسق للألعاب الإستراتيجية.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ border: '1px solid #E8D5A3', borderRadius: '8px', padding: '10px', backgroundColor: '#fff' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#8B4513', display: 'block', marginBottom: '6px' }}>
                  ١. حدد المنشأة المستهدفة:
                </label>
                <select
                  value={selectedPrereqBuildingId || ''}
                  onChange={(e) => setSelectedPrereqBuildingId(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1.5px solid #D4AF37', backgroundColor: '#fff', fontFamily: 'Cairo', fontSize: '12px', outline: 'none' }}
                >
                  {dbBuildingTypes.map(bt => (
                    <option key={bt.id} value={bt.id}>
                      {bt.icon} {bt.name} (تكلفة: {bt.cost})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ border: '1px solid #E8D5A3', borderRadius: '8px', padding: '10px', backgroundColor: '#fff' }}>
                {activePrereqBuilding ? (
                  <>
                    <h5 style={{ fontSize: '11px', fontWeight: 'bold', color: '#2C1810', marginBottom: '8px', borderBottom: '1px solid #E8D5A3', paddingBottom: '4px' }}>
                      المتطلبات قبل بناء <span style={{ color: '#D4AF37', fontSize: '14px' }}>{activePrereqBuilding.icon} {activePrereqBuilding.name}</span>:
                    </h5>
                    
                    <p style={{ fontSize: '10px', color: '#8B7355', marginBottom: '8px' }}>
                      اختر المنشآت التي يجب تشييدها أولاً لشرط التمكين بالسبط المحدّد:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                      {dbBuildingTypes
                        .filter(bt => bt.id !== selectedPrereqBuildingId)
                        .map(bt => {
                          const isChecked = activePrereqsArray.includes(bt.id) || activePrereqsArray.includes(bt.name);
                          return (
                            <label 
                              key={bt.id} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                border: isChecked ? '1px solid #D4AF37' : '1px solid #F1F3F4',
                                backgroundColor: isChecked ? 'rgba(212,175,55,0.06)' : 'transparent',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePrereq(activePrereqBuilding.id, bt.id, activePrereqBuilding.prerequisites)}
                                style={{ width: '14px', height: '14px', accentColor: '#D4AF37' }}
                              />
                              <span>{bt.icon} {bt.name}</span>
                            </label>
                          );
                        })}
                    </div>

                    {activePrereqsArray.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#888', fontSize: '10px', marginTop: '10px', padding: '6px', border: '1px dashed #DDD', borderRadius: '4px' }}>
                        لا توجد شروط مسبقة (منشأة أساسية متاحة للتنزيل المباشر).
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: '#888', padding: '12px', fontSize: '11px' }}>يرجى اختيار منشأة لتفصيل مخطط البناء الخاص بها.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
