# Solution blueprint, technical architecture, and MVP roadmap

This is the build document for the first version of agriChain. Product rules stay in [system.md](system.md) and [design-laws.md](design-laws.md). This document says how the first corridor is built, on what, and in what order.

The MVP is one cashew corridor with a small set of organizations who accept a single operator’s database, provided every handoff is signed and hash-chained. A shared ledger is a later move, made when a second operator will not accept that database.

## Decisions locked for the MVP

| Decision | Choice |
| --- | --- |
| Who may disagree with the database | Coop, plant, buyer, and origin authority accept one operator. Each event is signed by the organization that witnessed it. Any of them can recompute the hash chain. |
| Who writes a harvest | A coop clerk, in a web app, naming the grower and the parcel. Growers are records. They do not need an account in the MVP. |
| What a stranger sees | A public claim page: commodity, biological origin country, process countries, claim status. Exact weight, coordinates, and document hashes stay behind a role. |
| Where private data lives | The same Postgres database. Narrow views are API projections and database privileges, not a second store. |
| What “ledger” means here | An append-only event log. No token, no public chain, no permissioned chain in the MVP. |

Offline capture at the farm gate is not in the MVP. Add it only if the pilot coop cannot record the harvest at a connected buying point.

## Solution blueprint

agriChain keeps a lot of cashew honest from a parcel in Côte d'Ivoire to a European buyer. It answers three questions: what this is, where it grew, and which country kept the value of each step.

### People in the pilot

| Who | Account | What they write or read |
| --- | --- | --- |
| Grower | None | Named on a harvest. No login. |
| Coop clerk | Yes | Registers parcels, writes harvests, merges lots, records the load that leaves the country. |
| Plant clerk | Yes | Receives a lot, records processing, loss, and outputs. |
| Buyer | Yes | Reads the claim, the last inspection, and a quantity band. |
| Origin authority | Yes | Reads volumes leaving Côte d'Ivoire and where processing happened. |
| Auditor | Yes, granted by the operator | Opens the full path when an alert exists. |
| Public | None | Opens a claim page from a code on the bag. |

A broker is an organization that can enroll and sign events it witnessed. The MVP does not need one on the first path. The data model still has a place for that organization, because the middle of the chain is where the record has to exist.

### Path of a lot

```text
Parcel in Côte d'Ivoire
  → harvest, signed by the coop
  → merge of many harvests into one intake lot
  → load leaving the country
  → process at a plant in another country
  → claim a buyer and the public can read
```

Biological origin is Côte d'Ivoire from the harvest onward. The plant’s country is added as the place that processed the lot. The claim shows both. Processing never replaces origin.

### What the pilot has to prove

- A harvest names a parcel, a season, a grower, and a weight.
- Several harvests become one lot, and every input stays attached.
- The plant cannot ship more kernel than the raw nuts support. Loss is declared. Shells are either an output or part of that loss.
- The public claim says the nuts grew in Côte d'Ivoire even when they were cracked somewhere else.
- An over-yield, a broken mass balance, or a relabel that moves the date opens an alert and still keeps the event.
- The origin authority can see whether the cracking happened at home or abroad.

Settlement, payments, and an investigation graph are not part of this proof.

## Domain model

Quantities are integers in grams. There are no floating-point weights.

### Records

The six records in [system.md](system.md) map to tables as follows.

| Record | Table | Notes |
| --- | --- | --- |
| Actor | `actors`, `memberships` | A person or an organization. A clerk belongs to one organization. |
| Place | `places` | Parcel, plant, port, or vessel. A parcel holds a season yield ceiling in grams. |
| Lot | `lots` | One commodity. `biological_origin_country` is insert-only. |
| Event | `events` | Append-only. The lot stores `head_event_id`. |
| Claim | `claims` | Rebuilt in the same transaction as the event that changed it. |
| Alert | `alerts` | Opened by a check. Never deletes the event. |

Growers and parcels can exist before any login. A parcel stores country, area, commodity, season, and a manual yield ceiling. For the MVP that ceiling is entered by the coop from a published figure for the area. It is the number the harvest is judged against.

### Event types in the MVP

| Type | Who signs | What it does |
| --- | --- | --- |
| `harvest` | Coop | Creates a lot. Sets biological origin. Names parcel, grower, season, weight. |
| `merge` | Current custodian | Creates an output lot. Consumes each input lot. Output weight equals the sum of inputs. |
| `consume` | Same signer, same transaction as `merge` or `process` | Closes an input lot and points at the output. |
| `load` | Custodian | Records carrier, origin port, destination port, and the country the lot is leaving. |
| `process` | Plant | Consumes the input lot. Creates output lots. Declares additives and loss. Records the process country. |
| `inspect` | Lab or plant | Stores a pass or fail and the hash of the report. Does not store the file. |
| `relabel` | Custodian | Proposes a new label, code, or expiry. The claim keeps the packing expiry. |

