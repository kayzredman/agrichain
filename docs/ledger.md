# Decision: what makes this a ledger

Recorded because the question was asked directly, and because the first answer in [blueprint.md](blueprint.md) was only half of what the source episode asks for.

## The requirement

From the episode, as written in [brief.md](brief.md):

> A distributed ledger is chain of custody. It keeps data that no single firm or country controls, and it shows the data was not rewritten.

Two properties, not one.

The design already delivered the second. Every event is signed by the organization that witnessed it, each lot carries a hash chain, a merge commits to the head hash of every input, the canonical form is RFC 8785 so any party can recompute the bytes, and the application role cannot `UPDATE` or `DELETE` an event.

The design did not deliver the first. One operator's Postgres is controlled by one firm. The blueprint admitted as much: the operator "can refuse to publish, and can go offline". [field-notes.md](field-notes.md) is blunt about what that costs: "Adoption fails if the system is built for one company or one person who controls many farmers."

So the gap was real, and this document closes it.

## What was rejected, and why

A permissioned chain in the MVP. Hyperledger Fabric or Besu would mean an ordering service, channels, chaincode, membership service providers, and a certificate authority per organization, for a pilot with one coop, one plant, one buyer, and one authority. That spends the pilot on infrastructure and never reaches the question the pilot exists to answer, which is whether a coop clerk will sign a harvest at a buying point. The first design law is "Custody, not a coin", and its note is that the money story made people skip the journey. A consensus network before anyone is writing events is the same mistake in a different costume.

A token, a coin, or an anchor that needs a wallet. Still out of scope, for the reasons in [design-laws.md](design-laws.md).

## What was chosen

A transparency log, in the MVP. The model is RFC 6962, Certificate Transparency, which solved this exact problem: how a party who does not trust a log operator can still rely on the log.

- Every event's `event_hash` becomes a leaf in one append-only Merkle tree, in insertion order.
- The operator periodically signs a tree head: the log id, the tree size, the root hash, and a timestamp.
- Each enrolled organization counter-signs the tree head it has seen. The coop, the plant, the buyer, and the authority each hold signed heads.
- Any party can ask for an inclusion proof that its own event is in a tree of a given size, and a consistency proof that a smaller tree is a prefix of a larger one.

The result is that the operator cannot remove, alter, or reorder an event once any party holds a counter-signed head covering it, because the consistency proof fails and four other organizations hold a head that contradicts the new one. To cheat, the operator has to present two different histories for the same tree size, and any two parties comparing heads see it.

That is the property that was missing. No single firm controls the record, because no single firm can change it without being caught by parties who are not it.

## Why this and not a chain

- No nodes, no consensus, no ordering service, no validators to run or fund.
- No token, so the first design law stays intact.
- It publishes hashes, not payloads, so "Translucent, not glass" stays intact too. A leaf reveals nothing about a grower, a weight, or a parcel.
- It is the same guarantee a permissioned chain would give for this use, which is append-only agreed history, without the operational weight of one.
- The event format does not change, so moving to a permissioned ledger later is a migration and not a rewrite.

What it leaks is volume. Tree size tells a reader how many events exist. That is accepted.

## Trust has to be legible, or it is not trust

The reason this design exists is the trust story, so it is worth being exact about where that story can still fail.

A counter-signed tree head protects the cooperative only if the cooperative checks it. A log nobody audits is a log the operator controls again, this time with extra mathematics. And [field-notes.md](field-notes.md) sets the bar for what checking can look like: "Adoption fails if the system is built for one company or one person who controls many farmers. It has to be open. Farmers and governments can understand it."

A Merkle inclusion proof does not clear that bar. A clerk at a buying point cannot evaluate a hash path, and asking them to is how a system ends up technically verifiable and practically trusted on faith.

So verification is not an expert feature in this design. It is automatic and it is plain.

- The clerk's client fetches the latest head, checks the events that organization signed, and counter-signs the head, on sign-in. No one has to remember to do it.
- Each organization sees one plain sentence about its own record: how many of its events are covered, when it last counter-signed, and whether anything it signed has changed since. Not a hash path.
- A failed check is loud and specific. It names the event and says the record no longer matches what this organization signed, in those words.
- The proof itself stays available underneath, for an auditor or a government that wants to recompute. Legibility is the default view, not the only one.

This is the same discipline as the rest of the product. The public claim page shows a status and not a hash. The yield ceiling shows an alert and not a query plan. Verification gets the same treatment, because a farmer who cannot tell whether the record held does not have a record they control.

## What is still deferred

A permissioned ledger for the hash chain, when a second operator will not accept this database. That is the condition, and it has not happened. The event JSON and the leaf definition are already ledger-shaped, so the log can move when it does.

A public-chain anchor of the root hash, as a third-party timestamp. Cheap in principle, one hash per day, but it introduces a wallet and a funded account to the operations of a pilot run by a cooperative. It is worth doing when there is a dispute that a counter-signed head cannot settle.

## Where this lands in the build

Leaves are appended in the same transaction that inserts an event, from Phase 1. Backfilling a Merkle tree later is avoidable work, and appending a leaf is one insert.

Signed tree heads, counter-signatures, and the proof endpoints are Phase 6, after the audit door works. A proof nobody can read yet is not worth shipping before the thing it proves.
