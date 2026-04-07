/**
 * import-from-sheets.js
 *
 * Pulls member data from Google Sheets and upserts into MongoDB.
 *
 * Usage:
 *   node scripts/import-from-sheets.js            # import (upsert by lastName+firstName)
 *   node scripts/import-from-sheets.js --dry-run  # preview without writing
 *   node scripts/import-from-sheets.js --overwrite # overwrite all fields on existing records
 */

'use strict';

require('dotenv').config();
const path   = require('path');
const { google } = require('googleapis');
const mongoose   = require('mongoose');
const Member     = require('../src/models/Member');

// ── Config ────────────────────────────────────────────────────────────────────
const SPREADSHEET_ID  = '1ozaQD9hk7SNhxz_SKhcjLKXca6yq6Hen_YnwftXfP3I';
const SHEET_TAB       = 'Full Member Listing';
const KEY_FILE        = path.resolve(__dirname, '../.secrets/google-service-account.json');
const DRY_RUN         = process.argv.includes('--dry-run');
const OVERWRITE       = process.argv.includes('--overwrite');

// ── Column → Member field map ─────────────────────────────────────────────────
// Keys are sheet header values (trimmed, lowercased for matching).
// Skipped columns: ID, NEW, SECOND PERSON, SPOUSE, FAX, DATE PD DATABASE, CARD SENT
const COLUMN_MAP = {
  'expires':         { field: 'renewalDate',     type: 'date'    },
  'mem list':        { field: 'membership_list',  type: 'boolean' },
  'mail list':       { field: 'mailing_list',     type: 'boolean' },
  'e-mail news':     { field: 'email_news',       type: 'boolean' },
  'last name':       { field: 'lastName',         type: 'string'  },
  'first name':      { field: 'firstName',        type: 'string'  },
  'address1':        { field: 'addressLine1',     type: 'string'  },
  'address2':        { field: 'addressLine2',     type: 'string'  },
  'city':            { field: 'city',             type: 'string'  },
  'state':           { field: 'state',            type: 'string'  },
  'zip+4':           { field: 'postalZip',        type: 'string'  },
  'home':            { field: 'primaryPhone',     type: 'string'  },
  'work':            { field: 'secondaryPhone',   type: 'string'  },
  'cell':            { field: 'tertiaryPhone',    type: 'string'  },
  'e-mail address':  { field: 'emailAddress',     type: 'string'  },
  'hidden e-mail':   { field: 'hide_email',       type: 'boolean' },
  'satellite group': { field: 'satelliteHome',    type: 'string'  },
  'recurring':       { field: 'recurringMember',  type: 'boolean' },
};

// ── Type coercions ────────────────────────────────────────────────────────────
function toBoolean(val) {
  if (val === null || val === undefined || val === '') return false;
  return ['y', 'yes', '1', 'true', 'x'].includes(String(val).trim().toLowerCase());
}

function toDate(val) {
  if (!val || String(val).trim() === '') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function toString(val) {
  const s = String(val ?? '').trim();
  return s === '' ? null : s;
}

function coerce(val, type) {
  switch (type) {
    case 'boolean': return toBoolean(val);
    case 'date':    return toDate(val);
    default:        return toString(val);
  }
}

// ── Parse a sheet row using the header index map ──────────────────────────────
function parseRow(row, headerIndex) {
  const doc = {};
  for (const [colKey, { field, type }] of Object.entries(COLUMN_MAP)) {
    const idx = headerIndex[colKey];
    if (idx === undefined) continue;
    const raw   = row[idx] ?? '';
    const value = coerce(raw, type);
    if (value !== null && value !== undefined) doc[field] = value;
  }
  return doc;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : OVERWRITE ? 'OVERWRITE' : 'UPSERT (skip existing)'}\n`);

  // 1. Authenticate with service account
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // 2. Fetch sheet data
  console.log(`Fetching "${SHEET_TAB}" from Google Sheets…`);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_TAB}'`,
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) {
    console.error('Sheet is empty or has no data rows.');
    process.exit(1);
  }

  // 3. Build header → column index map
  const headers     = rows[0];
  const headerIndex = {};
  headers.forEach((h, i) => {
    const key = String(h).trim().toLowerCase();
    headerIndex[key] = i;
  });

  console.log(`Found ${rows.length - 1} data rows.\n`);

  // Warn about any expected columns that are missing
  for (const colKey of Object.keys(COLUMN_MAP)) {
    if (headerIndex[colKey] === undefined) {
      console.warn(`  WARNING: expected column "${colKey}" not found in sheet headers`);
    }
  }

  // 4. Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/membership');
  console.log('Connected to MongoDB.\n');

  // 5. Process rows
  const dataRows = rows.slice(1);
  let inserted = 0, updated = 0, skipped = 0, errored = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const doc = parseRow(row, headerIndex);

    // Skip completely empty rows
    if (!doc.lastName && !doc.firstName) continue;

    if (DRY_RUN) {
      console.log(`[DRY RUN] Row ${i + 2}:`, JSON.stringify(doc));
      continue;
    }

    try {
      const filter = {
        lastName:  doc.lastName  ?? '',
        firstName: doc.firstName ?? '',
      };

      const existing = await Member.findOne(filter);

      if (existing && !OVERWRITE) {
        skipped++;
      } else if (existing && OVERWRITE) {
        await Member.updateOne(filter, { $set: doc });
        updated++;
      } else {
        await Member.create(doc);
        inserted++;
      }
    } catch (err) {
      console.error(`  Row ${i + 2} error (${doc.firstName} ${doc.lastName}): ${err.message}`);
      errored++;
    }
  }

  // 6. Summary
  if (!DRY_RUN) {
    console.log('\n── Import Summary ───────────────────────');
    console.log(`  Inserted : ${inserted}`);
    console.log(`  Updated  : ${updated}`);
    console.log(`  Skipped  : ${skipped}`);
    console.log(`  Errors   : ${errored}`);
    console.log('─────────────────────────────────────────');
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
