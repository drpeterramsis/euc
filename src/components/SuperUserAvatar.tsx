import React from "react";

interface SuperUserAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm:  "w-8 h-8 text-base",
  md:  "w-10 h-10 text-lg",
  lg:  "w-16 h-16 text-3xl",
  xl:  "w-full h-full text-5xl",
};

/**
 * Renders a stylized, beautiful shield avatar badge for Super User.
 */
export function SuperUserAvatar({ size = "md", className = "" }: SuperUserAvatarProps) {
  return (
    <div
      className={`
        ${sizeMap[size]}
        rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600
        flex items-center justify-center
        ring-2 ring-yellow-300 shadow-md flex-shrink-0
        ${className}
      `}
      title="Super User"
    >
      🛡️
    </div>
  );
}