`split`, vessel `call`, and `release` exist as names in the product model. They are not required to finish the cashew MVP. A voyage with an extra port is the first event type added when a real shipment needs it.

### Canonical event

Every event is a JSON object with a fixed field order, signed as UTF-8 bytes:

```json
{
  "id": "uuid",
  "lot_id": "uuid",
  "type": "harvest",
  "prev_hash": "hex or null for the first event",
  "actor_id": "uuid of the signing organization",
  "payload": {}
}
```

`payload_hash` is SHA-256 of the canonical JSON. The organization signs `payload_hash` with Ed25519. The lot’s chain links `prev_hash` to the previous event’s `payload_hash`. The first event on a lot uses `prev_hash: null`, and only one such event is allowed.

The server rejects a body whose signature does not match the organization’s registered public key, whose `prev_hash` is not the current head, or whose `id` has already been stored. A retry of the same `id` returns the stored event.

### Claims and bands

A claim is derived. Users do not edit it.

| Field | Rule |
| --- | --- |
| Commodity | Copied from the harvest. |
| Biological origin | Copied from the harvest. No later event writes this field. |
| Process countries | Appended by each `process` event, in order. |
| Status | `clear` or `alert`. |
| Packing expiry | Set when first known. A `relabel` does not replace it. |
| Quantity band | A bucket from the commodity profile, not the gram value. The cashew profile uses under 1 t, 1–5 t, 5–20 t, and 20 t and over. |

The buyer and the public page receive the band. The coop, the plant, and an opened audit receive grams.

### Checks that open an alert

The event is still stored. The claim status becomes `alert`.

| Check | Rule |
| --- | --- |
| Yield ceiling | Sum of harvests for that parcel and season is greater than the ceiling. |
| Merge balance | Output grams differ from the sum of input grams. |
| Process balance | Outputs plus declared loss differ from the input. Additives are inputs. |
| Relabel | The new expiry is later than the packing expiry, or the public code changes. |
| Origin write | Any attempt to update `biological_origin_country` fails the transaction. This one does not become an alert, because the write does not land. |

## Technical architecture

One web service and one Postgres database. The browser signs. The API checks and stores. Views are queries.

```text
Browser (coop, plant, buyer, authority, public claim)
        |  session cookie for staff
        |  Ed25519 signature on each event
        v
Next.js service
  UI routes
  HTTP API  /api/v1/...
        |
        v
Postgres
  actors, places, lots, events, claims, alerts
```

There is no worker, cache, or object store in the MVP. Document files stay with the party who holds them. The event stores the SHA-256 of the file.

### Stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript |
| Service | Next.js (App Router). The UI and the HTTP API ship as one service. |
| API | Versioned route handlers under `/api/v1`. The UI is a client of that API. |
| Database | Postgres 16 |
| Schema and queries | SQL migrations. Drizzle for queries. |
| Validation | Zod, one schema per event type |
| Auth | Auth.js session cookies for staff. Organization and role live in `memberships`, not in the auth provider. |
| Signatures | Ed25519 in the browser via WebCrypto. Server stores the public key only. |
| Hash | SHA-256 over the canonical JSON event |
| Hosting | One region, one service, managed Postgres, daily backups |

The private key is generated in the browser when an organization enrolls. It is encrypted with a passphrase the organization keeps. The server may store the ciphertext so a new clerk machine can download it. The server cannot decrypt it. Signing happens in the browser after the passphrase is entered.

### Write path

1. The clerk’s session is a member of the organization, and the role may write that event type.
2. The browser builds the canonical event using the lot’s current `head` hash.
3. The browser signs `payload_hash` and posts the event.
4. The API checks the session, the signature, the payload schema, and the head.
5. One database transaction inserts the event, moves the head, writes any `consume` events, rebuilds the claim, and inserts alerts.
6. The response is the new head and the claim status.

Two clerks racing on the same lot: the second insert fails the unique constraint on `(lot_id, prev_hash)`. The client reloads the head and asks the clerk to submit again.

### Read path

| Route | Caller | Returns |
| --- | --- | --- |
| `GET /api/v1/claims/:code` | Public | Claim projection and quantity band. |
| `GET /api/v1/lots/:id` | Holder organization | Lots they signed or currently hold, with gram weights. |
| `GET /api/v1/authority/retention` | Origin authority for that country | Weight leaving, and the share of process events in that country. |
| `GET /api/v1/lots/:id/audit` | Auditor, and only when the lot has an open alert | Full events, facility ids, gram weights, document hashes. |

The audit read is written to an `audit_opens` row: who, when, and which lot.

