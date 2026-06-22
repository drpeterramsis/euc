import fs from 'fs';
import path from 'path';

// Define the source CSV data from user request
const csvData = `Booking_Ref,Document_Issue_Date,Group_Name,Traveler_Name,Agency,Agency_Address,Emergency_Contact,Agency_Telephone,Agency_Email,E_Ticket_Number,Airline,Airline_Booking_Ref,Emissions_kgCO2_total_party,Outbound_Flight_Number,Outbound_Departure_Date,Outbound_Departure_Time,Outbound_Departure_City,Outbound_Departure_Airport,Outbound_Departure_Terminal,Outbound_Arrival_Date,Outbound_Arrival_Time,Outbound_Arrival_City,Outbound_Arrival_Airport,Outbound_Arrival_Terminal,Outbound_Duration,Outbound_Stops,Outbound_Booking_Status,Outbound_Class,Outbound_Baggage_Allowance,Outbound_Equipment,Outbound_Meal,Outbound_Special_Meal,Outbound_Frequent_Flyer_Number,Return_Flight_Number,Return_Departure_Date,Return_Departure_Time,Return_Departure_City,Return_Departure_Airport,Return_Departure_Terminal,Return_Arrival_Date,Return_Arrival_Time,Return_Arrival_City,Return_Arrival_Airport,Return_Arrival_Terminal,Return_Duration,Return_Stops,Return_Booking_Status,Return_Class,Return_Baggage_Allowance,Return_Equipment,Return_Meal,Return_Special_Meal,Return_Frequent_Flyer_Number,Misc_Date,Misc_Type,Misc_Location,Misc_Status
ZJNTDI,11 June 2026,Groupdesk,Mahmoud Ibrahem,MINDSET TRAVEL EGYPT,"14 Kawthar Street, Mohandesin, Cairo",00201281282077,0020237619940 - 37619960,flightbooking@mindsettraveleg.com,077-6908093862,Egyptair,ZJNTDI,398.79,MS 789,25 June 2026,12:50,Cairo,Cairo Intl,3,25 June 2026,15:45,Prague,Vaclav Havel,1,03:55,Non stop,Confirmed,Economy,2 Piece(s),AIRBUS A320NEO,Flight meal,,,MS 790,28 June 2026,16:55,Prague,Vaclav Havel,1,28 June 2026,21:45,Cairo,Cairo Intl,3,03:50,Non stop,Confirmed,Economy,2 Piece(s),BOEING 737-800,Flight meal,,,30 December 2026,Miscellaneous,Cairo,Confirmed
ZDKDBD,17 June 2026,Groupdesk,Ahmed Elbatanouny,MINDSET TRAVEL EGYPT,"14 Kawthar Street, Mohandesin, Cairo",00201281282077,0020237619940 - 37619960,flightbooking@mindsettraveleg.com,077-6908093878,Egyptair,ZDKDBD,398.79,MS 789,25 June 2026,12:50,Cairo,Cairo Intl,3,25 June 2026,15:45,Prague,Vaclav Havel,1,03:55,Non stop,Confirmed,Economy,2 Piece(s),AIRBUS A320NEO,Flight meal,,,MS 790,28 June 2026,16:55,Prague,Vaclav Havel,1,28 June 2026,21:45,Cairo,Cairo Intl,3,03:50,Non stop,Confirmed,Economy,2 Piece(s),BOEING 737-800,Flight meal,,,30 December 2026,Miscellaneous,Cairo,Confirmed
ZDKDBD,17 June 2026,Groupdesk,Mahmoud Mobark,MINDSET TRAVEL EGYPT,"14 Kawthar Street, Mohandesin, Cairo",00201281282077,0020237619940 - 37619960,flightbooking@mindsettraveleg.com,077-6908093879,Egyptair,ZDKDBD,398.79,MS 789,25 June 2026,12:50,Cairo,Cairo Intl,3,25 June 2026,15:45,Prague,Vaclav Havel,1,03:55,Non stop,Confirmed,Economy,2 Piece(s),AIRBUS A320NEO,Flight meal,,,MS 790,28 June 2026,16:55,Prague,Vaclav Havel,1,28 June 2026,21:45,Cairo,Cairo Intl,3,03:50,Non stop,Confirmed,Economy,2 Piece(s),BOEING 737-800,Flight meal,,,30 December 2026,Miscellaneous,Cairo,Confirmed`;

