require('dotenv').config();
const mongoose = require('mongoose');
const Member = require('../src/models/Member');

const firstNames = [
  'James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','William','Barbara',
  'David','Elizabeth','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen',
  'Christopher','Lisa','Daniel','Nancy','Matthew','Betty','Anthony','Margaret','Mark','Sandra',
  'Donald','Ashley','Steven','Dorothy','Paul','Kimberly','Andrew','Emily','Joshua','Donna',
  'Kenneth','Michelle','Kevin','Carol','Brian','Amanda','George','Melissa','Timothy','Deborah'
];

const lastNames = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Anderson',
  'Taylor','Thomas','Moore','Martin','Jackson','Thompson','White','Harris','Sanchez','Clark',
  'Ramirez','Lewis','Robinson','Walker','Young','Hall','Allen','King','Wright','Scott',
  'Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Mitchell','Carter',
  'Perez','Roberts','Turner','Phillips','Campbell','Parker','Evans','Edwards','Collins','Stewart'
];

const streets = [
  'Maple St','Oak Ave','Cedar Blvd','Elm Dr','Washington St','Lincoln Ave','Main St',
  'Indiana Ave','Hoosier Ln','Meridian St','College Ave','Wabash Ave','Keystone Blvd',
  'Fall Creek Pkwy','Eagle Creek Rd','Shadeland Ave','Pendleton Pike','Michigan Rd',
  'Emerson Ave','Sherman Dr','Allisonville Rd','Binford Blvd','Georgetown Rd','Kessler Blvd'
];

const cities = [
  ['Indianapolis', '46201'], ['Indianapolis', '46220'], ['Indianapolis', '46240'],
  ['Fort Wayne',   '46801'], ['Evansville',   '47708'], ['South Bend',   '46601'],
  ['Carmel',       '46032'], ['Fishers',      '46037'], ['Bloomington',  '47401'],
  ['Hammond',      '46320'], ['Gary',         '46401'], ['Lafayette',    '47901'],
  ['Muncie',       '47302'], ['Terre Haute',  '47807'], ['Kokomo',       '46901'],
  ['Anderson',     '46011'], ['Greenwood',    '46142'], ['Noblesville',  '46060'],
  ['Elkhart',      '46514'], ['Mishawaka',    '46544']
];

const satellites = ['', '', '', 'DirecTV', 'Dish Network', 'HughesNet', 'Starlink'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randBool(truePct = 0.5) { return Math.random() < truePct; }
function randPhone() {
  const area = ['317','219','260','574','765','812'][Math.floor(Math.random()*6)];
  const n = () => String(Math.floor(Math.random() * 9000000) + 1000000);
  const num = n();
  return `(${area}) ${num.slice(0,3)}-${num.slice(3)}`;
}
function randDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const members = Array.from({ length: 50 }, (_, i) => {
  const firstName = firstNames[i];
  const lastName  = lastNames[i];
  const [city, zip] = rand(cities);
  const recurring  = randBool(0.55);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;

  return {
    firstName,
    lastName,
    addressLine1:    `${Math.floor(Math.random() * 9000) + 100} ${rand(streets)}`,
    addressLine2:    Math.random() < 0.15 ? `Apt ${Math.floor(Math.random()*20)+1}` : undefined,
    city,
    state:           'IN',
    postalZip:       zip,
    primaryPhone:    randPhone(),
    secondaryPhone:  randBool(0.4) ? randPhone() : undefined,
    tertiaryPhone:   randBool(0.15) ? randPhone() : undefined,
    emailAddress:    email,
    satelliteHome:   rand(satellites) || undefined,
    recurringMember: recurring,
    renewalDate:     recurring
      ? randDate(new Date('2026-01-01'), new Date('2027-01-01'))
      : undefined,
    membership_list: randBool(0.7),
    mailing_list:    randBool(0.6),
    email_news:      randBool(0.5),
    hide_email:      randBool(0.2),
  };
});

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://db:27017/membership');
  await Member.deleteMany({});
  const inserted = await Member.insertMany(members);
  console.log(`Seeded ${inserted.length} members into iba_members.`);
  await mongoose.disconnect();
})();
