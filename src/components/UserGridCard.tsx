import React from 'react';
import { SuperUserAvatar } from './SuperUserAvatar';

interface UserGridCardProps {
  key?: any;
  user: any;
  onView: (user: any) => void;
  onEdit: (user: any) => void;
  onDelete: (id: string) => void;
}

export default function UserGridCard({ user, onView, onEdit, onDelete }: UserGridCardProps) {
  const photo = user.photoUrl || user.photo;
  const isAdminWithoutPhoto = user.role === "admin" && !photo;

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col font-sans"
      style={{ height: "320px" }} // Fixed total card height to ensure perfect alignment
    >
      {/* Photo Area — fixed height h-48 = 192px */}
      {isAdminWithoutPhoto ? (
        <div className="relative w-full h-48 bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <SuperUserAvatar size="xl" />
          <span className="absolute top-2 right-2 text-xs font-black px-2 py-0.5 rounded-full bg-yellow-400 text-black uppercase tracking-wide">
            ADMIN
          </span>
        </div>
      ) : (
        <div className="relative w-full h-48 bg-gray-100 flex-shrink-0 overflow-hidden">
          {photo ? (
            <img
              src={photo}
              alt={user.name}
              className="w-full h-full object-cover object-center"
              onError={e => {
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          
          {/* Fallback space when photo is missing or fails to load */}
          {user.role === "admin" ? (
            <div
              className="absolute inset-0 w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-4xl"
              style={{ display: photo ? "none" : "flex" }}
              title="Super User"
            >
              🛡️
            </div>
          ) : (
            <div
              className="absolute inset-0 w-full h-full bg-yellow-400 flex items-center justify-center text-black font-bold text-5xl animate-fade-in"
              style={{ display: photo ? "none" : "flex" }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Role badge overlay top-right */}
          <span className="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full bg-black/60 text-white uppercase tracking-wider">
            {user.role}
          </span>
        </div>
      )}

      {/* Info section — flex-1 fills remaining space, truncation ensures perfectly robust UI */}
      <div className="p-3 flex flex-col gap-0.5 flex-1 min-h-0 overflow-hidden">
        <p className="font-semibold text-gray-900 text-sm leading-tight truncate whitespace-nowrap overflow-hidden" title={user.name}>
          {user.name}
        </p>
        <p className="text-xs text-gray-500 truncate whitespace-nowrap overflow-hidden" title={user.username}>
          {user.username}
        </p>
        <div className="flex items-center gap-1 mt-auto flex-shrink-0">
          <span className={`w-2 h-2 rounded-full ${user.isActive !== false ? 'bg-green-400' : 'bg-red-400'} inline-block flex-shrink-0`} />
          <span className="text-xs text-gray-500">{user.isActive !== false ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      {/* Icon-only action buttons — fixed height at bottom */}
      <div className="border-t border-gray-100 flex divide-x divide-gray-100 flex-shrink-0">
        <button
          onClick={() => onView(user)}
          className="flex-1 py-2.5 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition text-base"
          title="View"
        >
          👁
        </button>
        <button
          onClick={() => onEdit(user)}
          className="flex-1 py-2.5 flex items-center justify-center text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 transition text-base"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(user.id)}
          className="flex-1 py-2.5 flex items-center justify-center text-red-500 hover:text-red-650 hover:bg-red-50 transition text-base"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
