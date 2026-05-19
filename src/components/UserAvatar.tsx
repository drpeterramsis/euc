import React from "react";
import { SuperUserAvatar } from "./SuperUserAvatar";

interface User {
  role: string;
  name?: string;
  username?: string;
  photoUrl?: string;
  photo?: string;
}

interface UserAvatarProps {
  user: User | null | any;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm:  "w-8 h-8 text-xs sm:text-sm",
  md:  "w-10 h-10 text-sm sm:text-base",
  lg:  "w-16 h-16 text-2xl",
  xl:  "w-full h-full text-5xl",
};

/**
 * Highly polished and unified avatar component to render standard user photos,
 * the admin's custom Super User shield, or an elegant initials fallback.
 */
export default function UserAvatar({ user, size = "md", className = "" }: UserAvatarProps) {
  if (!user) {
    return (
      <div className={`${sizeMap[size]} rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold flex-shrink-0 ${className}`}>
        U
      </div>
    );
  }

  const hasPhotoUrl = user.photoUrl || user.photo;

  // Render Super User avatar for admin role when they do not have a custom profile picture
  if (user.role === "admin" && !hasPhotoUrl) {
    return <SuperUserAvatar size={size} className={className} />;
  }

  // Calculate initials
  let initials = "U";
  if (user.name) {
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      initials = parts[0].substring(0, 2).toUpperCase();
    }
  } else if (user.username) {
    initials = user.username.substring(0, 2).toUpperCase();
  }

  if (hasPhotoUrl) {
    return (
      <div className={`${sizeMap[size]} rounded-full overflow-hidden flex-shrink-0 relative ${className}`}>
        <img
          src={hasPhotoUrl}
          alt={user.name || "User Avatar"}
          className="w-full h-full object-cover object-center"
          onError={e => {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.display = "flex";
            }
          }}
        />
        {/* Fallback space-conscious initials */}
        <div
          className="absolute inset-0 w-full h-full bg-yellow-400 items-center justify-center text-black font-bold hidden border border-gray-200 rounded-full"
        >
          {initials}
        </div>
      </div>
    );
  }

  // Render initials badge if user has no photo
  return (
    <div
      className={`
        ${sizeMap[size]} rounded-full bg-yellow-400
        flex items-center justify-center
        text-black font-black flex-shrink-0 border border-gray-200
        ${className}
      `}
    >
      {initials}
    </div>
  );
}