// Helper: csv parsing
function parseCSV(content) {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]);
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const rec = {};
    headers.forEach((h, idx) => {
      rec[h] = values[idx] || "";
    });
    records.push(rec);
  }
  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Helper: Normalize name
function normalizeName(name) {
  if (!name) return "";
  let clean = name.toLowerCase().trim();
  // Strip prefixes and titles: Dr, Mr, Mrs, Ms, Prof
  clean = clean.replace(/^(dr|prof|mr|mrs|ms)(\.|\b)\s*/i, "");
  // Remove punctuation
  clean = clean.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  // Collapse spaces and trim
  clean = clean.replace(/\s+/g, " ");
  return clean.trim();
}

// Date formatter: Convert e.g. "25 June 2026" to "2026-06-25"
function formatDate(dateStr) {
  if (!dateStr) return "";
  const cleaned = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  const parts = cleaned.split(/\s+/);
  if (parts.length < 3) return cleaned;
  const day = parts[0].padStart(2, '0');
  const monthName = parts[1].toLowerCase();
  const year = parts[2];
  
  let month = "06";
  if (monthName.includes("jan")) month = "01";
  else if (monthName.includes("feb")) month = "02";
  else if (monthName.includes("mar")) month = "03";
  else if (monthName.includes("apr")) month = "04";
  else if (monthName.includes("may")) month = "05";
  else if (monthName.includes("jun")) month = "06";
  else if (monthName.includes("jul")) month = "07";
  else if (monthName.includes("aug")) month = "08";
  else if (monthName.includes("sep")) month = "09";
  else if (monthName.includes("oct")) month = "10";
  else if (monthName.includes("nov")) month = "11";
  else if (monthName.includes("dec")) month = "12";
  
  return `${year}-${month}-${day}`;
}

// Canonical Airport Details
function getAirportDetails(city) {
  const norm = (city || "").toLowerCase().trim();
  if (norm.includes("cairo")) {
    return {
      display: "Cairo, (Cairo Intl)",
      link: "https://maps.app.goo.gl/eqq3eSQEkkb9nEPz7",
      photo: "https://dl.dropboxusercontent.com/scl/fi/bck8538s5pp109ns47tk7/cairo_airport.webp?rlkey=ikmzh780qea8juim09o44bp9p&st=sov4t97n"
    };
  } else if (norm.includes("prague")) {
    return {
      display: "Prague, (Vaclav Havel)",
      link: "https://maps.app.goo.gl/hEMvxstxDQ3ySn447",
      photo: "https://dl.dropboxusercontent.com/scl/fi/kjjra5b0zs63ubfupye3a/prague_airport.jpg?rlkey=bd40zfck0pbbdh2te8jipk4xi&st=cy4e4qvc"
    };
  } else if (norm.includes("munich")) {
    return {
      display: "Munich, (Munich International)",
      link: "https://maps.app.goo.gl/q2qXGh6H8n9yZjV27",
      photo: "https://dl.dropboxusercontent.com/scl/fi/rg9wm8k1t2bno2l00uewe/munich.webp?rlkey=6p5kciszqgmllgkjkqa3nopr1&st=4qzgrebu"
    };
  }
  return {
    display: city,
    link: "",
    photo: ""
  };
}

// Timezone Mapper
function getTimezone(city) {
  const norm = (city || "").toLowerCase().trim();
  if (norm.includes("cairo")) {
    return "Africa/Cairo";
  } else if (norm.includes("prague")) {
    return "Europe/Prague";
  } else if (norm.includes("munich")) {
    return "Europe/Berlin";
  }
  return "UTC";
}

