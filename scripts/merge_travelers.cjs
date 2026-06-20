const fs = require('fs');

const MAP = {
  "abdelnaser elgamasy": "Abdel Naser Khalifa Soliman Elgamasy",
  "ahmed abdalla": "Ahmed Abouelez Abdelfattah Abdalla",
  "ahmed abdellatif": "Ahmed Elsayed Ahmed Abdellatif",
  "ahmd abosief": "Ahmed Fathy Mohamed Abosief",
  "ahmed abouzaid": "Ahmed Hassan Ibrahim Abouzaid",
  "ahmed abouzamel": "Ahmed Hossameldin Ferig Mohamed Abouzamel",
  "dr amr elkholy": "Amr Ahmed Badawi Mohamed Elkholy",
  "aref eid": "Aref Mohamed Maarouf Eid",
  "ashraf shahin": "Ashraf Mohamed Samy Shahin",
  "ayman ibrahim": "Ayman Ishak Bushra Ibrahim",
  "ayman rashed": "Ayman Sayed Ahmed Rashed",
  "emad ibrahim": "Emad Moustafa Gaber Ibrahim",
  "enmar habib": "Enmar Ibrahim Mohamed Habib",
  "hamada abdelhameed": "Hamada Ahmed Youssof Abdelhameed",
  "hany ahmed": "Hany Fathy Mohamed Ahmed",
  "hazem abdel moneim": "Hazem Rashad",
  "hisham hussein": "Hisham Ibrahim Mohamed Hussein",
  "hisham elshawaf": "Hisham Mohamed Fathey Salama Elshawaf",
  "hosam hanoun": "Hosam Mahdy Said Hanoun",
  "hussein aly": "Hussein Aly Hussein Aly",
  "joseph shenoda": "Joseph William Azmy Shenoda",
  "karim saad": "Karim Saad Mohamed Saad",
  "mohamed elogairy": "Mohamed Abdou Abdelrassoul Elogairy",
  "mohamed elgahawy": "Mohamed Eissa Ali Elgahawy",
  "mohamed aboshabayek": "Mohamed Ismail Abdellatif Aboshabayek",
  "mohamed elgammal": "Mohamed Youssef Abdelkader Elgammal",
  "saber mohamed": "Saber Hassouna Hassan Mohamed",
  "sultan moshrky": "Sultan Fakhry Khalifa Soliman",
  "tamer elsayed": "Tamer Elsayed Helmy Elsayed",
  "wael ali": "Wael Mohamed Farhat Ali",
  "wael khalil": "Wael Mohamed Sameh Taha Abdelmoneim Khalil",
  "walid youssef": "Walid Milad Said Youssef",
  "happy tawdrous": "Happy Raafat",
  "michael bebawy": "Michael Melad Kamel"
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 3) return dateStr;
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

function parseCSV(content) {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];
  
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
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

function getAirportLinkAndPhoto(city, defaultLink, defaultPhoto) {
  if (!city) return { link: defaultLink, photo: defaultPhoto };
  const lowercase = city.toLowerCase();
  if (lowercase.includes("cairo")) {
    return {
      link: "https://maps.app.goo.gl/eqq3eSQEkkb9nEPz7",
      photo: "https://dl.dropboxusercontent.com/scl/fi/bck8538s5pp109ns47tk7/cairo_airport.webp?rlkey=ikmzh780qea8juim09o44bp9p&st=sov4t97n"
    };
  } else if (lowercase.includes("prague")) {
    return {
      link: "https://maps.app.goo.gl/hEMvxstxDQ3ySn447",
      photo: "https://dl.dropboxusercontent.com/scl/fi/kjjra5b0zs63ubfupye3a/prague_airport.jpg?rlkey=bd40zfck0pbbdh2te8jipk4xi&st=cy4e4qvc"
    };
  } else if (lowercase.includes("munich")) {
    return {
      link: "https://maps.app.goo.gl/q2qXGh6H8n9yZjV27",
      photo: "https://dl.dropboxusercontent.com/scl/fi/rg9wm8k1t2bno2l00uewe/munich.webp?rlkey=6p5kciszqgmllgkjkqa3nopr1&st=4qzgrebu"
    };
  } else {
    return {
      link: defaultLink,
      photo: defaultPhoto
    };
  }
}

