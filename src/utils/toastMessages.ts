import toast from 'react-hot-toast';

export const notify = {
  // ── Users ──
  userAdded:      () => toast.success('✅ تم إضافة العضو بنجاح'),
  userUpdated:    () => toast.success('✅ تم تحديث بيانات العضو'),
  userDeleted:    () => toast.success('✅ تم حذف العضو بنجاح'),
  userTransferred:() => toast.success('✅ تم نقل العضو إلى السبط الجديد'),

  // ── Auth ──
  loginSuccess:   () => toast.success('✅ مرحباً! تم تسجيل الدخول'),
  logoutSuccess:  () => toast.success('👋 تم تسجيل الخروج بنجاح'),

  // ── Settings ──
  settingsSaved:  () => toast.success('✅ تم حفظ الإعدادات'),
  mapSaved:       () => toast.success('✅ تم حفظ توزيع الأسباط على الخريطة'),

  // ── Errors ──
  saveFailed:     () => toast.error('❌ حدث خطأ أثناء الحفظ، حاول مرة أخرى'),
  deleteFailed:   () => toast.error('❌ حدث خطأ أثناء الحذف'),
  loadFailed:     () => toast.error('❌ فشل تحميل البيانات'),
  usernameTaken:  () => toast.error('❌ اسم المستخدم مستخدم بالفعل'),
  cannotDeleteSelf: () => toast.error('❌ لا يمكنك حذف حسابك الشخصي'),
  fillAllFields:  () => toast.error('⚠️ يرجى ملء جميع الحقول المطلوبة'),
  passwordShort:  () => toast.error('⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل'),

  // ── Custom ──
  custom: (msg: string, type: 'success' | 'error' | 'default' = 'success') => {
    if (type === 'success') toast.success(msg);
    else if (type === 'error') toast.error(msg);
    else toast(msg);
  }
};
