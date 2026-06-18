// ─────────────────────────────────────────────
// FILE: src/pages/Profile.tsx
// PURPOSE: Profile view displaying the user's name, thumbnail, role, and custom flight & hotel detail cards as a full timeline view.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from "react";
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { getLabel } from '../utils/labels';
import { displayPhone } from '../utils/phone';
import { readJSON } from '../utils/github';
import { formatTimeAmPm, splitAmPm } from '../utils/timezone';
import { isPushSupported, getExistingSubscription, subscribeUser, sendTestNotification } from "../utils/push";

// ─────────────────────────────────────────────
// DETAIL ROW COMPONENT (High-contrast label vs value typography)
// ─────────────────────────────────────────────
function DetailRow({
  label, value, isLink = false, href
}: {
  label: string; value: React.ReactNode;
  isLink?: boolean; href?: string;
}) {
  const isEmpty = value === undefined || value === null || value === "";
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 font-sans">
        {label}
      </span>
      {isEmpty ? (
        <span className="text-sm text-gray-300 italic font-sans">—</span>
      ) : isLink && href ? (
        <a href={href} target="_blank" rel="noopener noreferrer"
           className="text-sm font-semibold text-yellow-600 hover:text-yellow-700 hover:underline flex items-center gap-1 font-sans break-all">
          📍 View on Map <span className="text-xs">↗</span>
        </a>
      ) : (
        <span className="text-sm font-bold text-gray-800 font-sans">
          {value}
        </span>
      )}
    </div>
  );
}

