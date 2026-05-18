/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';

/**
 * Schedule component renders the trip schedule timeline.
 */
export default function Schedule() {
  const { schedule, currentUser } = useApp();

  const filtered = schedule.filter((item: any) => 
    item.accessRoles.includes(currentUser?.role) || 
    item.accessUserIds.includes(currentUser?.id)
  );

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Trip Schedule</h1>
      <div className="space-y-6">
        {filtered.length > 0 ? (
          filtered.map((day: any) => (
            <div key={day.id} className="bg-white p-6 rounded-lg shadow">
              <h2 className="font-bold text-lg mb-4 text-yellow-600">{day.date}: {day.title}</h2>
              <div className="space-y-4">
                {day.items.map((item: any, i: number) => (
                    <div key={i} className="border-l-2 border-gray-200 pl-4 py-1">
                        <div className="font-semibold">{item.time} - {item.activity}</div>
                        <div className="text-sm text-gray-500">{item.location}</div>
                    </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No schedule available yet.</div>
        )}
      </div>
    </Layout>
  );
}
