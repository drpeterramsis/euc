import { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminDeductPoints } from '../services/pointsService';
import { notify } from '../utils/toastMessages';

interface DeductPointsModalProps {
  teams: any[];
  currentUser: any;
  onClose: () => void;
  onSuccess?: () => void;
  initialTeamId?: string;
}

const DeductPointsModal = memo(function DeductPointsModal({
  teams, currentUser, onClose, onSuccess, initialTeamId = ''
}: DeductPointsModalProps) {
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
    if (!form.amount)           e.amount  = 'أدخل عدد النقاط المراد خصمها';
    if (Number(form.amount) < 1) e.amount  = 'يجب أن تكون النقاط أكبر من صفر';
    if (!form.reason.trim())    e.reason  = 'أدخل سبب خصم النقاط';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await adminDeductPoints({
        teamId:   form.team_id,
        amount:   Number(form.amount),
        reason:   form.reason,
        adminId:  currentUser?.id,
      });
      const teamName = teams.find((t: any) => t.id === form.team_id)?.name ?? '';
      notify.custom(`⚠️ تم خصم ${form.amount} نقطة من سبط ${teamName}`, 'success');
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
            border: '2px solid #E74C3C', padding: '24px',
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
            paddingBottom: '12px', borderBottom: '1.5px solid #FADBD8',
          }}>
            <h2 style={{
              fontFamily: "'Cairo', sans-serif", fontSize: '17px',
              color: '#C0392B', margin: 0, fontWeight: 700,
            }}>
              🛑 خصم نقاط من ميزانية السبط
            </h2>
            <button onClick={onClose} style={{
              background: 'none', border: 'none',
              fontSize: '20px', cursor: 'pointer', color: '#922B21',
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
              backgroundColor: '#FDEDEC',
              border: '1.5px solid #E74C3C',
              borderRadius: '10px', padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex', justifyContent: 'space-around',
              fontFamily: "'Cairo', sans-serif", fontSize: '12px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#C0392B', fontSize: '18px' }}>
                  {selectedTeam.points_total ?? 0}
                </div>
                <div style={{ color: '#7B241C' }}>إجمالي النقاط</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#E74C3C', fontSize: '18px' }}>
                  {selectedTeam.points_spent ?? 0}
                </div>
                <div style={{ color: '#7B241C' }}>نقاط مُنفقة</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#27AE60', fontSize: '18px' }}>
                  {(selectedTeam.points_total ?? 0) - (selectedTeam.points_spent ?? 0)}
                </div>
                <div style={{ color: '#7B241C' }}>النقاط المتاحة</div>
              </div>
            </div>
          )}

          {/* Amount */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>عدد النقاط المراد خصمها *</label>
            <input
              type="number" min="1" max="9999"
              placeholder="مثال: 50"
              value={form.amount}
              onChange={handleChange('amount')}
              dir="ltr"
              style={inputStyle(!!errors.amount)}
            />
            {errors.amount && <ErrorText msg={errors.amount} />}
          </div>

          {/* Reason */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>سبب الخصم *</label>
            <input
              type="text"
              placeholder="مثال: مخالفة القواعد الإدارية أو تراجع أداء"
              value={form.reason}
              onChange={handleChange('reason')}
              style={inputStyle(!!errors.reason)}
            />
            {errors.reason && <ErrorText msg={errors.reason} />}
          </div>

          {/* Quick reasons */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{
              fontSize: '11px', color: '#922B21',
              fontFamily: "'Cairo', sans-serif",
              display: 'block', marginBottom: '6px',
            }}>
              أسباب سريعة للخصم:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                'إلغاء مكافأة بالخطأ',
                'عقوبة مخالفة القوانين',
                'تراجع في التحدي الإداري',
                'خصم روتيني معتمد',
                'تأخر في تسليم المطلوب',
                'غياب بدون عذر مقبول',
                'تراجع الأداء البرمجي أو التنظيمي',
                'مخالفة قواعد الخيمة أو السبط',
                'سلوك غير لائق أو تشتيت'
              ].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, reason: r }))}
                  style={{
                    padding: '3px 10px', borderRadius: '12px',
                    border: '1px solid #E74C3C',
                    backgroundColor: form.reason === r ? '#E74C3C' : '#FDEDEC',
                    color: form.reason === r ? '#fff' : '#C0392B',
                    fontSize: '11px', cursor: 'pointer',
                    fontFamily: "'Cairo', sans-serif",
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
            paddingTop: '16px', borderTop: '1px solid #FADBD8',
          }}>
            <button onClick={onClose} style={cancelBtnStyle}>إلغاء</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '10px 22px', borderRadius: '8px',
                border: 'none', backgroundColor: '#E74C3C',
                color: '#fff', fontFamily: "'Cairo', sans-serif",
                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                opacity: submitting ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(231,76,60,0.35)',
              }}
            >
              {submitting ? 'جاري الخصم...' : '🛑 خصم النقاط'}
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

export default DeductPointsModal;

const labelStyle: any = {
  display: 'block', fontFamily: "'Cairo', sans-serif",
  fontSize: '13px', fontWeight: 600,
  color: '#7B241C', marginBottom: '5px',
};
const inputStyle = (hasError: boolean): any => ({
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', borderRadius: '8px',
  border: `1.5px solid ${hasError ? '#E74C3C' : '#E74C3C'}`,
  fontFamily: "'Cairo', sans-serif", fontSize: '14px',
  backgroundColor: '#FFFDF5', color: '#2C1810', outline: 'none',
});
const ErrorText = ({ msg }: { msg: string }) => (
  <span style={{
    display: 'block', color: '#E74C3C', fontSize: '11px',
    marginTop: '3px', fontFamily: "'Cairo', sans-serif",
  }}>⚠️ {msg}</span>
);
const cancelBtnStyle: any = {
  padding: '10px 22px', borderRadius: '8px',
  border: '1.5px solid #E74C3C',
  backgroundColor: 'transparent', color: '#922B21',
  fontFamily: "'Cairo', sans-serif", fontSize: '14px',
  cursor: 'pointer',
};
