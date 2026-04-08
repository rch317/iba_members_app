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
| Database | MongoDB Atlas (cloud) |
| ODM | Mongoose 8 |
| Frontend | Vanilla JS, no framework |
| Port | 3001 (local), 80 (EC2 via nginx) |
| Collections | `iba_members`, `iba_satellite_groups`, `iba_users`, `iba_sessions` |
| Auth | Google OAuth (passport) + API key (X-API-Key header) |

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
npm run dev                      # nodemon watch mode
npm run import:sheets            # import from Google Sheets (upsert, skip existing)
npm run import:sheets:dry        # preview import without writing
npm run import:sheets:overwrite  # import and overwrite existing records
npm run seed                     # seed 50 fake Indiana members (dev/testing)
npm run seed:groups              # seed 20 fake satellite groups (dev/testing)
npm run create-user              # add authorized user: node scripts/create-user.js <email> [name] [--api-key]
```

App: `http://localhost:3001/admin`

Google Sheets key file: `.secrets/google-service-account.json` (not committed)

## Admin Pages

| Page | URL | Auth required |
|---|---|---|
| Members | `/admin` | Yes |
| Satellite Groups | `/admin/satellite-groups` | Yes |
| Active Mailing List | `/admin/mailing-active` | Yes |
| Member Roster | `/roster` | No (public) |

Features on both table pages: sortable column headers, pagination, add/edit/delete modals.
Members page: filter by active/expired, recurring, membership list, mailing list. Stats bar shows total, active, recurring, membership list, mailing list, email news counts.
Satellite groups page: live member search widget, clickable member detail flyout.
Active Mailing List page: members with `renewalDate >= today` AND `mailing_list = true`. Address fields only — intended for mailing labels.
Roster page: public-facing active member list (name + renewal date), filterable and sortable.

### `iba_users`
`googleId` (sparse), `email`, `displayName`, `apiKey` (sparse), `active` (bool), `createdAt`

### `iba_sessions`
Managed automatically by `connect-mongo`. Stores Express sessions in MongoDB.

## Authentication

- **Browser**: visit `/login` → Sign in with Google. Only users pre-added to `iba_users` can log in.
- **API**: pass `X-API-Key: <key>` header.
- **Add a user**: `node scripts/create-user.js email@gmail.com "Name" [--api-key]`
- **Public routes**: `/health`, `/login`, `/auth/*`, `/roster`, `/api/members/roster`

## Deployment (EC2)

- **Instance**: Amazon Linux 2023, `t3.micro`
- **App**: runs under PM2, starts on boot via systemd
- **Proxy**: nginx on port 80 → Node on port 3001
- **Load Balancer**: ALB at `iba-membership-lb-2018470141.us-east-1.elb.amazonaws.com`
- **Database**: MongoDB Atlas (NAT gateway outbound IP whitelisted)
- **Bootstrap**: `curl -fsSL https://raw.githubusercontent.com/rch317/iba_members_app/main/scripts/setup.sh | bash`
- **Deploy update**: `git pull && pm2 restart iba-membership`

## API Endpoints
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

# Auth (public)
GET  /login
GET  /auth/google
GET  /auth/google/callback
GET  /auth/logout
GET  /auth/me

# Members (requires auth except where noted)
GET  /api/members/roster          ← public
GET  /api/members?page&limit&renewalDate_gte&renewalDate_lt&recurringMember&membership_list&mailing_list&sortField&sortDir
GET  /api/members/search?q=
GET  /api/members/stats
GET  /api/members/active?page&limit&sortField&sortDir
GET  /api/members/mailing-active
GET  /api/members/:id
POST /api/members
PATCH /api/members/:id
DELETE /api/members/:id

# Satellite Groups (requires auth)
GET  /api/satellite-groups?page&limit&sortField&sortDir
GET  /api/satellite-groups/:id
POST /api/satellite-groups
PATCH /api/satellite-groups/:id
DELETE /api/satellite-groups/:id
```

Full details: see `API-Reference.md`

## Git

Repo: `https://github.com/rch317/iba_members_app`

## Next Ideas

- [ ] Custom domain + HTTPS via ACM + certbot
- [ ] Dues payment tracking
- [ ] Print/export member list (mailing labels, CSV)
- [ ] Scheduled auto-import from Google Sheets
- [ ] User management admin page (add/deactivate users without SSH)
