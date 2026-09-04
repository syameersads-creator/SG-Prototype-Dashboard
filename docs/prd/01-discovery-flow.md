# Phase-by-phase discovery flow

Each phase below has: **goal**, **who**, **inputs**, **activities**, **outputs**,
**exit gate**, and the **failure mode** that kills projects at that stage.

---

## Phase 0 — Qualify & frame

**Goal.** Establish that there is a business problem worth automating, and that
someone owns it.

**Who.** You + the client's economic buyer (the person whose budget it is).

**Activities.**
- Ask the framing question: *"If this platform works perfectly, what number
  changes, and who notices?"* If they cannot answer, you are not ready to start.
- Establish the trigger. Something happened — a lost customer, a failed audit, a
  key person resigning, a growth ceiling. That trigger is your real requirement.
- Identify the **single accountable sponsor** and the **process owner** (usually
  two different people).
- Agree a budget band and a go-live intent date. Not a commitment — a band.

**Outputs.** A one-page engagement note: objective, trigger, sponsor, process
owner, budget band, target date, what is explicitly *not* in scope.

**Exit gate.** Sponsor signs the engagement note.

**Failure mode.** Starting discovery with an enthusiastic middle manager who
cannot approve anything. You will do six weeks of work and then meet the owner,
who wants something different.

---

## Phase 1 — Evidence collection (client-led)

**Goal.** Get the client to hand over the artefacts that describe how the
business actually runs, before you form any opinion.

**Who.** Client's process owner assembles; you review.

**Activities.**
- Send the [collection pack](02-client-collection-pack.md). Give a deadline and
  a named owner per item — an unowned list returns empty.
- Set up a shared folder with the exact folder structure you want back. People
  fill structure; they ignore requests.
- Review as items arrive. Log every question the evidence raises — those become
  your interview questions in Phase 2.

**Outputs.** Populated evidence folder + an open-questions log.

**Exit gate.** Tier 1 complete, Tier 2 at least 70% complete.

**Failure mode.** Accepting "we don't have that documented" as an answer. If
there is no SOP, there is still a spreadsheet, a WhatsApp group, or a notebook.
Ask for *that*. The absence of documentation is itself a finding — write it down.

---

## Phase 2 — Interviews & shadowing

**Goal.** Understand the work as performed, including the workarounds nobody
would put in writing.

**Who.** One interviewer + one note-taker. Never interview a junior with their
manager in the room.

**Activities.**
- 45-60 min semi-structured interview per role (see [guide](03-interview-guide.md)).
- **At least one full-day shadow** of the busiest operational role. Sit next to
  them. Count how many times they retype the same data.
- Collect screenshots of every screen and spreadsheet they touch, in the order
  they touch them.
- Ask each person to walk you through their *last* transaction, not a typical
  one. Typical transactions are fiction; the last one is real.

**Outputs.** Interview notes, a shadow log with timings, a screen inventory of
the current state.

**Exit gate.** Every role in the org chart that touches the process has been
interviewed at least once, including the person everyone calls "the one who
knows how it really works."

**Failure mode.** Only talking to managers. Managers describe the designed
process; clerks perform the real one.

---

## Phase 3 — As-is process map

**Goal.** A single picture of the current process that the client agrees is
accurate — including the ugly parts.

**Activities.**
- Map end-to-end in swimlanes by role. One lane per role, not per department.
- For every step capture: trigger, actor, system/tool used, input, output,
  duration, wait time before it, failure rate, what happens on exception.
- Mark every **handoff**, every **rekeying** of data, and every **wait state**.
  Those three are where the value is.
- Walk the map back to the people you interviewed and let them correct it. They
  will. That correction meeting is the most valuable hour of the project.

**Outputs.** As-is swimlane map, handoff/rekey register, cycle-time baseline.

**Exit gate.** Process owner and at least two front-line staff confirm the map.

**Failure mode.** Mapping the happy path only. Roughly 30-40% of operational
effort in most SMEs is exception handling. If your map has no exception
branches, you have mapped a fantasy.

---

## Phase 4 — Pain & opportunity sizing

**Goal.** Turn complaints into numbers so prioritisation stops being political.

