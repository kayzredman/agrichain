# QA: modular and configurable

Reviewed against one requirement: a later area of concern is onboarded by configuration and a small module, not by rewriting the lot, the event log, or the write path.

Verdict: the kernel passes. The cashew pilot does not. Phase 1 must not start until the pilot settings below are data on a profile, not branches in the harvest flow.

## What already holds

The six records, the signed event envelope, and the single write path do not mention cashew. `payload` is an object, so a new event can carry new fields. Biological origin is insert-only for every commodity. Alerts keep the event. Integer grams avoid a unit fork. Honey, fish, fertilizer, and vessel calls are named as later work rather than as extra databases.

## What is welded to the pilot

| Weld | Where it shows up | What breaks later |
| --- | --- | --- |
| Origin country is Côte d'Ivoire | Phase 2 exit check. Authority page copy. | Honey from New Zealand, or a second cashew origin, needs a code change. |
| Mixed-origin merges are rejected | Phase 2, stated as a product rule. | A commodity that allows blending has to fork `merge`. |
| Quantity bands are 1 t, 5 t, 20 t | Claim rules. | Honey is sold in grams. Those buckets publish a useless band. |
| Roles are four columns | Authorization table: harvest, process, grams, audit. | A lab, a port agent, or a fertilizer supplier does not fit a column. |
| Checks are a fixed list in the write path | Yield, balance, transfer window, relabel. | Fish must block a species claim without a passing inspection. That check has nowhere to plug in. |
| Claim fields are a fixed set | Commodity, origin, process countries, expiry, band. | Halal, species, and honey grade were in the product model and dropped from the blueprint. |
| Process-abroad is an exit check | Phase 3 expects the plant country to differ from origin. | A country that cracks its own nuts fails a test that should only describe this pilot. |

## Kernel and modules

The kernel is the same for every concern.

- Records: actor, place, lot, event, claim, alert.
- One write: check the session, the signature, the payload schema, and the lot head. Store the event. Run the checks that the profile turned on. Rebuild the claim.
- Laws that stay in code, not in config: append-only events, no update of biological origin, signer key must match the organization, a narrow public view.

Each later concern is a module. A module may add an event type, a named check, a claim field, and a read projection. It does not add a second lot table.

![Kernel, and the modules that are on for cashew or left for later](diagrams/modules.png)

| Module | On for cashew | Adds |
| --- | --- | --- |
| Custody | Yes | `harvest`, `merge`, `consume`, `transfer`, `accept`, `load`, `process`, `pack`, `inspect`, `relabel` |
| Mass and yield | Yes | Ceiling and balance checks. Thresholds and tolerances come from the profile. |
| Credence | No | Claim gating only. A claim field such as species or honey grade stays off until a passing inspection exists. The `inspect` event itself is in the kernel. |
| Voyage | No | `call`. An undeclared port opens an alert. |
| Inputs | No | A fertilizer or seed attestation. A missing one lowers the ceiling. |
| Investigation export | No | A read of the lot path, hashes, and organization ids. |
| Settlement | No | `release` and retained-value sharing. |

`inspect` used to sit in Credence while the blueprint listed it as an MVP event and the Phase 5 exit check depended on it. One of the two had to move. The event is in the kernel, because a pass or fail with a report hash needs no commodity knowledge, and the buyer view is worth nothing without it. What Credence actually adds is the gate: a rule that a claim field may not be published without a passing inspection. That gate is off for cashew, which publishes no species or grade.

Custody grew two events for the same reason the review found them missing: the docs required a holder everywhere and no event ever moved one. `transfer` and `accept` are kernel, not a module, because every commodity changes hands.

## What is configuration

Stored in Postgres and seeded. Changing it does not require a change to the event envelope.

| Config | Cashew pilot value | Later change |
| --- | --- | --- |
| Commodity profile | `cashew` | Insert `honey` or `fish`. |
| Corridor | Côte d'Ivoire to a processor country to a European buyer | Insert another origin or destination. |
| Merge policy | Same biological origin only | Set `allow_mixed` on a profile that blends. |
| Quantity bands | Under 1 t, 1–5 t, 5–20 t, 20 t and over | A gram scale on the honey profile. |
| Claim fields | Commodity, origin, process countries, status, packing expiry, band | Add species or grade on that profile. |
| Enabled checks | Ceiling, merge shortfall, process shortfall, unaccepted transfer, relabel | Turn on `species_requires_inspect` for fish. |
| Balance tolerance | A gram or basis-point allowance on a shortfall | A corridor weighing wet nuts needs a wider one than a corridor weighing dry. |
| Transfer window | How long a `transfer` may sit unaccepted before an alert | A sea leg needs weeks. A truck to the next town needs a day. |
| Capabilities | Coop writes harvest, merge, transfer, and load. Plant accepts, processes, packs, and inspects. Buyer reads the claims of lots transferred to it. Authority reads aggregates for its country. Auditor opens an alerted lineage. | Grant `write:inspect` to a lab without a new role column. |

Capabilities are names (`write:harvest`, `write:accept`, `read:grams`, `read:aggregates`, `open:audit`), granted to an organization kind on a profile. The API asks whether this organization holds the capability. It does not switch on the job title.

Configuration is versioned. A lot records the `profile_version` it was created under and its claim is always rebuilt against that version, so editing a band or a tolerance cannot quietly change what an already published claim means.

Check functions live in code, one module each, registered by name. The profile lists the names that run. Adding cashew-sized bands is a row. Adding a new kind of check is one module, then a row that turns it on.

## Phase 1 exit, added

The cashew profile is seed data. The harvest handler does not contain the strings `cashew` or `Côte d'Ivoire`. A test can load a second profile with different bands and a different origin country and record a harvest without a schema migration.

Pilot tests still use a Côte d'Ivoire parcel and the cashew bands. Those assertions belong in the test fixture, not in the table constraints.
