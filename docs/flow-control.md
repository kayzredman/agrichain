# Decision: what happens after the checks

The question was whether a lot should flow automatically once the checks pass, or wait for a second person to approve it. The answer is both, chosen per event type in configuration, with one rule that is not negotiable.

## The rule: never gate the event, gate the claim

An event that happened, happened. A harvest that was cut, was cut. If a signed event sits in a pending queue waiting for an approver, then for as long as it waits there is a true thing that the record does not say. That gap is the opacity this whole system exists to remove, and it is worse than the error an approver was meant to catch, because it is invisible.

So the event is recorded the moment it is signed, always. What waits for a second party is never the record. It is what the record is allowed to *claim*.

This also keeps the append-only law in [design-laws.md](design-laws.md) intact. A pending queue is a mutable staging area by another name, and it would need an update path, which `events` does not have.

## Three dispositions

After the write path runs its checks, a lot is in exactly one of three states. Which one it lands in is decided by the commodity profile, not by code.

**Auto-advance.** Every check passed. The claim reads `clear` and the next step is unlocked with no human in the way. This is the default, and it is the state the cashew pilot runs in for every event type. A system that asks a person to approve a normal day is a system people route around.

**Alert.** A plausibility check fired. The event is stored, the claim reads `alert`, and the investigation door opens. Downstream steps are **not** blocked. Blocking them would hold physical goods that rot while a dispute is argued, and the moment recording a lot can freeze a container, the incentive is to stop recording. The alert travels with the goods instead, including through a merge.

**Countersign required.** The profile marks this event type as needing a second signature before the claim can read `clear`. The event is on the record immediately. The claim reads `awaiting countersign` until the second party signs, and a reader sees exactly that rather than a false `clear`.

## Why this fits the trust model

The point worth noticing is that agriChain already has a maker-checker control, and it is a stronger one than the banking version.

Classic four-eyes puts the maker and the checker inside the same organization. They share a manager, a payroll, and an interest in the lot looking correct. A coop clerk checked by a coop supervisor is a weak control against a coop that wants to inflate a harvest.

`transfer` and `accept` put the two signatures in **different organizations with opposing interests**. The coop wants the weight high. The plant, which pays for it and has to balance it against what it cracks, wants the weight true. That handoff is already a maker and a checker who disagree, and it is the control the design leans on.

Intra-organization countersign is therefore an option for high-value steps, not the backbone. Turning it on everywhere would also break adoption: a cooperative with one clerk and one phone at a buying point cannot produce a second approver, and that cooperative is exactly who this is for. [field-notes.md](field-notes.md) is clear that adoption fails when the system is built for the party with the most staff.

## Alert resolution

This was listed as open in [qa-acceptance.md](qa-acceptance.md). It is the same mechanism as a countersign.

A resolution is a signed record placed **beside** the alert. It never edits it, never closes it in the sense of making it go away, and never deletes the event that caused it.

- An alert has a state: `open`, or `resolved` with a reason, a signer, and a time.
- Resolving requires the `resolve:alert` capability. In the cashew pilot it is granted to the origin authority and the auditor, not to the organization whose event raised the alert. Nobody clears their own alarm.
- A resolved alert still appears on the lot, on the audit view, and in the lineage of anything the lot became. The public claim returns to `clear` and says the record was reviewed.
- An inherited alert is resolved at its source. Resolving the source writes a resolution beside each inherited row rather than deleting them.

## What is configuration

All of it, on the commodity profile, so a later corridor changes a row rather than a handler.

| Setting | Cashew pilot value | Later change |
| --- | --- | --- |
| `countersign_required` | Empty. Every event auto-advances. | List `process` for a corridor where a plant has been caught under-declaring. |
| `countersign_by` | Not set | `same_org` for four-eyes, or an organization kind such as `authority`. |
| `countersign_window` | Not set | How long a claim may read `awaiting countersign` before an alert opens. |
| `alert_blocks_downstream` | `false` | A commodity where moving suspect goods is itself the harm might set this true. Cashew does not. |
| `resolve:alert` grants | Origin authority, auditor | Grant to a certifier on a profile that has one. |

## Where this lands in the build

Phase 1 through 5 run in auto-advance, because the pilot has no countersigned event type. The states and the capability exist from Phase 1 so that turning one on later is configuration and not a migration.

Alert resolution ships in Phase 5, with the audit door, since the auditor is one of the two parties who can sign one.