// Construct Flight Details payload for a CSV record
function constructFlightDetails(row) {
  const outDep = getAirportDetails(row.Outbound_Departure_City);
  const outArr = getAirportDetails(row.Outbound_Arrival_City);
  const retDep = getAirportDetails(row.Return_Departure_City);
  const retArr = getAirportDetails(row.Return_Arrival_City);
  
  const outFreqFlyer = row.Outbound_Frequent_Flyer_Number || "";
  const retFreqFlyer = row.Return_Frequent_Flyer_Number || "";
  const freqFlyer = outFreqFlyer || retFreqFlyer;

  const durationOut = row.Outbound_Duration || "";
  const durationOutStr = durationOut + (row.Outbound_Stops ? ` (${row.Outbound_Stops})` : "");
  
  const departureSeg = {
    flightNumber: row.Outbound_Flight_Number || "",
    date: formatDate(row.Outbound_Departure_Date),
    time: row.Outbound_Departure_Time || "",
    departureAirport: outDep.display,
    departureAirportLink: outDep.link,
    departureAirportPhotoUrl: outDep.photo,
    terminal: row.Outbound_Departure_Terminal || "",
    arrivalAirport: outArr.display,
    arrivalAirportLink: outArr.link,
    arrivalAirportPhotoUrl: outArr.photo,
    arrivalTime: row.Outbound_Arrival_Time || "",
    arrivalDate: formatDate(row.Outbound_Arrival_Date),
    arrivalTerminal: row.Outbound_Arrival_Terminal || "",
    duration: durationOutStr,
    aircraft: row.Outbound_Equipment || "",
    baggage: row.Outbound_Baggage_Allowance || "2 Piece(s)",
    meal: row.Outbound_Meal || "Flight meal",
    specialMeal: row.Outbound_Special_Meal || "",
    cabinClass: row.Outbound_Class || "Economy",
    bookingStatus: row.Outbound_Booking_Status || "Confirmed",
    inputTimezone: getTimezone(row.Outbound_Departure_City),
    timezoneDisplay: "both",
    frequentFlyerNumber: outFreqFlyer,
    gate: "",
    arrivalGate: ""
  };

  let arrivalSeg = null;
  if (row.Return_Flight_Number) {
    const durationRet = row.Return_Duration || "";
    const durationRetStr = durationRet + (row.Return_Stops ? ` (${row.Return_Stops})` : "");
    arrivalSeg = {
      flightNumber: row.Return_Flight_Number || "",
      date: formatDate(row.Return_Departure_Date),
      time: row.Return_Departure_Time || "",
      departureAirport: retDep.display,
      departureAirportLink: retDep.link,
      departureAirportPhotoUrl: retDep.photo,
      terminal: row.Return_Departure_Terminal || "",
      arrivalAirport: retArr.display,
      arrivalAirportLink: retArr.link,
      arrivalAirportPhotoUrl: retArr.photo,
      arrivalTime: row.Return_Arrival_Time || "",
      arrivalDate: formatDate(row.Return_Arrival_Date),
      arrivalTerminal: row.Return_Arrival_Terminal || "",
      duration: durationRetStr,
      aircraft: row.Return_Equipment || "",
      baggage: row.Return_Baggage_Allowance || "2 Piece(s)",
      meal: row.Return_Meal || "Flight meal",
      specialMeal: row.Return_Special_Meal || "",
      cabinClass: row.Return_Class || "Economy",
      bookingStatus: row.Return_Booking_Status || "Confirmed",
      inputTimezone: getTimezone(row.Return_Departure_City),
      timezoneDisplay: "both",
      frequentFlyerNumber: retFreqFlyer,
      gate: "",
      arrivalGate: ""
    };
  }

  return {
    bookingReference: row.Booking_Ref || "",
    ticketNumber: row.E_Ticket_Number || "",
    documentIssueDate: row.Document_Issue_Date || "",
    airlineCode: row.Airline === "Egyptair" ? "MS (Egyptair)" : (row.Airline || ""),
    frequentFlyerNumber: freqFlyer,
    bookingStatus: row.Outbound_Booking_Status || "Confirmed",
    cabinClass: row.Outbound_Class || "Economy",
    baggageAllowance: row.Outbound_Baggage_Allowance || "2 Piece(s)",
    aircraft: row.Outbound_Equipment || "",
    meal: row.Outbound_Meal || "Flight meal",
    duration: durationOut,
    departure: departureSeg,
    arrival: arrivalSeg
  };
}

