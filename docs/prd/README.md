# Operations Platform PRD Playbook

A repeatable flow for taking a client from "we run on WhatsApp and spreadsheets"
to a signed-off PRD and a designed operations platform.

## Why this exists

Most operations-platform projects fail for one of three reasons:

1. **You designed the process the client described, not the one they run.**
   What people say they do and what the evidence shows are different documents.
2. **Scope grew because nothing was written down as out of scope.**
3. **You built screens before you understood the data model**, so every new
   requirement forced a rewrite.

This playbook attacks all three: it collects *evidence* rather than opinions, it
forces an explicit scope line, and it puts the entity model before the UI.

## The flow at a glance

| # | Phase | Duration | Exit gate |
|---|-------|----------|-----------|
| 0 | Qualify & frame | 1-3 days | Signed engagement note with a business objective and a budget band |
| 1 | Evidence collection | 1-2 weeks (client-led) | Tier 1 + Tier 2 pack received and reviewed |
| 2 | Interviews & shadowing | 1 week | Every core role interviewed; at least one full-day shadow |
| 3 | As-is process map | 3-5 days | Client signs "yes, that is how we actually work" |
| 4 | Pain & opportunity sizing | 2-3 days | Ranked pain list with hours/dollars attached |
| 5 | To-be design | 1 week | Agreed future process, with the manual steps that survive named explicitly |
| 6 | PRD | 1 week | PRD signed; MoSCoW cut line agreed |
| 7 | Platform design | 1-2 weeks | Entity model, screen inventory, role matrix, clickable prototype |
| 8 | Validate & baseline | 3-5 days | Prototype walkthrough passed by real users; change control starts |

Phases 1-2 run in parallel. Phase 7 can start on the Must-have slice while the
Should-haves are still being argued about.

## Documents in this pack

| File | Use it for |
|------|-----------|
| [`01-discovery-flow.md`](01-discovery-flow.md) | The detailed phase-by-phase flow, with inputs, outputs and failure modes |
| [`02-client-collection-pack.md`](02-client-collection-pack.md) | **The list you send the client.** What to collect, why, and in what format |
| [`03-interview-guide.md`](03-interview-guide.md) | Question bank by role, plus the questions that surface hidden work |
| [`04-prd-template.md`](04-prd-template.md) | The PRD itself, fill-in-the-blanks |
| [`05-platform-design-kit.md`](05-platform-design-kit.md) | PRD to entity model to screens to dashboard metrics |
| [`06-governance.md`](06-governance.md) | RACI, decision log, assumption register, change control, UAT |

## The one rule

**Never accept a description where an artefact exists.** If the client says
"we approve purchases over $5,000", ask for the last 20 approvals. You will find
the threshold is $5,000 except for three suppliers, except in December, except
when the owner is travelling. That exception is your requirement.
