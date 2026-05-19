const fs = require('fs');

const updatedList = [
  {
    "id": "U001",
    "name": "Abdel Naser Khalifa Soliman Elgamasy",
    "role": "doctor",
    "username": "Abdelnasser.Elgamasy",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/8teq72655v75wp8qb37ck/Abdelnasser.Elgamasy.jpg?rlkey=qwy0205rbk6oe3y02jjrl03yq&st=jyaq66jb"
  },
  {
    "id": "U002",
    "name": "Ahmed Abouelez Abdelfattah Abdalla",
    "role": "doctor",
    "username": "Ahmed.Abouelez",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/o1ejp22gisyzww8kjszqa/Ahmed.Abouelez.jpeg?rlkey=loaltbh0x25m5d2dqrj67dwdk&st=ggvepm4w"
  },
  {
    "id": "U003",
    "name": "Ahmed Elsayed Ahmed Abdellatif",
    "role": "doctor",
    "username": "Ahmed.Abdellatif",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/qkujcyjin2fvn4xu22b32/Ahmed.Abdellatif.jpg?rlkey=c7s0bzweg7r2jbmtx5k6c5pup&st=t84h1k9c"
  },
  {
    "id": "U004",
    "name": "Ahmed Fathy Mohamed Abosief",
    "role": "doctor",
    "username": "Ahmed.Abosief",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/zsw5o58lsb088fx434g1g/Ahmed.Abosief.jpg?rlkey=farxh8tmu6fxw5rrf1jrg9kb5&st=94qc7qsi"
  },
  {
    "id": "U005",
    "name": "Ahmed Hassan Ibrahim Abouzaid",
    "role": "doctor",
    "username": "Ahmed.Abouzaid",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/o1nltt93quwd3cv58g09v/Ahmed.Abouzaid.jpg?rlkey=yvzglk084l4xrzz8cd28sznu5&st=jq24yyxg"
  },
  {
    "id": "U006",
    "name": "Ahmed Hossameldin Ferig Mohamed Abouzamel",
    "role": "doctor",
    "username": "Ahmed.Abouzamel",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/7iyazn1y9332fwpernzy0/Ahmed.Abouzamel.jpg?rlkey=mrzv0mcb1ojwgpefopczmr8ne&st=9ywgqfsz"
  },
  {
    "id": "U007",
    "name": "Amgad Mohammed Younis Hamed",
    "role": "doctor",
    "username": "Amgad.Younis",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/q6eeph6ho8dojj2atvnmf/Amgad.Younis.png?rlkey=wmb4ategiiswzrqup2v2n6b5i&st=oa3wn3wz"
  },
  {
    "id": "U008",
    "name": "Amr Ahmed Badawi Mohamed Elkholy",
    "role": "doctor",
    "username": "Amr.Elkholy",
    "password": "Diamonrecta5mg",
    "photoUrl": ""
  },
  {
    "id": "U009",
    "name": "Aref Mohamed Maarouf Eid",
    "role": "doctor",
    "username": "Aref.Maarouf",
    "password": "Diamonrecta5mg",
    "photoUrl": ""
  },
  {
    "id": "U010",
    "name": "Ashraf Mohamed Samy Shahin",
    "role": "doctor",
    "username": "Ashraf.Shahin",
    "password": "Diamonrecta5mg",
    "photoUrl": ""
  },
  {
    "id": "U011",
    "name": "Ayman Ishak Bushra Ibrahim",
    "role": "doctor",
    "username": "Ayman.Ishak",
    "password": "Diamonrecta5mg",
    "photoUrl": ""
  },
  {
    "id": "U012",
    "name": "Ayman Sayed Ahmed Rashed",
    "role": "doctor",
    "username": "Ayman.Rashed",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/8amofrvt7zxj8de8bdtu9/Ayman.Rashed.jpg?rlkey=3j5pv1p6zkua1gf6zgda88gl2&st=hly2yhp3"
  },
  {
    "id": "U013",
    "name": "Emad Moustafa Gaber Ibrahim",
    "role": "doctor",
    "username": "Emad.Moustafa",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/59sauqkh8ixz6f00gk74o/Emad.Moustafa.jpg?rlkey=3bkhzcm2dxli2iq7px7kgimjk&st=2e09z7dc"
  },
  {
    "id": "U014",
    "name": "Enmar Ibrahim Mohamed Habib",
    "role": "doctor",
    "username": "Enmar.Habib",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/m4qundu3nks2eelmrrxib/Enmar.Habib.jpg?rlkey=ihi1dj3we6d4um0k6zj2ecm5y&st=hlaxqgy2"
  },
  {
    "id": "U015",
    "name": "Hamada Ahmed Youssof Abdelhameed",
    "role": "doctor",
    "username": "Hamada.Youssof",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/mu2jh87erbpi4i210y5lb/Hamada.Youssof.jpg?rlkey=ghjcavtqwsdqrskpybm3gcygy&st=xetrtpbs"
  },
  {
    "id": "U016",
    "name": "Hany Fathy Mohamed Ahmed",
    "role": "doctor",
    "username": "Hany.Fathy",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/vvb0rqe5fsrrpe8edgbk6/Hany.Fathy.jpg?rlkey=mts2linftcxahy36k8btz1y2y&st=vfr8kegu"
  },
  {
    "id": "U017",
    "name": "Hazem Rashad",
    "role": "doctor",
    "username": "Hazem.Rashad",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/rhq5p6zb4ogz8gfwe4jva/Hazem.Rashad.jpg?rlkey=d0kgg5sptu2voidrwf0xb103r&st=j57e7fei"
  },
  {
    "id": "U018",
    "name": "Hisham Ibrahim Mohamed Hussein",
    "role": "doctor",
    "username": "Hisham.Mansour",
    "password": "Diamonrecta5mg",
    "photoUrl": ""
  },
  {
    "id": "U019",
    "name": "Hisham Mohamed Fathey Salama Elshawaf",
    "role": "doctor",
    "username": "Hisham.Elshawaf",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/fwrv7ff8vadqynvt00255/Hisham.Elshawaf.jpg?rlkey=kbge1hpsz0d46147gq3mua3t5&st=n4e3769k"
  },
  {
    "id": "U020",
    "name": "Hosam Mahdy Said Hanoun",
    "role": "doctor",
    "username": "Hosam.Mahdy",
    "password": "Diamonrecta5mg",
    "photoUrl": ""
  },
  {
    "id": "U021",
    "name": "Hussein Aly Hussein Aly",
    "role": "doctor",
    "username": "Hussein.Aly",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/huq532epoxgrbwoq2dnbi/Hussein.Aly.jpg?rlkey=bxijem1bo7s7c6i3nqqeiwuby&st=gefz3xjm"
  },
  {
    "id": "U022",
    "name": "Joseph William Azmy Shenoda",
    "role": "doctor",
    "username": "Joseph.William",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/4q16ograox4v365xe20ro/Joseph.William.jpg?rlkey=m0kww8624k4ljusknyrmdutso&st=tjie1oin"
  },
  {
    "id": "U023",
    "name": "Karim Saad Mohamed Saad",
    "role": "doctor",
    "username": "Karim.Saad",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/fl0205mb1qsswjtr7iim1/Karim.Saad.jpg?rlkey=nxke92zb86ucuvtn92gnj7ztn&st=597amkut"
  },
  {
    "id": "U024",
    "name": "Mahmoud Elsayed Hassanein Abdelaziz Mobark",
    "role": "doctor",
    "username": "Mahmoud.Mobark",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/xlm0o5y92yyb6l4jifxl8/Mahmoud.Mobark.jpeg?rlkey=3g69nthonteq9q6yeeacoel4w&st=62lw7juz"
  },
  {
    "id": "U025",
    "name": "Mohamed Abdou Abdelrassoul Elogairy",
    "role": "doctor",
    "username": "Mohamed.Abdelrassoul",
    "password": "Diamonrecta5mg",
    "photoUrl": ""
  },
  {
    "id": "U026",
    "name": "Mohamed Eissa Ali Elgahawy",
    "role": "doctor",
    "username": "Mohamed.Elgahawy",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/1lgthp425jwqvyygaymxt/Mohamed.elgahawy.jpg?rlkey=icnv8i9jny9lguaatjzfearg0&st=o0fbwf7u"
  },
  {
    "id": "U027",
    "name": "Mohamed Ismail Abdellatif Aboshabayek",
    "role": "doctor",
    "username": "Mohamed.Shabayek",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/oowq48vuoidlffqggghhe/Mohamed.Shabayek.jpg?rlkey=epg934gmmjz3dgxsa29mdwdsy&st=5w182jeu"
  },
  {
    "id": "U028",
    "name": "Mohamed Youssef Abdelkader Elgammal",
    "role": "doctor",
    "username": "Mohamed.Elgammal",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/v6ig4sbmsfoeqwm4ashgd/Mohamed.Elgammal.jpg?rlkey=4vizvk7u3r0mzabkppirmyrkf&st=9kfgd5oc"
  },
  {
    "id": "U029",
    "name": "Saber Hassouna Hassan Mohamed",
    "role": "doctor",
    "username": "Saber.Hassouna",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/26ccz29f3qvwybred9v1z/Saber.Hassouna.jpg?rlkey=a4b8t04dpj4vnf6fpme0gdltj&st=raacflye"
  },
  {
    "id": "U030",
    "name": "Salah Abdelhamid Mohamed Salaheldin Abdelhamid",
    "role": "doctor",
    "username": "Salah.Elhamshary",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/spgbwpaeml0fymkwbkmdh/Salah.Elhamshary.jpg?rlkey=r3u0yehdo6rv3y8q6y662d9vo&st=z7yq19pa"
  },
  {
    "id": "U031",
    "name": "Sultan Fakhry Khalifa Soliman",
    "role": "doctor",
    "username": "Sultan.Fakhry",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/sotz9320qn3ni3f6l0gsi/Sultan.Fakhry.jpg?rlkey=4c25mivv8lii16a5dfc2e9yta&st=nlwzjzts"
  },
  {
    "id": "U032",
    "name": "Tamer Elsayed Helmy Elsayed",
    "role": "doctor",
    "username": "Tamer.Helmy",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/yqpeo2k4wug7ai3akinyj/Tamer.Helmy.jpg?rlkey=ab6fkf07tvg19q94j9lo6zmgt&st=jov1xidp"
  },
  {
    "id": "U033",
    "name": "Wael Mohamed Farhat Ali",
    "role": "doctor",
    "username": "Wael.Farahat",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/q0ux4ruevcx1fghulfnp9/Wael.Farahat.jpg?rlkey=n6zi99qrsxqt93vr4e1vkxuxg&st=t8vpa1oz"
  },
  {
    "id": "U034",
    "name": "Wael Mohamed Sameh Taha Abdelmoneim Khalil",
    "role": "doctor",
    "username": "Wael.Sameh",
    "password": "Diamonrecta5mg",
    "photoUrl": "https://dl.dropboxusercontent.com/scl/fi/3jn07ce9n64eet5wl9k5r/Wael.Sameh.jpg?rlkey=cbpdhif95zwnt2arvn5jz0edp&st=12g6cvn5"
  },
  {
    "id": "U035",
    "name": "Walid Milad Said Youssef",
    "role": "doctor",
    "username": "Walid.Milad",
    "password": "Diamonrecta5mg",
    "photoUrl": ""
  }
];

