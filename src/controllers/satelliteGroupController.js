const SatelliteGroup = require('../models/SatelliteGroup');

const ALLOWED_FIELDS = [
  'groupName', 'addressLine1', 'addressLine2', 'city', 'state', 'postalZip',
  'primaryContact', 'secondaryContact', 'tertiaryContact',
];

// GET /api/satellite-groups
const GROUP_SORT_FIELDS = new Set(['groupName', 'city', 'state']);

async function listGroups(req, res) {
  const { page = 1, limit = 20, sortField = 'groupName', sortDir = '1' } = req.query;

  const field = GROUP_SORT_FIELDS.has(sortField) ? sortField : 'groupName';
  const dir   = Number(sortDir) >= 0 ? 1 : -1;
  const sortObj = { [field]: dir };
  if (field !== 'groupName') sortObj.groupName = 1;

  const skip = (Number(page) - 1) * Number(limit);
  const [groups, total] = await Promise.all([
    SatelliteGroup.find()
      .populate('primaryContact',   'firstName lastName')
      .populate('secondaryContact', 'firstName lastName')
      .populate('tertiaryContact',  'firstName lastName')
      .skip(skip)
      .limit(Number(limit))
      .sort(sortObj),
    SatelliteGroup.countDocuments(),
  ]);
  res.json({ total, page: Number(page), limit: Number(limit), groups });
}

// GET /api/satellite-groups/:id
async function getGroup(req, res) {
  const group = await SatelliteGroup.findById(req.params.id)
    .populate('primaryContact',   'firstName lastName emailAddress primaryPhone')
    .populate('secondaryContact', 'firstName lastName emailAddress primaryPhone')
    .populate('tertiaryContact',  'firstName lastName emailAddress primaryPhone');
  if (!group) return res.status(404).json({ error: 'Satellite group not found' });
  res.json(group);
}

// POST /api/satellite-groups
async function createGroup(req, res) {
  const data = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => ALLOWED_FIELDS.includes(k))
  );
  const group = await SatelliteGroup.create(data);
  res.status(201).json(group);
}

// PATCH /api/satellite-groups/:id
async function updateGroup(req, res) {
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => ALLOWED_FIELDS.includes(k))
  );
  const group = await SatelliteGroup.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!group) return res.status(404).json({ error: 'Satellite group not found' });
  res.json(group);
}

// DELETE /api/satellite-groups/:id
async function deleteGroup(req, res) {
  const group = await SatelliteGroup.findByIdAndDelete(req.params.id);
  if (!group) return res.status(404).json({ error: 'Satellite group not found' });
  res.json({ message: 'Satellite group deleted' });
}

module.exports = { listGroups, getGroup, createGroup, updateGroup, deleteGroup };
