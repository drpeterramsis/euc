import React from "react";

interface DirectoryCardProps {
  key?: any;
  user: any;
}

export function DirectoryCard({ user }: DirectoryCardProps) {
  const photo = user.photoUrl || user.photo;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm
                    overflow-hidden flex flex-col font-sans"
         style={{ height: "300px" }}>

      {/* Photo — fixed height, cropped */}
      <div className="relative w-full h-44 bg-gray-100 flex-shrink-0 overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={user.name}
            className="w-full h-full object-cover object-center"
            onError={e => {
              e.currentTarget.style.display = "none";
              const fb = e.currentTarget.nextElementSibling as HTMLElement;
              if (fb) fb.style.display = "flex";
            }}
          />
        ) : null}
        {/* Fallback initials */}
        <div
          className="w-full h-full bg-yellow-400 items-center justify-center
                     text-black font-bold text-4xl"
          style={{ display: photo ? "none" : "flex" }}
        >
          {user.name?.charAt(0).toUpperCase()}
        </div>
        {/* Role badge */}
        <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5
                         rounded-full bg-black/60 text-white uppercase tracking-wide">
          {user.role}
        </span>
      </div>

      {/* Info — read only */}
      <div className="p-3 flex flex-col gap-0.5 flex-1 min-h-0 overflow-hidden">

        {/* Name */}
        <p className="font-semibold text-gray-900 text-sm leading-tight
                      truncate whitespace-nowrap overflow-hidden">
          {user.name}
        </p>

        {/* Title (e.g. "Consultant Urologist") — if available */}
        {user.title && (
          <p className="text-xs text-yellow-600 font-medium truncate">
            {user.title}
          </p>
        )}

        {/* Phone — if available */}
        {user.phone && (
          <a
            href={`tel:${user.phone}`}
            className="text-xs text-gray-500 hover:text-yellow-500
                       transition-colors truncate mt-auto"
          >
            📞 {user.phone}
          </a>
        )}

        {/* Email — if available */}
        {user.email && (
          <a
            href={`mailto:${user.email}`}
            className="text-xs text-gray-500 hover:text-yellow-500
                       transition-colors truncate"
          >
            ✉️ {user.email}
          </a>
        )}

      </div>
    </div>
  );
}
