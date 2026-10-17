# QA: final acceptance

Reviewed against the product story, the system design, the flow, and the architecture, before any Phase 1 code exists. This is the second QA round. The first, [qa-modularity.md](qa-modularity.md), asked whether a later concern could be onboarded by configuration. This one asks whether the design as written can be built at all.

Verdict: conditional pass. The story holds, the kernel and configuration split holds, and three blockers had to be closed first. They are closed below, and the fixes are in [system.md](system.md) and [blueprint.md](blueprint.md).

## What passed

The product story traces from the episode in [field-notes.md](field-notes.md) through the eight laws in [design-laws.md](design-laws.md) to the phases, with no law contradicted by a phase. Integer grams, append-only events, insert-only biological origin, alerts that keep the event, and a narrow public view are stated the same way everywhere. The kernel carries no commodity name.

## Blocker 1: custody was required and never recorded

Fifteen places required a holder. The read path returned "lots they signed or currently hold". Phase 3 asserted "the plant cannot process a lot it does not hold". [system.md](system.md) listed "current holder" as a reader. No event moved custody and no record stored a holder, so the plant could never come to hold anything. `load` named a carrier and two ports and changed nothing about who was responsible for the goods.

A chain of custody whose custody is implied is not a chain of custody. The aggregation gap in [blind-spots.md](blind-spots.md), "nobody is named in between", was reappearing inside our own design.

Decision: an explicit two-sided handoff. `transfer` is signed by the custodian and names the receiver. `accept` is signed by the receiver and is the only event that moves `holder_org_id`. A transfer nobody accepts opens an alert, which is the first check in the MVP that looks at the middle of the chain rather than at either end.

The alternative considered was deriving custody from `load` and `process`, with the named destination becoming the holder on arrival. It was rejected: it gives the receiver no signature, so a lot can be pushed onto an organization that never agreed to hold it, and the record of a disputed handoff would be one party's word.

This also fixed a second hole. Nothing linked a buyer to a lot, so "the buyer sees the last inspection" had no subject. A buyer is now a party a lot was transferred to.

## Blocker 2: an alert did not survive a merge

Phase 1 put an alert on an over-ceiling harvest lot. Phase 2 consumed that lot into a new one and said nothing about the status the output carried. As written, the alert stopped at the merge. Because an audit may only be opened on an alerted lot, the trail stopped there too.

One merge would have laundered a bad harvest, in a system whose entire purpose is that aggregation hides things.

Decision: the output of a merge or a process inherits an open alert from any input, as its own row naming the source lot and the source alert. Audit scope widens to the lineage of an alerted lot, walked through `consume` events, so an auditor can get from an alerted harvest to the packed lot it ended up in.

## Blocker 3: reject and alert were used interchangeably

[system.md](system.md) said a process event *cannot* emit more than it received. The blueprint and the Phase 2 and 3 exit checks said a mismatch *opens an alert*. One refuses the write, the other stores it. Both documents claimed to be the rule.

Decision: split by what the claim actually is. More out than in is impossible, so it is rejected and nothing is stored. A shortfall is implausible, and might be undeclared loss or might be theft, so it is stored with an alert beyond a tolerance the profile sets. The law is "Implausible before criminal", which asks for a record and an alert, not a refusal.

The tolerance is configuration. Cashew loses weight drying between the farm gate and the intake scale, so a fixed constant would either alert on every honest lot or hide a real shortfall.

## Defects fixed alongside

- The signed envelope had no timestamp. `observed_at` is now signed; the server's `received_at` stays outside the signature. Expiry, season, and the transfer window all depend on a time the signer attests to.
- The envelope had no key id, so a rotation would have invalidated every past signature. Keys are now versioned in `org_keys`, events carry `key_id`, and a revoked key still verifies what it signed before revocation.
- "A fixed field order" was not a specification a second party could reimplement. The canonical form is now RFC 8785.
- `payload_hash` was described as the hash of the whole event, and the envelope showed no signature. Renamed to `event_hash`, with `signature` and `key_id` stored beside it.
- A merged lot's first event is `merge` with `prev_hash: null`, so the chains did not link across a merge. The merge payload now commits to each input lot's head hash.
- Nothing set the packing expiry that Phase 4 tested a relabel against, and nothing minted the public code. A `pack` event does both, once per lot.
- Relabel direction was reversed between the two docs. Extending shelf life is the fraud, so the alert fires on an expiry moved *later*.
- Claims were derived from mutable configuration with no version recorded, so editing a band would silently change a published claim. A lot records `profile_version` and its claim is rebuilt against that version.
- `(lot_id, prev_hash)` unique with "null allowed once per lot" is not what Postgres does with nulls. A partial unique index on `lot_id` where `prev_hash is null` is.
- `consume` had no capability and no stated writer. It is written by the server inside the merge and process transactions and is never accepted from a client.
- `inspect` was an MVP event in the blueprint and an off module in [qa-modularity.md](qa-modularity.md). The event is kernel; the Credence module is now claim gating only.
- The public claim field list in "Decisions locked" named four fields where the claims table published six.
- The build order in [system.md](system.md) had seven steps with alerts at step five, while Phase 1 already raised an alert. It now mirrors the five phases.
- Two invariants described modules that are off for cashew, the fertilizer ceiling and the port-skip alert. They are marked as product rules, not MVP behaviour.
- An enrolling organization could set its own kind. Self-declaring as an origin authority or an auditor is a read-privilege escalation, so the kind is recorded by the operator and an unapproved organization can sign nothing.

## Still open

- The diagrams in [diagrams/](diagrams) predate this round. The lot flow and the write path need the transfer and accept steps.
- The mockups show a per-lot weight on the origin-authority screen, which that reader may not see, and have no accept screen.
- Alert resolution is named but not designed. An alert can be opened and inherited; nothing says who closes one, or what a closed alert does to a published claim. It is not needed before Phase 4.
