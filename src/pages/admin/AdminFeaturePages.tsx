import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPlaceholder from "./AdminPlaceholder";
import { useApp } from "../../context/AppContext";
import { githubUpdateFile } from "../../utils/github";

export const AdminUsers = () => {
  const { users, updateUsers } = useApp() as any;
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const toggleActive = async (userId: string, currentStatus: boolean) => {
    setLoadingId(userId);
    try {
      const updatedUsers = users.map((u: any) =>
        u.id === userId
          ? { ...u, active: !currentStatus, revoked: currentStatus }
          : u,
      );
      updateUsers(updatedUsers);
      await githubUpdateFile(
        "data/users.json",
        JSON.stringify(updatedUsers, null, 2),
        `Toggle active status for user ${userId}`,
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update user status.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 min-h-[44px] min-w-[44px] pr-2"
        >
          ← Admin Panel
        </button>
        <span className="text-gray-300">|</span>
        <h1 className="text-sm font-semibold text-gray-700 truncate">Users</h1>
      </div>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">User Management</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {users.map((u: any) => (
            <div
              key={u.id}
              className="p-4 border-b border-gray-100 flex items-center justify-between"
            >
              <div>
                <p className="font-bold">{u.name}</p>
                <p className="text-xs text-gray-500">
                  @{u.username} — {u.role}
                </p>
              </div>
              <button
                onClick={() =>
                  toggleActive(u.id, u.active !== false && u.revoked !== true)
                }
                disabled={loadingId === u.id}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  u.active !== false && u.revoked !== true
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {loadingId === u.id
                  ? "Updating..."
                  : u.active !== false && u.revoked !== true
                    ? "Active"
                    : "Revoked"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AdminPosts = () => <AdminPlaceholder title="Gallery" />;
export const AdminCategories = () => (
  <AdminPlaceholder title="Post Categories" />
);
export const AdminSessions = () => (
  <AdminPlaceholder title="Conference Sessions" />
);
export const AdminTripSchedule = () => <AdminPlaceholder title="Schedule" />;
export const AdminFlightHotel = () => (
  <AdminPlaceholder title="Flight & Hotel Logistics" />
);
export const AdminCountdown = () => (
  <AdminPlaceholder title="Countdown & Timeline" />
);
export const AdminMedia = () => <AdminPlaceholder title="Media & Gallery" />;
export const AdminDirectory = () => (
  <AdminPlaceholder title="Staff Directory" />
);
export const AdminSettings = () => <AdminPlaceholder title="App Settings" />;
export const AdminAppearance = () => <AdminPlaceholder title="Appearance" />;
