import React, { useState, useEffect, useMemo } from 'react';
import { showToast } from './Toast';
import { localToUtc, utcToDisplay, TZ_CAIRO, TZ_PRAGUE } from "../utils/timezone";
import { getDefaultFlightDetails, getDefaultHotelDetails } from "../context/AppContext";

const DEFAULT_FEATURE_ACCESS = {
  sessions:       { access: true,  status: "full" },
  schedule:       { access: true,  status: "full" },
  photoGallery:   { access: false, status: "coming_soon" },
};

const DEFAULT_VISIBLE_FIELDS = {
  departure:    true,
  arrival:      true,
  hotelName:       true,
  hotelAddress:    true,
  checkIn:         true,
  checkOut:        true,
  roomNumber:      true,
  mapsLink:        true,
  transfers:       true,
  email:           true,
  phone:           true,
};

const FEATURES = [
  { key: "sessions",       label: "Sessions",        icon: "🎓",
    desc: "Scientific conference session access" },
  { key: "schedule",       label: "Schedule",   icon: "📅",
    desc: "View trip itinerary" },
  { key: "photoGallery",   label: "Photo Gallery",   icon: "📷",
    desc: "Conference photos" },
];

const FIELD_SECTIONS = [
  {
    label: "✈️ Flight Details",
    fields: [
      { key: "departure",  label: "Departure Trip" },
      { key: "arrival",    label: "Arrival Trip" },
    ]
  },
  {
    label: "🏨 Hotel Details",
    fields: [
      { key: "hotelName",    label: "Hotel Name" },
      { key: "hotelAddress", label: "Hotel Address" },
      { key: "checkIn",      label: "Check-in Date" },
      { key: "checkOut",     label: "Check-out Date" },
      { key: "roomNumber",   label: "Room Number" },
      { key: "mapsLink",     label: "Google Maps Link" },
    ]
  },
  {
    label: "🚌 Transfers",
    fields: [
      { key: "transfers", label: "Show Transfers Section" },
    ]
  },
  {
    label: "👤 Personal Info",
    fields: [
      { key: "email", label: "Show Email" },
      { key: "phone", label: "Show Phone" },
    ]
  },
];

