---
tags: [dev, api, nodejs, reference]
created: 2026-04-07
---

# IBA Membership App — API Reference

Base URL: `http://localhost:3001`

All request bodies use `Content-Type: application/json`.  
All responses are JSON. Errors return `{ "error": "message" }`.

---

## Members

### `GET /api/members`
List members with optional filtering, sorting, and pagination.

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Records per page |
| `recurringMember` | boolean | — | Filter by `true` or `false` |
| `membership_list` | boolean | — | Filter by `true` or `false` |
| `mailing_list` | boolean | — | Filter by `true` or `false` |
| `renewalDate_gte` | string | — | Pass `today` to return only active (not expired) members |
| `renewalDate_lt` | string | — | Pass `today` to return only expired members |
| `sortField` | string | `lastName` | Sort field: `lastName`, `firstName`, `emailAddress`, `city`, `state`, `recurringMember`, `renewalDate` |
| `sortDir` | number | `1` | `1` = ascending, `-1` = descending |

**Response**
```json
{
  "total": 50,
  "page": 1,
  "limit": 20,
  "members": [ { ...memberObject } ]
}
```

---

### `GET /api/members/search?q=`
Lightweight name search for autocomplete. Matches first or last name (case-insensitive). Returns up to 10 results.

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `q` | string | Search term |

**Response**
```json
[
  {
    "_id": "...",
    "firstName": "Jane",
    "lastName": "Smith",
    "emailAddress": "jane@example.com",
    "primaryPhone": "317-555-0100"
  }
]
```

---

### `GET /api/members/stats`
Summary counts across the full member collection.

**Response**
```json
{
  "total": 790,
  "activeMembers": 178,
  "recurring": 300,
  "membershipList": 400,
  "mailingList": 350,
  "emailNews": 280
}
```

---

### `GET /api/members/active`
Paginated, sortable list of members whose `renewalDate >= today`. Accepts the same `page`, `limit`, `sortField`, and `sortDir` params as `GET /api/members`.

**Response** — same shape as `GET /api/members`.

---

### `GET /api/members/mailing-active`
Members whose `renewalDate` is in the future **and** `mailing_list = true`.  
Returns only address fields — intended for mailing label generation.

**Response**
```json
{
  "total": 9,
  "members": [
    {
      "_id": "...",
      "firstName": "Jane",
      "lastName": "Smith",
      "addressLine1": "123 Main St",
      "addressLine2": null,
      "city": "Indianapolis",
      "state": "IN",
      "postalZip": "46201"
    }
  ]
}
```

---

### `GET /api/members/:id`
Fetch a single member by MongoDB `_id`.

**Response** — full member object, or `404` if not found.

---

### `POST /api/members`
Create a new member.

**Request Body** — any subset of member fields:

| Field | Type | Notes |
|---|---|---|
| `firstName` | string | |
| `lastName` | string | |
| `addressLine1` | string | |
| `addressLine2` | string | |
| `city` | string | |
| `state` | string | |
| `postalZip` | string | |
| `primaryPhone` | string | |
| `secondaryPhone` | string | |
| `tertiaryPhone` | string | |
| `emailAddress` | string | Must be unique (sparse) |
| `satelliteHome` | string | Satellite group name |
| `recurringMember` | boolean | |
| `renewalDate` | date | ISO 8601 string |
| `membership_list` | boolean | |
| `mailing_list` | boolean | |
| `email_news` | boolean | |
| `hide_email` | boolean | |

**Response** — `201` with created member object.

---

### `PATCH /api/members/:id`
Update one or more fields on an existing member. Only provided fields are changed.

**Request Body** — same fields as `POST`, all optional.

**Response** — updated member object, or `404` if not found.

---

### `DELETE /api/members/:id`
Delete a member permanently.

**Response**
```json
{ "message": "Member deleted" }
```
Returns `404` if not found.

---

## Satellite Groups

### `GET /api/satellite-groups`
List groups with sorting and pagination. Contact fields are populated with `firstName` and `lastName`.

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Records per page |
| `sortField` | string | `groupName` | Sort field: `groupName`, `city`, `state` |
| `sortDir` | number | `1` | `1` = ascending, `-1` = descending |

**Response**
```json
{
  "total": 20,
  "page": 1,
  "limit": 20,
  "groups": [
    {
      "_id": "...",
      "groupName": "Satellite 1",
      "addressLine1": "...",
      "city": "Indianapolis",
      "state": "IN",
      "postalZip": "46201",
      "primaryContact":   { "_id": "...", "firstName": "Jane", "lastName": "Smith" },
      "secondaryContact": null,
      "tertiaryContact":  null
    }
  ]
}
```

---

### `GET /api/satellite-groups/:id`
Fetch a single group. Contact fields are populated with `firstName`, `lastName`, `emailAddress`, and `primaryPhone`.

**Response** — full group object with populated contacts, or `404`.

---

### `POST /api/satellite-groups`
Create a new satellite group.

**Request Body**

| Field | Type | Notes |
|---|---|---|
| `groupName` | string | |
| `addressLine1` | string | |
| `addressLine2` | string | |
| `city` | string | |
| `state` | string | |
| `postalZip` | string | |
| `primaryContact` | ObjectId | Member `_id` |
| `secondaryContact` | ObjectId | Member `_id` |
| `tertiaryContact` | ObjectId | Member `_id` |

**Response** — `201` with created group object.

---

### `PATCH /api/satellite-groups/:id`
Update one or more fields on an existing group.

**Request Body** — same fields as `POST`, all optional.

**Response** — updated group object, or `404`.

---

### `DELETE /api/satellite-groups/:id`
Delete a group permanently.

**Response**
```json
{ "message": "Satellite group deleted" }
```
Returns `404` if not found.

---

## Health

### `GET /health`
Returns application and database status. Returns HTTP `200` when healthy, `503` when the database is not connected.

**Response**
```json
{
  "status": "ok",
  "db": "connected",
  "uptime": 3600,
  "timestamp": "2026-04-07T19:33:20.947Z"
}
```

| Field | Values |
|---|---|
| `status` | `ok` or `degraded` |
| `db` | `connected`, `connecting`, `disconnected`, `disconnecting` |
| `uptime` | Process uptime in seconds |
| `timestamp` | Current server time (ISO 8601) |
