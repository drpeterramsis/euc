import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────
// Sub-components defined OUTSIDE — never recreated on render
// ─────────────────────────────────────────────────────────

const FormField = memo(({ label, error, children }: any) => (
  <div style={{ marginBottom: '14px' }}>
    <label style={{
      display: 'block',
      fontFamily: "'Tajawal', sans-serif",
      fontSize: '13px',
      fontWeight: 600,
      color: '#6B5B45',
      marginBottom: '5px',
    }}>
      {label}
    </label>
    {children}
    {error && (
      <span style={{
        display: 'block',
        color: '#E74C3C',
        fontSize: '11px',
        marginTop: '3px',
        fontFamily: "'Tajawal', sans-serif",
      }}>
        ⚠️ {error}
      </span>
    )}
  </div>
));

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
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxShadow: hasError
    ? '0 0 0 3px rgba(231,76,60,0.1)'
    : 'none',
});

// ─────────────────────────────────────────────────────────
// MAIN MODAL — self-contained, manages its own form state
// ─────────────────────────────────────────────────────────

interface AddMemberModalProps {
  team?: any;
  onClose: () => void;
  onSave: (form: any) => void;
}

const AddMemberModal = memo(function AddMemberModal({ team, onClose, onSave }: AddMemberModalProps) {

  // ✅ Form state lives HERE — changing it only re-renders THIS component
  const [form, setForm] = useState({
    name:     '',
    username: '',
    password: '',
    role:     'member',
    team_id:  team?.id ?? '',
  });

  const [errors,      setErrors]    = useState<any>({});
  const [showPassword, setShowPw]   = useState(false);
  const [submitting,   setSubmitting] = useState(false);

  // ✅ useCallback — stable references, no recreation on render
  const handleNameChange = useCallback((e: any) => {
    setForm(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleUsernameChange = useCallback((e: any) => {
    const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setForm(prev => ({ ...prev, username: clean }));
  }, []);

  const handlePasswordChange = useCallback((e: any) => {
    setForm(prev => ({ ...prev, password: e.target.value }));
  }, []);

  const handleRoleChange = useCallback((e: any) => {
    setForm(prev => ({ ...prev, role: e.target.value }));
  }, []);

  const togglePassword = useCallback(() => {
    setShowPw(prev => !prev);
  }, []);

  const validate = useCallback(() => {
    const e: any = {};
    if (!form.name.trim())
      e.name = 'الاسم الكامل مطلوب';
    if (!form.username.trim())
      e.username = 'اسم المستخدم مطلوب';
    else if (!/^[a-z0-9_]+$/.test(form.username))
      e.username = 'أحرف إنجليزية صغيرة وأرقام و _ فقط';
    if (!form.password)
      e.password = 'كلمة المرور مطلوبة';
    else if (form.password.length < 4)
      e.password = '4 أحرف على الأقل';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSave(form);   // parent handles Supabase call
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, onSave]);

  // Close on Escape key
  const handleKeyDown = useCallback((e: any) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  return (
    <AnimatePresence>

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        onKeyDown={handleKeyDown}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9,  y: 20 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{    opacity: 0, scale: 0.9,  y: 20 }}
          transition={{ type: 'spring', damping: 24, stiffness: 340 }}
          onClick={e => e.stopPropagation()}   // prevent backdrop close
          style={{
            backgroundColor: '#FFFDF5',
            borderRadius: '16px',
            border: '2px solid #D4AF37',
            padding: '24px',
            width: '100%',
            maxWidth: '420px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
            direction: 'rtl',
            position: 'relative',
          }}
        >

          {/* ── Header ── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            paddingBottom: '12px',
            borderBottom: '1.5px solid #E8D5A3',
          }}>
            <h2 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '17px',
              color: '#8B4513',
              margin: 0,
            }}>
              ➕ إضافة عضو جديد
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#8B7355',
                lineHeight: 1,
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F0E6C8'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              ✕
            </button>
          </div>

          {/* ── Team Badge ── */}
          <div style={{
            backgroundColor: (team?.color ?? '#D4AF37') + '22',
            border: `1.5px solid ${team?.color ?? '#D4AF37'}`,
            borderRadius: '8px',
            padding: '7px 14px',
            marginBottom: '18px',
            fontSize: '13px',
            fontFamily: "'Tajawal', sans-serif",
            color: '#2C1810',
            textAlign: 'center',
            fontWeight: 600,
          }}>
            {team?.symbol ?? '⚔️'}&nbsp; سبط: <strong>{team?.name ?? '—'}</strong>
          </div>

          {/* ── Field: Name ── */}
          <FormField label="الاسم الكامل *" error={errors.name}>
            <input
              type="text"
              placeholder="مثال: بطرس رمسيس"
              value={form.name}
              onChange={handleNameChange}
              autoFocus
              autoComplete="off"
              style={getInputStyle(!!errors.name)}
              onFocus={e => {
                if (!errors.name)
                  e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.2)';
              }}
              onBlur={e => { e.target.style.boxShadow = 'none'; }}
            />
          </FormField>

          {/* ── Field: Username ── */}
          <FormField label="اسم المستخدم *" error={errors.username}>
            <input
              type="text"
              placeholder="مثال: peter_ramsis"
              value={form.username}
              onChange={handleUsernameChange}
              autoComplete="off"
              dir="ltr"
              style={{
                ...getInputStyle(!!errors.username),
                fontFamily: 'monospace',
                letterSpacing: '0.5px',
              }}
              onFocus={e => {
                if (!errors.username)
                  e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.2)';
              }}
              onBlur={e => { e.target.style.boxShadow = 'none'; }}
            />
          </FormField>

          {/* ── Field: Password ── */}
          <FormField label="كلمة المرور *" error={errors.password}>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="4 أحرف على الأقل"
                value={form.password}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                dir="ltr"
                style={{
                  ...getInputStyle(!!errors.password),
                  paddingLeft: '42px',
                }}
                onFocus={e => {
                  if (!errors.password)
                    e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.2)';
                }}
                onBlur={e => { e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={togglePassword}
                tabIndex={-1}             // skip in tab order
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#8B7355',
                  padding: '4px',
                  lineHeight: 1,
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <span style={{
              display: 'block',
              fontSize: '10px',
              color: '#B8A88A',
              fontFamily: "'Tajawal', sans-serif",
              marginTop: '3px',
            }}>
              ملاحظة: كلمات المرور مرئية للإدارة للضرورة التنظيمية
            </span>
          </FormField>

          {/* ── Field: Role ── */}
          <FormField label="الدور" error={errors.role}>
            <select
              value={form.role}
              onChange={handleRoleChange}
              style={getInputStyle(false)}
            >
              <option value="member">⚔️ عضو</option>
              <option value="team_admin">🛡️ قائد السبط</option>
            </select>
          </FormField>

          {/* ── Action Buttons ── */}
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid #F0E6C8',
          }}>
            <button
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                border: '1.5px solid #D4AF37',
                backgroundColor: 'transparent',
                color: '#8B7355',
                fontFamily: "'Tajawal', sans-serif",
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              إلغاء
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: submitting ? '#E8D5A3' : '#D4AF37',
                color: '#fff',
                fontFamily: "'Tajawal', sans-serif",
                fontSize: '14px',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(212,175,55,0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              {submitting ? (
                <>
                  <span style={{
                    width: '14px', height: '14px',
                    border: '2px solid #fff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }}/>
                  جاري الإضافة...
                </>
              ) : (
                '✅ إضافة العضو'
              )}
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

export default AddMemberModal;
