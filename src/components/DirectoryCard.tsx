import React from "react";
import { callHref, whatsappHref, displayPhone } from "../utils/phone";

interface DirectoryCardProps {
  key?: any;
  user: any;
  currentUser: any;
}

export function DirectoryCard({ user, currentUser }: DirectoryCardProps) {
  const photo = user.photoUrl || user.photo;

  // Determine if contact buttons and contact info should show
  // Admin & Staff -> view all
  // Doctor -> view staff only, not other doctors
  const canContact = (() => {
    if (!user.phone) return false; // no phone = no buttons/details ever
    if (!currentUser) return false; // guard if undefined
    if (currentUser.role === "admin") return true;   // admin sees all
    if (currentUser.role === "staff") return true;   // staff sees all
    if (currentUser.role === "doctor") {
      return user.role === "staff"; // doctors only see staff contact
    }
    return false;
  })();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm
                    overflow-hidden flex flex-col font-sans"
         style={{ height: canContact ? "340px" : "300px" }}>

      {/* Photo — dynamic height depending on contact actions */}
      <div className={`relative w-full flex-shrink-0 overflow-hidden bg-gray-100 ${canContact ? "h-40" : "h-44"}`}>
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

      {/* Info — read only, layout shifts properly */}
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

        {/* Phone — display only if available & contactable (properly formatted) */}
        {user.phone && canContact && (
          <p className="text-xs text-gray-500 truncate mt-auto">
            📞 {displayPhone(user.phone)}
          </p>
        )}

        {/* Email — if available */}
        {user.email && (
          <a
            href={`mailto:${user.email}`}
            className={`text-xs text-gray-500 hover:text-yellow-500 transition-colors truncate ${!canContact ? "mt-auto" : ""}`}
          >
            ✉️ {user.email}
          </a>
        )}

        {/* Contact buttons block — only renders when canContact === true */}
        {canContact && user.phone && (
          <div className="flex gap-2 mt-2 flex-shrink-0">
            {/* Phone Call button using calling utility helper */}
            <a
              href={callHref(user.phone)}
              className="flex-1 inline-flex items-center justify-center gap-1
                         bg-blue-500 hover:bg-blue-600
                         text-white font-semibold text-xs
                         py-1.5 rounded-lg transition-colors cursor-pointer"
              title={`Call ${user.name}`}
            >
              📞 Call
            </a>

            {/* WhatsApp button using whatsapp utility helper (digits only, no '+' sign) */}
            <a
              href={whatsappHref(user.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1
                         bg-green-500 hover:bg-green-600
                         text-white font-semibold text-xs
                         py-1.5 rounded-lg transition-colors cursor-pointer"
              title={`WhatsApp ${user.name}`}
            >
              💬 Chat
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
