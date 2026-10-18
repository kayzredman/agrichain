# Docs

All design notes, decisions, and project documents for agriChain live in this folder. Add new docs here. Do not leave them only in chat.

Figures cited from the episode are what the guest stated. They are not a separate audit.

Start at [state.md](state.md) if you are picking this up after a break.

| Doc | What it is |
| --- | --- |
| [state.md](state.md) | Where the project stands, the settled decisions, and what to do next |
| [brief.md](brief.md) | The problem, the three failures, and what the ledger is for |
| [field-notes.md](field-notes.md) | Notes from the Siren Investigates episode |
| [blind-spots.md](blind-spots.md) | Where a clean lot story breaks, and the record that exposes it |
| [design-laws.md](design-laws.md) | Constraints. A feature that breaks one repeats a failure already described |
| [system.md](system.md) | Records, access, invariants, first corridor, build order |
| [blueprint.md](blueprint.md) | Solution blueprint, technical architecture, and MVP roadmap |
| [ledger.md](ledger.md) | Decision: what makes this a ledger, and why not a permissioned chain yet |
| [flow-control.md](flow-control.md) | Decision: auto-advance, alert, or countersign after the checks, and how an alert is resolved |
| [agriChain Solution Blueprint.docx](agriChain%20Solution%20Blueprint.docx) | The same blueprint as a Word document |
| [git-plan.md](git-plan.md) | Branch flow: local dev, remote dev after QA, then main |
| [qa-modularity.md](qa-modularity.md) | QA: kernel versus commodity configuration |
| [qa-acceptance.md](qa-acceptance.md) | QA: final acceptance of the design, flow, and architecture |

Drawings live in [diagrams/](diagrams) and are included in the docs above: the lot path, who can see a lot, the service architecture, the write path, the transparency log, the modules, the blind spots, and the git promotion. The scripts that rebuild them, and the Word document, are in [tools/](../tools).

The screens are in [mockups/](../mockups). They are plain HTML with no build step. [tools/README.md](../tools/README.md) says how to serve them.

Source: [Food and the Fight for Global Security](https://www.youtube.com/watch?v=P-qcYDpPTB4). Guest: Genevieve Leveille, CEO of AgriLedger. Host: Siren, Galway.
