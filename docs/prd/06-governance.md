# Governance: keeping the project honest

## RACI for the discovery-to-design phase

| Activity | You | Sponsor | Process owner | Front-line | IT |
|----------|-----|---------|---------------|-----------|-----|
| Engagement note | R | A | C | I | I |
| Evidence collection | C | I | **A/R** | R | R |
| Interviews | R | I | C | R | R |
| As-is map | R | I | A | C | I |
| Pain sizing | R | A | C | C | I |
| To-be design | R | A | R | C | C |
| PRD | R | A | R | C | C |
| Platform design | R | I | C | C | C |
| Prototype validation | R | I | A | R | I |
| Data cleaning | C | I | A | R | R |

The one to hold firm on: **evidence collection is Accountable to the client's
process owner, not to you.** If you chase every document yourself, the project
never gets client ownership and UAT will be brutal.

---

## Decision log

Every decision that closes an option. Without this, the same argument recurs
monthly and nobody remembers why.

| # | Date | Decision | Options considered | Rationale | Decided by | Reversible? |
|---|------|----------|--------------------|-----------|-----------|-------------|

---

## Assumption register

Assumptions are requirements you have not verified. Track them or they become
defects.

| # | Assumption | Made because | Impact if wrong | How we validate | By when | Status |
|---|-----------|--------------|-----------------|-----------------|---------|--------|

Review at every checkpoint. An assumption still open at sign-off must be either
converted to a requirement or written into the risk section.

---

## Change control (starts the moment the PRD is signed)

A change request needs five things before it is even discussed:

1. What is being asked for, in one sentence
2. Who is asking and why (which business outcome it serves)
3. Impact on cost, timeline and other requirements
4. What comes **out** of scope to make room, if the budget is fixed
5. Sponsor decision, dated

**The trade rule:** in a fixed budget, nothing enters scope without something
leaving. Establish this at PRD sign-off, in front of the sponsor, before the
first change request arrives. It is far easier to agree in principle than in
the specific case.

| CR# | Date | Request | Requester | Impact (cost/time) | Traded out | Decision | Decided by |
|-----|------|---------|-----------|--------------------|-----------|----------|-----------|

---

## Acceptance criteria and UAT

Write UAT scenarios from the PRD acceptance criteria — not from the build. If
you cannot write a test from a requirement, the requirement was not finished.

**UAT scenario format**

| Field | Content |
|-------|---------|
| Scenario | Coordinator assigns an urgent job arriving after cut-off |
| Role | Coordinator |
| Preconditions | Crew A already at capacity; job promise date is today |
| Steps | 1... 2... 3... |
| Expected result | Observable, unambiguous |
| Requirement ref | REQ-JOB-014 |
| Result | Pass / Fail / Blocked |

**Coverage rule.** Every Must-have requirement needs at least one UAT scenario,
and **at least one third of scenarios must be exception paths.** UAT that only
walks the happy path guarantees a bad first month in production.

**Who tests.** The people who will use it daily, not their managers. Give them
protected time; UAT squeezed between real work is theatre.

**Defect triage during UAT**

| Severity | Definition | Fix before go-live? |
|----------|-----------|---------------------|
| 1 — Blocker | Cannot complete a core business transaction | Yes |
| 2 — Major | Workaround exists but is unacceptable daily | Yes |
| 3 — Minor | Cosmetic or rare | Backlog |
| 4 — Change | Not a defect; it works as specified | Change control |

Agree these definitions **before** UAT starts. The severity-4 row is what stops
"can you also just..." from being logged as a bug.

---

## Standing meetings

| Cadence | Who | Purpose | Output |
|---------|-----|---------|--------|
| Weekly, 30 min | You + process owner | Evidence chase, open questions, blockers | Updated open-questions log |
| Fortnightly, 45 min | + sponsor | Decisions, scope, risks | Decision log entries |
| At each phase gate | All | Formal sign-off | Signed gate document |

Keep the weekly short and make the open-questions log the agenda. A project
with an aging open-questions list is a project about to slip.

---

## Warning signs

Escalate to the sponsor when you see any of these:

- Evidence items are more than a week late with no named owner
- You cannot get 30 minutes with a front-line user
- The person who "knows how it really works" has not been made available
- The process owner has never disagreed with anything you have shown them
- Requirements keep arriving from someone who is not in the RACI
- The client wants to skip the as-is map and "just design the new system"

The last one is the most dangerous and the most common request. The as-is map is
what makes the to-be design credible to the people who have to adopt it.
