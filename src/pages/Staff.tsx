import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';

/**
 * Staff Directory page displaying conference staff members with contact options.
 */
export default function Staff() {
  const { users } = useApp();
  const staffMembers = users.filter((u: any) => u.role === "staff");

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff Directory</h1>
        <p className="text-gray-500 text-sm mt-1">Contact the organizational team for assistance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffMembers.map((member: any) => {
          const waNumber = (member.phone || "").replace(/\D/g, "");
          const waMessage = encodeURIComponent(
            "Hello, I am contacting you from the EUC Conference App."
          );

          return (
            <div 
              key={member.id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center transition-all hover:shadow-md"
            >
              {/* Photo / Initials */}
              <div className="mb-4">
                {member.photoUrl || member.photo ? (
                  <img 
                    src={member.photoUrl || member.photo} 
                    alt={member.name} 
                    className="w-24 h-24 rounded-full border-4 border-yellow-50 object-cover shadow-sm"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      e.currentTarget.nextElementSibling?.classList.add('flex');
                    }}
                  />
                ) : null}
                <div className={`${(member.photoUrl || member.photo) ? 'hidden' : 'flex'} w-24 h-24 bg-yellow-400 items-center justify-center rounded-full text-2xl font-black text-black border-4 border-yellow-50 shadow-sm`}>
                  {getInitials(member.name || "")}
                </div>
              </div>

              {/* Info */}
              <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
              <p className="text-yellow-600 font-bold text-xs uppercase tracking-widest mt-1">
                {member.title || "Staff Member"}
              </p>
              {member.email && (
                <a 
                  href={`mailto:${member.email}`} 
                  className="text-gray-500 text-sm mt-3 hover:text-yellow-600 transition-colors break-all"
                >
                  {member.email}
                </a>
              )}

              {/* Actions */}
              <div className="mt-6 flex w-full gap-3">
                {member.phone && (
                  <>
                    <a 
                      href={`tel:${member.phone}`}
                      className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
                    >
                      📞 Call
                    </a>
                    <a 
                      href={`https://wa.me/${waNumber}?text=${waMessage}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#25D366] text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#128C7E] transition-colors"
                    >
                      💬 WhatsApp
                    </a>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {staffMembers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <span className="text-4xl mb-3 block">👥</span>
            <p className="text-gray-500 font-bold">No staff members listed yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
