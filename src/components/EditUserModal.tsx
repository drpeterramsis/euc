import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const getInputStyle = (hasError: boolean): any => ({
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: '8px',
  border: `1.5px solid ${hasError ? '#E74C3C' : '#D4AF37'}`,
  fontFamily: "'Tajawal', sans-serif",
  fontSize: '14px',
  backgroundColor: '#FFFDF5',
  color: '#2C1810',
  outline: 'none',
});

const EditUserModal = memo(function EditUserModal({
  user, teams, onClose, onSave
}: any) {
  const [form, setForm] = useState({
    name:     user?.name     ?? '',
    username: user?.username ?? '',
    password: '',              // empty = keep existing
    role:     user?.role     ?? 'member',
    team_id:  user?.team_id  ?? '',
  });
  const [errors,       setErrors]    = useState<any>({});
  const [showPassword, setShowPw]    = useState(false);
  const [submitting,   setSubmitting] = useState(false);

  const handleChange = useCallback((field: string) => (e: any) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const handleUsernameChange = useCallback((e: any) => {
    const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setForm(prev => ({ ...prev, username: clean }));
    setErrors(prev => ({ ...prev, username: '' }));
  }, []);

  const validate = () => {
    const e: any = {};
    if (!form.name.trim())     e.name     = 'الاسم مطلوب';
    if (!form.username.trim()) e.username = 'اسم المستخدم مطلوب';
    if (form.password && form.password.length < 4)
      e.password = '4 أحرف على الأقل';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Only include password if user typed a new one
      const updateData: any = {
        name:     form.name.trim(),
        username: form.username.trim(),
        role:     form.role,
        team_id:  form.team_id,
      };
      if (form.password.trim()) {
        updateData.password = form.password;   // maps to password_hash in service
      }
      await onSave(user.id, updateData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          backgroundColor: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '16px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1,   y: 0  }}
          exit={{    opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 24, stiffness: 340 }}
          onClick={e => e.stopPropagation()}
          style={{
            backgroundColor: '#FFFDF5', borderRadius: '16px',
            border: '2px solid #D4AF37', padding: '24px',
            width: '100%', maxWidth: '440px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
            direction: 'rtl',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '18px',
            paddingBottom: '12px', borderBottom: '1.5px solid #E8D5A3',
          }}>
            <h2 style={{
              fontFamily: "'Cinzel', serif", fontSize: '17px',
              color: '#8B4513', margin: 0,
            }}>
              ✏️ تعديل بيانات العضو
            </h2>
            <button onClick={onClose} style={{
              background: 'none', border: 'none',
              fontSize: '20px', cursor: 'pointer', color: '#8B7355',
            }}>✕</button>
          </div>

          {/* Current user badge */}
          <div style={{
            backgroundColor: '#F0E6C8', borderRadius: '8px',
            padding: '8px 14px', marginBottom: '18px',
            fontSize: '12px', color: '#6B5B45',
            fontFamily: "'Tajawal', sans-serif",
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <code style={{ fontWeight: 700, color: '#8B4513' }}>
              {user?.username}
            </code>
            <span>—</span>
            <span>{user?.name}</span>
          </div>

          {/* Name */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>الاسم الكامل *</label>
            <input
              type="text" value={form.name}
              onChange={handleChange('name')}
              style={getInputStyle(!!errors.name)}
              autoFocus
            />
            {errors.name && <ErrorMsg msg={errors.name} />}
          </div>

          {/* Username */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>اسم المستخدم *</label>
            <input
              type="text" value={form.username} dir="ltr"
              onChange={handleUsernameChange}
              style={{ ...getInputStyle(!!errors.username), fontFamily: 'monospace' }}
            />
            {errors.username && <ErrorMsg msg={errors.username} />}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>
              كلمة المرور الجديدة
              <span style={{ fontSize: '11px', color: '#B8A88A', marginRight: '6px' }}>
                (اتركها فارغة للإبقاء على الحالية)
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password} dir="ltr"
                placeholder="اترك فارغاً للإبقاء على كلمة المرور الحالية"
                onChange={handleChange('password')}
                style={{ ...getInputStyle(!!errors.password), paddingLeft: '42px' }}
              />
              <button
                type="button" tabIndex={-1}
                onClick={() => setShowPw(p => !p)}
                style={{
                  position: 'absolute', left: '10px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: '16px',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <ErrorMsg msg={errors.password} />}
          </div>

          {/* Role */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>الدور</label>
            <select
              value={form.role}
              onChange={handleChange('role')}
              style={getInputStyle(false)}
            >
              <option value="member">⚔️ عضو</option>
              <option value="team_admin">🛡️ قائد السبط</option>
              <option value="super_admin">👑 سوبر أدمن</option>
            </select>
          </div>

          {/* Team */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>السبط</label>
            <select
              value={form.team_id || ''}
              onChange={handleChange('team_id')}
              style={getInputStyle(false)}
            >
              <option value="">— بدون سبط —</option>
              {teams.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.symbol} {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex', gap: '10px',
            justifyContent: 'flex-end', marginTop: '22px',
            paddingTop: '16px', borderTop: '1px solid #F0E6C8',
          }}>
            <button onClick={onClose} style={cancelBtnStyle}>إلغاء</button>
            <button onClick={handleSubmit} disabled={submitting} style={{
              ...saveBtnStyle,
              backgroundColor: submitting ? '#E8D5A3' : '#D4AF37',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}>
              {submitting ? 'جاري الحفظ...' : '💾 حفظ التعديلات'}
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

export default EditUserModal;

const labelStyle: any = {
  display: 'block', fontFamily: "'Tajawal', sans-serif",
  fontSize: '13px', fontWeight: 600,
  color: '#6B5B45', marginBottom: '5px',
};
const ErrorMsg = ({ msg }: { msg: string }) => (
  <span style={{
    display: 'block', color: '#E74C3C',
    fontSize: '11px', marginTop: '3px',
    fontFamily: "'Tajawal', sans-serif",
  }}>⚠️ {msg}</span>
);
const saveBtnStyle: any = {
  padding: '10px 22px', borderRadius: '8px', border: 'none',
  backgroundColor: '#D4AF37', color: '#fff',
  fontFamily: "'Tajawal', sans-serif",
  fontSize: '14px', fontWeight: 700,
  boxShadow: '0 4px 12px rgba(212,175,55,0.35)',
};
const cancelBtnStyle: any = {
  padding: '10px 22px', borderRadius: '8px',
  border: '1.5px solid #D4AF37',
  backgroundColor: 'transparent', color: '#8B7355',
  fontFamily: "'Tajawal', sans-serif", fontSize: '14px',
  cursor: 'pointer',
};
