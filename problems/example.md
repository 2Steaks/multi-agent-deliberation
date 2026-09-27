# Decision: Switch from flat-rate to usage-based billing

## Context

We run a B2B SaaS product (project collaboration tooling) with three flat-rate
plans: Starter, Team, Enterprise. Pricing is per-seat, unlimited usage within
each plan.

One feature — AI-powered document summarization — now accounts for ~80% of
our infrastructure cost, driven by a small subset of "power user" accounts
(roughly 5% of customers generate 60% of summarization calls). Everyone else
uses it lightly or not at all, but pays the same price.

Finance wants to introduce usage-based billing for this feature specifically:
a monthly included allowance per plan tier, with metered overage billed at
the end of the month. All other features stay flat-rate/unlimited.

## The proposal

Replace unlimited summarization usage with:
- A fixed monthly allowance per plan (e.g. 200 summaries on Team)
- Metered overage billed per-summary beyond the allowance
- Real-time usage visible in-app; email warning at 80% of allowance

Target: recover infra cost from heavy users without raising list price for
everyone else, and ship this within the current quarter.

## The question

Should we make this change, and if so, how should it be scoped and
sequenced to avoid alienating existing customers who are used to unlimited
usage?