**Activities.**
- For each pain point capture: frequency x time per occurrence x loaded hourly
  cost = annual cost. Add error cost (rework, penalties, lost sales) separately.
- Classify each pain: **eliminate** (the step should not exist), **automate**,
  **assist** (human decides, system prepares), or **leave alone**.
- Cross-check against the trigger from Phase 0. If the biggest measured pain is
  not the sponsor's trigger, you have a conversation to have — now, not later.

**Outputs.** Ranked pain register with annual cost per item and a disposition.

**Exit gate.** Sponsor agrees the top 5.

**Failure mode.** Sizing effort but not error cost. A 2-minute step done wrong
once a month can cost more than a 2-hour step done right.

---

## Phase 5 — To-be process design

**Goal.** Design the future process *before* designing software. Software is
downstream of process.

**Activities.**
- Redraw the swimlanes. Target: fewer handoffs, no rekeying, no wait state
  longer than the work state before it.
- Apply the order: **eliminate → simplify → standardise → automate.** Automating
  a step that should be deleted is the most expensive mistake in this playbook.
- Explicitly name the steps that **stay manual**. Clients assume everything not
  mentioned is automated. Write the manual list down and have them initial it.
- Design the exception paths as first-class flows, not as "we'll handle that
  outside the system."

**Outputs.** To-be swimlane map, manual-steps list, exception flows, target
cycle time.

**Exit gate.** Process owner signs the to-be map, including the manual list.

**Failure mode.** Designing the to-be process for the org chart the client wants
in three years instead of the staff they have on Monday.

---

## Phase 6 — Write the PRD

**Goal.** One document that a designer, a developer and the sponsor all read the
same way.

**Activities.**
- Fill the [PRD template](04-prd-template.md).
- Write requirements as user stories with **testable** acceptance criteria.
  "Fast" is not testable. "P95 search result under 2 seconds with 50,000 job
  records" is.
- Run MoSCoW with the sponsor and the process owner in the same room. Force a
  cut line: Must-haves must be deliverable in the budget band with 30% headroom.
- Attach the data model sketch and the role matrix even in draft — they surface
  disagreements that prose hides.

**Outputs.** Signed PRD v1.0, MoSCoW list with a marked MVP cut line.

**Exit gate.** Sponsor signature + process owner signature. Change control
starts the moment the ink dries.

**Failure mode.** A PRD full of "the system should be user-friendly and
scalable." Every requirement needs a number, a role, or a rule.

---

## Phase 7 — Platform design

**Goal.** Turn the PRD into something clickable, in the right order.

**Order matters — do not skip ahead:**

1. **Entity model.** What things exist, what identifies them, how they relate.
2. **State machines.** For each core entity, the statuses and the legal
   transitions, and who may make each transition.
3. **Role x permission matrix.** Who can see, create, edit, approve, delete.
4. **Screen inventory.** Derived from the entity model x roles, not invented.
5. **Dashboard metric spec.** Every tile: definition, source, refresh, owner,
   and the action it is supposed to prompt.
6. **Wireframes → clickable prototype.** Only now.

See the [design kit](05-platform-design-kit.md) for the templates.

**Exit gate.** A prototype that a real user can complete their most common task
in, unaided, while you watch silently.

**Failure mode.** Starting with dashboards. Dashboards are the last thing to
design and the first thing clients ask for. Design the transactional screens
that generate the data first, or your dashboard will show empty charts.

---

## Phase 8 — Validate & baseline

**Goal.** Prove the design before it costs money to be wrong.

**Activities.**
- Usability walkthrough with 3-5 real front-line users, one at a time. Give a
  task, say nothing, count the stumbles.
- Walk the prototype through the **top 3 exception scenarios**, not the happy path.
- Dry-run the data migration: take a real month of records and map every field.
  Fields with no home are missing requirements.
- Baseline the metrics you will be judged on (cycle time, error rate, volume per
  head) so the go-live benefit is provable.

**Outputs.** Validated prototype, migration field-mapping sheet, benefit
baseline, backlog for build.

**Exit gate.** Sponsor approves build scope against the MoSCoW cut line.
