# Manufacturing Project Controls Command Center

A standalone dashboard verifying and correcting a downloaded "AI research" document — "Domain:
Project Control in Manufacturing Environments" — that proposed 30 methods and a 4-tier dashboard
architecture for project controls in mission-critical, multi-site manufacturing programs. Nine live,
interactive modules covering WBS/EVMS baseline governance, DCMA-14-Point schedule health, EVM/EAC
cost engineering, QSRA Monte Carlo risk, FMEA, supply-chain/procurement controls, change governance
and traceability, a diagnostic playbook of the remaining verified methods, and a full source ledger.

**Not a real employer's dashboard.** Every dollar figure, date, and site name is a synthetic worked
example built to demonstrate real project-controls methodology. See the Methodology & Source Ledger
tab for exactly what's independently verified vs. corrected vs. invented for the exercise.

## Why this repo exists, and why it's separate from its siblings

This session already has two related dashboards:
- [`project-controls-command-center`](https://github.com/tjaiyen/project-controls-command-center) —
  capital-program EVM/schedule controls for **construction**, 4,109 passing stress checks.
- [`ams-manufacturing-cost-command-center`](https://github.com/tjaiyen/ams-manufacturing-cost-command-center) —
  should-cost/MHR/variance methodology for **manufacturing cost engineering**.

The downloaded document this repo verifies is about **manufacturing project controls** — a third,
genuinely distinct combination (project-controls *methodology*, applied to the *manufacturing*
domain) that neither sibling repo covers. A structural survey of `project-controls-command-center`
confirmed it already implements the construction-domain version of most of this methodology (a full
4-method EAC, DCMA-14-style schedule health, AACE Monte Carlo risk, an NCR quality register, a
change/contract register) at far greater depth than this document proposes — bolting
manufacturing-specific concepts (BOM sync, Takt-time production-line balancing, PPAP/AS9145,
IQ/OQ/PQ→C&Q commissioning) onto that construction-themed dashboard would have repeated the same
domain mismatch this session already resolved once (`ams-manufacturing-cost-command-center` vs.
`cost-management-command-center`) by keeping the domains in separate repos. This repo is
deliberately scoped to the manufacturing-specific concepts those two siblings do not and should not
cover.

## Zero dependencies, by design

Plain HTML/CSS/vanilla JS, one file, no build step, no framework, no external script or stylesheet.
Every calculation runs client-side in the functions defined in `index.html`'s own `<script>` block —
the same architectural stance as every sibling repo in this family.

## Verification methodology

The source document's 30 methods were cross-checked against published project-controls, quality-
engineering, and supply-chain literature via **7 independent parallel research passes** (one per
document section), each requiring ≥2 corroborating sources and a disconfirming search before
accepting a claim, plus a structural survey of the sibling `project-controls-command-center` repo to
confirm this dashboard doesn't duplicate work already done there. Verified 2026-09-05.

### The headline finding: borrowed regulated-industry vocabulary

Three independent research passes, working on unrelated sections of the document, each found the
**same class of error** — specific compliance vocabulary borrowed from one regulated industry and
applied broadly to "mission-critical manufacturing" without caveat:

- **APQP/PPAP** is AIAG-**automotive**-native (18 elements); aerospace/defense uses the distinct,
  IAQG-governed **AS9145** standard (11 deliverables) — not raw PPAP. This dashboard's APQP/PPAP
  tracker on the Quality tab makes the framework an explicit selector, not an assumption.
- **IQ/OQ/PQ** is FDA/pharma-**GxP**-native (21 CFR §211.63); even semiconductor-industry guides
  admit they're borrowing "the pharmaceutical industry's 3Q framework." This dashboard's
  Commissioning tab uses **Commissioning & Qualification (C&Q)** instead, reserving IQ/OQ/PQ for
  genuinely FDA-regulated scope.
- **Common Data Environment (CDE)** is construction/BIM-native (ISO 19650) — no evidence of native
  manufacturing/PLM usage was found. The real manufacturing-native term is "digital thread" or
  "unified data environment."

### Confirmed technical corrections (not silently repeated as fact)

- "CBS" is not a real EVMS pillar term — the actual fourth structural element alongside WBS/OBS is
  the **Chart of Accounts** (NDIA/EIA-748 Intent Guide).
- "EBOM → MBOM → PBOM" is not a real 3-tier manufacturing lineage — Planning BOM (PBOM) is an MRP
  demand-planning construct ("super bill"), not a manufacturing-execution tier after MBOM. This
  dashboard's Baseline tab models the real 2-tier EBOM→MBOM lineage only.
- "WIP Value-at-Risk" is not an established named practice — a plausible-sounding synthesis of three
  separately-real concepts (VaR, WIP aging, scrap risk).
- "Vendor Performance Indexing (VPI)" is not a standardized named metric — it turns up as an
  unrelated proprietary term in *property-management* vendor scoring, confirming it's reinvented
  per-organization, not an industry standard. This dashboard's Supply Chain tab uses the correctly-
  named metrics instead: OTIF %, Defect PPM, Billing Variance %.
- RPN (Severity × Occurrence × Detection) was replaced by **Action Priority (AP)** in the joint
  AIAG-VDA FMEA Handbook (2019), specifically because RPN's multiplication can rate a high-severity
  failure as low-priority. This dashboard's FMEA table computes both, side by side, to demonstrate
  the exact divergence that motivated the change (a severity-9 item with RPN=108 is flagged AP=HIGH
  while ranking below a lower-severity item with RPN=343 — any watch-list built on an RPN threshold
  alone would risk missing the real high-severity item).
- The document's own dashboard "Level 1-4" numbering collides with (but doesn't match) **both**
  ISA-95's real Level 0-4 automation hierarchy **and** ISA-101's separate Level 1-4 HMI hierarchy —
  three different schemes share the same numbers in the same domain. This dashboard's tabs are named
  by function, not by number, to avoid the collision.
- "Under three clicks" drill-down is the specific, 20+-year-old **debunked** UX myth (Porter 2003: no
  drop-off in success/satisfaction after 3 clicks, users click 25+ times without friction when they
  feel they're making progress; Nielsen: changing a design from 3 to 4 clicks *increased* conversion
  600%). Not used as a design constraint here.

### Confirmed real, with a stated materiality caveat

- "Zero tolerance for negative float" is real DCMA-audit-threshold language, but is contested in
  practitioner literature as a rigid policy that can mask root causes in complex schedules.
- "Daily/automated end-of-day EVMS" refresh is not standard practice at multi-billion-dollar program
  scale — real ANSI/EIA-748 cadence is monthly; cost-accrual lag is the specific structural reason
  EVM can't be truly daily. This independently reconfirms, in a different domain, an identical
  finding from an earlier manufacturing-cost-KPI research pass this session.
- Multi-site tooling/equipment leveling is strongly evidenced for autoclaves specifically (real
  peer-reviewed aerospace-composite scheduling literature) but thin for grouping CNCs/metrology
  rigs/calibration chambers into the same claim.
- "Digital twin" multi-tier supply-chain visibility has real leading-edge case studies but a 2024
  peer-reviewed study found only ~16% of self-labeled "digital twins" achieve true closed-loop
  capability — most are rebranded monitoring dashboards.

### Verified real, correctly described, no correction needed

EIA-748 EVMS and all its formulas (CPI, SPI, both TCPI variants, the 4-method EAC triangulation —
checked exactly against PMBOK-aligned sourcing); the real DCMA 14-Point Assessment (all 14 named
checks); Critical Chain Project Management (Goldratt, 1997); Takt time applied to project milestone
turnover (genuine Lean Construction practice); QSRA Monte Carlo simulation (AACE 57R-09); Digital
Thread (2013 USAF origin); FAT/SAT tied to milestone payments (IEC 62381/ISA-105); Tier-N supply-
chain terminology and dual-sourcing; scope creep and the FAR-Changes-Clause-grounded practice of
separating customer-directed changes from contractor rework.

## Verification

Run: `node stress.cjs` — 163 checks, all passing as of this writing. Every golden value (EVM/EAC
figures, the QSRA Monte Carlo P50/P80/P95 percentiles, the DCMA pass count, every calculator's
output) was pre-registered by hand or via a standalone Node script *before* being written into
`stress.cjs`, then confirmed against the real page's own JS logic, then confirmed a second time live
in a real browser.

**Accepted limitation:** the DCMA 14-point checklist's "re-render after editing an input" path, and
similarly any component that reads a value back out of a `document.getElementById()` call on
previously-`innerHTML`-rendered markup, isn't testable in `stress.cjs`'s DOM stub (it stubs
`getElementById`/`querySelectorAll` directly rather than parsing HTML strings into a real DOM tree,
so a fresh call to such an id after a render auto-vivifies a blank stub element rather than finding
the "real" one). The first, load-bearing render (using the page's own seeded defaults) is fully
covered; live-editing behavior for these specific inputs was verified directly in a real browser
instead — confirmed working (editing the DCMA "Lags %" input from a failing to a passing value
correctly moved the pass count from 11/14 to 12/14).

## Status

Built 2026-09-06 in direct response to a downloaded "Domain: Project Control in Manufacturing
Environments" document, verified via 7 parallel research passes plus a structural survey of the
sibling `project-controls-command-center` repo. Local commit only — push pending explicit
confirmation, same discipline as every sibling repo in this session.
