# Interview guide

45-60 minutes per role. Two people: one asks, one writes. Record with permission.
Never interview a junior with their manager present.

## Opening (every interview, 3 minutes)

> "I am not here to assess anyone's performance. I want to understand how the
> work actually gets done, including the parts that are annoying or that you do
> outside the official process. Those parts are the most useful to me."

Then: **"Walk me through the last one you did."** Not a typical one. The last one.
Typical transactions are reconstructions; the last one is memory.

---

## The eight questions that surface hidden work

Ask these of everyone, whatever their role.

1. What do you do that you think a computer should be doing?
2. Where do you type the same information twice?
3. What do you keep in your own file or notebook because the system cannot hold it?
4. What do you have to chase someone for, and how do you chase them?
5. When something goes wrong, how do you find out — and how long after it happened?
6. What takes five minutes when it should take thirty seconds?
7. What do you do at month-end or year-end that you do not do the rest of the time?
8. If you were away for two weeks, what would break, and who would call you?

Question 8 finds the undocumented process. Question 3 finds the missing data model.

---

## By role

### Owner / sponsor (economic buyer)

- What made you start looking for a system this year rather than last year?
- Twelve months after go-live, what number do you want to be able to point at?
- What decision do you currently make on gut feel that you would rather make on data?
- What is the growth plan — volume, headcount, locations, product lines?
- What would make you consider this project a failure even if it was delivered on time?
- What has been tried before and did not work? Why?
- Who in the organisation will resist this, and why?
- What is your budget band, and is any of it time-bound (grant, financial year)?

### Operations manager (process owner)

- Take me through a normal day, hour by hour.
- Where does work queue up? What is the bottleneck this month?
- How do you know today's status without asking anyone?
- How do you allocate work to people — what rules do you apply in your head?
- What do you check before you approve something?
- What percentage of jobs go exactly to plan? What happens to the rest?
- What reports do you produce, for whom, and how long does each take to compile?
- Which of your staff has knowledge nobody else has?
- What is your busiest period, and what breaks first when it hits?

### Front-line staff (the people who will use it all day)

- Show me your screen. Walk me through what you have open right now and why.
- Which of these fields do you actually fill in? Which do you skip?
- What do you write in "Remarks"?
- When the system will not let you do something, what do you do instead?
- What do you have to remember that the system does not remind you of?
- How do you know when a job is yours to pick up?
- What is the most annoying thing about your current tools?
- If you are out on site, what do you need on your phone?

### Finance / admin

- What triggers an invoice? How long after the work is done?
- Where do billing disputes come from — what is the root cause?
- What do you have to reconcile manually, and against what?
- What is the month-end close sequence, and where does it stall?
- What data do you need from operations that you currently have to ask for?
- What are the tax/invoicing format requirements we must comply with?
- How are payments recorded and matched?

### IT / whoever keeps the systems running

- What runs where, and who has admin?
- What integrations exist today, and how were they built?
- What is your backup and recovery position?
- What devices do staff have — company or personal? Managed or not?
- What is the network like in the warehouse / on site?
- What are your constraints on where data can be hosted?
- What has broken in the last year?

### Customer-facing / sales

- How does an enquiry arrive? Through how many channels?
- What do you need to know to quote? How long does it take to find out?
- What do customers most often ask you that you cannot answer immediately?
- What promises do you make that operations then has to keep?
- What causes a customer to complain?

---

## Process-mapping questions (per step)

When walking a process, for every single step capture:

| Field | Question |
|-------|----------|
| Trigger | What tells you to start this? |
| Actor | Who does it? Who does it when they are away? |
| Tool | What do you use to do it? |
| Input | What do you need in front of you before you can start? |
| Rule | What decides which way it goes? |
| Output | What exists at the end that did not exist before? |
| Duration | How long does the work itself take? |
| Wait | How long does it usually sit before someone picks it up? |
| Volume | How many of these a day? |
| Exception | What are the ways this goes wrong, and how often? |
| Recovery | What do you do when it does? |

The **wait** and **exception** columns are where the business case lives. Most
teams underestimate wait time by an order of magnitude — verify it against the
timestamps in the transaction export, not the interview.

---

## Shadowing protocol

One full day with the busiest operational role. Bring a tally sheet.

Count, do not ask:

- Number of times the same data is typed into a second place
- Number of times they switch application
- Number of interruptions (calls, walk-ups, chat) and what each was about
- Number of times they ask a colleague for information
- Number of times they consult something outside the system (notebook, printout, memory)
- Minutes spent waiting on someone else

At the end of the day, show them the tally. It usually surprises them, and it
converts them into an advocate for the project — which you will need at UAT.

---

## After every interview (10 minutes, same day)

Write three things while it is fresh:

1. **Facts** — what they told you.
2. **Contradictions** — where this conflicts with someone else's account or with
   the evidence. Chase these; they are always a real requirement.
3. **Requirements implied** — your own inference, tagged as inference so it does
   not later get quoted back as fact.
