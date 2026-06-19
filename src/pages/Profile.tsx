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
import { MapPhoto } from "../components/MapPhoto";

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

  // Construct dynamic trip details from user's personalized tickets & travel details
  useEffect(() => {
    if (!fullUser) return;

    const items: any[] = [];

    // Outbound flight (if exists/has flight number or booking reference or departure info)
    if (
      fullUser.flightDetails?.departure?.flightNumber || 
      fullUser.flightDetails?.bookingReference ||
      fullUser.flightDetails?.departure?.departureAirport ||
      fullUser.flightDetails?.departure?.arrivalAirport
    ) {
      items.push({
        id: "outbound-flight-dynamic",
        title: "Outbound Flight (Trip 1)",
        type: "flight",
        details: {
          flightNumber: fullUser.flightDetails?.departure?.flightNumber || fullUser.flightDetails?.airlineCode || "—",
          date: fullUser.flightDetails?.departure?.date || "",
          time: fullUser.flightDetails?.departure?.time || "",
          departureAirport: fullUser.flightDetails?.departure?.departureAirport || "",
          departureAirportLocation: fullUser.flightDetails?.departure?.departureAirportLink || "",
          departureTerminal: fullUser.flightDetails?.departure?.terminal || "",
          departureGate: fullUser.flightDetails?.departure?.gate || "",
          arrivalAirport: fullUser.flightDetails?.departure?.arrivalAirport || "",
          arrivalAirportLocation: fullUser.flightDetails?.departure?.arrivalAirportLink || "",
          arrivalTerminal: fullUser.flightDetails?.departure?.arrivalTerminal || "",
          arrivalGate: fullUser.flightDetails?.departure?.arrivalGate || "",
          arrivalDate: fullUser.flightDetails?.departure?.arrivalDate || "",
          arrivalTime: fullUser.flightDetails?.departure?.arrivalTime || "",
          duration: fullUser.flightDetails?.departure?.duration || fullUser.flightDetails?.duration || "",
          aircraft: fullUser.flightDetails?.departure?.aircraft || fullUser.flightDetails?.aircraft || "",
          baggage: fullUser.flightDetails?.departure?.baggage || fullUser.flightDetails?.baggageAllowance || "2 Piece(s)",
          meal: fullUser.flightDetails?.departure?.meal || fullUser.flightDetails?.meal || "Meal",
          cabinClass: fullUser.flightDetails?.departure?.cabinClass || fullUser.flightDetails?.cabinClass || "Economy",
          bookingStatus: fullUser.flightDetails?.departure?.bookingStatus || fullUser.flightDetails?.bookingStatus || "Confirmed",
          frequentFlyerNumber: fullUser.flightDetails?.departure?.frequentFlyerNumber || fullUser.flightDetails?.frequentFlyerNumber || "",
          bookingReference: fullUser.flightDetails?.bookingReference || "",
          ticketNumber: fullUser.flightDetails?.ticketNumber || "",
          documentIssueDate: fullUser.flightDetails?.documentIssueDate || "",
          airlineCode: fullUser.flightDetails?.airlineCode || "",
        }
      });
    }

    // Return flight (if exists)
    if (
      fullUser.flightDetails?.arrival?.flightNumber || 
      fullUser.flightDetails?.bookingReference ||
      fullUser.flightDetails?.arrival?.departureAirport ||
      fullUser.flightDetails?.arrival?.arrivalAirport
    ) {
      items.push({
        id: "return-flight-dynamic",
        title: "Return Flight (Trip 2)",
        type: "flight",
        details: {
          flightNumber: fullUser.flightDetails?.arrival?.flightNumber || fullUser.flightDetails?.airlineCode || "—",
          date: fullUser.flightDetails?.arrival?.date || "",
          time: fullUser.flightDetails?.arrival?.time || "",
          departureAirport: fullUser.flightDetails?.arrival?.departureAirport || "",
          departureAirportLocation: fullUser.flightDetails?.arrival?.departureAirportLink || "",
          departureTerminal: fullUser.flightDetails?.arrival?.terminal || "",
          departureGate: fullUser.flightDetails?.arrival?.gate || "",
          arrivalAirport: fullUser.flightDetails?.arrival?.arrivalAirport || "",
          arrivalAirportLocation: fullUser.flightDetails?.arrival?.arrivalAirportLink || "",
          arrivalTerminal: fullUser.flightDetails?.arrival?.arrivalTerminal || "",
          arrivalGate: fullUser.flightDetails?.arrival?.arrivalGate || "",
          arrivalDate: fullUser.flightDetails?.arrival?.arrivalDate || "",
          arrivalTime: fullUser.flightDetails?.arrival?.arrivalTime || "",
          duration: fullUser.flightDetails?.arrival?.duration || fullUser.flightDetails?.duration || "",
          aircraft: fullUser.flightDetails?.arrival?.aircraft || fullUser.flightDetails?.aircraft || "",
          baggage: fullUser.flightDetails?.arrival?.baggage || fullUser.flightDetails?.baggageAllowance || "2 Piece(s)",
          meal: fullUser.flightDetails?.arrival?.meal || fullUser.flightDetails?.meal || "Meal",
          cabinClass: fullUser.flightDetails?.arrival?.cabinClass || fullUser.flightDetails?.cabinClass || "Economy",
          bookingStatus: fullUser.flightDetails?.arrival?.bookingStatus || fullUser.flightDetails?.bookingStatus || "Confirmed",
          frequentFlyerNumber: fullUser.flightDetails?.arrival?.frequentFlyerNumber || fullUser.flightDetails?.frequentFlyerNumber || "",
          bookingReference: fullUser.flightDetails?.bookingReference || "",
          ticketNumber: fullUser.flightDetails?.ticketNumber || "",
          documentIssueDate: fullUser.flightDetails?.documentIssueDate || "",
          airlineCode: fullUser.flightDetails?.airlineCode || "",
        }
      });
    }

    // Hotel (if exists)
    if (fullUser.hotel?.name) {
      items.push({
        id: "hotel-lodging-dynamic",
        title: "Hotel & Lodging",
        type: "hotel",
        details: {
          hotelName: fullUser.hotel.name,
          address: fullUser.hotel.address || "",
          checkInDate: fullUser.hotel.checkIn || "",
          checkOutDate: fullUser.hotel.checkOut || "",
          roomNumber: fullUser.hotel.roomNumber || "",
          googleMapLocation: fullUser.hotel.mapsLink || "",
          checkInTime: "14:00",
          checkOutTime: "11:00 AM",
        }
      });
    }

    // Transfers / Shuttles (if any)
    if (fullUser.transfers && fullUser.transfers.length > 0) {
      fullUser.transfers.forEach((tr: any, idx: number) => {
        items.push({
          id: `transfer-dynamic-${idx}`,
          title: tr.title || tr.name || `Personal Transfer — Trip segment ${idx + 1}`,
          type: "transfer",
          details: {
            serviceType: tr.type || "Shuttle",
            date: tr.date || "",
            time: tr.time || "",
            pickup: tr.pickup || "",
            dropoff: tr.dropoff || "",
            provider: tr.provider || "",
            contact: tr.contact || "",
            notes: tr.notes || "",
          }
        });
      });
    }

    // Fallback to schedule.json if absolutely nothing is personalized for the user
    if (items.length === 0) {
      readJSON("schedule.json")
        .then(setScheduleItems)
        .catch(() => setScheduleItems([]));
    } else {
      setScheduleItems(items);
    }
  }, [fullUser]);

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
      <div className="pb-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 mt-6 block">
          🎫 My Personalized Tickets & Travel Logistics
        </p>

        {(!fullUser.flightDetails && !fullUser.hotel) ? (
          <div className="py-8 px-6 text-center bg-gray-50 border border-dashed rounded-xl text-gray-400 font-bold italic font-sans border-gray-200 mb-8">
            No personalized flight ticket or hotel details have been assigned to your account yet. Contact the organizer to update your parameters.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            {/* TRIP 1: OUTBOUND FLIGHT */}
            {(fullUser.flightDetails?.departure?.flightNumber || fullUser.flightDetails?.bookingReference) && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-150 overflow-hidden flex flex-col justify-between">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-5 py-3.5 flex items-center justify-between text-black">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛫</span>
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wide">Outbound Flight (Trip 1)</h3>
                      <p className="text-[10px] font-semibold opacity-75">To Prague: Prague Vaclav Havel Airport (PRG)</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-black text-yellow-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest font-mono">
                    {fullUser.flightDetails?.departure?.bookingStatus || fullUser.flightDetails?.bookingStatus || "Confirmed"}
                  </span>
                </div>

                <div className="p-5 space-y-5">
                  {/* General Ticket Data Dashboard */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Booking PNR</span>
                      <span className="text-xs font-extrabold text-gray-800 font-mono tracking-wide">{fullUser.flightDetails?.bookingReference || "—"}</span>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Ticket Number</span>
                      <span className="text-xs font-extrabold text-gray-800 font-mono break-all">{fullUser.flightDetails?.ticketNumber || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Class / Aircraft</span>
                      <span className="text-xs font-bold text-gray-700">{fullUser.flightDetails?.departure?.cabinClass || fullUser.flightDetails?.cabinClass || "Economy"} ({fullUser.flightDetails?.departure?.aircraft || fullUser.flightDetails?.aircraft || "—"})</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Airline Code</span>
                      <span className="text-xs font-bold text-gray-750 font-mono">{fullUser.flightDetails?.airlineCode || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Issue Date</span>
                      <span className="text-xs font-bold text-gray-750">{fullUser.flightDetails?.documentIssueDate || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Frequent Flyer</span>
                      <span className="text-xs font-semibold text-gray-750 font-mono break-all">{fullUser.flightDetails?.departure?.frequentFlyerNumber || fullUser.flightDetails?.frequentFlyerNumber || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Flight Number</span>
                      <span className="text-xs font-black text-amber-600 font-mono">{fullUser.flightDetails?.departure?.flightNumber || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Booking Status</span>
                      <span className="text-xs font-semibold text-green-700">{fullUser.flightDetails?.departure?.bookingStatus || fullUser.flightDetails?.bookingStatus || "Confirmed"}</span>
                    </div>
                  </div>

                  {/* SEPARATED DEPARTURE & ARRIVAL DETAILS IN TIMELINE */}
                  <div className="space-y-4 relative">
                    {/* Visual dashed connecting line */}
                    <div className="absolute left-6 top-8 bottom-8 w-0.5 border-l-2 border-dashed border-gray-200"></div>

                    {/* DEPARTURE SECTION */}
                    <div className="relative flex gap-4 p-4 rounded-xl border border-rose-100 bg-rose-50/10 hover:bg-rose-50/20 transition duration-150">
                      <div className="h-12 w-12 shrink-0 bg-gradient-to-br from-rose-500 to-rose-600 rounded-full flex items-center justify-center text-white shadow-sm z-10 font-sans">
                        <span className="text-xl">🛫</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold tracking-wider text-rose-700 bg-rose-100/50 px-2.5 py-0.5 rounded uppercase font-sans">
                            Departure Wing
                          </span>
                          <span className="text-[10px] font-mono font-bold text-gray-400">CAI</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-extrabold text-gray-850">
                            {fullUser.flightDetails?.departure?.departureAirportLink ? (
                              <a
                                href={fullUser.flightDetails.departure.departureAirportLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-600 hover:text-amber-700 underline inline-flex items-center gap-1 font-sans"
                              >
                                {fullUser.flightDetails?.departure?.departureAirport || "Cairo International (CAI)"} ↗
                              </a>
                            ) : (
                              fullUser.flightDetails?.departure?.departureAirport || "Cairo International (CAI)"
                            )}
                          </p>
                          <p className="text-sm font-bold text-gray-700">
                            📅 {fullUser.flightDetails?.departure?.date ? new Date(fullUser.flightDetails.departure.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—"}
                          </p>
                          <p className="text-lg font-black text-gray-900 flex items-center gap-1 font-mono">
                            ⏰ {fullUser.flightDetails?.departure?.time || "—"}
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-normal font-sans">(Cairo Local Time)</span>
                          </p>
                        </div>
                        <div className="flex gap-2 text-xs pt-1">
                          <span className="bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600 font-semibold shadow-xs">
                            Terminal: <strong className="text-gray-900">{fullUser.flightDetails?.departure?.terminal || "3"}</strong>
                          </span>
                          {fullUser.flightDetails?.departure?.gate && (
                            <span className="bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600 font-semibold shadow-xs">
                              Gate: <strong className="text-gray-900">{fullUser.flightDetails.departure.gate}</strong>
                            </span>
                          )}
                        </div>
                        {fullUser.flightDetails?.departure?.departureAirportLink && (
                          <div className="mt-2.5">
                            <MapPhoto 
                              url={fullUser.flightDetails.departure.departureAirportLink} 
                              alt={fullUser.flightDetails.departure.departureAirport || "Departure Airport"} 
                              className="w-full h-32 object-cover rounded-lg shadow-inner border border-rose-100"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DURATION INTERSTITIAL */}
                    <div className="pl-16 flex items-center">
                      <span className="text-[10px] font-extrabold px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-amber-600 uppercase font-sans tracking-wider">
                        ⏱ Flight Duration: {fullUser.flightDetails?.departure?.duration || fullUser.flightDetails?.duration || "03:55 (Non stop)"}
                      </span>
                    </div>

                    {/* ARRIVAL SECTION */}
                    <div className="relative flex gap-4 p-4 rounded-xl border border-emerald-100 bg-emerald-50/10 hover:bg-emerald-50/20 transition duration-150 font-sans">
                      <div className="h-12 w-12 shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-sm z-10">
                        <span className="text-xl">🛬</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between font-sans">
                          <span className="text-[10px] font-extrabold tracking-wider text-emerald-700 bg-emerald-100/50 px-2.5 py-0.5 rounded uppercase">
                            Arrival Wing
                          </span>
                          <span className="text-[10px] font-mono font-bold text-gray-400">PRG</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-extrabold text-gray-850">
                            {fullUser.flightDetails?.departure?.arrivalAirportLink ? (
                              <a
                                href={fullUser.flightDetails.departure.arrivalAirportLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 underline inline-flex items-center gap-1"
                              >
                                {fullUser.flightDetails?.departure?.arrivalAirport || "Prague Vaclav Havel (PRG)"} ↗
                              </a>
                            ) : (
                              fullUser.flightDetails?.departure?.arrivalAirport || "Prague Vaclav Havel (PRG)"
                            )}
                          </p>
                          <p className="text-sm font-bold text-gray-700">
                            📅 {fullUser.flightDetails?.departure?.arrivalDate ? new Date(fullUser.flightDetails.departure.arrivalDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : (fullUser.flightDetails?.departure?.date ? new Date(fullUser.flightDetails.departure.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—")}
                          </p>
                          <p className="text-lg font-black text-gray-900 flex items-center gap-1 font-mono">
                            ⏰ {fullUser.flightDetails?.departure?.arrivalTime || "—"}
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-normal font-sans">(Prague Local Time)</span>
                          </p>
                        </div>
                        <div className="flex gap-2 text-xs pt-1">
                          <span className="bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600 font-semibold shadow-xs">
                            Terminal: <strong className="text-gray-900">{fullUser.flightDetails?.departure?.arrivalTerminal || "1"}</strong>
                          </span>
                          {fullUser.flightDetails?.departure?.arrivalGate && (
                            <span className="bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600 font-semibold shadow-xs">
                              Gate: <strong className="text-gray-900">{fullUser.flightDetails.departure.arrivalGate}</strong>
                            </span>
                          )}
                        </div>
                        {fullUser.flightDetails?.departure?.arrivalAirportLink && (
                          <div className="mt-2.5">
                            <MapPhoto 
                              url={fullUser.flightDetails.departure.arrivalAirportLink} 
                              alt={fullUser.flightDetails.departure.arrivalAirport || "Arrival Airport"} 
                              className="w-full h-32 object-cover rounded-lg shadow-inner border border-emerald-100"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Flight Preferences Footer Line */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap justify-between items-center text-xs text-gray-600 gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[10px] text-gray-400 uppercase tracking-wider">Pass Preferences:</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-bold text-gray-750">🍽 {fullUser.flightDetails?.departure?.meal || fullUser.flightDetails?.meal || "Meal"}</span>
                      <span className="bg-gray-100 px-2.5 py-0.5 rounded text-[11px] font-bold text-gray-750">💼 {fullUser.flightDetails?.departure?.baggage || fullUser.flightDetails?.baggageAllowance || "2 Piece(s)"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TRIP 2: RETURN FLIGHT */}
            {(fullUser.flightDetails?.arrival?.flightNumber || fullUser.flightDetails?.bookingReference) && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-150 overflow-hidden flex flex-col justify-between">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-5 py-3.5 flex items-center justify-between text-black">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛫</span>
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wide">Return Flight (Trip 2)</h3>
                      <p className="text-[10px] font-semibold opacity-75">Return Journey: Departure From Prague (PRG)</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-black text-yellow-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest font-mono">
                    {fullUser.flightDetails?.arrival?.bookingStatus || fullUser.flightDetails?.bookingStatus || "Confirmed"}
                  </span>
                </div>

                <div className="p-5 space-y-5">
                  {/* General Ticket Data Dashboard */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Booking PNR</span>
                      <span className="text-xs font-extrabold text-gray-800 font-mono tracking-wide">{fullUser.flightDetails?.bookingReference || "—"}</span>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Ticket Number</span>
                      <span className="text-xs font-extrabold text-gray-800 font-mono break-all">{fullUser.flightDetails?.ticketNumber || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Class / Aircraft</span>
                      <span className="text-xs font-bold text-gray-700">{fullUser.flightDetails?.arrival?.cabinClass || fullUser.flightDetails?.cabinClass || "Economy"} ({fullUser.flightDetails?.arrival?.aircraft || fullUser.flightDetails?.aircraft || "—"})</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Airline Code</span>
                      <span className="text-xs font-bold text-gray-750 font-mono">{fullUser.flightDetails?.airlineCode || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Issue Date</span>
                      <span className="text-xs font-bold text-gray-750">{fullUser.flightDetails?.documentIssueDate || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Frequent Flyer</span>
                      <span className="text-xs font-semibold text-gray-750 font-mono break-all">{fullUser.flightDetails?.arrival?.frequentFlyerNumber || fullUser.flightDetails?.frequentFlyerNumber || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Flight Number</span>
                      <span className="text-xs font-black text-amber-600 font-mono">{fullUser.flightDetails?.arrival?.flightNumber || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Booking Status</span>
                      <span className="text-xs font-semibold text-green-700">{fullUser.flightDetails?.arrival?.bookingStatus || fullUser.flightDetails?.bookingStatus || "Confirmed"}</span>
                    </div>
                  </div>

                  {/* SEPARATED DEPARTURE & ARRIVAL DETAILS IN TIMELINE */}
                  <div className="space-y-4 relative">
                    {/* Visual dashed connecting line */}
                    <div className="absolute left-6 top-8 bottom-8 w-0.5 border-l-2 border-dashed border-gray-200"></div>

                    {/* DEPARTURE SECTION */}
                    <div className="relative flex gap-4 p-4 rounded-xl border border-rose-100 bg-rose-50/10 hover:bg-rose-50/20 transition duration-150">
                      <div className="h-12 w-12 shrink-0 bg-gradient-to-br from-rose-500 to-rose-600 rounded-full flex items-center justify-center text-white shadow-sm z-10 font-sans">
                        <span className="text-xl">🛫</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold tracking-wider text-rose-700 bg-rose-100/50 px-2.5 py-0.5 rounded uppercase font-sans">
                            Departure Wing
                          </span>
                          <span className="text-[10px] font-mono font-bold text-gray-400">PRG</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-extrabold text-gray-850">
                            {fullUser.flightDetails?.arrival?.departureAirportLink ? (
                              <a
                                href={fullUser.flightDetails.arrival.departureAirportLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-600 hover:text-amber-700 underline inline-flex items-center gap-1 font-sans"
                              >
                                {fullUser.flightDetails?.arrival?.departureAirport || "Prague Vaclav Havel (PRG)"} ↗
                              </a>
                            ) : (
                              fullUser.flightDetails?.arrival?.departureAirport || "Prague Vaclav Havel (PRG)"
                            )}
                          </p>
                          <p className="text-sm font-bold text-gray-700">
                            📅 {fullUser.flightDetails?.arrival?.date ? new Date(fullUser.flightDetails.arrival.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—"}
                          </p>
                          <p className="text-lg font-black text-gray-900 flex items-center gap-1 font-mono">
                            ⏰ {fullUser.flightDetails?.arrival?.time || "—"}
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-normal font-sans">(Prague Local Time)</span>
                          </p>
                        </div>
                        <div className="flex gap-2 text-xs pt-1">
                          <span className="bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600 font-semibold shadow-xs">
                            Terminal: <strong className="text-gray-900">{fullUser.flightDetails?.arrival?.terminal || "1"}</strong>
                          </span>
                          {fullUser.flightDetails?.arrival?.gate && (
                            <span className="bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600 font-semibold shadow-xs">
                              Gate: <strong className="text-gray-900">{fullUser.flightDetails.arrival.gate}</strong>
                            </span>
                          )}
                        </div>
                        {fullUser.flightDetails?.arrival?.departureAirportLink && (
                          <div className="mt-2.5">
                            <MapPhoto 
                              url={fullUser.flightDetails.arrival.departureAirportLink} 
                              alt={fullUser.flightDetails.arrival.departureAirport || "Departure Airport"} 
                              className="w-full h-32 object-cover rounded-lg shadow-inner border border-rose-100"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DURATION INTERSTITIAL */}
                    <div className="pl-16 flex items-center font-sans">
                      <span className="text-[10px] font-extrabold px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-amber-600 uppercase tracking-wider">
                        ⏱ Flight Duration: {fullUser.flightDetails?.arrival?.duration || fullUser.flightDetails?.duration || "03:50 (Non stop)"}
                      </span>
                    </div>

                    {/* ARRIVAL SECTION */}
                    <div className="relative flex gap-4 p-4 rounded-xl border border-emerald-100 bg-emerald-50/10 hover:bg-emerald-50/20 transition duration-150">
                      <div className="h-12 w-12 shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-sm z-10 font-sans">
                        <span className="text-xl">🛬</span>
                      </div>
                      <div className="flex-1 space-y-2 font-sans">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold tracking-wider text-emerald-700 bg-emerald-100/50 px-2.5 py-0.5 rounded uppercase">
                            Arrival Wing
                          </span>
                          <span className="text-[10px] font-mono font-bold text-gray-400">CAI</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-extrabold text-gray-850">
                            {fullUser.flightDetails?.arrival?.arrivalAirportLink ? (
                              <a
                                href={fullUser.flightDetails.arrival.arrivalAirportLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 underline inline-flex items-center gap-1 font-sans"
                              >
                                {fullUser.flightDetails?.arrival?.arrivalAirport || "Cairo International (CAI)"} ↗
                              </a>
                            ) : (
                              fullUser.flightDetails?.arrival?.arrivalAirport || "Cairo International (CAI)"
                            )}
                          </p>
                          <p className="text-sm font-bold text-gray-700">
                            📅 {fullUser.flightDetails?.arrival?.arrivalDate ? new Date(fullUser.flightDetails.arrival.arrivalDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : (fullUser.flightDetails?.arrival?.date ? new Date(fullUser.flightDetails.arrival.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—")}
                          </p>
                          <p className="text-lg font-black text-gray-900 flex items-center gap-1 font-mono">
                            ⏰ {fullUser.flightDetails?.arrival?.arrivalTime || "—"}
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-normal font-sans">(Cairo Local Time)</span>
                          </p>
                        </div>
                        <div className="flex gap-2 text-xs pt-1 col-span-1">
                          <span className="bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600 font-semibold shadow-xs">
                            Terminal: <strong className="text-gray-900">{fullUser.flightDetails?.arrival?.arrivalTerminal || "3"}</strong>
                          </span>
                          {fullUser.flightDetails?.arrival?.arrivalGate && (
                            <span className="bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600 font-semibold shadow-xs">
                              Gate: <strong className="text-gray-900">{fullUser.flightDetails.arrival.arrivalGate}</strong>
                            </span>
                          )}
                        </div>
                        {fullUser.flightDetails?.arrival?.arrivalAirportLink && (
                          <div className="mt-2.5">
                            <MapPhoto 
                              url={fullUser.flightDetails.arrival.arrivalAirportLink} 
                              alt={fullUser.flightDetails.arrival.arrivalAirport || "Arrival Airport"} 
                              className="w-full h-32 object-cover rounded-lg shadow-inner border border-emerald-100"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Flight Preferences Footer Line */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap justify-between items-center text-xs text-gray-600 gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[10px] text-gray-400 uppercase tracking-wider">Pass Preferences:</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-bold text-gray-750">🍽 {fullUser.flightDetails?.arrival?.meal || fullUser.flightDetails?.meal || "Meal"}</span>
                      <span className="bg-gray-100 px-2.5 py-0.5 rounded text-[11px] font-bold text-gray-750">💼 {fullUser.flightDetails?.arrival?.baggage || fullUser.flightDetails?.baggageAllowance || "2 Piece(s)"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STRIP 3: HOTEL CARD */}
            {fullUser.hotel?.name && (
              <div className="col-span-1 xl:col-span-2 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-md border border-gray-150 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-3.5 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏨</span>
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wide">My Hotel & Lodging Logistics</h3>
                      <p className="text-[10px] opacity-90 font-semibold">Assigned Accommodations in Prague</p>
                    </div>
                  </div>
                  {fullUser.hotel?.roomNumber && (
                    <span className="text-xs bg-white text-emerald-800 font-bold px-3 py-1 rounded">
                      Room: {fullUser.hotel.roomNumber}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                  {/* Hotel Photo Section */}
                  <div className="md:col-span-4 h-48 md:h-full relative overflow-hidden min-h-[180px] bg-gray-100">
                    <img 
                      src={fullUser.hotel.photoUrl || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"} 
                      alt={fullUser.hotel.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                      {fullUser.hotel?.roomNumber && (
                        <span className="text-[11px] bg-emerald-500 text-white font-extrabold px-2.5 py-1 rounded-full shadow-lg">
                          Room {fullUser.hotel.roomNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hotel Text details */}
                  <div className="md:col-span-8 p-5 flex flex-col justify-between">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3.5">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Hotel Name</span>
                          <h4 className="text-base font-black text-gray-800 leading-snug">{fullUser.hotel.name}</h4>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Address</span>
                          <p className="text-xs text-gray-750 font-medium leading-relaxed">{fullUser.hotel.address || "Prague City Center, Czech Republic"}</p>
                        </div>
                        {fullUser.hotel?.mapsLink && (
                          <a 
                            href={fullUser.hotel.mapsLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 underline focus:ring-1 focus:ring-emerald-500 rounded px-1 -ml-1 transition-all"
                          >
                            📍 View on Google Maps ↗
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:border-l border-gray-150 pt-4 sm:pt-0 sm:pl-5 border-t sm:border-t-0 border-gray-150">
                        <div>
                          <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider block mb-0.5">📅 Check-In Date</span>
                          <p className="text-xs font-black text-gray-800">
                            {fullUser.hotel?.checkIn ? new Date(fullUser.hotel.checkIn).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </p>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5 font-sans">Rooms ready from 14:00</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-rose-700 uppercase tracking-wider block mb-0.5">📅 Check-Out Date</span>
                          <p className="text-xs font-black text-gray-800">
                            {fullUser.hotel?.checkOut ? new Date(fullUser.hotel.checkOut).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </p>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5 font-sans">Key return before 11:00 AM</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


      </div>
    </Layout>
  );
}
