# MongoDB Collection Schemas

Database: `membership`

---

## iba_members

Stores all IBA membership records.

| Field | Type | Constraints | Default |
|---|---|---|---|
| `firstName` | String | **required**, trim | |
| `lastName` | String | **required**, trim | |
| `addressLine1` | String | trim | |
| `addressLine2` | String | trim | |
| `city` | String | trim | |
| `state` | String | trim | |
| `postalZip` | String | trim | |
| `primaryPhone` | String | trim | |
| `secondaryPhone` | String | trim | |
| `tertiaryPhone` | String | trim | |
| `emailAddress` | String | unique (sparse), lowercase, trim | |
| `satelliteHome` | String | trim | |
| `recurringMember` | Boolean | | `false` |
| `renewalDate` | Date | | |
| `membership_list` | Boolean | | `false` |
| `mailing_list` | Boolean | | `false` |
| `email_news` | Boolean | | `false` |
| `hide_email` | Boolean | | `false` |
| `createdAt` | Date | auto (timestamps) | |
| `updatedAt` | Date | auto (timestamps) | |

**Notes:**
- `satelliteHome` stores the `satelliteID` value from `iba_satellite_groups` (e.g. `SAT-001`) to link a member to their satellite group.
- `emailAddress` has a sparse unique index — multiple documents may have `null`/missing values without conflict.

---

## iba_satellite_groups

Regional satellite groups that members belong to.

| Field | Type | Constraints | Default |
|---|---|---|---|
| `satelliteID` | String | **required**, trim | |
| `groupName` | String | trim | |
| `notes` | String | trim | |
| `addressLine1` | String | trim | |
| `addressLine2` | String | trim | |
| `city` | String | trim | |
| `state` | String | trim | |
| `postalZip` | String | trim | |
| `primaryContact` | ObjectId | ref → `iba_members` | `null` |
| `secondaryContact` | ObjectId | ref → `iba_members` | `null` |
| `tertiaryContact` | ObjectId | ref → `iba_members` | `null` |
| `createdAt` | Date | auto (timestamps) | |
| `updatedAt` | Date | auto (timestamps) | |

**Notes:**
- `satelliteID` (e.g. `SAT-001`) is the stable identifier used by members in `satelliteHome`.
- Contact fields reference `iba_members` documents by `_id`.

---

## iba_notes

Timestamped notes attached to individual members.

| Field | Type | Constraints | Default |
|---|---|---|---|
| `member` | ObjectId | **required**, indexed, ref → `iba_members` | |
| `text` | String | **required**, trim | |
| `createdAt` | Date | auto (timestamps) | |
| `updatedAt` | Date | auto (timestamps) | |

---

## iba_users

Admin users for OAuth login and API access.

| Field | Type | Constraints | Default |
|---|---|---|---|
| `googleId` | String | unique (sparse) | |
| `email` | String | **required**, unique | |
| `displayName` | String | | `""` |
| `apiKey` | String | unique (sparse) | |
| `active` | Boolean | | `true` |
| `createdAt` | Date | | `Date.now` |

**Notes:**
- Users authenticate via Google OAuth; `googleId` is set on first login.
- `apiKey` can be generated via the `generateApiKey()` instance method for programmatic access.

---

## iba_sessions

Managed automatically by `connect-mongo`. Stores Express session data with a 7-day TTL.
