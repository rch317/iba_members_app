---
tags: [dev, nodejs, mongodb, devcontainer, project]
created: 2026-04-07
status: active
---

# IBA Membership App

Node.js + MongoDB membership management app built inside a VS Code dev container.

## Stack

| Layer | Detail |
|---|---|
| Runtime | Node.js 24 / Express 4 |
| Database | MongoDB (Docker service `db`) |
| ODM | Mongoose 8 |
| Frontend | Vanilla JS, no framework |
| Port | 3001 |
| Collections | `iba_members`, `iba_satellite_groups` |

## Dev Container

- Defined in `.devcontainer/` using Docker Compose + custom Dockerfile
- On rebuild: `npm install` runs + MongoDB data is auto-restored from `data/dump/`
- VS Code extensions: MongoDB for VS Code pre-installed
- Ports forwarded: `3001` (app), `27017` (MongoDB)
- Tools included: `mongosh`, `mongodump`/`mongorestore`, `jq`

## Restoring the Project

### From GitHub (recommended)
```bash
git clone https://github.com/<you>/<repo>.git
# Open folder in VS Code → "Reopen in Container"
# npm install + mongorestore run automatically via postCreateCommand
```

### From local git
The `.git/` folder lives at `/workspaces/javascript-node-mongo/.git/`.
Clone or copy the folder, then reopen in VS Code.

## Running Locally

```bash
npm run dev                    # nodemon watch mode
npm run import:sheets          # import from Google Sheets (upsert, skip existing)
npm run import:sheets:dry      # preview import without writing
npm run import:sheets:overwrite # import and overwrite existing records
npm run seed                   # seed 50 fake Indiana members (dev/testing)
npm run seed:groups            # seed 20 fake satellite groups (dev/testing)
```

App: `http://localhost:3001/admin`

Google Sheets key file: `.secrets/google-service-account.json` (not committed)

## Admin Pages

| Page | URL |
|---|---|
| Members | `/admin` |
| Satellite Groups | `/admin/satellite-groups` |
| Active Mailing List | `/admin/mailing-active` |

Features on both table pages: sortable column headers, pagination, add/edit/delete modals.
Members page: filter by active/expired, recurring, membership list, mailing list. Stats bar shows total, active, recurring, membership list, mailing list, email news counts.
Satellite groups page: live member search widget, clickable member detail flyout.
Active Mailing List page: members with `renewalDate >= today` AND `mailing_list = true`. Address fields only — intended for mailing labels.

## Data Model

### `iba_members`
`firstName`, `lastName`, `addressLine1`, `addressLine2`, `city`, `state`, `postalZip`,
`primaryPhone`, `secondaryPhone`, `tertiaryPhone`, `emailAddress`, `satelliteHome`,
`recurringMember` (bool), `renewalDate` (date),
`membership_list`, `mailing_list`, `email_news`, `hide_email` (all bool)

### `iba_satellite_groups`
`groupName`, `addressLine1`, `addressLine2`, `city`, `state`, `postalZip`,
`primaryContact`, `secondaryContact`, `tertiaryContact` (ObjectId refs → Member)

## API Endpoints

```
GET  /health

GET  /api/members?page&limit&renewalDate_gte&renewalDate_lt&recurringMember&membership_list&mailing_list&sortField&sortDir
GET  /api/members/search?q=
GET  /api/members/stats
GET  /api/members/active?page&limit&sortField&sortDir
GET  /api/members/mailing-active
GET  /api/members/:id
POST /api/members
PATCH /api/members/:id
DELETE /api/members/:id

GET  /api/satellite-groups?page&limit&sortField&sortDir
GET  /api/satellite-groups/:id
POST /api/satellite-groups
PATCH /api/satellite-groups/:id
DELETE /api/satellite-groups/:id
```

Full details: see `API-Reference.md`

## Git

Local repo at `/workspaces/javascript-node-mongo`.

Push to GitHub to make it portable:
```bash
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin master
```

## Next Ideas

- [ ] Push repo to GitHub
- [ ] Authentication layer
- [ ] Dues payment tracking
- [ ] Print/export member list (mailing labels, CSV)
- [ ] Scheduled auto-import from Google Sheets
