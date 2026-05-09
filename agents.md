# Agent Session Protocol — NeuroStat

This file contains mandatory instructions for every AI agent (GitHub Copilot Coding Agent, Claude, GPT, or any other) working in this repository.

---

## ⚠️ Mandatory End-of-Session Checklist

**These steps MUST be completed at the end of EVERY agent session that involves a behaviour or feature change.** Skipping any of these steps is considered a critical error.

### 1. `CHANGELOG.md`

- Add an entry under `## [Unreleased]` using the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.
- Use the headings **Added**, **Changed**, or **Fixed** as appropriate.
- Be specific: describe *what* changed and *why* it matters.

### 2. `docs/USER_MANUAL.md` (English)

- Update every section that is affected by the change.
- Reflect new UI, new settings, changed workflows, or removed features accurately.
- Outdated documentation is a critical defect — the manual must always match the actual application behaviour.

### 3. `docs/BENUTZERHANDBUCH.md` (German)

- Apply the same updates as `USER_MANUAL.md`, translated into German.
- Both documents must always be in sync.

### 4. `README.md`

- Update the **Features** list if a new user-facing capability was added or removed.
- Update the **Screenshot** if the UI changed significantly.
- Update the **Tech Stack** table if a new dependency was introduced.
- Update the **Workflow** block if the step sequence changed.

### 5. `LICENSE`

- The copyright line must always read: `Copyright (c) 2024–<current year> Neuroklast`
- Update the year at the start of each calendar year.

### 6. `ARCHITECTURE.md` (only for significant architectural decisions)

- Add an ADR entry (Architecture Decision Record) when:
  - A new state management approach is introduced.
  - A new parsing strategy or data pipeline is added.
  - A core business-logic decision is made that future developers need to understand.
- Use the schema: **Context → Decision → Consequences**.

### 7. `docs/QUICKSTART_EN.md` and `docs/QUICKSTART_DE.md` (only when user workflow changes)

- Update if the step-by-step onboarding workflow changed for end users.

---

## Checklist Template

Copy and paste this into your session plan / PR description:

```
### Session-End Documentation Checklist
- [ ] CHANGELOG.md — [Unreleased] entry added
- [ ] docs/USER_MANUAL.md — affected sections updated
- [ ] docs/BENUTZERHANDBUCH.md — same sections updated in German
- [ ] README.md — Features / Tech Stack / Workflow updated if needed
- [ ] LICENSE — copyright year correct
- [ ] ARCHITECTURE.md — ADR added if applicable
- [ ] docs/QUICKSTART_EN.md + docs/QUICKSTART_DE.md — updated if workflow changed
```

---

## Why This Matters

NeuroStat is a **FinTech-grade** royalty reporting tool used by real music labels for real financial statements. Stale documentation causes:

- Labels misconfiguring split rates → incorrect artist payouts
- Support issues from incorrect instructions in the manual
- Legal and tax compliance errors if German VAT text guidance is wrong

**Documentation is not optional. It is part of the definition of done.**
