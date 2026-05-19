const fs = require('fs');

const usersPath = './data/users.json';
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

const hotelData = {
    name: "Vienna House Diplomat Prague",
    mapsLink: "https://maps.app.goo.gl/PuScYyJrgmk4SMq58",
    address: "",
    checkIn: "",
    checkOut: "",
    roomNumber: ""
};

const flightDetailsData = {
    departure: {
        flightNumber: "MS.789",
        date: "25 June 2026",
        terminal: "3",
        time: "",
        departureAirport: "",
        arrivalAirport: ""
    },
    arrival: {
        flightNumber: "MS.790",
        date: "28 June 2026",
        terminal: "1",
        time: "",
        departureAirport: "",
        arrivalAirport: ""
    }
};

users.forEach(u => {
    u.hotel = {
        ...(u.hotel || {}),
        name: hotelData.name,
        mapsLink: hotelData.mapsLink
    };

    u.flightDetails = {
        departure: {
            ...(u.flightDetails?.departure || {}),
            flightNumber: flightDetailsData.departure.flightNumber,
            date: flightDetailsData.departure.date,
            terminal: flightDetailsData.departure.terminal
        },
        arrival: {
            ...(u.flightDetails?.arrival || {}),
            flightNumber: flightDetailsData.arrival.flightNumber,
            date: flightDetailsData.arrival.date,
            terminal: flightDetailsData.arrival.terminal
        }
    };
});

fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
console.log('Successfully updated users.json flights and hotel.');
