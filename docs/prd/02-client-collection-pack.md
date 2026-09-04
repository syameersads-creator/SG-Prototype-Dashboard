# Client collection pack

**This is the document you send the client.** Adapt the wording, keep the
structure. Every item has a named owner and a deadline, or it will not arrive.

Set up a shared folder in advance with these exact subfolders. People fill in a
structure; they ignore a list.

```
/01-org-and-people
/02-process-and-sop
/03-forms-and-templates
/04-transaction-samples
/05-systems-and-screens
/06-master-data
/07-numbers-and-volumes
/08-rules-and-compliance
/09-problems-and-wishlist
```

---

## Tier 1 — Before kickoff (must have)

Without these, do not start. Deadline: 5 working days.

| # | What to collect | Why we need it | Format |
|---|-----------------|----------------|--------|
| 1.1 | Org chart with headcount per function, and who reports to whom | Determines roles and permissions in the platform | PDF or slide |
| 1.2 | A one-paragraph description of what the business sells and to whom | Frames every design decision | Text |
| 1.3 | List of every software/tool in daily use, including WhatsApp groups and personal spreadsheets | The real system landscape. The shadow IT is where the requirements hide | Spreadsheet |
| 1.4 | For each tool: who administers it, what it costs, whether the contract can be exited | Determines what we integrate with vs. replace | Spreadsheet |
| 1.5 | The 3 things that go wrong most often, in their own words | The trigger behind the project | Text |
| 1.6 | Named sponsor and process owner, with authority to sign off | Prevents the six-week rework meeting | Email |

## Tier 2 — During discovery (the evidence)

Deadline: 10 working days. This is the tier that determines whether your PRD is
real or imagined.

### Process and rules

| # | What to collect | Why |
|---|-----------------|-----|
| 2.1 | Every SOP, work instruction, checklist or training doc — even outdated ones | Outdated SOPs show you what was *intended*; the gap to reality is your requirement |
| 2.2 | Approval matrix / limits of authority: who approves what, up to what value | Becomes the approval workflow engine |
| 2.3 | Pricing rules, discount rules, credit terms — including the exceptions | The exceptions are the hard part of the build |
| 2.4 | Escalation rules: what happens when something is late, short, damaged, rejected | Exception flows are 30-40% of operational effort |
| 2.5 | Working calendar: shifts, cut-off times, peak seasons, public holidays that matter | Drives SLA logic and capacity views |

### Forms and documents (ask for **blank template + 3 filled real examples** of each)

| # | What to collect |
|---|-----------------|
| 2.6 | Every customer-facing document: quotation, sales order, delivery order, invoice, credit note, service report |
| 2.7 | Every internal form: job order, requisition, purchase order, goods receipt, timesheet, inspection sheet, incident report |
| 2.8 | Every spreadsheet used to run the operation — **the actual file, not a screenshot**, formulas intact |
| 2.9 | Reports currently sent to management, with the raw file used to build them |

> The filled examples matter more than the blanks. Handwritten notes in the
> margins of a real form are unwritten requirements.

### Transaction samples

| # | What to collect | Why |
|---|-----------------|-----|
| 2.10 | A full export of 3-6 months of core transactions (jobs / orders / tickets / shipments) — CSV or Excel, all columns | Reveals real volumes, real field usage, real data quality |
| 2.11 | One complete "case file" for 5 transactions, end to end: enquiry → quote → order → execution → delivery → invoice → payment | Shows the real handoffs and how long each takes |
| 2.12 | 3 examples of transactions that went *wrong*, with the email/chat trail | Your exception design comes from here |

### Systems and screens

| # | What to collect |
|---|-----------------|
| 2.13 | Screenshots of every screen staff use daily, in the sequence they use them |
| 2.14 | Any existing system's data export capability: can we get data out? In what format? |
| 2.15 | API documentation for anything we may need to integrate (accounting, e-commerce, payment, carrier, government portal) |
| 2.16 | Current login/user list per system, with roles — shows who really does what |

### Master data

| # | What to collect | Why |
|---|-----------------|-----|
| 2.17 | Customer list with fields as currently held | This is your migration scope and your first data-quality shock |
| 2.18 | Supplier / subcontractor list |
| 2.19 | Product / service / item catalogue with pricing structure |
| 2.20 | Asset register: vehicles, equipment, sites, containers — whatever the operation revolves around |
| 2.21 | Staff list with roles, and which staff are field-based vs office-based | Field staff means mobile-first, offline tolerance |

### Numbers

| # | What to collect | Why |
|---|-----------------|-----|
| 2.22 | Transaction volume per day/week/month for the last 12 months | Sizes the system and reveals seasonality |
| 2.23 | Peak day ever recorded, and what happened | Your load requirement |
| 2.24 | Number of concurrent users expected at peak hour | Licensing, architecture |
| 2.25 | Current KPIs reported to management, how each is calculated, and who compiles it | The dashboard spec writes itself from this |
| 2.26 | Loaded hourly cost per role (approx is fine) | Lets you size the pain in dollars |

## Tier 3 — Before build (constraints)

Deadline: before design sign-off.

| # | What to collect | Why |
|---|-----------------|-----|
| 3.1 | Data protection / privacy obligations, and what personal data is held | Determines retention, access logging, consent handling |
| 3.2 | Industry or regulatory requirements: licensing, tax invoicing rules, e-invoicing mandates, safety records, audit trail retention periods | These are non-negotiable requirements, not nice-to-haves |
| 3.3 | Audit history: any findings from external audits or customer audits | Free requirements list |
| 3.4 | IT constraints: device fleet, browsers, network in the warehouse/site, whether staff have company email | A warehouse with no wifi changes the whole architecture |
| 3.5 | Existing contracts with lock-in (ERP, accounting) and renewal dates | Timing your cut-over |
| 3.6 | Who currently holds the admin passwords, and what happens if they leave | Real operational risk, usually unaddressed |
| 3.7 | Budget band and funding source; any grant scheme deadlines | Grant deadlines drive scope more than requirements do |

---

## Email you can send

> Subject: Information we need to design your operations platform
>
> Hi [Name],
>
> To design something that fits how you actually work — rather than how it looks
> on paper — we need to see the real artefacts your team uses. I have set up a
> shared folder with the structure below.
>
> Two things that make this fast:
>
> 1. **Send real, filled-in examples, not blank templates.** A messy real form
>    tells us more than a clean template. Redact customer names if you prefer.
> 2. **Do not tidy anything up first.** The spreadsheet with three tabs nobody
>    understands is exactly what we need to see.
>
> Tier 1 items by [date] so we can hold kickoff; Tier 2 by [date].
> I have put a name next to each item — could you confirm those owners?
>
> Anything you cannot find, just tell me it does not exist. That is useful
> information in itself.

---

## Reading the evidence

When the pack arrives, work through it looking for these five things:

1. **Rekeying.** The same value typed into more than one system. Count the hops.
2. **Reconciliation.** Any spreadsheet whose purpose is to compare two other
   sources. Each one is a missing integration.
3. **Private spreadsheets.** A file on one person's desktop that the operation
   depends on. That is a single point of failure and a requirement.
4. **Fields that are always blank.** Do not migrate them; ask why they exist.
5. **Free-text fields carrying structured meaning.** A "Remarks" column holding
   status codes means a status field is missing from the current system — and
   will be needed in yours.

Every one of these produces a line in the pain register.
