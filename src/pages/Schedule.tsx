// ─────────────────────────────────────────────
// FILE: src/pages/Schedule.tsx
// PURPOSE: Renders the trip schedule with real itinerary (flights/hotels) using high-contrast styling.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { getLabel } from '../utils/labels';
import { getPageAccess } from '../utils/pageAccess';

// Shared type interfaces
interface FlightDetails {
  direction?: string;
  flightNumber?: string;
  date?: string;
  time?: string;
  departureAirport?: string;
  departureAirportLocation?: string;
  departureTerminal?: string;
  departureGate?: string;
  arrivalAirport?: string;
  arrivalAirportLocation?: string;
}

interface HotelDetails {
  hotelName?: string;
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  address?: string;
  googleMapLocation?: string;
}

interface ScheduleItem {
  id: string;
  type: string;
  direction?: string;
  title: string;
  visibility?: string;
  details: FlightDetails & HotelDetails;
}

// ─────────────────────────────────────────────
// DETAIL ROW COMPONENT (Label vs Value Visual Differentiation)
// ─────────────────────────────────────────────
function DetailRow({
  label,
  value,
  isLink = false,
  href
}: {
  label: string;
  value: string;
  isLink?: boolean;
  href?: string;
}) {
  const isEmpty = !value || value.trim() === "";

  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-gray-100 last:border-0">
      {/* LABEL — small, muted, uppercase */}
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </span>

      {/* VALUE — larger, dark, semibold */}
      {isEmpty ? (
        <span className="text-sm text-gray-300 italic font-sans">—</span>
      ) : isLink && href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-yellow-600 hover:text-yellow-700 hover:underline flex items-center gap-1 break-all"
        >
          📍 View on Map
          <span className="text-xs">↗</span>
        </a>
      ) : (
        <span className="text-sm font-semibold text-gray-800">
          {value}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// FLIGHT CARD COMPONENT
// ─────────────────────────────────────────────
function FlightCard({ item }: { item: any, key?: any }) {
  const d = item.details;
  const isOutbound = item.direction === "outbound" || d?.direction === "outbound";
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Card Header — Black background, white text */}
      <div className="bg-black px-5 py-4 flex items-center justify-between">
        <h2 className="text-white font-bold text-base">{item.title}</h2>
        <span className="text-xs bg-yellow-400 text-black font-semibold px-2.5 py-1 rounded-full">
          {isOutbound ? "Departure" : "Return"}
        </span>
      </div>

      {/* Card Body */}
      <div className="px-5 py-2">
        <DetailRow label="Flight Number"       value={d?.flightNumber || ""} />
        <DetailRow label="Date"
          value={d?.date
            ? new Date(d.date).toLocaleDateString("en-GB", {
                weekday: "long", year: "numeric",
                month:   "long", day: "numeric"
              })
            : ""
          }
        />
        <DetailRow label="Departure Time"      value={d?.time || ""} />
        <DetailRow label="Departure Airport"   value={d?.departureAirport || ""} />
        <DetailRow label="Departure Location"
          value={d?.departureAirportLocation || ""}
          isLink={true}
          href={d?.departureAirportLocation}
        />
        <DetailRow label="Terminal"            value={d?.departureTerminal || ""} />
        <DetailRow label="Gate"                value={d?.departureGate || ""} />
        <DetailRow label="Arrival Airport"     value={d?.arrivalAirport || ""} />
        <DetailRow label="Arrival Location"
          value={d?.arrivalAirportLocation || ""}
          isLink={true}
          href={d?.arrivalAirportLocation}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HOTEL CARD COMPONENT
// ─────────────────────────────────────────────
function HotelCard({ item }: { item: any, key?: any }) {
  const d = item.details;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Card Header — Black background, white text */}
      <div className="bg-black px-5 py-4">
        <h2 className="text-white font-bold text-base">{item.title}</h2>
      </div>

      {/* Card Body */}
      <div className="px-5 py-2">
        <DetailRow label="Hotel Name"    value={d?.hotelName || ""} />
        <DetailRow label="Check-In Date"
          value={d?.checkInDate
            ? new Date(d.checkInDate).toLocaleDateString("en-GB", {
                weekday: "long", year: "numeric",
                month:   "long", day: "numeric"
              })
            : ""
          }
        />
        <DetailRow label="Check-In Time"  value={d?.checkInTime || ""} />
        <DetailRow label="Check-Out Date"
          value={d?.checkOutDate
            ? new Date(d.checkOutDate).toLocaleDateString("en-GB", {
                weekday: "long", year: "numeric",
                month:   "long", day: "numeric"
              })
            : ""
          }
        />
        <DetailRow label="Check-Out Time" value={d?.checkOutTime || ""} />
        <DetailRow label="Address"        value={d?.address || ""} />
        <DetailRow label="Google Maps"
          value={d?.googleMapLocation || ""}
          isLink={true}
          href={d?.googleMapLocation}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCHEDULE PAGE MAIN EXPORT
// ─────────────────────────────────────────────
export default function Schedule() {
  const { schedule, currentUser, appConfig } = useApp();

  const pageTitle = getLabel(appConfig, "schedule");

  // ✅ Read page access correctly - admin/staff always bypass restriction
  const access = getPageAccess("schedule", currentUser?.role, appConfig);

  // Debug statement to track permissions during development
  useEffect(() => {
    console.log("[Schedule] role:", currentUser?.role, "| access:", access);
  }, [currentUser?.role, access]);

  // Hidden Check
  if (access === "hidden") {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh] font-sans">
          <p className="text-gray-400 text-sm font-bold">This page is not available.</p>
        </div>
      </Layout>
    );
  }

  // Coming Soon Check
  if (access === "coming-soon") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center text-center px-6 py-20 min-h-[60vh] font-sans">
          <span className="text-6xl mb-5">🔒</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {appConfig?.navLabels?.["schedule"] ?? pageTitle}
          </h1>
          <p className="text-gray-500 mb-6 font-semibold text-sm max-w-xs">
            This feature is coming soon.
          </p>
        </div>
      </Layout>
    );
  }

  // Support view-as toggle for Admins during tests
  const viewAs = sessionStorage.getItem("euc_view_as");
  const displayUser = viewAs ? JSON.parse(viewAs) : currentUser;

  // Filter based on visibility restrictions
  const filteredSchedule = (schedule || []).filter((item: any) => {
    if (!item.visibility || item.visibility === "all_users") return true;
    
    const uRole = displayUser?.role?.trim().toLowerCase();
    
    // Admins and Staff can always see restricted schedule cards
    if (uRole === "admin" || uRole === "staff") return true;

    // Doctor checks
    if (item.accessRoles?.includes(displayUser?.role) || item.accessUserIds?.includes(displayUser?.id)) {
      return true;
    }
    return false;
  });

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        <div className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded">PRAGUE-2026</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchedule.length > 0 ? (
          filteredSchedule.map((item: any) => (
            item.type === "hotel"
              ? <HotelCard  key={item.id} item={item} />
              : <FlightCard key={item.id} item={item} />
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <span className="text-5xl mb-4 block">✈️</span>
            <p className="text-gray-500 font-bold">No schedule items available for your role.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