// Brand Replacement: STANDALONE word EVA -> Experts of
function replaceEVABrand(value) {
  if (typeof value === "string") {
    // replace standard word boundary 'EVA'
    return value.replace(/\bEVA\b/g, "Experts of");
  } else if (Array.isArray(value)) {
    return value.map(replaceEVABrand);
  } else if (value !== null && typeof value === "object") {
    const newVal = {};
    for (const key of Object.keys(value)) {
      newVal[key] = replaceEVABrand(value[key]);
    }
    return newVal;
  }
  return value;
}

function run() {
  const usersPath = path.join(process.cwd(), 'data', 'users.json');
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  
  const records = parseCSV(csvData);
  
  const patches = [];
  const not_found = [];
  const conflicts = [];
  
  // Track system users to see modifications and updates
  const updatedUsers = users.map(user => {
    // Make sure we apply global branding replacements to existing fields
    return replaceEVABrand(user);
  });
  
  for (const row of records) {
    const travelerNameOriginal = row.Traveler_Name;
    const travelerNameNorm = normalizeName(travelerNameOriginal);
    
    // Find matching candidates
    const candidates = [];
    const travelerWords = travelerNameNorm.split(' ');
    
    for (const u of updatedUsers) {
      const uNameNorm = normalizeName(u.name);
      const userWords = uNameNorm.split(' ');
      
      // Option 1: Contiguous substring matching
      const contiguousMatch = uNameNorm.includes(travelerNameNorm) || travelerNameNorm.includes(uNameNorm);
      
      // Option 2: Word-set containment matching (all words of one are in the other)
      const wordSetMatch = travelerWords.every(w => userWords.includes(w)) || userWords.every(w => travelerWords.includes(w));
      
      if (contiguousMatch || wordSetMatch) {
        candidates.push(u);
      }
    }
    
    const ticketNo = row.E_Ticket_Number;
    const rebuiltFlightDetails = constructFlightDetails(row);
    // Apply branding replacement to flightDetails as well just in case
    const rebuiltFlightDetailsBranded = replaceEVABrand(rebuiltFlightDetails);
    
    if (candidates.length === 0) {
      not_found.push({
        excelTravelerName: travelerNameOriginal,
        ticketNumber: ticketNo,
        reason: "No user found with a matching name containing or contained within the normalized traveler name",
        flightDetails: rebuiltFlightDetailsBranded
      });
    } else if (candidates.length > 1) {
      conflicts.push({
        excelTravelerName: travelerNameOriginal,
        ticketNumber: ticketNo,
        reason: "Multiple candidates matched the traveler name of " + travelerNameOriginal,
        candidateUserIds: candidates.map(c => c.id)
      });
    } else {
      const matchUser = candidates[0];
      
      // Update the user record's flightDetails completely
      matchUser.flightDetails = rebuiltFlightDetailsBranded;
      
      patches.push({
        userId: matchUser.id,
        userName: matchUser.name,
        matchMethod: "name",
        excelTravelerName: travelerNameOriginal,
        updatedFlightDetails: rebuiltFlightDetailsBranded
      });
    }
  }
  
  // Write the users file back (if patched)
  fs.writeFileSync(usersPath, JSON.stringify(updatedUsers, null, 2));
  
  // also update public copy if it exists!
  const publicUsersPath = path.join(process.cwd(), 'public', 'data', 'users.json');
  if (fs.existsSync(publicUsersPath)) {
    fs.writeFileSync(publicUsersPath, JSON.stringify(updatedUsers, null, 2));
  }
  
  // Prepare final JSON payload
  const result = {
    patches,
    not_found,
    conflicts
  };
  
  fs.writeFileSync(path.join(process.cwd(), 'scripts', 'result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

run();
