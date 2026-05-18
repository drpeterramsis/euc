/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';

/**
 * Sessions component renders the list/grid of scientific sessions.
 */
export default function Sessions() {
  const { sessions, currentUser } = useApp();

  if (currentUser?.role === 'staff') {
    return <Layout>Access Restricted. Only doctors and admins can view sessions.</Layout>;
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Scientific Sessions</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.length > 0 ? (
          sessions.map((s: any) => (
            <div key={s.id} className="bg-white p-4 rounded-lg shadow border-t-4 border-yellow-500">
              <h3 className="font-bold text-lg">{s.title}</h3>
              <p className="text-sm text-gray-600">{s.speaker}</p>
              <p className="text-sm font-semibold mt-2">{s.time} | {s.hall}</p>
              <div className="mt-2 bg-gray-100 p-2 rounded text-xs">{s.topic}</div>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No sessions scheduled yet.</div>
        )}
      </div>
    </Layout>
  );
}
