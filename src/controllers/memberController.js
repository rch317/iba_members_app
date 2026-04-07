const Member = require('../models/Member');

const ALLOWED_FIELDS = [
  'firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'state',
  'postalZip', 'primaryPhone', 'secondaryPhone', 'tertiaryPhone', 'emailAddress',
  'satelliteHome', 'recurringMember', 'renewalDate', 'membership_list',
  'mailing_list', 'email_news', 'hide_email',
];

const MAILING_PROJECTION = 'firstName lastName addressLine1 addressLine2 city state postalZip';

// GET /api/members/mailing-active  — active mailing list (renewalDate > today AND mailing_list = true)
async function mailingListActive(req, res) {
  const members = await Member.find(
    { mailing_list: true, renewalDate: { $gt: new Date() } },
    MAILING_PROJECTION
  ).sort({ lastName: 1, firstName: 1 });
  res.json({ total: members.length, members });
}

// GET /api/members/search?q=smith  — lightweight name search for autocomplete
async function searchMembers(req, res) {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const members = await Member.find(
    { $or: [{ firstName: regex }, { lastName: regex }] },
    'firstName lastName emailAddress primaryPhone'
  ).sort({ lastName: 1, firstName: 1 }).limit(10);
  res.json(members);
}

// GET /api/members
const MEMBER_SORT_FIELDS = new Set(['lastName', 'firstName', 'emailAddress', 'city', 'state', 'recurringMember', 'renewalDate']);

async function listMembers(req, res) {
  const { recurringMember, membership_list, mailing_list, page = 1, limit = 20, sortField = 'lastName', sortDir = '1' } = req.query;
  const filter = {};
  if (recurringMember !== undefined) filter.recurringMember = recurringMember === 'true';
  if (membership_list  !== undefined) filter.membership_list  = membership_list  === 'true';
  if (mailing_list     !== undefined) filter.mailing_list     = mailing_list     === 'true';

  const field = MEMBER_SORT_FIELDS.has(sortField) ? sortField : 'lastName';
  const dir   = Number(sortDir) >= 0 ? 1 : -1;
  const sortObj = { [field]: dir };
  if (field !== 'lastName') sortObj.lastName = 1;

  const skip = (Number(page) - 1) * Number(limit);
  const [members, total] = await Promise.all([
    Member.find(filter).skip(skip).limit(Number(limit)).sort(sortObj),
    Member.countDocuments(filter),
  ]);

  res.json({ total, page: Number(page), limit: Number(limit), members });
}

// GET /api/members/:id
async function getMember(req, res) {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
}

// POST /api/members
async function createMember(req, res) {
  const data = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => ALLOWED_FIELDS.includes(k))
  );
  const member = await Member.create(data);
  res.status(201).json(member);
}

// PATCH /api/members/:id
async function updateMember(req, res) {
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => ALLOWED_FIELDS.includes(k))
  );
  const member = await Member.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
}

// DELETE /api/members/:id
async function deleteMember(req, res) {
  const member = await Member.findByIdAndDelete(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json({ message: 'Member deleted' });
}

// GET /api/members/stats
async function getStats(req, res) {
  const [total, recurring, membershipList, mailingList, emailNews] = await Promise.all([
    Member.countDocuments(),
    Member.countDocuments({ recurringMember: true }),
    Member.countDocuments({ membership_list: true }),
    Member.countDocuments({ mailing_list: true }),
    Member.countDocuments({ email_news: true }),
  ]);
  res.json({ total, recurring, membershipList, mailingList, emailNews });
}

module.exports = { searchMembers, mailingListActive, listMembers, getMember, createMember, updateMember, deleteMember, getStats };
