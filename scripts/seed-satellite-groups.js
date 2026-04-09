require('dotenv').config();
const mongoose = require('mongoose');
const Member = require('../src/models/Member');
const SatelliteGroup = require('../src/models/SatelliteGroup');

const streets = [
  'Maple St', 'Oak Ave', 'Cedar Blvd', 'Elm Dr', 'Washington St',
  'Lincoln Ave', 'Main St', 'Indiana Ave', 'Meridian St', 'Wabash Ave',
  'Keystone Blvd', 'College Ave', 'Shadeland Ave', 'Michigan Rd', 'Kessler Blvd',
  'Allisonville Rd', 'Binford Blvd', 'Georgetown Rd', 'Fall Creek Pkwy', 'Sherman Dr',
];

const cities = [
  ['Indianapolis', '46201'], ['Indianapolis', '46220'], ['Fort Wayne', '46801'],
  ['Evansville',   '47708'], ['South Bend',   '46601'], ['Carmel',     '46032'],
  ['Fishers',      '46037'], ['Bloomington',  '47401'], ['Hammond',    '46320'],
  ['Lafayette',    '47901'], ['Muncie',       '47302'], ['Terre Haute','47807'],
  ['Kokomo',       '46901'], ['Anderson',     '46011'], ['Greenwood',  '46142'],
  ['Noblesville',  '46060'], ['Elkhart',      '46514'], ['Mishawaka',  '46544'],
  ['Columbus',     '47201'], ['Jeffersonville','47130'],
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const groupNames = [
  'Hoosier Hammersmiths', 'Crossroads Forge', 'Wabash Valley Ironworks',
  'Circle City Anvil Club', 'Limestone Strikers', 'Prairie Fire Forge',
  'Covered Bridge Blacksmiths', 'Calumet Ironworkers', 'Sugar Creek Smiths',
  'Tippecanoe Forge Guild', 'Whitewater Valley Smiths', 'Cardinal Forge',
  'Sycamore Ironworks', 'Heartland Hammer Guild', 'Bluebird Forge',
  'Cornbelt Blacksmiths', 'Rivertown Anvil Society', 'Dunes Edge Forge',
  'Wildcat Creek Smiths', 'Flatrock Forge Collective',
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://db:27017/membership');

  // Pull all member IDs from the live collection
  const members = await Member.find({}, '_id').lean();
  if (members.length < 3) {
    console.error('Need at least 3 members seeded before running this script.');
    process.exit(1);
  }
  const ids = members.map(m => m._id);

  // Shuffle and pick 3 distinct members per group
  function pickContacts() {
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    return { primary: shuffled[0], secondary: shuffled[1], tertiary: shuffled[2] };
  }

  await SatelliteGroup.deleteMany({});

  const groups = Array.from({ length: 20 }, (_, i) => {
    const [city, zip] = cities[i];
    const { primary, secondary, tertiary } = pickContacts();
    const sid = `SAT-${String(i + 1).padStart(3, '0')}`;
    return {
      satelliteID:      sid,
      groupName:        groupNames[i],
      addressLine1:     `${Math.floor(Math.random() * 9000) + 100} ${streets[i]}`,
      city,
      state:            'IN',
      postalZip:        zip,
      primaryContact:   primary,
      secondaryContact: secondary,
      tertiaryContact:  tertiary,
    };
  });

  const inserted = await SatelliteGroup.insertMany(groups);
  console.log(`Seeded ${inserted.length} satellite groups into iba_satellite_groups.`);
  await mongoose.disconnect();
})();