export default function UserControlCard({ isOpen, mode, user, onClose, onSave }: any) {
  const [activeTab, setActiveTab] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [applyToAllTravel, setApplyToAllTravel] = useState(false);
  const [applyFeaturesToAll, setApplyFeaturesToAll] = useState(false);
  const [applyFieldsToAll, setApplyFieldsToAll] = useState(false);

  const [formData, setFormData] = useState(() => {
    if (mode === "edit" && user) {
      return {
        id:           user.id           || "",
        name:         user.name         || "",
        username:     user.username     || "",
        password:     user.password     || "",
        role:         user.role         || "doctor",
        title:        user.title        || "",
        email:        user.email        || "",
        phone:        user.phone        || "",
        photoUrl:     user.photoUrl     || user.photo || "",
        status:       user.status       ?? true,
      };
    }
    return {
      id:       "u" + Date.now(),
      name:     "",
      username: "",
      password: "",
      role:     "doctor",
      title:    "",
      email:    "",
      phone:    "",
      photoUrl: "",
      status:   true,
    };
  });

  const [travelData, setTravelData] = useState(() => {
    if (mode === "edit" && user) {
      return {
        bookingReference:    user.flightDetails?.bookingReference    || "",
        ticketNumber:        user.flightDetails?.ticketNumber        || "",
        documentIssueDate:   user.flightDetails?.documentIssueDate   || "",
        airlineCode:         user.flightDetails?.airlineCode         || "",
        frequentFlyerNumber: user.flightDetails?.frequentFlyerNumber || "",
        bookingStatus:       user.flightDetails?.bookingStatus       || "",
        cabinClass:          user.flightDetails?.cabinClass          || "",
        baggageAllowance:    user.flightDetails?.baggageAllowance    || "",
        aircraft:            user.flightDetails?.aircraft            || "",
        meal:                user.flightDetails?.meal                || "",
        duration:            user.flightDetails?.duration            || "",
        departure: {
          flightNumber:      user.flightDetails?.departure?.flightNumber     || "",
          date:              user.flightDetails?.departure?.date             || "",
          time:              user.flightDetails?.departure?.time             || "",
          departureAirport:  user.flightDetails?.departure?.departureAirport || "",
          departureAirportLink: user.flightDetails?.departure?.departureAirportLink || "",
          departureAirportPhotoUrl: user.flightDetails?.departure?.departureAirportPhotoUrl || "",
          arrivalAirport:    user.flightDetails?.departure?.arrivalAirport   || "",
          arrivalAirportLink:   user.flightDetails?.departure?.arrivalAirportLink   || "",
          arrivalAirportPhotoUrl:   user.flightDetails?.departure?.arrivalAirportPhotoUrl   || "",
          terminal:          user.flightDetails?.departure?.terminal         || "",
          gate:              user.flightDetails?.departure?.gate             || "",
          inputTimezone:     user.flightDetails?.departure?.inputTimezone     || "Africa/Cairo",
          timezoneDisplay:   user.flightDetails?.departure?.timezoneDisplay   || "both",
          // New fields
          arrivalTime:       user.flightDetails?.departure?.arrivalTime       || "",
          arrivalDate:       user.flightDetails?.departure?.arrivalDate       || "",
          arrivalTerminal:   user.flightDetails?.departure?.arrivalTerminal   || "",
          arrivalGate:       user.flightDetails?.departure?.arrivalGate       || "",
          duration:          user.flightDetails?.departure?.duration          || user.flightDetails?.duration || "",
          aircraft:          user.flightDetails?.departure?.aircraft          || user.flightDetails?.aircraft || "",
          baggage:           user.flightDetails?.departure?.baggage           || user.flightDetails?.baggageAllowance || "2 Piece(s)",
          meal:              user.flightDetails?.departure?.meal              || user.flightDetails?.meal || "Meal",
          cabinClass:        user.flightDetails?.departure?.cabinClass        || user.flightDetails?.cabinClass || "Economy",
          bookingStatus:     user.flightDetails?.departure?.bookingStatus     || user.flightDetails?.bookingStatus || "Confirmed",
          frequentFlyerNumber: user.flightDetails?.departure?.frequentFlyerNumber || user.flightDetails?.frequentFlyerNumber || "",
        },
        arrival: {
          flightNumber:      user.flightDetails?.arrival?.flightNumber       || "",
          date:              user.flightDetails?.arrival?.date               || "",
          time:              user.flightDetails?.arrival?.time               || "",
          departureAirport:  user.flightDetails?.arrival?.departureAirport || "",
          departureAirportLink: user.flightDetails?.arrival?.departureAirportLink || "",
          departureAirportPhotoUrl: user.flightDetails?.arrival?.departureAirportPhotoUrl || "",
          arrivalAirport:    user.flightDetails?.arrival?.arrivalAirport   || "",
          arrivalAirportLink:   user.flightDetails?.arrival?.arrivalAirportLink   || "",
          arrivalAirportPhotoUrl:   user.flightDetails?.arrival?.arrivalAirportPhotoUrl   || "",
          terminal:          user.flightDetails?.arrival?.terminal           || "",
          gate:              user.flightDetails?.arrival?.gate               || "",
          inputTimezone:     user.flightDetails?.arrival?.inputTimezone     || "Africa/Cairo",
          timezoneDisplay:   user.flightDetails?.arrival?.timezoneDisplay   || "both",
          // New fields
          arrivalTime:       user.flightDetails?.arrival?.arrivalTime       || "",
          arrivalDate:       user.flightDetails?.arrival?.arrivalDate       || "",
          arrivalTerminal:   user.flightDetails?.arrival?.arrivalTerminal   || "",
          arrivalGate:       user.flightDetails?.arrival?.arrivalGate       || "",
          duration:          user.flightDetails?.arrival?.duration          || user.flightDetails?.duration || "",
          aircraft:          user.flightDetails?.arrival?.aircraft          || user.flightDetails?.aircraft || "",
          baggage:           user.flightDetails?.arrival?.baggage           || user.flightDetails?.baggageAllowance || "2 Piece(s)",
          meal:              user.flightDetails?.arrival?.meal              || user.flightDetails?.meal || "Meal",
          cabinClass:        user.flightDetails?.arrival?.cabinClass        || user.flightDetails?.cabinClass || "Economy",
          bookingStatus:     user.flightDetails?.arrival?.bookingStatus     || user.flightDetails?.bookingStatus || "Confirmed",
          frequentFlyerNumber: user.flightDetails?.arrival?.frequentFlyerNumber || user.flightDetails?.frequentFlyerNumber || "",
        },
        hotelName:        user.hotel?.name                     || "",
        hotelAddress:     user.hotel?.address                  || "",
        checkIn:          user.hotel?.checkIn                  || "",
        checkOut:         user.hotel?.checkOut                 || "",
        roomNumber:       user.hotel?.roomNumber               || "",
        mapsLink:         user.hotel?.mapsLink                 || "",
        hotelPhotoUrl:    user.hotel?.photoUrl                 || "",
        transfers:        user.transfers                       || [],
      };
    }
    return {
      bookingReference:    "",
      ticketNumber:        "",
      documentIssueDate:   "",
      airlineCode:         "",
      frequentFlyerNumber: "",
      bookingStatus:       "",
      cabinClass:          "",
      baggageAllowance:    "",
      aircraft:            "",
      meal:                "",
      duration:            "",
      departure: { flightNumber: "", date: "", time: "", departureAirport: "", departureAirportLink: "", arrivalAirport: "", arrivalAirportLink: "", terminal: "", gate: "", inputTimezone: "Africa/Cairo", timezoneDisplay: "both", arrivalTime: "", arrivalDate: "", arrivalTerminal: "", arrivalGate: "", duration: "", aircraft: "", baggage: "2 Piece(s)", meal: "Meal", cabinClass: "Economy", bookingStatus: "Confirmed", frequentFlyerNumber: "" },
      arrival: { flightNumber: "", date: "", time: "", departureAirport: "", departureAirportLink: "", arrivalAirport: "", arrivalAirportLink: "", terminal: "", gate: "", inputTimezone: "Africa/Cairo", timezoneDisplay: "both", arrivalTime: "", arrivalDate: "", arrivalTerminal: "", arrivalGate: "", duration: "", aircraft: "", baggage: "2 Piece(s)", meal: "Meal", cabinClass: "Economy", bookingStatus: "Confirmed", frequentFlyerNumber: "" },
      hotelName: "", hotelAddress: "", checkIn: "",
      checkOut: "", roomNumber: "", mapsLink: "", hotelPhotoUrl: "", transfers: [],
    };
  });

  const [featureAccess, setFeatureAccess] = useState(() => {
    if (mode === "edit" && user?.featureAccess) {
      return { ...DEFAULT_FEATURE_ACCESS, ...user.featureAccess };
    }
    return { ...DEFAULT_FEATURE_ACCESS };
  });

  const [visibleFields, setVisibleFields] = useState(() => {
    if (mode === "edit" && user?.visibleFields) {
      return { ...DEFAULT_VISIBLE_FIELDS, ...user.visibleFields };
    }
    return { ...DEFAULT_VISIBLE_FIELDS };
  });

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && user?.id) {
      const fetchFullUser = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/admin/users/${user.id}`);
          if (!response.ok) {
            throw new Error("Failed to load user details");
          }
          const { user: rawUser } = await response.json();
          let fetchedUser = rawUser;
          if (fetchedUser) {
            if (!fetchedUser.flightDetails || !fetchedUser.flightDetails.departure || !fetchedUser.flightDetails.departure.flightNumber) {
              fetchedUser = {
                ...fetchedUser,
                flightDetails: getDefaultFlightDetails(fetchedUser.name)
              };
            }
            if (!fetchedUser.hotel || !fetchedUser.hotel.name) {
              fetchedUser = {
                ...fetchedUser,
                hotel: getDefaultHotelDetails()
              };
            }
          }

          if (fetchedUser) {
            setFormData({
              id:       fetchedUser.id       || "",
              name:     fetchedUser.name     || "",
              username: fetchedUser.username || "",
              password: fetchedUser.password || "",
              role:     fetchedUser.role     || "doctor",
              title:    fetchedUser.title    || "",
              email:    fetchedUser.email    || "",
              phone:    fetchedUser.phone    || "",
              photoUrl: fetchedUser.photoUrl || fetchedUser.photo || "",
              status:   fetchedUser.status   ?? true,
            });

            setTravelData({
              bookingReference:    fetchedUser.flightDetails?.bookingReference    || "",
              ticketNumber:        fetchedUser.flightDetails?.ticketNumber        || "",
              documentIssueDate:   fetchedUser.flightDetails?.documentIssueDate   || "",
              airlineCode:         fetchedUser.flightDetails?.airlineCode         || "",
              frequentFlyerNumber: fetchedUser.flightDetails?.frequentFlyerNumber || "",
              bookingStatus:       fetchedUser.flightDetails?.bookingStatus       || "",
              cabinClass:          fetchedUser.flightDetails?.cabinClass          || "",
              baggageAllowance:    fetchedUser.flightDetails?.baggageAllowance    || "",
              aircraft:            fetchedUser.flightDetails?.aircraft            || "",
              meal:                fetchedUser.flightDetails?.meal                || "",
              duration:            fetchedUser.flightDetails?.duration            || "",
              departure: {
                flightNumber:      fetchedUser.flightDetails?.departure?.flightNumber     || "",
                date:              fetchedUser.flightDetails?.departure?.date             || "",
                time:              fetchedUser.flightDetails?.departure?.time             || "",
                departureAirport:  fetchedUser.flightDetails?.departure?.departureAirport || "",
                departureAirportLink: fetchedUser.flightDetails?.departure?.departureAirportLink || "",
                departureAirportPhotoUrl: fetchedUser.flightDetails?.departure?.departureAirportPhotoUrl || "",
                arrivalAirport:    fetchedUser.flightDetails?.departure?.arrivalAirport   || "",
                arrivalAirportLink:   fetchedUser.flightDetails?.departure?.arrivalAirportLink   || "",
                arrivalAirportPhotoUrl:   fetchedUser.flightDetails?.departure?.arrivalAirportPhotoUrl   || "",
                terminal:          fetchedUser.flightDetails?.departure?.terminal         || "",
                gate:              fetchedUser.flightDetails?.departure?.gate             || "",
                inputTimezone:     fetchedUser.flightDetails?.departure?.inputTimezone     || "Africa/Cairo",
                timezoneDisplay:   fetchedUser.flightDetails?.departure?.timezoneDisplay   || "both",
                arrivalTime:       fetchedUser.flightDetails?.departure?.arrivalTime       || "",
                arrivalDate:       fetchedUser.flightDetails?.departure?.arrivalDate       || "",
                arrivalTerminal:   fetchedUser.flightDetails?.departure?.arrivalTerminal   || "",
                arrivalGate:       fetchedUser.flightDetails?.departure?.arrivalGate       || "",
                duration:          fetchedUser.flightDetails?.departure?.duration          || fetchedUser.flightDetails?.duration || "",
                aircraft:          fetchedUser.flightDetails?.departure?.aircraft          || fetchedUser.flightDetails?.aircraft || "",
                baggage:           fetchedUser.flightDetails?.departure?.baggage           || fetchedUser.flightDetails?.baggageAllowance || "2 Piece(s)",
                meal:              fetchedUser.flightDetails?.departure?.meal              || fetchedUser.flightDetails?.meal || "Meal",
                cabinClass:        fetchedUser.flightDetails?.departure?.cabinClass        || fetchedUser.flightDetails?.cabinClass || "Economy",
                bookingStatus:     fetchedUser.flightDetails?.departure?.bookingStatus     || fetchedUser.flightDetails?.bookingStatus || "Confirmed",
                frequentFlyerNumber: fetchedUser.flightDetails?.departure?.frequentFlyerNumber || fetchedUser.flightDetails?.frequentFlyerNumber || "",
              },
              arrival: {
                flightNumber:      fetchedUser.flightDetails?.arrival?.flightNumber       || "",
                date:              fetchedUser.flightDetails?.arrival?.date               || "",
                time:              fetchedUser.flightDetails?.arrival?.time               || "",
                departureAirport:  fetchedUser.flightDetails?.arrival?.departureAirport || "",
                departureAirportLink: fetchedUser.flightDetails?.arrival?.departureAirportLink || "",
                departureAirportPhotoUrl: fetchedUser.flightDetails?.arrival?.departureAirportPhotoUrl || "",
                arrivalAirport:    fetchedUser.flightDetails?.arrival?.arrivalAirport   || "",
                arrivalAirportLink:   fetchedUser.flightDetails?.arrival?.arrivalAirportLink   || "",
                arrivalAirportPhotoUrl:   fetchedUser.flightDetails?.arrival?.arrivalAirportPhotoUrl   || "",
                terminal:          fetchedUser.flightDetails?.arrival?.terminal           || "",
                gate:              fetchedUser.flightDetails?.arrival?.gate               || "",
                inputTimezone:     fetchedUser.flightDetails?.arrival?.inputTimezone     || "Africa/Cairo",
                timezoneDisplay:   fetchedUser.flightDetails?.arrival?.timezoneDisplay   || "both",
                arrivalTime:       fetchedUser.flightDetails?.arrival?.arrivalTime       || "",
                arrivalDate:       fetchedUser.flightDetails?.arrival?.arrivalDate       || "",
                arrivalTerminal:   fetchedUser.flightDetails?.arrival?.arrivalTerminal   || "",
                arrivalGate:       fetchedUser.flightDetails?.arrival?.arrivalGate       || "",
                duration:          fetchedUser.flightDetails?.arrival?.duration          || fetchedUser.flightDetails?.duration || "",
                aircraft:          fetchedUser.flightDetails?.arrival?.aircraft          || fetchedUser.flightDetails?.aircraft || "",
                baggage:           fetchedUser.flightDetails?.arrival?.baggage           || fetchedUser.flightDetails?.baggageAllowance || "2 Piece(s)",
                meal:              fetchedUser.flightDetails?.arrival?.meal              || fetchedUser.flightDetails?.meal || "Meal",
                cabinClass:        fetchedUser.flightDetails?.arrival?.cabinClass        || fetchedUser.flightDetails?.cabinClass || "Economy",
                bookingStatus:     fetchedUser.flightDetails?.arrival?.bookingStatus     || fetchedUser.flightDetails?.bookingStatus || "Confirmed",
                frequentFlyerNumber: fetchedUser.flightDetails?.arrival?.frequentFlyerNumber || fetchedUser.flightDetails?.frequentFlyerNumber || "",
              },
              hotelName:        fetchedUser.hotel?.name                     || "",
              hotelAddress:     fetchedUser.hotel?.address                  || "",
              checkIn:          fetchedUser.hotel?.checkIn                  || "",
              checkOut:         fetchedUser.hotel?.checkOut                 || "",
              roomNumber:       fetchedUser.hotel?.roomNumber               || "",
              mapsLink:         fetchedUser.hotel?.mapsLink                 || "",
              hotelPhotoUrl:    fetchedUser.hotel?.photoUrl                 || "",
              transfers:        fetchedUser.transfers                       || [],
            });

            setFeatureAccess({
              ...DEFAULT_FEATURE_ACCESS,
              ...(fetchedUser.featureAccess || {}),
            });

            setVisibleFields({
              ...DEFAULT_VISIBLE_FIELDS,
              ...(fetchedUser.visibleFields || {}),
            });
          }
        } catch (err: any) {
          showToast(`Note: Using fallback details (${err.message || "Failed to fetch from server"})`, "info");
          
          let fallbackUser = user;
          if (fallbackUser) {
            if (!fallbackUser.flightDetails || !fallbackUser.flightDetails.departure || !fallbackUser.flightDetails.departure.flightNumber) {
              fallbackUser = {
                ...fallbackUser,
                flightDetails: getDefaultFlightDetails(fallbackUser.name)
              };
            }
            if (!fallbackUser.hotel || !fallbackUser.hotel.name) {
              fallbackUser = {
                ...fallbackUser,
                hotel: getDefaultHotelDetails()
              };
            }
          }

          if (fallbackUser) {
            setFormData({
              id:       fallbackUser.id       || "",
              name:     fallbackUser.name     || "",
              username: fallbackUser.username || "",
              password: fallbackUser.password || "",
              role:     fallbackUser.role     || "doctor",
              title:    fallbackUser.title    || "",
              email:    fallbackUser.email    || "",
              phone:    fallbackUser.phone    || "",
              photoUrl: fallbackUser.photoUrl || fallbackUser.photo || "",
              status:   fallbackUser.status   ?? true,
            });

            setTravelData({
              bookingReference:    fallbackUser.flightDetails?.bookingReference    || "",
              ticketNumber:        fallbackUser.flightDetails?.ticketNumber        || "",
              documentIssueDate:   fallbackUser.flightDetails?.documentIssueDate   || "",
              airlineCode:         fallbackUser.flightDetails?.airlineCode         || "",
              frequentFlyerNumber: fallbackUser.flightDetails?.frequentFlyerNumber || "",
              bookingStatus:       fallbackUser.flightDetails?.bookingStatus       || "",
              cabinClass:          fallbackUser.flightDetails?.cabinClass          || "",
              baggageAllowance:    fallbackUser.flightDetails?.baggageAllowance    || "",
              aircraft:            fallbackUser.flightDetails?.aircraft            || "",
              meal:                fallbackUser.flightDetails?.meal                || "",
              duration:            fallbackUser.flightDetails?.duration            || "",
              departure: {
                flightNumber:      fallbackUser.flightDetails?.departure?.flightNumber     || "",
                date:              fallbackUser.flightDetails?.departure?.date             || "",
                time:              fallbackUser.flightDetails?.departure?.time             || "",
                departureAirport:  fallbackUser.flightDetails?.departure?.departureAirport || "",
                departureAirportLink: fallbackUser.flightDetails?.departure?.departureAirportLink || "",
                departureAirportPhotoUrl: fallbackUser.flightDetails?.departure?.departureAirportPhotoUrl || "",
                arrivalAirport:    fallbackUser.flightDetails?.departure?.arrivalAirport   || "",
                arrivalAirportLink:   fallbackUser.flightDetails?.departure?.arrivalAirportLink   || "",
                arrivalAirportPhotoUrl:   fallbackUser.flightDetails?.departure?.arrivalAirportPhotoUrl   || "",
                terminal:          fallbackUser.flightDetails?.departure?.terminal         || "",
                gate:              fallbackUser.flightDetails?.departure?.gate             || "",
                inputTimezone:     fallbackUser.flightDetails?.departure?.inputTimezone     || "Africa/Cairo",
                timezoneDisplay:   fallbackUser.flightDetails?.departure?.timezoneDisplay   || "both",
                arrivalTime:       fallbackUser.flightDetails?.departure?.arrivalTime       || "",
                arrivalDate:       fallbackUser.flightDetails?.departure?.arrivalDate       || "",
                arrivalTerminal:   fallbackUser.flightDetails?.departure?.arrivalTerminal   || "",
                arrivalGate:       fallbackUser.flightDetails?.departure?.arrivalGate       || "",
                duration:          fallbackUser.flightDetails?.departure?.duration          || fallbackUser.flightDetails?.duration || "",
                aircraft:          fallbackUser.flightDetails?.departure?.aircraft          || fallbackUser.flightDetails?.aircraft || "",
                baggage:           fallbackUser.flightDetails?.departure?.baggage           || fallbackUser.flightDetails?.baggageAllowance || "2 Piece(s)",
                meal:              fallbackUser.flightDetails?.departure?.meal              || fallbackUser.flightDetails?.meal || "Meal",
                cabinClass:        fallbackUser.flightDetails?.departure?.cabinClass        || fallbackUser.flightDetails?.cabinClass || "Economy",
                bookingStatus:     fallbackUser.flightDetails?.departure?.bookingStatus     || fallbackUser.flightDetails?.bookingStatus || "Confirmed",
                frequentFlyerNumber: fallbackUser.flightDetails?.departure?.frequentFlyerNumber || fallbackUser.flightDetails?.frequentFlyerNumber || "",
              },
              arrival: {
                flightNumber:      fallbackUser.flightDetails?.arrival?.flightNumber       || "",
                date:              fallbackUser.flightDetails?.arrival?.date               || "",
                time:              fallbackUser.flightDetails?.arrival?.time               || "",
                departureAirport:  fallbackUser.flightDetails?.arrival?.departureAirport || "",
                departureAirportLink: fallbackUser.flightDetails?.arrival?.departureAirportLink || "",
                departureAirportPhotoUrl: fallbackUser.flightDetails?.arrival?.departureAirportPhotoUrl || "",
                arrivalAirport:    fallbackUser.flightDetails?.arrival?.arrivalAirport   || "",
                arrivalAirportLink:   fallbackUser.flightDetails?.arrival?.arrivalAirportLink   || "",
                arrivalAirportPhotoUrl:   fallbackUser.flightDetails?.arrival?.arrivalAirportPhotoUrl   || "",
                terminal:          fallbackUser.flightDetails?.arrival?.terminal           || "",
                gate:              fallbackUser.flightDetails?.arrival?.gate               || "",
                inputTimezone:     fallbackUser.flightDetails?.arrival?.inputTimezone     || "Africa/Cairo",
                timezoneDisplay:   fallbackUser.flightDetails?.arrival?.timezoneDisplay   || "both",
                arrivalTime:       fallbackUser.flightDetails?.arrival?.arrivalTime       || "",
                arrivalDate:       fallbackUser.flightDetails?.arrival?.arrivalDate       || "",
                arrivalTerminal:   fallbackUser.flightDetails?.arrival?.arrivalTerminal   || "",
                arrivalGate:       fallbackUser.flightDetails?.arrival?.arrivalGate       || "",
                duration:          fallbackUser.flightDetails?.arrival?.duration          || fallbackUser.flightDetails?.duration || "",
                aircraft:          fallbackUser.flightDetails?.arrival?.aircraft          || fallbackUser.flightDetails?.aircraft || "",
                baggage:           fallbackUser.flightDetails?.arrival?.baggage           || fallbackUser.flightDetails?.baggageAllowance || "2 Piece(s)",
                meal:              fallbackUser.flightDetails?.arrival?.meal              || fallbackUser.flightDetails?.meal || "Meal",
                cabinClass:        fallbackUser.flightDetails?.arrival?.cabinClass        || fallbackUser.flightDetails?.cabinClass || "Economy",
                bookingStatus:     fallbackUser.flightDetails?.arrival?.bookingStatus     || fallbackUser.flightDetails?.bookingStatus || "Confirmed",
                frequentFlyerNumber: fallbackUser.flightDetails?.arrival?.frequentFlyerNumber || fallbackUser.flightDetails?.frequentFlyerNumber || "",
              },
              hotelName:           fallbackUser.hotel?.name                     || "",
              hotelAddress:        fallbackUser.hotel?.address                  || "",
              checkIn:             fallbackUser.hotel?.checkIn                  || "",
              checkOut:            fallbackUser.hotel?.checkOut                 || "",
              roomNumber:          fallbackUser.hotel?.roomNumber               || "",
              mapsLink:            fallbackUser.hotel?.mapsLink                 || "",
              hotelPhotoUrl:       fallbackUser.hotel?.photoUrl                 || "",
              transfers:           fallbackUser.transfers                       || [],
            });

            setFeatureAccess({
              ...DEFAULT_FEATURE_ACCESS,
              ...(fallbackUser.featureAccess || {}),
            });

            setVisibleFields({
              ...DEFAULT_VISIBLE_FIELDS,
              ...(fallbackUser.visibleFields || {}),
            });
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchFullUser();
    } else if (mode === "create") {
      setFormData({
        id: "u" + Date.now(),
        name: "", username: "", password: "",
        role: "doctor", title: "", email: "", phone: "",
        photoUrl: "", status: true,
      });
      setTravelData({
        bookingReference:    "",
        ticketNumber:        "",
        documentIssueDate:   "",
        airlineCode:         "",
        frequentFlyerNumber: "",
        bookingStatus:       "",
        cabinClass:          "",
        baggageAllowance:    "",
        aircraft:            "",
        meal:                "",
        duration:            "",
        departure: { flightNumber: "", date: "", time: "", departureAirport: "", departureAirportLink: "", arrivalAirport: "", arrivalAirportLink: "", terminal: "", gate: "", inputTimezone: "Africa/Cairo", timezoneDisplay: "both" },
        arrival: { flightNumber: "", date: "", time: "", departureAirport: "", departureAirportLink: "", arrivalAirport: "", arrivalAirportLink: "", terminal: "", gate: "", inputTimezone: "Africa/Cairo", timezoneDisplay: "both" },
        hotelName: "", hotelAddress: "", checkIn: "",
        checkOut: "", roomNumber: "", mapsLink: "", transfers: [],
      });
      setFeatureAccess({ ...DEFAULT_FEATURE_ACCESS });
      setVisibleFields({ ...DEFAULT_VISIBLE_FIELDS });
    }
    setApplyToAllTravel(false);
    setApplyFeaturesToAll(false);
    setApplyFieldsToAll(false);
  }, [isOpen, user, mode]);

  const departurePragueDisplay = useMemo(() => {
    const d = travelData.departure?.date;
    const t = travelData.departure?.time;
    const tz = travelData.departure?.inputTimezone || "Africa/Cairo";
    if (!d || !t) return null;
    try {
      const utc = localToUtc(`${d}T${t}`, tz);
      return utcToDisplay(utc, TZ_PRAGUE).time;
    } catch { return null; }
  }, [travelData.departure?.date, travelData.departure?.time, travelData.departure?.inputTimezone]);

  const departureCairoDisplay = useMemo(() => {
    const d = travelData.departure?.date;
    const t = travelData.departure?.time;
    const tz = travelData.departure?.inputTimezone || "Africa/Cairo";
    if (!d || !t) return null;
    try {
      const utc = localToUtc(`${d}T${t}`, tz);
      return utcToDisplay(utc, TZ_CAIRO).time;
    } catch { return null; }
  }, [travelData.departure?.date, travelData.departure?.time, travelData.departure?.inputTimezone]);

  const arrivalPragueDisplay = useMemo(() => {
    const d = travelData.arrival?.date;
    const t = travelData.arrival?.time;
    const tz = travelData.arrival?.inputTimezone || "Africa/Cairo";
    if (!d || !t) return null;
    try {
      const utc = localToUtc(`${d}T${t}`, tz);
      return utcToDisplay(utc, TZ_PRAGUE).time;
    } catch { return null; }
  }, [travelData.arrival?.date, travelData.arrival?.time, travelData.arrival?.inputTimezone]);

  const arrivalCairoDisplay = useMemo(() => {
    const d = travelData.arrival?.date;
    const t = travelData.arrival?.time;
    const tz = travelData.arrival?.inputTimezone || "Africa/Cairo";
    if (!d || !t) return null;
    try {
      const utc = localToUtc(`${d}T${t}`, tz);
      return utcToDisplay(utc, TZ_CAIRO).time;
    } catch { return null; }
  }, [travelData.arrival?.date, travelData.arrival?.time, travelData.arrival?.inputTimezone]);

  if (!isOpen) return null;

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleTravelChange = (e: any) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setTravelData((prev: any) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setTravelData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  function toggleFeatureAccess(key: string) {
    setFeatureAccess((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        access: !prev[key]?.access,
      }
    }));
  }

  function setFeatureStatus(key: string, status: string) {
    setFeatureAccess((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
      }
    }));
  }

  function toggleField(key: string) {
    setVisibleFields((prev: any) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function toggleSection(fields: {key: string}[], value: boolean) {
    const updates: any = {};
    fields.forEach(f => { updates[f.key] = value; });
    setVisibleFields((prev: any) => ({ ...prev, ...updates }));
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      showToast("Full name is required", "error");
      setActiveTab(1);
      return;
    }
    if (!formData.username.trim()) {
      showToast("Username is required", "error");
      setActiveTab(1);
      return;
    }
    if (mode === "create" && !formData.password.trim()) {
      showToast("Password is required", "error");
      setActiveTab(1);
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = {
        ...(mode === "edit" ? user : {}),
        
        id:       formData.id,
        name:     formData.name.trim(),
        username: formData.username.trim(),
        password: formData.password.trim(),
        role:     formData.role,
        title:    formData.title.trim(),
        email:    formData.email.trim(),
        phone:    formData.phone.trim(),
        photoUrl: formData.photoUrl.trim(),
        photo:    formData.photoUrl.trim(), // Keep sync with legacy photo field
        status:   formData.status,
        isActive: formData.status, 

        flightDetails: {
          bookingReference:    travelData.bookingReference,
          ticketNumber:        travelData.ticketNumber,
          documentIssueDate:   travelData.documentIssueDate,
          airlineCode:         travelData.airlineCode,
          frequentFlyerNumber: travelData.frequentFlyerNumber,
          bookingStatus:       travelData.bookingStatus,
          cabinClass:          travelData.cabinClass,
          baggageAllowance:    travelData.baggageAllowance,
          aircraft:            travelData.aircraft,
          meal:                travelData.meal,
          duration:            travelData.duration,
          departure:           travelData.departure,
          arrival:             travelData.arrival,
        },
        hotel: {
          name:       travelData.hotelName,
          address:    travelData.hotelAddress,
          checkIn:    travelData.checkIn,
          checkOut:   travelData.checkOut,
          roomNumber: travelData.roomNumber,
          mapsLink:   travelData.mapsLink,
          photoUrl:   travelData.hotelPhotoUrl,
        },
        transfers: travelData.transfers,
        featureAccess: { ...featureAccess },
        visibleFields: { ...visibleFields },
      };

      await onSave(updatedUser, applyToAllTravel, applyFeaturesToAll, applyFieldsToAll);

      showToast(
        mode === "edit"
          ? `${updatedUser.name} updated successfully ✓`
          : `${updatedUser.name} created successfully ✓`,
        "success"
      );
      onClose();
    } catch (err) {
      showToast("Failed to save changes. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-2xl font-bold">{mode === 'edit' ? `Edit User — ${formData.name || formData.username}` : 'Create New User'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-xl leading-none">✕</button>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap border-b text-sm font-bold">
          {['Personal Info', 'Travel Details', 'Feature Access', 'Field Visibility'].map((name, i) => (
            <button key={i} onClick={() => setActiveTab(i+1)} className={`flex-1 min-w-[120px] py-3 px-4 text-center border-b-2 transition-colors ${activeTab === i+1 ? 'border-yellow-500 text-yellow-600 bg-yellow-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
              {name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-50">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent"></div>
              <p className="mt-3 text-sm font-semibold text-gray-600">Loading latest user details...</p>
            </div>
          )}
          {activeTab === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="w-full p-2 border rounded" />
                <input name="username" value={formData.username} onChange={handleChange} placeholder="Username" className="w-full p-2 border rounded" />
                
                <div className="relative">
                  <input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} placeholder="Password" className="w-full p-2 border rounded pr-10" />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                    )}
                  </button>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1">Role</label>
                  <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded">
                    <option value="admin">Admin</option>
                    <option value="doctor">Doctor</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1">Job Title</label>
                  <input name="title" value={formData.title} onChange={handleChange} placeholder="Job Title" className="w-full p-2 border rounded" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1">Email Address</label>
                  <input name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className="w-full p-2 border rounded" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className="w-full p-2 border rounded" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-bold text-gray-400 uppercase">Profile Photo URL</label>
                <div className="flex items-center gap-4">
                  {formData.photoUrl ? (
                    <img 
                      src={formData.photoUrl} 
                      alt="Preview" 
                      className="w-12 h-12 rounded-full border bg-gray-100 object-cover shrink-0 shadow-sm" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        e.currentTarget.nextElementSibling?.classList.add('flex');
                      }}
                    />
                  ) : null}
                  <div className={`${formData.photoUrl ? 'hidden' : 'flex'} w-12 h-12 bg-yellow-400 items-center justify-center rounded-full font-bold text-black border border-gray-200 shadow-sm shrink-0`}>
                    {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <input name="photoUrl" value={formData.photoUrl} onChange={handleChange} placeholder="https://example.com/photo.jpg" className="flex-1 p-2 border rounded focus:ring-1 focus:ring-yellow-500 outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded border max-w-[150px]">
                <input type="checkbox" name="status" checked={formData.status} onChange={handleChange} className="w-5 h-5 accent-yellow-500" />
                <span className="font-semibold">{formData.status ? 'Active User' : 'Inactive'}</span>
              </label>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-6">
              <div className="p-4 border rounded bg-gray-50 bg-gradient-to-r from-gray-50 to-white shadow-sm">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-800">
                  <span>🎫 Ticket Details</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Booking Reference (PNR)</label>
                    <input name="bookingReference" value={travelData.bookingReference || ""} onChange={handleTravelChange} placeholder="e.g. AB1CD2" className="w-full p-2 border rounded" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Ticket Number (E-ticket)</label>
                    <input name="ticketNumber" value={travelData.ticketNumber || ""} onChange={handleTravelChange} placeholder="e.g. 057-1234567890" className="w-full p-2 border rounded" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Document Issue Date</label>
                    <input name="documentIssueDate" value={travelData.documentIssueDate || ""} onChange={handleTravelChange} placeholder="e.g. 15 May 2026" className="w-full p-2 border rounded" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Airline Code (Optional)</label>
                    <input name="airlineCode" value={travelData.airlineCode || ""} onChange={handleTravelChange} placeholder="e.g. MS" className="w-full p-2 border rounded" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Frequent Flyer (Optional)</label>
                    <input name="frequentFlyerNumber" value={travelData.frequentFlyerNumber || ""} onChange={handleTravelChange} placeholder="e.g. MS-12345" className="w-full p-2 border rounded" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Booking Status (Optional)</label>
                    <input name="bookingStatus" value={travelData.bookingStatus || ""} onChange={handleTravelChange} placeholder="e.g. Confirmed" className="w-full p-2 border rounded" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Cabin Class (Optional)</label>
                    <input name="cabinClass" value={travelData.cabinClass || ""} onChange={handleTravelChange} placeholder="e.g. Business" className="w-full p-2 border rounded" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Baggage Allowance (Optional)</label>
                    <input name="baggageAllowance" value={travelData.baggageAllowance || ""} onChange={handleTravelChange} placeholder="e.g. 2PC" className="w-full p-2 border rounded" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Aircraft (Optional)</label>
                    <input name="aircraft" value={travelData.aircraft || ""} onChange={handleTravelChange} placeholder="e.g. B787-9" className="w-full p-2 border rounded" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Meal preference (Optional)</label>
                    <input name="meal" value={travelData.meal || ""} onChange={handleTravelChange} placeholder="e.g. Standard" className="w-full p-2 border rounded" />
                  </div>
                  <div className="flex flex-col sm:col-span-2">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Remarks / Duration (Optional)</label>
                    <input name="duration" value={travelData.duration || ""} onChange={handleTravelChange} placeholder="e.g. Duration: 4h 15m" className="w-full p-2 border rounded" />
                  </div>
                </div>
              </div>

              <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50/20 shadow-sm">
                <h3 className="font-bold mb-3 text-yellow-800 border-b border-yellow-100 pb-1.5 flex items-center gap-1.5">
                  <span>🛫 Departure Flight (Trip 1: To Prague)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-1 sm:col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100/50 p-1.5 rounded">Flight Meta</div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Flight Number</label>
                    <input name="departure.flightNumber" value={travelData.departure?.flightNumber || ""} onChange={handleTravelChange} placeholder="e.g. MS 789" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Equipment / Aircraft</label>
                    <input name="departure.aircraft" value={travelData.departure?.aircraft || ""} onChange={handleTravelChange} placeholder="e.g. AIRBUS A320NEO" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Booking Status</label>
                    <input name="departure.bookingStatus" value={travelData.departure?.bookingStatus || ""} onChange={handleTravelChange} placeholder="e.g. Confirmed" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Cabin Class</label>
                    <input name="departure.cabinClass" value={travelData.departure?.cabinClass || ""} onChange={handleTravelChange} placeholder="e.g. Economy" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Duration (Non stop)</label>
                    <input name="departure.duration" value={travelData.departure?.duration || ""} onChange={handleTravelChange} placeholder="e.g. 03:55" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Frequent Flyer (Departure flight)</label>
                    <input name="departure.frequentFlyerNumber" value={travelData.departure?.frequentFlyerNumber || ""} onChange={handleTravelChange} placeholder="e.g. MS4001012993" className="w-full p-2 border rounded bg-white" />
                  </div>

                  <div className="col-span-1 sm:col-span-2 text-xs font-bold text-rose-800 uppercase tracking-wider bg-rose-50 p-1.5 rounded mt-2">🛫 Departure Information</div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-rose-700 mb-0.5">Departure Date</label>
                    <input name="departure.date" type="date" value={travelData.departure?.date || ""} onChange={handleTravelChange} className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-rose-700 mb-0.5">Departure Time</label>
                    <input name="departure.time" type="time" value={travelData.departure?.time || ""} onChange={handleTravelChange} className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-rose-700 mb-0.5">Departure Airport</label>
                    <input name="departure.departureAirport" value={travelData.departure?.departureAirport || ""} onChange={handleTravelChange} placeholder="e.g. Cairo (Intl)" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-rose-700 mb-0.5">Departure Airport Location Link</label>
                    <input name="departure.departureAirportLink" value={travelData.departure?.departureAirportLink || ""} onChange={handleTravelChange} placeholder="e.g. Google Maps Link" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-rose-700 mb-0.5">Departure Airport Direct Photo Link (Fallback Url)</label>
                    <input name="departure.departureAirportPhotoUrl" value={travelData.departure?.departureAirportPhotoUrl || ""} onChange={handleTravelChange} placeholder="e.g. Direct image address" className="w-full p-2 border rounded bg-white text-xs text-gray-700" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-rose-700 mb-0.5">Terminal</label>
                      <input name="departure.terminal" value={travelData.departure?.terminal || ""} onChange={handleTravelChange} placeholder="Terminal" className="w-full p-2 border rounded bg-white" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-rose-700 mb-0.5">Gate</label>
                      <input name="departure.gate" value={travelData.departure?.gate || ""} onChange={handleTravelChange} placeholder="Gate" className="w-full p-2 border rounded bg-white" />
                    </div>
                  </div>

                  <div className="col-span-1 sm:col-span-2 text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 p-1.5 rounded mt-2">🛬 Arrival Information</div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-emerald-700 mb-0.5">Arrival Date</label>
                    <input name="departure.arrivalDate" type="date" value={travelData.departure?.arrivalDate || ""} onChange={handleTravelChange} className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-emerald-700 mb-0.5">Arrival Time</label>
                    <input name="departure.arrivalTime" type="time" value={travelData.departure?.arrivalTime || ""} onChange={handleTravelChange} className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-emerald-700 mb-0.5">Arrival Airport</label>
                    <input name="departure.arrivalAirport" value={travelData.departure?.arrivalAirport || ""} onChange={handleTravelChange} placeholder="e.g. Prague (Vaclav Havel)" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-emerald-700 mb-0.5">Arrival Airport Location Link</label>
                    <input name="departure.arrivalAirportLink" value={travelData.departure?.arrivalAirportLink || ""} onChange={handleTravelChange} placeholder="e.g. Google Maps Link" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-emerald-700 mb-0.5">Arrival Airport Direct Photo Link (Fallback Url)</label>
                    <input name="departure.arrivalAirportPhotoUrl" value={travelData.departure?.arrivalAirportPhotoUrl || ""} onChange={handleTravelChange} placeholder="e.g. Direct image address" className="w-full p-2 border rounded bg-white text-xs text-gray-700" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-emerald-700 mb-0.5">Terminal</label>
                      <input name="departure.arrivalTerminal" value={travelData.departure?.arrivalTerminal || ""} onChange={handleTravelChange} placeholder="Terminal" className="w-full p-2 border rounded bg-white" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-emerald-700 mb-0.5">Gate</label>
                      <input name="departure.arrivalGate" value={travelData.departure?.arrivalGate || ""} onChange={handleTravelChange} placeholder="Gate" className="w-full p-2 border rounded bg-white" />
                    </div>
                  </div>

                  <div className="col-span-1 sm:col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100/50 p-1.5 rounded mt-2">Services & Preferences</div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Baggage Allowance</label>
                    <input name="departure.baggage" value={travelData.departure?.baggage || ""} onChange={handleTravelChange} placeholder="e.g. 2 Piece(s)" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Flight Meal</label>
                    <input name="departure.meal" value={travelData.departure?.meal || ""} onChange={handleTravelChange} placeholder="e.g. Meal" className="w-full p-2 border rounded bg-white" />
                  </div>

                  {/* Timezones */}
                  <div className="col-span-1 sm:col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100/50 p-1.5 rounded mt-2">Timezone Display Settings</div>
                  
                  <div className="flex flex-col col-span-1 sm:col-span-2 gap-1.5 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    {/* Timezone Selector */}
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Timezone for calculations</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="depTz"
                            value="Africa/Cairo"
                            checked={(travelData.departure?.inputTimezone || "Africa/Cairo") === "Africa/Cairo"}
                            onChange={() => setTravelData((prev: any) => ({
                              ...prev,
                              departure: { ...prev.departure, inputTimezone: "Africa/Cairo" }
                            }))}
                            className="accent-yellow-500 w-4 h-4"
                          />
                          <span className="text-xs text-gray-700 font-medium">🇪🇬 Cairo (UTC+3)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="depTz"
                            value="Europe/Prague"
                            checked={(travelData.departure?.inputTimezone || "Africa/Cairo") === "Europe/Prague"}
                            onChange={() => setTravelData((prev: any) => ({
                              ...prev,
                              departure: { ...prev.departure, inputTimezone: "Europe/Prague" }
                            }))}
                            className="accent-yellow-500 w-4 h-4"
                          />
                          <span className="text-xs text-gray-700 font-medium">🇨🇿 Prague (UTC+2)</span>
                        </label>
                      </div>
                    </div>

                    {/* Timezone Display Mode Selector */}
                    <div className="flex flex-col mt-2 pt-2 border-t">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Show time on screen as</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="depTzDisp"
                            value="both"
                            checked={(travelData.departure?.timezoneDisplay || "both") === "both"}
                            onChange={() => setTravelData((prev: any) => ({
                              ...prev,
                              departure: { ...prev.departure, timezoneDisplay: "both" }
                            }))}
                            className="accent-yellow-500 w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-gray-700 font-medium">Both timezones</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="depTzDisp"
                            value="prague"
                            checked={(travelData.departure?.timezoneDisplay || "both") === "prague"}
                            onChange={() => setTravelData((prev: any) => ({
                              ...prev,
                              departure: { ...prev.departure, timezoneDisplay: "prague" }
                            }))}
                            className="accent-yellow-500 w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-gray-705 font-semibold">🇨🇿 Prague only</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="depTzDisp"
                            value="cairo"
                            checked={(travelData.departure?.timezoneDisplay || "both") === "cairo"}
                            onChange={() => setTravelData((prev: any) => ({
                              ...prev,
                              departure: { ...prev.departure, timezoneDisplay: "cairo" }
                            }))}
                            className="accent-yellow-500 w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-gray-705 font-semibold">🇪🇬 Cairo only</span>
                        </label>
                      </div>
                    </div>

                    {/* Live Preview */}
                    {departurePragueDisplay && departureCairoDisplay && (
                      <div className="text-[10px] bg-gray-50 p-2 rounded border border-gray-150 text-gray-650 font-semibold leading-normal flex flex-row items-center gap-3 mt-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Preview:</span>
                        <div>🇨🇿 PRG: <strong>{departurePragueDisplay}</strong></div>
                        <div>🇪🇬 CAI: <strong>{departureCairoDisplay}</strong></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50/20 shadow-sm">
                <h3 className="font-bold mb-3 text-yellow-800 border-b border-yellow-100 pb-1.5 flex items-center gap-1.5">
                  <span>🛬 Arrival Flight (Trip 2: Return Home)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-1 sm:col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100/50 p-1.5 rounded">Flight Meta</div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Flight Number</label>
                    <input name="arrival.flightNumber" value={travelData.arrival?.flightNumber || ""} onChange={handleTravelChange} placeholder="e.g. MS 790" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Equipment / Aircraft</label>
                    <input name="arrival.aircraft" value={travelData.arrival?.aircraft || ""} onChange={handleTravelChange} placeholder="e.g. AIRBUS A320NEO" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Booking Status</label>
                    <input name="arrival.bookingStatus" value={travelData.arrival?.bookingStatus || ""} onChange={handleTravelChange} placeholder="e.g. Confirmed" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Cabin Class</label>
                    <input name="arrival.cabinClass" value={travelData.arrival?.cabinClass || ""} onChange={handleTravelChange} placeholder="e.g. Economy" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Duration (Non stop)</label>
                    <input name="arrival.duration" value={travelData.arrival?.duration || ""} onChange={handleTravelChange} placeholder="e.g. 03:55" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Frequent Flyer (Arrival Flight)</label>
                    <input name="arrival.frequentFlyerNumber" value={travelData.arrival?.frequentFlyerNumber || ""} onChange={handleTravelChange} placeholder="e.g. MS4001012993" className="w-full p-2 border rounded bg-white" />
                  </div>

                  <div className="col-span-1 sm:col-span-2 text-xs font-bold text-rose-800 uppercase tracking-wider bg-rose-50 p-1.5 rounded mt-2">🛫 Departure Information</div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-rose-700 mb-0.5">Departure Date</label>
                    <input name="arrival.date" type="date" value={travelData.arrival?.date || ""} onChange={handleTravelChange} className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-rose-700 mb-0.5">Departure Time</label>
                    <input name="arrival.time" type="time" value={travelData.arrival?.time || ""} onChange={handleTravelChange} className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-rose-700 mb-0.5">Departure Airport</label>
                    <input name="arrival.departureAirport" value={travelData.arrival?.departureAirport || ""} onChange={handleTravelChange} placeholder="e.g. Prague (Vaclav Havel)" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-rose-700 mb-0.5">Departure Airport Location Link</label>
                    <input name="arrival.departureAirportLink" value={travelData.arrival?.departureAirportLink || ""} onChange={handleTravelChange} placeholder="e.g. Google Maps Link" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-rose-700 mb-0.5">Departure Airport Direct Photo Link (Fallback Url)</label>
                    <input name="arrival.departureAirportPhotoUrl" value={travelData.arrival?.departureAirportPhotoUrl || ""} onChange={handleTravelChange} placeholder="e.g. Direct image address" className="w-full p-2 border rounded bg-white text-xs text-gray-700" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-rose-700 mb-0.5">Terminal</label>
                      <input name="arrival.terminal" value={travelData.arrival?.terminal || ""} onChange={handleTravelChange} placeholder="Terminal" className="w-full p-2 border rounded bg-white" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-rose-700 mb-0.5">Gate</label>
                      <input name="arrival.gate" value={travelData.arrival?.gate || ""} onChange={handleTravelChange} placeholder="Gate" className="w-full p-2 border rounded bg-white" />
                    </div>
                  </div>

                  <div className="col-span-1 sm:col-span-2 text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 p-1.5 rounded mt-2">🛬 Arrival Information</div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-emerald-700 mb-0.5">Arrival Date</label>
                    <input name="arrival.arrivalDate" type="date" value={travelData.arrival?.arrivalDate || ""} onChange={handleTravelChange} className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-emerald-700 mb-0.5">Arrival Time</label>
                    <input name="arrival.arrivalTime" type="time" value={travelData.arrival?.arrivalTime || ""} onChange={handleTravelChange} className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-emerald-700 mb-0.5">Arrival Airport</label>
                    <input name="arrival.arrivalAirport" value={travelData.arrival?.arrivalAirport || ""} onChange={handleTravelChange} placeholder="e.g. Cairo (Intl)" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-emerald-700 mb-0.5">Arrival Airport Location Link</label>
                    <input name="arrival.arrivalAirportLink" value={travelData.arrival?.arrivalAirportLink || ""} onChange={handleTravelChange} placeholder="e.g. Google Maps Link" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-emerald-700 mb-0.5">Arrival Airport Direct Photo Link (Fallback Url)</label>
                    <input name="arrival.arrivalAirportPhotoUrl" value={travelData.arrival?.arrivalAirportPhotoUrl || ""} onChange={handleTravelChange} placeholder="e.g. Direct image address" className="w-full p-2 border rounded bg-white text-xs text-gray-700" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-emerald-700 mb-0.5">Terminal</label>
                      <input name="arrival.arrivalTerminal" value={travelData.arrival?.arrivalTerminal || ""} onChange={handleTravelChange} placeholder="Terminal" className="w-full p-2 border rounded bg-white" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-emerald-700 mb-0.5">Gate</label>
                      <input name="arrival.arrivalGate" value={travelData.arrival?.arrivalGate || ""} onChange={handleTravelChange} placeholder="Gate" className="w-full p-2 border rounded bg-white" />
                    </div>
                  </div>

                  <div className="col-span-1 sm:col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100/50 p-1.5 rounded mt-2">Services & Preferences</div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Baggage Allowance</label>
                    <input name="arrival.baggage" value={travelData.arrival?.baggage || ""} onChange={handleTravelChange} placeholder="e.g. 2 Piece(s)" className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-0.5">Flight Meal</label>
                    <input name="arrival.meal" value={travelData.arrival?.meal || ""} onChange={handleTravelChange} placeholder="e.g. Meal" className="w-full p-2 border rounded bg-white" />
                  </div>

                  {/* Timezones */}
                  <div className="col-span-1 sm:col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100/50 p-1.5 rounded mt-2">Timezone Display Settings</div>

                  <div className="flex flex-col col-span-1 sm:col-span-2 gap-1.5 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    {/* Timezone Selector */}
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Timezone for calculations</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="arrTz"
                            value="Africa/Cairo"
                            checked={(travelData.arrival?.inputTimezone || "Africa/Cairo") === "Africa/Cairo"}
                            onChange={() => setTravelData((prev: any) => ({
                              ...prev,
                              arrival: { ...prev.arrival, inputTimezone: "Africa/Cairo" }
                            }))}
                            className="accent-yellow-500 w-4 h-4"
                          />
                          <span className="text-xs text-gray-700 font-medium">🇪🇬 Cairo (UTC+3)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="arrTz"
                            value="Europe/Prague"
                            checked={(travelData.arrival?.inputTimezone || "Africa/Cairo") === "Europe/Prague"}
                            onChange={() => setTravelData((prev: any) => ({
                              ...prev,
                              arrival: { ...prev.arrival, inputTimezone: "Europe/Prague" }
                            }))}
                            className="accent-yellow-500 w-4 h-4"
                          />
                          <span className="text-xs text-gray-700 font-medium">🇨🇿 Prague (UTC+2)</span>
                        </label>
                      </div>
                    </div>

                    {/* Timezone Display Mode Selector */}
                    <div className="flex flex-col mt-2 pt-2 border-t">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Show time on screen as</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="arrTzDisp"
                            value="both"
                            checked={(travelData.arrival?.timezoneDisplay || "both") === "both"}
                            onChange={() => setTravelData((prev: any) => ({
                              ...prev,
                              arrival: { ...prev.arrival, timezoneDisplay: "both" }
                            }))}
                            className="accent-yellow-500 w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-gray-700 font-medium">Both timezones</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="arrTzDisp"
                            value="prague"
                            checked={(travelData.arrival?.timezoneDisplay || "both") === "prague"}
                            onChange={() => setTravelData((prev: any) => ({
                              ...prev,
                              arrival: { ...prev.arrival, timezoneDisplay: "prague" }
                            }))}
                            className="accent-yellow-500 w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-gray-705 font-semibold">🇨🇿 Prague only</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="arrTzDisp"
                            value="cairo"
                            checked={(travelData.arrival?.timezoneDisplay || "both") === "cairo"}
                            onChange={() => setTravelData((prev: any) => ({
                              ...prev,
                              arrival: { ...prev.arrival, timezoneDisplay: "cairo" }
                            }))}
                            className="accent-yellow-500 w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-gray-705 font-semibold">🇪🇬 Cairo only</span>
                        </label>
                      </div>
                    </div>

                    {/* Live Preview */}
                    {arrivalPragueDisplay && arrivalCairoDisplay && (
                      <div className="text-[10px] bg-gray-50 p-2 rounded border border-gray-150 text-gray-650 font-semibold leading-normal flex flex-row items-center gap-3 mt-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Preview:</span>
                        <div>🇨🇿 PRG: <strong>{arrivalPragueDisplay}</strong></div>
                        <div>🇪🇬 CAI: <strong>{arrivalCairoDisplay}</strong></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded bg-gray-50">
                <h3 className="font-bold mb-3">🏨 Hotel Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input name="hotelName" value={travelData.hotelName} onChange={handleTravelChange} placeholder="Hotel Name" className="w-full p-2 border rounded" />
                  <input name="roomNumber" value={travelData.roomNumber} onChange={handleTravelChange} placeholder="Room Number" className="w-full p-2 border rounded" />
                  <input name="checkIn" type="date" value={travelData.checkIn} onChange={handleTravelChange} className="w-full p-2 border rounded" />
                  <input name="checkOut" type="date" value={travelData.checkOut} onChange={handleTravelChange} className="w-full p-2 border rounded" />
                  <input name="hotelAddress" value={travelData.hotelAddress} onChange={handleTravelChange} placeholder="Address" className="col-span-2 w-full p-2 border rounded" />
                  <input name="mapsLink" value={travelData.mapsLink} onChange={handleTravelChange} placeholder="Google Maps Link" className="col-span-2 w-full p-2 border rounded" />
                  
                  <div className="col-span-2 flex flex-col gap-1.5 mt-1">
                    <label className="text-xs font-bold text-gray-500">Hotel Photo URL</label>
                    <div className="flex gap-2">
                      <input 
                        name="hotelPhotoUrl" 
                        value={travelData.hotelPhotoUrl || ""} 
                        onChange={handleTravelChange} 
                        placeholder="e.g. https://images.unsplash.com/... or click fetch to auto-extract" 
                        className="flex-1 p-2 border rounded text-xs" 
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!travelData.mapsLink) {
                            showToast("Please enter a Google Maps Link first!", "error");
                            return;
                          }
                          showToast("Resolving hotel photo from Maps Link...", "info");
                          try {
                            const res = await fetch(`/api/maps-photo?url=${encodeURIComponent(travelData.mapsLink)}`);
                            if (!res.ok) throw new Error("Could not resolve map photo");
                            const data = await res.json();
                            if (data.photoUrl) {
                              setTravelData(prev => ({ ...prev, hotelPhotoUrl: data.photoUrl }));
                              showToast("Resolved hotel photo successfully! ✓", "success");
                            } else {
                              showToast("No main photo found in maps preview page. Try using another location link or entering an image URL.", "info");
                            }
                          } catch (e: any) {
                            showToast(`Failed to parse photo: ${e.message}`, "error");
                          }
                        }}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition-colors whitespace-nowrap"
                      >
                        ⚡ Fetch from Maps
                      </button>
                    </div>
                    {travelData.hotelPhotoUrl && (
                      <div className="mt-2 text-center">
                        <span className="text-xs font-semibold text-gray-400 block mb-1">Preview:</span>
                        <img 
                          src={travelData.hotelPhotoUrl} 
                          alt="Hotel Preview" 
                          className="mx-auto max-h-40 rounded object-cover shadow border bg-gray-100"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-lg max-w-max mx-auto shadow-sm hover:bg-yellow-100 transition-colors">
                <input type="checkbox" name="applyToAllTravel" checked={applyToAllTravel} onChange={(e) => setApplyToAllTravel(e.target.checked)} className="accent-yellow-500 w-5 h-5"/>
                <span className="font-bold text-sm">Apply these travel & hotel details to ALL users</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-lg max-w-max mx-auto shadow-sm hover:bg-yellow-100 transition-colors">
                <input type="checkbox" name="applyFeaturesToAll" checked={applyFeaturesToAll} onChange={(e) => setApplyFeaturesToAll(e.target.checked)} className="accent-yellow-500 w-5 h-5"/>
                <span className="font-bold text-sm">Apply these feature access settings to ALL users</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-lg max-w-max mx-auto shadow-sm hover:bg-yellow-100 transition-colors">
                <input type="checkbox" name="applyFieldsToAll" checked={applyFieldsToAll} onChange={(e) => setApplyFieldsToAll(e.target.checked)} className="accent-yellow-500 w-5 h-5"/>
                <span className="font-bold text-sm">Apply these field visibility settings to ALL users</span>
              </label>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-4">
              {FEATURES.map(feature => {
                const fa = featureAccess[feature.key] || { access: false, status: "coming_soon" };
                const isOn = fa.access === true;

                return (
                  <div key={feature.key} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{feature.icon}</span>
                        <div>
                          <p className="text-gray-900 font-semibold text-sm">{feature.label}</p>
                          <p className="text-gray-500 text-xs">{feature.desc}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFeatureAccess(feature.key)}
                        className={`relative inline-flex items-center w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none border ${isOn ? "bg-yellow-500 border-yellow-600" : "bg-gray-200 border-gray-300"}`}
                      >
                        <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${isOn ? "translate-x-8" : "translate-x-1"}`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">Access:</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isOn ? "bg-yellow-100 text-yellow-800 border border-yellow-200" : "bg-gray-200 text-gray-600 border border-gray-300"}`}>
                        {isOn ? "ON" : "OFF"}
                      </span>
                    </div>
                    {isOn && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">Status:</span>
                        <select
                          value={fa.status || "full"}
                          onChange={e => setFeatureStatus(feature.key, e.target.value)}
                          className="bg-white border border-gray-300 text-gray-900 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        >
                          <option value="full">✅ Full Access</option>
                          <option value="coming_soon">🔒 Coming Soon</option>
                        </select>
                        {fa.status === "full" && (
                          <span className="text-xs bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-full">Full Access</span>
                        )}
                        {fa.status === "coming_soon" && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full">Coming Soon</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 4 && (
            <div className="space-y-4">
              {FIELD_SECTIONS.map(section => (
                <div key={section.label} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h4 className="text-gray-900 font-bold text-sm">{section.label}</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.fields, true)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        All
                      </button>
                      <span className="text-gray-400">|</span>
                      <button
                        type="button"
                        onClick={() => toggleSection(section.fields, false)}
                        className="text-xs text-gray-500 hover:text-gray-700 font-semibold"
                      >
                        None
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {section.fields.map(field => (
                      <label key={field.key} className="flex items-center gap-2 cursor-pointer group hover:bg-gray-100 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={visibleFields[field.key] !== false}
                          onChange={() => toggleField(field.key)}
                          className="w-4 h-4 accent-yellow-500 cursor-pointer"
                        />
                        <span className="text-gray-700 text-sm group-hover:text-gray-900 transition-colors font-medium">
                          {field.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button onClick={onClose} disabled={isSaving} className="px-6 py-2 bg-white border rounded shadow-sm hover:bg-gray-100 font-bold disabled:opacity-50">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-yellow-500 rounded shadow hover:bg-yellow-600 text-black font-bold disabled:opacity-50 flex items-center justify-center min-w-[140px]">
            {isSaving ? <span className="animate-pulse">Saving...</span> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
