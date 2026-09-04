# Platform design kit

From signed PRD to clickable prototype. **Follow the order.** Each step's output
is the next step's input; skipping ahead is what causes redesigns.

---

## Step 1 — Entity model

List the nouns that appear in the process map and the forms. Those are your
entities. For each one:

| Entity | What it represents | Identified by | Owned by (role) | Lifecycle |
|--------|--------------------|---------------|-----------------|-----------|
| Job | One unit of work sold to a customer | Job number | Ops coordinator | Draft → Scheduled → In progress → Completed → Invoiced → Closed |

Then the relationships, stated in plain sentences with cardinality:

- A **Customer** has many **Sites**.
- A **Job** belongs to one **Customer** and one **Site**.
- A **Job** has many **Tasks**; a **Task** is assigned to one **Crew**.
- An **Invoice** covers one or more **Jobs** *(this is the one that always turns
  out to be many-to-many after you have built one-to-many — confirm it against
  real invoices from the evidence pack)*.

**Test your model against the evidence.** Take five real case files from item
2.11 of the collection pack and try to represent each in the model. Any field on
a real form that has nowhere to go is a missing attribute or a missing entity.

**Rules of thumb**
- If an attribute has its own history, its own status, or its own owner, it is
  an entity, not a field.
- If a client says "sometimes it's one, sometimes it's several", it is many.
- Anything with a number printed on a customer-facing document needs a stable,
  human-readable identifier and a numbering rule.

---

## Step 2 — State machines

For every core entity, define the statuses and the legal transitions. Statuses
that no one can act differently on are not statuses.

| From | To | Trigger | Who may | Preconditions | Side effects |
|------|----|---------|---------|---------------|--------------|
| Scheduled | In progress | Crew starts work | Crew lead | Site details confirmed | Timestamp, notify coordinator |
| In progress | Completed | Work signed off | Crew lead | All tasks done, photos attached | Locks task edits, queues for invoicing |

Also define, explicitly:
- Which transitions can go **backwards**, and who may reverse them
- What happens to a record that is **cancelled** part-way (data retained? billable?)
- **Terminal states**, and whether anything can leave them

Undefined reverse transitions are the single largest source of post-go-live
support tickets.

---

## Step 3 — Role × permission matrix

Rows = roles from the PRD. Columns = entities. Cells = C / R / U / D / A (approve).

| | Customer | Job | Task | Invoice | Timesheet | Reports |
|---|---|---|---|---|---|---|
| Crew | – | R (assigned only) | R U (assigned only) | – | C R U (own) | – |
| Coordinator | C R U | C R U | C R U D | R | R | Ops reports |
| Finance | R | R | – | C R U A | R A | All financial |
| Director | R | R | R | R A | R | All |

Then check three things:

1. **Segregation of duties.** Nobody creates *and* approves the same thing.
   Where the client's headcount makes that impossible, record it as an accepted
   risk with a compensating control (e.g. after-the-fact review report), and get
   the sponsor to sign it.
2. **Row-level scoping.** "R" is rarely global — is it own records, own team,
   own site, own customer? Write the scope in the cell.
3. **Field-level exceptions.** Cost price, margin, salary, personal data. List
   the fields that are narrower than the entity's permission.

---

## Step 4 — Screen inventory

Derive screens from entities × roles — do not invent them.

| Screen | Entity | Type | Primary role | Purpose | Key actions | Notes |
|--------|--------|------|--------------|---------|-------------|-------|
| Job list | Job | List | Coordinator | Find and triage today's work | Filter, assign, open | Default filter: today + unassigned |
| Job detail | Job | Detail | Coordinator | Full record, timeline | Edit, transition, attach | Tabs: details / tasks / files / history |
| My jobs (mobile) | Job | List | Crew | Today's assignments | Start, complete, photo | Offline-capable |

Standard types: list, detail, create/edit form, approval queue, dashboard,
settings/admin, search.

**Every list screen needs a decision on:** default filter, default sort, columns,
saved views, bulk actions, empty state, and what happens at 10,000 rows.

**Do not forget the unglamorous screens.** Admin/master-data maintenance,
user management, and the audit log are always omitted from the estimate and
always required.

---

## Step 5 — Dashboard metric spec

Design this **after** the transactional screens. A dashboard is a view of data
the transactional screens create; design it first and you will design charts for
data nobody captures.

For every tile:

| Field | Example |
|-------|---------|
| Name | Jobs at risk today |
| Question it answers | Which jobs will miss their promise date if nobody acts? |
| Exact definition | Jobs with status ∈ {Scheduled, In progress} AND promise_date = today AND no crew assigned, OR last status change > 4h ago |
| Source | Job table |
| Refresh | Live on load, 60s poll |
| Audience | Coordinator, Ops manager |
| **Action it prompts** | Click through to filtered list; assign crew |
| Threshold / alert | Amber > 3, red > 8 |
| Owner of the number | Ops manager |

**If a tile has no "action it prompts", delete it.** Dashboards that only inform
get ignored within a month.

Structure the dashboard in three bands:
1. **Act now** — exceptions requiring intervention today (top, biggest)
2. **Today's state** — volumes, progress against plan
3. **Trend** — this week/month vs. last, for management

---

## Step 6 — Wireframes and prototype

Only now do you draw screens.

**Order of build for the prototype:** the single most frequent task first
(usually "create the core transaction"), then its list view, then the approval
step, then the exception path, then the dashboard.

**Design constraints to carry through**
- Match the client's vocabulary exactly. If they say "job sheet", never write
  "work order" — the wording fight costs more than the feature.
- Keep the field order of the paper form on the first release. Familiarity beats
  optimality during adoption; optimise in phase 2.
- Every screen that field staff use: thumb-reachable, high contrast, works with
  gloves and in sunlight, tolerates losing signal mid-form.
- Make the exception path as easy as the happy path, or staff will route around
  the system to handle exceptions and your data will be wrong.

**Validation.** Put the prototype in front of 3-5 real users, one at a time.
Give them a task. Say nothing. Count the stumbles. Fix the top three. Repeat.

---

## Step 7 — Migration field mapping

Take one real month of records. Map every source field to a destination field.

| Source system | Source field | Sample value | Destination entity.field | Transform | Owner of cleaning | Issues |
|---------------|--------------|--------------|--------------------------|-----------|-------------------|--------|

Three outcomes to hunt for:
- **Source field with no destination** → either a missing requirement or an
  agreed drop. Get it decided in writing, not by silence.
- **Destination with no source** → someone has to enter it manually at go-live.
  Who, and how long will it take? This is usually the hidden cost of the project.
- **Dirty data** → duplicates, inconsistent naming, dates as text. Cleaning is
  the client's job and it always takes longer than they think. Start it in
  parallel with build, not at cut-over.
