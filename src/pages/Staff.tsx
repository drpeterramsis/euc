import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { getLabel } from '../utils/labels';
import { getPageAccess as getCentralPageAccess } from '../lib/pageAccess';
import { Navigate } from 'react-router-dom';

/**
 * Staff Directory page displaying conference staff members with contact options.
 */
export default function Staff() {
  const { users, appConfig, currentUser, content } = useApp() as any;

  const centralAccess = content?.settings 
    ? getCentralPageAccess(currentUser?.id || "", currentUser?.role || "", "staffDirectory", content.settings)
    : { enabled: true, comingSoon: false };

  if (centralAccess.comingSoon) {
    return <Navigate to="/coming-soon" replace />;
  }

  if (!centralAccess.enabled) {
    return <Navigate to="/access-denied" replace />;
  }
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
        <h1 className="text-2xl font-bold text-gray-900">{getLabel(appConfig, "staff")}</h1>
        <p className="text-gray-500 text-sm mt-1">Contact the organizational team for assistance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffMembers.map((user: any) => {
          const waNum = (user.phone || "").replace(/\D/g, "");
          const waMsg = encodeURIComponent(
            "Hello, I am contacting you from the EUC Conference App."
          );

          return (
            <div 
              key={user.id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center transition-all hover:shadow-md"
            >
              <div className="mb-4">
                {user.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.name}
                    className="h-20 w-20 rounded-full object-cover mx-auto shadow-sm border-4 border-yellow-50"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.classList.remove('hidden');
                        e.currentTarget.nextElementSibling.classList.add('flex');
                      }
                    }}
                  />
                ) : null}
                <div className={`${user.photoUrl ? 'hidden' : 'flex'} h-20 w-20 rounded-full bg-yellow-400 items-center justify-center text-black font-bold text-2xl mx-auto shadow-sm border-4 border-yellow-50`}>
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
              <p className="text-yellow-600 font-bold text-xs uppercase tracking-widest mt-1">
                {user.title || "Staff Member"}
              </p>
              {user.email && (
                <a 
                  href={`mailto:${user.email}`} 
                  className="text-gray-500 text-sm mt-3 hover:text-yellow-600 transition-colors break-all"
                >
                  {user.email}
                </a>
              )}

              <div className="mt-6 flex w-full gap-3">
                {user.phone && (
                  <>
                    <a 
                      href={`tel:${user.phone}`}
                      className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
                    >
                      📞 Call
                    </a>
                    <a 
                      href={`https://wa.me/${waNum}?text=${waMsg}`}
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
            <p className="text-gray-500 font-bold">No staff members found.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
