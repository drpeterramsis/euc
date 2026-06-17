import React, { useState } from 'react';
import { getSupabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

interface AddUserFormProps {
  onUserAdded: () => void;
  teams: any[];
}

export default function AddUserForm({ onUserAdded, teams }: AddUserFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [team_id, setTeamId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;

    const password_hash = bcrypt.hashSync(password, 10);
    const { error: insertError } = await supabase.from('users').insert([{
      username, password_hash, role, team_id: team_id || null
    }]);

    if (insertError) {
      setError('خطأ في إضافة المستخدم');
    } else {
      setUsername('');
      setPassword('');
      onUserAdded();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow space-y-4" dir="rtl">
      <h3 className="font-bold">إضافة مستخدم جديد</h3>
      <input type="text" placeholder="اسم المستخدم" className="w-full p-2 border" value={username} onChange={e => setUsername(e.target.value)} required />
      <input type="password" placeholder="كلمة المرور" className="w-full p-2 border" value={password} onChange={e => setPassword(e.target.value)} required />
      <select className="w-full p-2 border" value={role} onChange={e => setRole(e.target.value)}>
        <option value="member">عضو</option>
        <option value="team_admin">قائد السبط</option>
        <option value="super_admin">مدير النظام</option>
      </select>
      <select className="w-full p-2 border" value={team_id} onChange={e => setTeamId(e.target.value)}>
        <option value="">بدون سبط</option>
        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <button type="submit" className="bg-[#D4AF37] text-white p-2 rounded w-full">إضافة</button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
