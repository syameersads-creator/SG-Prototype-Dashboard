# PRD — [Client] Operations Platform

| | |
|---|---|
| **Version** | 0.1 draft |
| **Date** | |
| **Author** | |
| **Sponsor (signs off)** | |
| **Process owner (signs off)** | |
| **Status** | Draft / In review / Signed |

---

## 1. Problem & objective

**Business trigger.** What happened that made this project start now.

**Objective.** One sentence. What changes, for whom, measured how.

**Success metrics.** Three at most, each with a baseline and a target.

| Metric | How it is measured | Baseline (today) | Target | Measured by when |
|--------|--------------------|------------------|--------|------------------|
| e.g. Quote-to-order cycle time | Timestamp diff, median | 3.2 days | < 1 day | 3 months post go-live |
| | | | | |

**Non-goals.** What this platform explicitly will not do. Be specific and
slightly aggressive here — this section prevents more scope creep than any other.

---

## 2. Current state summary

- As-is process map: [link]
- Systems in use today: [table]
- Volume baseline: [numbers]
- Top pains, sized: [link to pain register]

**Key findings.** Five bullets maximum. The things a new reader must know.

---

## 3. Users & roles

| Role | Headcount | Where they work | Device | Primary jobs-to-be-done | Technical comfort |
|------|-----------|-----------------|--------|--------------------------|-------------------|
| | | Office / field / warehouse | Desktop / phone / tablet | | Low / med / high |

For each role, one line: *"[Role] needs to [do what] so that [outcome]."*

---

## 4. Scope

### In scope (this release)

Modules/capabilities, one line each.

### Out of scope (this release)

Explicitly named, with the reason and — where relevant — which future phase it
lands in. "Not discussed" is not the same as "out of scope"; only listed items
are out of scope, everything else is undecided and must be raised.

### Phasing

| Phase | Contents | Rationale |
|-------|----------|-----------|
| MVP | | |
| Phase 2 | | |
| Later / maybe | | |

---

## 5. Functional requirements

Group by module. Each requirement gets an ID, a story, testable acceptance
criteria, and a MoSCoW priority.

### 5.1 [Module name]

**REQ-[MOD]-001 — [Short title]**  ·  Priority: **Must**

> As a [role], I need to [action], so that [outcome].

**Acceptance criteria**
- Given [state], when [action], then [observable result].
- [Rule, with the actual numbers and thresholds]
- [What happens on the exception path]

**Notes.** Source of the requirement (interview, evidence item, regulation).

---

Repeat. Aim for requirements that a tester could verify without asking you a
question. If an acceptance criterion contains "appropriately", "easily", or
"as needed", it is not finished.

---

## 6. Business rules

Rules that apply across modules. State each as a testable rule with its
exceptions, and name who owns changing it.

| ID | Rule | Exceptions | Owner |
|----|------|-----------|-------|
| BR-01 | Purchases above $5,000 require director approval | Suppliers A, B on standing order; emergency purchases approved retrospectively within 48h | Finance manager |

---

## 7. Data & integration

- **Core entities and relationships:** [link to entity model]
- **Master data ownership:** who is the system of record for each entity
- **Migration scope:** what comes across, from where, how much, cleaned by whom
- **Integrations:**

| System | Direction | Data | Frequency | Method | Owner | Fallback if it fails |
|--------|-----------|------|-----------|--------|-------|----------------------|

- **Retention & deletion:** what is kept, for how long, and why

---

## 8. Reporting & dashboards

Every metric gets a full spec — see the [design kit](05-platform-design-kit.md).
A tile with no defined action is decoration; cut it.

| Metric | Definition (exact) | Source | Refresh | Audience | Action it prompts |
|--------|--------------------|--------|---------|----------|-------------------|

---

## 9. Non-functional requirements

| Area | Requirement |
|------|-------------|
| Performance | e.g. list views P95 < 2s at 50,000 records |
| Concurrency | e.g. 25 concurrent users at peak, 09:00-10:00 |
| Availability | Target uptime, acceptable maintenance window |
| Mobile / offline | Which roles, which screens, what happens with no signal |
| Access control | Role-based; least privilege; approval segregation of duties |
| Audit | What is logged, retained how long, who can read it |
| Data protection | Personal data held, lawful basis, retention, subject access |
| Backup & recovery | RPO / RTO |
| Localisation | Languages, currency, date format, tax rules |
| Accessibility | Target level |
| Browser / device support | Explicit list |

---

## 10. Assumptions, dependencies, risks

| # | Assumption | If wrong, impact | Validate by |
|---|-----------|------------------|-------------|

| # | Dependency | Owner | Needed by |
|---|-----------|-------|-----------|

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|

---

## 11. Rollout & adoption

- Migration approach: big bang / parallel run / phased by site or module
- Training: who, how, when, and who trains the next intake
- Cut-over plan and rollback trigger
- Support model for the first 30 days
- **Adoption risk:** who loses convenience or status because of this system, and
  what is being done about that. This is the most under-written section of most
  PRDs and the most common cause of failure after go-live.

---

## 12. Open questions

| # | Question | Owner | Needed by | Blocks |
|---|----------|-------|-----------|--------|

---

## 13. Sign-off

| Name | Role | Signature | Date |
|------|------|-----------|------|

Changes after this point follow the change control process in
[`06-governance.md`](06-governance.md).
