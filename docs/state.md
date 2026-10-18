# Where this stands

Last worked on 18 October 2026. Picking it back up should not need the chat history. If something here disagrees with another doc, the other doc wins and this one is stale.

## What exists

Design, not code. There is no application yet: no repository scaffold, no database, no package.json. What exists is a settled design and a clickable set of screens that shows what it looks like.

- **The design** is in [blueprint.md](blueprint.md), with [system.md](system.md) for records and invariants and [design-laws.md](design-laws.md) for the constraints a feature is not allowed to break.
- **The screens** are in [`mockups/`](../mockups) as plain HTML, CSS, and JavaScript. Sixteen of them. No build step, no framework. See [tools/README.md](../tools/README.md) for how to serve them.
- **The drawings** are in [diagrams/](diagrams), and [tools/](../tools) can regenerate them and the Word document.

## The four decisions that are settled

These took the most argument. Reopening one means reading the doc first, because the rejected alternatives are written down with the reasons.

**Custody moves on two signatures.** A `transfer` names a receiver, an `accept` signs for it, and only the `accept` moves `holder_org_id`. A transfer nobody accepts opens an alert rather than stranding the lot. In [blueprint.md](blueprint.md).

**Over-emission is refused, a shortfall is stored with an alert.** More out than in is impossible and is rejected outright. Less out than in is merely implausible, so it is recorded and flagged, because undeclared loss is the thing worth seeing. In [system.md](system.md).

**It is a ledger, not a blockchain product.** An append-only signed event log with a transparency log over it, after RFC 6962: signed tree heads counter-signed by each organization, with inclusion and consistency proofs. No token, no public chain, no consensus network. Verification runs automatically on sign-in and says one plain sentence, because a Merkle proof a farmer cannot read is not trust. The full reasoning, including why not Fabric or Besu for one coop and one plant, is in [ledger.md](ledger.md).

**The event is never gated, only the claim.** After the checks a lot advances, alerts, or waits for a countersign, chosen per event type by the profile. A signed event is written immediately in all three cases. Alert resolution is signed beside the alert by a party that did not raise it. In [flow-control.md](flow-control.md).

## What to do next

Roughly in order. Nothing here is started.

1. **Scaffold the application.** TypeScript, Next.js App Router, Postgres 16, Drizzle, Zod, Auth.js. Phase 1 in [blueprint.md](blueprint.md) has the exit checks that say when it is done.
2. **Draw the three dispositions.** The Word document is current, but no diagram shows what happens after the checks. The write path drawing stops at "Store" and "Reply", which was true before [flow-control.md](flow-control.md) and is not any more.
3. **Decide what a corridor is in the data model.** Transfer windows and balance tolerances are described as corridor settings, but a corridor is not yet a record anywhere. It is currently implied by the commodity profile.
4. **Design the sign-in verification screen for a failure.** [verify](../mockups/index.html) shows the wording for a failed check but nothing says what the clerk is allowed to do next, or whether the system keeps accepting writes while an organization's record is disputed.

## Known rough edges in the mockups

Cosmetic, deliberate, and recorded so they are not rediscovered as bugs.

- The dashboard counters drift upward the longer the page is open. The demo script harvests more often than it packs.
- The activity flow is driven by a fixed script in `mockups/app.js`, not by anything real.
- There is no dark mode. The tokens in `mockups/styles.css` are semantic, so adding one is a block of overrides rather than a rewrite.
- Light theme only was a choice, not an oversight. One mode done properly beat two done loosely.

## Branch state

Local `dev` is ahead of everything else. `origin/dev`, `origin/main`, and local `main` are all at `3abad5d`, which predates the flow-control work. Promotion follows [git-plan.md](git-plan.md): push `origin/dev`, then `origin/main`, then fast-forward local `main`. Never commit on `main`, never force-push.
