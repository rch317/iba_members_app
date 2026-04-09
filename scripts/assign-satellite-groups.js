require('dotenv').config();
const mongoose = require('mongoose');
const Member = require('../src/models/Member');
const SG = require('../src/models/SatelliteGroup');

const groupCoords = {
  'Indianapolis': [39.7684, -86.1581],
  'Fort Wayne': [41.0793, -85.1394],
  'Evansville': [37.9716, -87.5711],
  'South Bend': [41.6764, -86.2520],
  'Carmel': [39.9784, -86.1180],
  'Fishers': [39.9568, -86.0133],
  'Bloomington': [39.1653, -86.5264],
  'Hammond': [41.5834, -87.5001],
  'Lafayette': [40.4167, -86.8753],
  'Muncie': [40.1934, -85.3864],
  'Terre Haute': [39.4667, -87.4139],
  'Kokomo': [40.4867, -86.1336],
  'Anderson': [40.1053, -85.6803],
  'Greenwood': [39.6137, -86.1066],
  'Noblesville': [40.0456, -86.0086],
  'Elkhart': [41.6820, -85.9767],
  'Mishawaka': [41.6620, -86.1586],
  'Columbus': [39.2014, -85.9214],
  'Jeffersonville': [38.2776, -85.7372],
};

const knownCities = {
  'INDIANAPOLIS':[39.77,-86.16],'GREENFIELD':[39.78,-85.77],'FRANKLIN':[39.48,-86.05],
  'FORT WAYNE':[41.08,-85.14],'SOUTH BEND':[41.68,-86.25],'ANDERSON':[40.11,-85.68],
  'MUNCIE':[40.19,-85.39],'BLOOMINGTON':[39.17,-86.53],'LAFAYETTE':[40.42,-86.88],
  'TERRE HAUTE':[39.47,-87.41],'EVANSVILLE':[37.97,-87.57],'KOKOMO':[40.49,-86.13],
  'CARMEL':[39.98,-86.12],'FISHERS':[39.96,-86.01],'NOBLESVILLE':[40.05,-86.01],
  'GREENWOOD':[39.61,-86.11],'COLUMBUS':[39.20,-85.92],'ELKHART':[41.68,-85.98],
  'JEFFERSONVILLE':[38.28,-85.74],'HAMMOND':[41.58,-87.50],'MISHAWAKA':[41.66,-86.16],
  'RICHMOND':[39.83,-84.89],'SHELBYVILLE':[39.52,-85.78],'MARTINSVILLE':[39.43,-86.43],
  'BEDFORD':[38.86,-86.49],'SEYMOUR':[38.96,-85.89],'LOGANSPORT':[40.75,-86.36],
  'CRAWFORDSVILLE':[40.04,-86.87],'NEW CASTLE':[39.93,-85.37],'CONNERSVILLE':[39.64,-85.14],
  'VINCENNES':[38.68,-87.53],'MADISON':[38.74,-85.38],'JASPER':[38.39,-86.93],
  'WARSAW':[41.24,-85.85],'MARION':[40.56,-85.66],'PERU':[40.75,-86.07],
  'GREENSBURG':[39.34,-85.48],'RUSHVILLE':[39.62,-85.45],'BATESVILLE':[39.30,-85.22],
  'AVON':[39.76,-86.40],'PLAINFIELD':[39.70,-86.40],'BROWNSBURG':[39.84,-86.40],
  'WESTFIELD':[40.04,-86.13],'ZIONSVILLE':[39.95,-86.26],'LEBANON':[40.05,-86.47],
  'DANVILLE':[39.76,-86.53],'MOORESVILLE':[39.61,-86.37],'MONROVIA':[39.58,-86.48],
  'SPENCER':[39.29,-86.76],'NASHVILLE':[39.21,-86.25],'PENDLETON':[39.97,-85.75],
  'FORTVILLE':[39.93,-85.85],'MCCORDSVILLE':[39.90,-85.93],'NEW PALESTINE':[39.72,-85.89],
  'BARGERSVILLE':[39.52,-86.17],'TRAFALGAR':[39.41,-86.15],'EDINBURGH':[39.35,-85.97],
  'VALPARAISO':[41.47,-87.06],'MICHIGAN CITY':[41.71,-86.90],'GARY':[41.59,-87.35],
  'GOSHEN':[41.58,-85.83],'PORTLAND':[40.43,-84.98],'HUNTINGTON':[40.88,-85.50],
  'WABASH':[40.80,-85.83],'AUBURN':[41.37,-85.06],'ANGOLA':[41.63,-85.00],
  'DECATUR':[40.83,-84.93],'BLUFFTON':[40.74,-85.17],'TIPTON':[40.28,-86.04],
  'ELWOOD':[40.28,-85.84],
  'CHICAGO':[41.88,-87.63],'CINCINNATI':[39.10,-84.51],'LOUISVILLE':[38.25,-85.76],
  'DAYTON':[39.76,-84.19],'DETROIT':[42.33,-83.05],'TOLEDO':[41.65,-83.54],
  'LEXINGTON':[38.04,-84.50],
};

const stateDefaults = {
  'IN':[39.77,-86.16],'OH':[39.96,-82.99],'MI':[42.33,-83.05],
  'IL':[41.88,-87.63],'KY':[38.25,-85.76],'PA':[40.44,-79.99],
  'WI':[43.04,-87.91],'MN':[44.98,-93.27],'TN':[36.16,-86.78],
  'MO':[38.63,-90.20],'AL':[33.52,-86.80],'SC':[34.00,-81.03],
  'FL':[28.54,-81.38],'AK':[61.22,-149.90],'LA':[30.46,-91.19],
};

function geoDist(a, b) {
  const dx = a[0] - b[0], dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const groups = await SG.find({}, 'satelliteID city').lean();
  const groupList = groups.map(g => ({
    id: g.satelliteID,
    coords: groupCoords[g.city] || [39.77, -86.16],
  }));

  function findNearest(city, state) {
    const key = (city || '').toUpperCase().trim();
    let coords = knownCities[key];
    if (!coords) {
      coords = stateDefaults[(state || '').toUpperCase().trim()] || [39.77, -86.16];
    }
    let best = groupList[0], bestD = Infinity;
    for (const g of groupList) {
      const d = geoDist(coords, g.coords);
      if (d < bestD) { bestD = d; best = g; }
    }
    return best.id;
  }

  const members = await Member.find({}, 'city state').lean();
  const ops = members.map(m => ({
    updateOne: {
      filter: { _id: m._id },
      update: { $set: { satelliteHome: findNearest(m.city, m.state) } },
    },
  }));
  const result = await Member.bulkWrite(ops);
  console.log('Updated', result.modifiedCount, 'of', members.length, 'members');

  const distribution = await Member.aggregate([
    { $group: { _id: '$satelliteHome', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  distribution.forEach(d => console.log(d._id, ':', d.count));
  await mongoose.disconnect();
})();