export default function Profile() {
  const { currentUser, users, tripInfo, appConfig } = useApp();
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const viewAs = sessionStorage.getItem("euc_view_as");
  const displayUser = viewAs ? JSON.parse(viewAs) : currentUser;
  const fullUser = users.find(u => u.id === displayUser?.id) || displayUser;

  // Push Notification state
  const [pushSupported, setPushSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushSuccess, setPushSuccess] = useState<string | null>(null);

  // Check support and active subscription status on mount
  useEffect(() => {
    const supported = isPushSupported();
    setPushSupported(supported);
    if (supported) {
      getExistingSubscription()
        .then((sub) => {
          setIsSubscribed(!!sub);
        })
        .catch((err) => {
          console.error("Error fetching push subscription:", err);
        });
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!fullUser) return;
    setPushLoading(true);
    setPushError(null);
    setPushSuccess(null);

    const result = await subscribeUser(
      fullUser.id || fullUser.username,
      fullUser.username,
      fullUser.role
    );

    setPushLoading(false);
    if (result.success) {
      setIsSubscribed(true);
      setPushSuccess("Notifications enabled successfully!");
    } else {
      setPushError(result.error || "Failed to subscribe to push notifications.");
    }
  };

  const handleSendTestNotification = async () => {
    if (!fullUser) return;
    setPushLoading(true);
    setPushError(null);
    setPushSuccess(null);

    const result = await sendTestNotification(
      fullUser.id || fullUser.username,
      fullUser.username
    );

    setPushLoading(false);
    if (result.success) {
      setPushSuccess("Test notification request sent to server!");
    } else {
      setPushError(result.error || "Failed to send test notification.");
    }
  };

  const hasUserRoles = users.some(u => u.role);
  const showTestButton = !hasUserRoles || (fullUser?.role && fullUser.role.toLowerCase() === "admin");

  // Fetch full schedule details dynamically on mount
  useEffect(() => {
    readJSON("schedule.json")
      .then(setScheduleItems)
      .catch(() => setScheduleItems([]));
  }, []);

  // Helper to render split AM/PM beautifully
  function renderTimeWithSplitAmPm(timeStr: string) {
    if (!timeStr) return "";
    const formatted = formatTimeAmPm(timeStr);
    const { digits, period } = splitAmPm(formatted);
    return (
      <span className="inline-flex items-center text-sm font-bold text-gray-800">
        {digits}
        {period && (
          <span className="text-xs font-semibold ml-0.5 text-amber-500 tracking-wide leading-tight">
            {period}
          </span>
        )}
      </span>
    );
  }

  if (!fullUser) return <Layout>Loading...</Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6 text-gray-900">{getLabel(appConfig, "profile")}</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
        <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-6 space-y-4 sm:space-y-0 pb-6 border-b border-gray-100">
          {(fullUser.photoUrl || fullUser.photo) ? (
            <img 
              src={fullUser.photoUrl || fullUser.photo} 
              className="w-24 h-24 rounded-full shadow-sm border border-gray-200 object-cover" 
              alt="Profile" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                e.currentTarget.nextElementSibling?.classList.add('flex');
              }}
              referrerPolicy="no-referrer"
            />
          ) : null}
          <div className={`${(fullUser.photoUrl || fullUser.photo) ? 'hidden' : 'flex'} w-24 h-24 bg-yellow-400 items-center justify-center rounded-full font-bold text-black border border-gray-200 text-3xl shadow-sm`}>
            {fullUser.name ? fullUser.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900">{fullUser.name}</h2>
            <p className="text-yellow-600 font-semibold tracking-wide text-sm mt-1">{fullUser.role.toUpperCase()}</p>
            {fullUser?.phone && (
              <p className="text-sm text-gray-600 mt-2 font-sans">
                📞 {displayPhone(fullUser.phone)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* PUSH NOTIFICATIONS MANAGEMENT */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-2 font-sans flex items-center gap-2">
          🔔 Push Notifications
        </h3>
        <p className="text-xs text-gray-500 mb-4 font-sans leading-relaxed">
          Stay updated instantly with flight announcements, hotel details, and schedule milestones. Enabled notifications will deliver updates directly to your screen.
        </p>

        {!pushSupported ? (
          <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg font-sans border border-amber-100">
            ⚠ Push notifications are not supported by this browser. Please ensure you are viewing over HTTPS and that your browser supports Service Workers.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleEnableNotifications}
                disabled={pushLoading}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer ${
                  isSubscribed 
                    ? "border border-emerald-500 text-emerald-800 bg-emerald-50 hover:bg-emerald-100" 
                    : "bg-yellow-400 text-black hover:bg-yellow-500 hover:shadow"
                }`}
              >
                {pushLoading ? "Processing..." : isSubscribed ? "✓ Notifications Enabled" : "Enable Notifications"}
              </button>

              {showTestButton && (
                <button
                  type="button"
                  onClick={handleSendTestNotification}
                  disabled={pushLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 transition shadow-sm cursor-pointer"
                >
                  Send Test Notification
                </button>
              )}
            </div>

            {pushSuccess && (
              <p className="text-xs text-emerald-600 font-semibold font-sans mt-1">
                ✓ {pushSuccess}
              </p>
            )}
            {pushError && (
              <p className="text-xs text-red-600 font-semibold font-sans mt-1">
                ⚠ {pushError}
              </p>
            )}
          </div>
        )}
      </div>



      {/* COMPREHENSIVE DYNAMIC TRAVEL & LODGING LOGISTICS SECTION (System 1) */}
      <div className="pb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 mt-6 block">
          Trip Details
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scheduleItems.length > 0 ? (
            scheduleItems.map(item => (
              <div key={item.id}
                   className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-2">

                {/* Card header */}
                <div className="bg-black px-5 py-3 flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm">{item.title}</h3>
                  <span className="text-[10px] bg-yellow-400 text-black px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                    {item.type}
                  </span>
                </div>

                {/* Card body */}
                <div className="px-5 py-2">
                  {item.type === "flight" && (
                    <>
                      <DetailRow label="Flight Number"
                        value={item.details?.flightNumber || ""} />
                      <DetailRow label="Date"
                        value={item.details?.date
                          ? new Date(item.details.date).toLocaleDateString("en-GB", {
                              weekday: "long", year: "numeric",
                              month: "long", day: "numeric"
                            })
                          : ""}
                      />
                      <DetailRow label="Departure Time"
                        value={renderTimeWithSplitAmPm(item.details?.time || "")} />
                      <DetailRow label="Departure Airport"
                        value={item.details?.departureAirport || ""} />
                      <DetailRow label="Departure Location"
                        value={item.details?.departureAirportLocation || ""}
                        isLink={true}
                        href={item.details?.departureAirportLocation} />
                      <DetailRow label="Terminal"
                        value={item.details?.departureTerminal || ""} />
                      <DetailRow label="Gate"
                        value={item.details?.departureGate || ""} />
                      <DetailRow label="Arrival Airport"
                        value={item.details?.arrivalAirport || ""} />
                      <DetailRow label="Arrival Location"
                        value={item.details?.arrivalAirportLocation || ""}
                        isLink={true}
                        href={item.details?.arrivalAirportLocation} />
                    </>
                  )}
                  {item.type === "hotel" && (
                    <>
                      <DetailRow label="Hotel Name"
                        value={item.details?.hotelName || ""} />
                      <DetailRow label="Check-In Date"
                        value={item.details?.checkInDate
                          ? new Date(item.details.checkInDate).toLocaleDateString("en-GB", {
                              weekday: "long", year: "numeric",
                              month: "long", day: "numeric"
                            })
                          : ""}
                      />
                      <DetailRow label="Check-In Time"
                        value={renderTimeWithSplitAmPm(item.details?.checkInTime || "")} />
                      <DetailRow label="Check-Out Date"
                        value={item.details?.checkOutDate
                          ? new Date(item.details.checkOutDate).toLocaleDateString("en-GB", {
                              weekday: "long", year: "numeric",
                              month: "long", day: "numeric"
                            })
                          : ""}
                      />
                      <DetailRow label="Check-Out Time"
                        value={renderTimeWithSplitAmPm(item.details?.checkOutTime || "")} />
                      <DetailRow label="Address"
                        value={item.details?.address || ""} />
                      <DetailRow label="Google Maps"
                        value={item.details?.googleMapLocation || ""}
                        isLink={true}
                        href={item.details?.googleMapLocation} />
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 text-center bg-gray-50 border border-dashed rounded-xl text-gray-400 font-bold italic font-sans border-gray-200">
              No trip lodging/flight details assigned is available yet.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