### Database rules

- The application role may `INSERT` into `events` and may not `UPDATE` or `DELETE` them.
- A trigger rejects updates to `lots.biological_origin_country`.
- `events.id` is unique.
- `(lot_id, prev_hash)` is unique. `prev_hash` null is allowed once per lot.
- `claims` is updated only by the transaction that inserted the event.

### Authorization

| Role | Harvest and merge | Process | Read grams | Read claim | Open audit |
| --- | --- | --- | --- | --- | --- |
| Coop clerk | Own lots | No | Own lots | Yes | No |
| Plant clerk | No | Lots the plant holds | Those lots | Yes | No |
| Buyer | No | No | No | Yes, plus last inspection | No |
| Origin authority | No | No | Country aggregates only | Yes | No |
| Auditor | No | No | Alerted lots | Yes | Yes |

A clerk can sign only with the key of their own organization, and only for a lot that organization currently holds. Harvest is the exception: it creates the lot.

That table is the cashew seed, not the authorization model. A profile grants capabilities (`write:harvest`, `write:process`, `read:grams`, `open:audit`) to an organization kind. The API checks the capability. A lab or a port agent is a new grant, not a new column.

## Kernel and configuration

Lots, events, and claims stay generic. Cashew settings live in seed data: profile, corridor, bands, merge policy, claim fields, enabled checks, and capability grants. The harvest handler does not contain a commodity name or an origin country. A later concern adds a module and rows, as set out in [qa-modularity.md](qa-modularity.md).

## MVP roadmap

Phases are sequential. A phase is done when its exit checks pass, not when the screens exist. Dates wait until a pilot coop and a plant are named.

### Phase 1 — Parcel and harvest

Enroll a coop organization, register a parcel with a ceiling, and record a harvest signed in the browser.

Exit checks:

- A harvest from an unknown key is rejected.
- A second harvest that pushes the parcel over its ceiling is stored, and the lot’s claim is `alert`.
- `biological_origin_country` cannot be updated.
- The grower has no user account.
- The harvest path reads the cashew profile from configuration. It does not hard-code the commodity or the origin country.

### Phase 2 — Named merges

A clerk merges several harvest lots into one intake lot.

Exit checks:

- Every input lot has a `consume` event pointing at the output.
- A consumed lot cannot be merged again.
- Output grams must equal the sum of inputs, or an alert opens.
- The output lot’s biological origin is copied from the inputs.
- The cashew profile rejects a mixed-origin merge. The test fixture uses Côte d'Ivoire. The merge code does not.

### Phase 3 — Load and process

Record the lot leaving the country and the plant turning raw nuts into outputs plus a declared loss.

Exit checks:

- The process country is stored beside biological origin. The pilot plant is abroad. A profile may process at home.
- Outputs plus loss must equal the input, or an alert opens.
- The plant cannot process a lot it does not hold.

### Phase 4 — Claim

Publish the derived claim, including the public code a bag can carry.

Exit checks:

- The public route returns origin, process countries, status, and a quantity band.
- The public route does not return grams, parcel coordinates, grower name, or document hashes.
- A relabel with a later expiry leaves the packing expiry on the claim and opens an alert.

### Phase 5 — Authority and audit

This is the end of the MVP.

Exit checks:

- The origin-authority page shows weight leaving Côte d'Ivoire and the share of process events that happened there.
- An auditor can open a lot only when it has an alert, and the open is logged.
- A buyer sees the claim, the last inspection result, and the band.

### After the MVP

In this order, and only when the pilot asks for them:

1. Fertilizer or seed attestation that lowers a parcel ceiling when the attestation is missing.
2. Vessel calls, so an undeclared port opens an alert.
3. An export bundle for an external investigation graph: lot path, hashes, and organization ids. No KYC dossier in this database.
4. Honey as a second commodity, where the fraud is content and a price premium.
5. Fish only with a lab attestation required before a species claim.
6. Settlement and retained-value sharing.
7. An offline client, if buying points have no signal.
8. A permissioned ledger for the hash chain, if a second operator refuses this database. The event JSON stays the same so the log can move.

## Out of scope

- A token, a coin, or tokenized inventory.
- Full KYC, crew identities, and beneficial-ownership graphs.
- Public prices and public parcel coordinates.
- A grantor or donor portal.
- A model that writes events or invents an origin.
- Storing scans of shipping documents. Hashes only.
- Multi-region deployment and a mobile app.

## How this stays honest

The operator can refuse to publish, and can go offline. The operator cannot silently rewrite a history that other parties have already verified, because those parties hold the signatures and the hashes. That is the custody property this MVP owes. It is not a claim that a cartel is inside the database. When an alert fires, the trail leaves this system and goes to people who investigate companies and accounts.