const existingUsers = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));

const result = [];
// Keep all non-doctor users
for (const u of existingUsers) {
    if (u.role !== 'doctor') {
        result.push(u);
    }
}

// Merge doctors
for (const newUser of updatedList) {
    const existing = existingUsers.find(u => {
        // match by id (case insensitive) or username
        return u.id.toLowerCase() === newUser.id.toLowerCase() || 
               (u.username && u.username.toLowerCase() === newUser.username.toLowerCase());
    });
    
    if (existing) {
        result.push({
            ...existing,
            ...newUser,
            id: newUser.id // standardize ID format to U001, etc.
        });
    } else {
        result.push({
            ...newUser,
            status: true,
            isActive: true,
            featureAccess: {
                sessions: { access: true, status: "full" },
                schedule: { access: true, status: "full" },
                photoGallery: { access: true, status: "coming_soon" },
                documents: { access: true, status: "coming_soon" }
            },
            visibleFields: {
                flightNumber: true, departureDate: true, departureTime: true,
                departureAirport: true, arrivalAirport: true, arrivalTime: true,
                hotelName: true, hotelAddress: true, checkIn: true,
                checkOut: true, roomNumber: true, mapsLink: true,
                transfers: true, email: true, phone: true
            },
            flightDetails: {
                flightNumber: "", departureDate: "", departureTime: "",
                departureAirport: "", arrivalAirport: "", arrivalTime: "",
                returnFlight: "", returnDate: "", returnTime: ""
            },
            hotel: {
                name: "", address: "", checkIn: "", checkOut: "", roomNumber: "", mapsLink: ""
            },
            transfers: []
        });
    }
}

fs.writeFileSync('./data/users.json', JSON.stringify(result, null, 2));
console.log('Successfully updated users.');