function main() {
  const travelersCSV = fs.readFileSync('./data/travelers.csv', 'utf8');
  const travelers = parseCSV(travelersCSV);
  
  const usersJSON = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
  
  console.log(`Loaded ${travelers.length} travelers and ${usersJSON.length} users.`);
  
  let matchCount = 0;
  
  for (const t of travelers) {
    const rawName = t.Traveler_Name || "";
    const cleanName = rawName.trim().toLowerCase();
    const targetFullName = MAP[cleanName];
    
    if (!targetFullName) {
      console.warn(`No MAP record found for traveler: "${rawName}"`);
      continue;
    }
    
    const userObj = usersJSON.find(u => u.name.toLowerCase() === targetFullName.toLowerCase());
    if (!userObj) {
      console.warn(`Could not find user in users.json with full name: "${targetFullName}"`);
      continue;
    }
    
    matchCount++;
    
    // Format dates
    const outboundDepDate = formatDate(t.Outbound_Departure_Date);
    const outboundArrDate = formatDate(t.Outbound_Arrival_Date);
    const returnDepDate = formatDate(t.Return_Departure_Date);
    const returnArrDate = formatDate(t.Return_Arrival_Date);
    
    const outDepDetails = getAirportLinkAndPhoto(
      t.Outbound_Departure_City,
      "https://maps.app.goo.gl/eqq3eSQEkkb9nEPz7",
      "https://dl.dropboxusercontent.com/scl/fi/bck8538s5pp109ns47tk7/cairo_airport.webp?rlkey=ikmzh780qea8juim09o44bp9p&st=sov4t97n"
    );
    const outArrDetails = getAirportLinkAndPhoto(
      t.Outbound_Arrival_City,
      "https://maps.app.goo.gl/hEMvxstxDQ3ySn447",
      "https://dl.dropboxusercontent.com/scl/fi/kjjra5b0zs63ubfupye3a/prague_airport.jpg?rlkey=bd40zfck0pbbdh2te8jipk4xi&st=cy4e4qvc"
    );
    const retDepDetails = getAirportLinkAndPhoto(
      t.Return_Departure_City,
      "https://maps.app.goo.gl/hEMvxstxDQ3ySn447",
      "https://dl.dropboxusercontent.com/scl/fi/kjjra5b0zs63ubfupye3a/prague_airport.jpg?rlkey=bd40zfck0pbbdh2te8jipk4xi&st=cy4e4qvc"
    );
    const retArrDetails = getAirportLinkAndPhoto(
      t.Return_Arrival_City,
      "https://maps.app.goo.gl/eqq3eSQEkkb9nEPz7",
      "https://dl.dropboxusercontent.com/scl/fi/bck8538s5pp109ns47tk7/cairo_airport.webp?rlkey=ikmzh780qea8juim09o44bp9p&st=sov4t97n"
    );
    
    const freqFlyer = t.Outbound_Frequent_Flyer_Number || t.Return_Frequent_Flyer_Number || "";
    
    const flightDetails = {
      bookingReference: t.Booking_Ref || "",
      ticketNumber: t.E_Ticket_Number || "",
      documentIssueDate: t.Document_Issue_Date || "",
      airlineCode: `${t.Airline === 'Egyptair' ? 'MS (Egyptair)' : t.Airline}`,
      frequentFlyerNumber: freqFlyer,
      bookingStatus: t.Outbound_Booking_Status || "Confirmed",
      cabinClass: t.Outbound_Class || "Economy",
      baggageAllowance: t.Outbound_Baggage_Allowance || "2 Piece(s)",
      aircraft: t.Outbound_Equipment || "",
      meal: t.Outbound_Meal || "Meal",
      duration: t.Outbound_Duration || "",
      departure: {
        flightNumber: t.Outbound_Flight_Number || "",
        date: outboundDepDate,
        time: t.Outbound_Departure_Time || "",
        departureAirport: `${t.Outbound_Departure_City}, (${t.Outbound_Departure_Airport})`,
        departureAirportLink: outDepDetails.link,
        departureAirportPhotoUrl: outDepDetails.photo,
        arrivalAirport: `${t.Outbound_Arrival_City}, (${t.Outbound_Arrival_Airport})`,
        arrivalAirportLink: outArrDetails.link,
        arrivalAirportPhotoUrl: outArrDetails.photo,
        terminal: t.Outbound_Departure_Terminal || "",
        gate: "",
        inputTimezone: "Africa/Cairo",
        timezoneDisplay: "both",
        arrivalTime: t.Outbound_Arrival_Time || "",
        arrivalDate: outboundArrDate,
        arrivalTerminal: t.Outbound_Arrival_Terminal || "",
        arrivalGate: "",
        duration: `${t.Outbound_Duration} (${t.Outbound_Stops})`,
        aircraft: t.Outbound_Equipment || "",
        baggage: t.Outbound_Baggage_Allowance || "2 Piece(s)",
        meal: t.Outbound_Meal || "Meal",
        specialMeal: t.Outbound_Special_Meal || "",
        cabinClass: t.Outbound_Class || "Economy",
        bookingStatus: t.Outbound_Booking_Status || "Confirmed",
        frequentFlyerNumber: freqFlyer
      },
      arrival: {
        flightNumber: t.Return_Flight_Number || "",
        date: returnDepDate,
        time: t.Return_Departure_Time || "",
        departureAirport: `${t.Return_Departure_City}, (${t.Return_Departure_Airport})`,
        departureAirportLink: retDepDetails.link,
        departureAirportPhotoUrl: retDepDetails.photo,
        arrivalAirport: `${t.Return_Arrival_City}, (${t.Return_Arrival_Airport})`,
        arrivalAirportLink: retArrDetails.link,
        arrivalAirportPhotoUrl: retArrDetails.photo,
        terminal: t.Return_Departure_Terminal || "",
        gate: "",
        inputTimezone: t.Return_Departure_City.toLowerCase().includes("prague") ? "Europe/Prague" : "Africa/Cairo",
        timezoneDisplay: "both",
        arrivalTime: t.Return_Arrival_Time || "",
        arrivalDate: returnArrDate,
        arrivalTerminal: t.Return_Arrival_Terminal || "",
        arrivalGate: "",
        duration: `${t.Return_Duration} (${t.Return_Stops})`,
        aircraft: t.Return_Equipment || "",
        baggage: t.Return_Baggage_Allowance || "2 Piece(s)",
        meal: t.Return_Meal || "Meal",
        specialMeal: t.Return_Special_Meal || "",
        cabinClass: t.Return_Class || "Economy",
        bookingStatus: t.Return_Booking_Status || "Confirmed",
        frequentFlyerNumber: freqFlyer
      }
    };
    
    const hotel = {
      name: "Vienna House Diplomat Prague",
      address: "Evropská 15, 160 41 Praha 6, Czech Republic",
      checkIn: outboundDepDate,
      checkOut: returnDepDate,
      roomNumber: userObj.hotel?.roomNumber || "Allocated upon arrival",
      mapsLink: "https://maps.app.goo.gl/526iVtZV4oZUQ8Sh6",
      photoUrl: "https://dl.dropboxusercontent.com/scl/fi/lf60zdhhkwucu3zhmc074/Diplomat-Hotel-Prague.png?rlkey=iit6sq96u71ug40mb3603yyky&st=ojhoihcn"
    };
    
    userObj.flightDetails = flightDetails;
    userObj.hotel = hotel;
    userObj.isActive = true;
    userObj.status = true;
    
    if (!userObj.featureAccess) {
      userObj.featureAccess = {
        sessions: { access: true, status: "full" },
        schedule: { access: true, status: "full" },
        photoGallery: { access: true, status: "coming_soon" },
        documents: { access: true, status: "coming_soon" }
      };
    }
    if (!userObj.visibleFields) {
      userObj.visibleFields = {
        flightNumber: true, departureDate: true, departureTime: true,
        departureAirport: true, arrivalAirport: true, arrivalTime: true,
        hotelName: true, hotelAddress: true, checkIn: true,
        checkOut: true, roomNumber: true, mapsLink: true,
        transfers: true, email: true, phone: true
      };
    }
  }
  
  // Set default ticket on remaining doctors just in case
  for (const u of usersJSON) {
    if (u.role === 'doctor' && (!u.flightDetails || !u.flightDetails.departure)) {
      u.flightDetails = {
        bookingReference: "ZJNTDI",
        ticketNumber: "077-6908093816",
        documentIssueDate: "11 June 2026",
        airlineCode: "MS (Egyptair)",
        frequentFlyerNumber: "",
        bookingStatus: "Confirmed",
        cabinClass: "Economy",
        baggageAllowance: "2 Piece(s)",
        aircraft: "AIRBUS A320NEO",
        meal: "Meal",
        duration: "03:55",
        departure: {
          flightNumber: "MS 789",
          date: "2026-06-25",
          time: "12:50",
          departureAirport: "Cairo, (Cairo Intl)",
          departureAirportLink: "https://maps.app.goo.gl/eqq3eSQEkkb9nEPz7",
          departureAirportPhotoUrl: "https://dl.dropboxusercontent.com/scl/fi/bck8538s5pp109ns47tk7/cairo_airport.webp?rlkey=ikmzh780qea8juim09o44bp9p&st=sov4t97n",
          arrivalAirport: "Prague, (Vaclav Havel)",
          arrivalAirportLink: "https://maps.app.goo.gl/hEMvxstxDQ3ySn447",
          arrivalAirportPhotoUrl: "https://dl.dropboxusercontent.com/scl/fi/kjjra5b0zs63ubfupye3a/prague_airport.jpg?rlkey=bd40zfck0pbbdh2te8jipk4xi&st=cy4e4qvc",
          terminal: "3",
          gate: "",
          inputTimezone: "Africa/Cairo",
          timezoneDisplay: "both",
          arrivalTime: "15:45",
          arrivalDate: "2026-06-25",
          arrivalTerminal: "3",
          arrivalGate: "",
          duration: "03:55 (Non stop)",
          aircraft: "AIRBUS A320NEO",
          baggage: "2 Piece(s)",
          meal: "Meal",
          specialMeal: "",
          cabinClass: "Economy",
          bookingStatus: "Confirmed",
          frequentFlyerNumber: ""
        },
        arrival: {
          flightNumber: "MS 790",
          date: "2026-06-28",
          time: "16:55",
          departureAirport: "Prague, (Vaclav Havel)",
          departureAirportLink: "https://maps.app.goo.gl/hEMvxstxDQ3ySn447",
          departureAirportPhotoUrl: "https://dl.dropboxusercontent.com/scl/fi/kjjra5b0zs63ubfupye3a/prague_airport.jpg?rlkey=bd40zfck0pbbdh2te8jipk4xi&st=cy4e4qvc",
          arrivalAirport: "Cairo, (Cairo Intl)",
          arrivalAirportLink: "https://maps.app.goo.gl/eqq3eSQEkkb9nEPz7",
          arrivalAirportPhotoUrl: "https://dl.dropboxusercontent.com/scl/fi/bck8538s5pp109ns47tk7/cairo_airport.webp?rlkey=ikmzh780qea8juim09o44bp9p&st=sov4t97n",
          terminal: "1",
          gate: "",
          inputTimezone: "Europe/Prague",
          timezoneDisplay: "both",
          arrivalTime: "21:45",
          arrivalDate: "2026-06-28",
          arrivalTerminal: "3",
          arrivalGate: "",
          duration: "03:50 (Non stop)",
          aircraft: "BOEING 737-800",
          baggage: "2 Piece(s)",
          meal: "Meal",
          specialMeal: "",
          cabinClass: "Economy",
          bookingStatus: "Confirmed",
          frequentFlyerNumber: ""
        }
      };
      u.hotel = {
        name: "Vienna House Diplomat Prague",
        address: "Evropská 15, 160 41 Praha 6, Czech Republic",
        checkIn: "2026-06-25",
        checkOut: "2026-06-28",
        roomNumber: u.hotel?.roomNumber || "Allocated upon arrival",
        mapsLink: "https://maps.app.goo.gl/526iVtZV4oZUQ8Sh6",
        photoUrl: "https://dl.dropboxusercontent.com/scl/fi/lf60zdhhkwucu3zhmc074/Diplomat-Hotel-Prague.png?rlkey=iit6sq96u71ug40mb3603yyky&st=ojhoihcn"
      };
    }
  }
  
  fs.writeFileSync('./data/users.json', JSON.stringify(usersJSON, null, 2));
  
  // also update public file of users if it exists
  if (fs.existsSync('./public/data/users.json')) {
    fs.writeFileSync('./public/data/users.json', JSON.stringify(usersJSON, null, 2));
  }
  
  console.log(`Successfully merged ${matchCount} travelers flight and hotel data into /data/users.json.`);
}

main();
