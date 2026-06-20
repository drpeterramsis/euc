const fs = require('fs');

function normalize(s) {
  return s.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
}

function getAirportCanonical(city, airport) {
  const s = normalize(`${city} ${airport}`);
  if (s.includes("cairo")) return {
    link: "https://maps.app.goo.gl/eqq3eSQEkkb9nEPz7",
    photoUrl: "https://dl.dropboxusercontent.com/scl/fi/bck8538s5pp109ns47tk7/cairo_airport.webp?rlkey=ikmzh780qea8juim09o44bp9p&st=sov4t97n",
    display: "Cairo, (Cairo Intl)"
  };
  if (s.includes("prague")) return {
    link: "https://maps.app.goo.gl/hEMvxstxDQ3ySn447",
    photoUrl: "https://dl.dropboxusercontent.com/scl/fi/kjjra5b0zs63ubfupye3a/prague_airport.jpg?rlkey=bd40zfck0pbbdh2te8jipk4xi&st=cy4e4qvc",
    display: "Prague, (Vaclav Havel)"
  };
  if (s.includes("munich")) return {
    link: "https://maps.app.goo.gl/q2qXGh6H8n9yZjV27",
    photoUrl: "https://dl.dropboxusercontent.com/scl/fi/rg9wm8k1t2bno2l00uewe/munich.webp?rlkey=6p5kciszqgmllgkjkqa3nopr1&st=4qzgrebu",
    display: "Munich, (Munich International)"
  };
  return null;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
}

function main() {
  const travelersLines = fs.readFileSync('./data/travelers.csv', 'utf8').split('\n').filter(l => l.trim().length > 0);
  const headers = parseCSVLine(travelersLines[0]);
  const travelers = travelersLines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => obj[h] = vals[i]);
    return obj;
  });

  const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));

  let patches = [];
  let conflicts = [];

  for (const t of travelers) {
    const candidates = users.filter(u => {
      // Rule 1: Ticket Number
      if (u.flightDetails && u.flightDetails.ticketNumber === t.E_Ticket_Number) return true;
      // Rule 2: Name
      if (normalize(u.name).includes(normalize(t.Traveler_Name)) || normalize(t.Traveler_Name).includes(normalize(u.name))) return true;
      return false;
    });

    if (candidates.length === 0) {
      console.warn(`No match for ${t.Traveler_Name}`);
      continue;
    }
    if (candidates.length > 1) {
      conflicts.push({ traveler: t.Traveler_Name, count: candidates.length });
      continue;
    }
    const user = candidates[0];

    // Canonical airports
    const dep = getAirportCanonical(t.Outbound_Departure_City, t.Outbound_Departure_Airport);
    const arr = getAirportCanonical(t.Outbound_Arrival_City, t.Outbound_Arrival_Airport);
    const retDep = getAirportCanonical(t.Return_Departure_City, t.Return_Departure_Airport);
    const retArr = getAirportCanonical(t.Return_Arrival_City, t.Return_Arrival_Airport);

    const flightDetails = {
      bookingReference: t.Booking_Ref,
      ticketNumber: t.E_Ticket_Number,
      documentIssueDate: t.Document_Issue_Date,
      airlineCode: "MS (Egyptair)",
      frequentFlyerNumber: t.Outbound_Frequent_Flyer_Number || "",
      bookingStatus: t.Outbound_Booking_Status,
      cabinClass: t.Outbound_Class,
      baggageAllowance: t.Outbound_Baggage_Allowance,
      aircraft: t.Outbound_Equipment,
      meal: t.Outbound_Meal,
      duration: t.Outbound_Duration,
      departure: {
        flightNumber: t.Outbound_Flight_Number,
        date: t.Outbound_Departure_Date,
        time: t.Outbound_Departure_Time,
        departureAirport: dep.display,
        departureAirportLink: dep.link,
        departureAirportPhotoUrl: dep.photoUrl,
        terminal: t.Outbound_Departure_Terminal,
        arrivalAirport: arr.display,
        arrivalAirportLink: arr.link,
        arrivalAirportPhotoUrl: arr.photoUrl,
        arrivalTime: t.Outbound_Arrival_Time,
        arrivalDate: t.Outbound_Arrival_Date,
        arrivalTerminal: t.Outbound_Arrival_Terminal,
        duration: t.Outbound_Duration + (t.Outbound_Stops ? ` (${t.Outbound_Stops})` : ""),
        aircraft: t.Outbound_Equipment,
        baggage: t.Outbound_Baggage_Allowance,
        meal: t.Outbound_Meal,
        specialMeal: t.Outbound_Special_Meal || "",
        cabinClass: t.Outbound_Class,
        bookingStatus: t.Outbound_Booking_Status,
      },
      arrival: t.Return_Flight_Number ? {
        flightNumber: t.Return_Flight_Number,
        date: t.Return_Departure_Date,
        time: t.Return_Departure_Time,
        departureAirport: retDep.display,
        departureAirportLink: retDep.link,
        departureAirportPhotoUrl: retDep.photoUrl,
        terminal: t.Return_Departure_Terminal,
        arrivalAirport: retArr.display,
        arrivalAirportLink: retArr.link,
        arrivalAirportPhotoUrl: retArr.photoUrl,
        arrivalTime: t.Return_Arrival_Time,
        arrivalDate: t.Return_Arrival_Date,
        arrivalTerminal: t.Return_Arrival_Terminal,
        duration: t.Return_Duration + (t.Return_Stops ? ` (${t.Return_Stops})` : ""),
        aircraft: t.Return_Equipment,
        baggage: t.Return_Baggage_Allowance,
        meal: t.Return_Meal,
        specialMeal: t.Return_Special_Meal || "",
        cabinClass: t.Return_Class,
        bookingStatus: t.Return_Booking_Status,
      } : null
    };

    user.flightDetails = flightDetails;
    patches.push(user.id);
  }

  fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
  console.log(`Updated ${patches.length} users. Conflicts: ${conflicts.length}`);
}

main();
