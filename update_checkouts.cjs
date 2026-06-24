const fs = require('fs');
const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));

users.forEach(user => {
  if (user.hotel) {
    user.hotel.checkOut = "2026-06-28";
  }
});

fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
console.log("Updated all hotel check-out dates to 2026-06-28");
