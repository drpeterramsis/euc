import { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { awardPoints } from '../services/pointsService';
import { notify } from '../utils/toastMessages';

const AwardPointsModal = memo(function AwardPointsModal({
  teams, currentUser, onClose, onSuccess, initialTeamId = ''
}: any) {
  const [form, setForm] = useState({
    team_id: initialTeamId,
    amount:  '',
    reason:  '',
  });
  const [errors,    setErrors]    = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((field: string) => (e: any) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const validate = () => {
    const e: any = {};
    if (!form.team_id)          e.team_id = 'اختر سبطاً';
    if (!form.amount)           e.amount  = 'أدخل عدد النقاط';
    if (Number(form.amount) < 1) e.amount  = 'يجب أن تكون النقاط أكبر من صفر';
    if (!form.reason.trim())    e.reason  = 'أدخل سبب المكافأة';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await awardPoints({
        teamId:   form.team_id,
        amount:   Number(form.amount),
        reason:   form.reason,
        addedBy:  currentUser?.id,
      });
      const teamName = teams.find((t: any) => t.id === form.team_id)?.name ?? '';
      notify.custom(`✅ تم إضافة ${form.amount} نقطة لسبط ${teamName}`, 'success');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      notify.custom(`❌ ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTeam = teams.find((t: any) => t.id === form.team_id);

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
            width: '100%', maxWidth: '420px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
            direction: 'rtl',
            maxHeight: '90vh', overflowY: 'auto'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '20px',
            paddingBottom: '12px', borderBottom: '1.5px solid #E8D5A3',
          }}>
            <h2 style={{
              fontFamily: "'Cinzel', serif", fontSize: '17px',
              color: '#8B4513', margin: 0,
            }}>
              🏆 منح نقاط لسبط
            </h2>
            <button onClick={onClose} style={{
              background: 'none', border: 'none',
              fontSize: '20px', cursor: 'pointer', color: '#8B7355',
            }}>✕</button>
          </div>

          {/* Team Select */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>اختر السبط *</label>
            <select
              value={form.team_id}
              onChange={handleChange('team_id')}
              style={inputStyle(!!errors.team_id)}
            >
              <option value="">— اختر سبطاً —</option>
              {teams.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.symbol} {t.name}
                  {' '}({(t.points_total || 0) - (t.points_spent || 0)} نقطة متاحة)
                </option>
              ))}
            </select>
            {errors.team_id && <ErrorText msg={errors.team_id} />}
          </div>

          {/* Selected team stats */}
          {selectedTeam && (
            <div style={{
              backgroundColor: (selectedTeam.color ?? '#D4AF37') + '22',
              border: `1.5px solid ${selectedTeam.color ?? '#D4AF37'}`,
              borderRadius: '10px', padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex', justifyContent: 'space-around',
              fontFamily: "'Tajawal', sans-serif", fontSize: '12px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#D4AF37', fontSize: '18px' }}>
                  {selectedTeam.points_total ?? 0}
                </div>
                <div style={{ color: '#6B5B45' }}>إجمالي النقاط</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#E74C3C', fontSize: '18px' }}>
                  {selectedTeam.points_spent ?? 0}
                </div>
                <div style={{ color: '#6B5B45' }}>نقاط مُنفقة</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#27AE60', fontSize: '18px' }}>
                  {(selectedTeam.points_total ?? 0) - (selectedTeam.points_spent ?? 0)}
                </div>
                <div style={{ color: '#6B5B45' }}>النقاط المتاحة</div>
              </div>
            </div>
          )}

          {/* Amount */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>عدد النقاط *</label>
            <input
              type="number" min="1" max="9999"
              placeholder="مثال: 100"
              value={form.amount}
              onChange={handleChange('amount')}
              dir="ltr"
              style={inputStyle(!!errors.amount)}
            />
            {errors.amount && <ErrorText msg={errors.amount} />}
          </div>

          {/* Reason */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>سبب المكافأة *</label>
            <input
              type="text"
              placeholder="مثال: الفوز في التحدي الأسبوعي"
              value={form.reason}
              onChange={handleChange('reason')}
              style={inputStyle(!!errors.reason)}
            />
            {errors.reason && <ErrorText msg={errors.reason} />}
          </div>

          {/* Quick reasons */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{
              fontSize: '11px', color: '#B8A88A',
              fontFamily: "'Tajawal', sans-serif",
              display: 'block', marginBottom: '6px',
            }}>
              أسباب سريعة:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                'الفوز في تحدي',
                'نشاط متميز',
                'مكافأة حضور',
                'إنجاز مهمة',
                'مكافأة خاصة',
                'حفظ الأيات والتسميع',
                'الالتزام بقواعد خيمة الاجتماع',
                'التعاون ومساعدة الأسباط الأخرى',
                'المشاركة الفعالة في الأنشطة الكنسية',
                'الفوز بتحدي بناء الخريطة الإستراتيجية',
                'سلوك إيجابي ومثالي متميز'
              ].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, reason: r }))}
                  style={{
                    padding: '3px 10px', borderRadius: '12px',
                    border: '1px solid #D4AF37',
                    backgroundColor: form.reason === r ? '#D4AF37' : '#FFF8E7',
                    color: form.reason === r ? '#fff' : '#8B4513',
                    fontSize: '11px', cursor: 'pointer',
                    fontFamily: "'Tajawal', sans-serif",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex', gap: '10px', justifyContent: 'flex-end',
            paddingTop: '16px', borderTop: '1px solid #F0E6C8',
          }}>
            <button onClick={onClose} style={cancelBtnStyle}>إلغاء</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '10px 22px', borderRadius: '8px',
                border: 'none', backgroundColor: '#D4AF37',
                color: '#fff', fontFamily: "'Tajawal', sans-serif",
                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                opacity: submitting ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(212,175,55,0.35)',
              }}
            >
              {submitting ? 'جاري المنح...' : '🏆 منح النقاط'}
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

export default AwardPointsModal;

const labelStyle: any = {
  display: 'block', fontFamily: "'Tajawal', sans-serif",
  fontSize: '13px', fontWeight: 600,
  color: '#6B5B45', marginBottom: '5px',
};
const inputStyle = (hasError: boolean): any => ({
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', borderRadius: '8px',
  border: `1.5px solid ${hasError ? '#E74C3C' : '#D4AF37'}`,
  fontFamily: "'Tajawal', sans-serif", fontSize: '14px',
  backgroundColor: '#FFFDF5', color: '#2C1810', outline: 'none',
});
const ErrorText = ({ msg }: { msg: string }) => (
  <span style={{
    display: 'block', color: '#E74C3C', fontSize: '11px',
    marginTop: '3px', fontFamily: "'Tajawal', sans-serif",
  }}>⚠️ {msg}</span>
);
const cancelBtnStyle: any = {
  padding: '10px 22px', borderRadius: '8px',
  border: '1.5px solid #D4AF37',
  backgroundColor: 'transparent', color: '#8B7355',
  fontFamily: "'Tajawal', sans-serif", fontSize: '14px',
  cursor: 'pointer',
};
