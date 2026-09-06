#!/usr/bin/env node
// stress.cjs — verification suite for the Manufacturing Project Controls Command Center.
//
// Same discipline as the sibling repos (ams-manufacturing-cost-command-center,
// cost-management-command-center, project-controls-command-center): stub the DOM, execute the
// page's real inline script via vm.runInContext, and assert against exact numbers pre-registered
// by hand/Node calculation and confirmed live in a real browser before this file was written. This
// tests the ACTUAL page code, not a parallel reimplementation that could hide the same bug twice.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let passes = 0, failures = 0;
function check(cond, msg, detail) {
  if (cond) { passes++; console.log("pass: " + msg); }
  else { failures++; console.error("FAIL: " + msg + (detail !== undefined ? " -- " + detail : "")); }
}

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

console.log("--- Structural checks ---");
const TABS = ["exec", "baseline", "schedule", "evm", "quality", "supply", "change", "playbook", "methodology"];
TABS.forEach((t) => {
  check(html.includes(`data-tab="${t}"`), `nav button for "${t}" exists`);
  check(html.includes(`id="tab-${t}"`), `panel for "${t}" exists`);
  check(html.includes(`id="navtab-${t}"`), `nav button id navtab-${t} exists`);
  check(html.includes(`aria-controls="tab-${t}"`), `nav button for "${t}" points aria-controls at its real panel id`);
  check(html.includes(`aria-labelledby="navtab-${t}"`), `panel for "${t}" points aria-labelledby back at its real nav button id`);
});
check((html.match(/role="tabpanel"/g) || []).length === TABS.length, `exactly ${TABS.length} panels carry role="tabpanel"`, (html.match(/role="tabpanel"/g) || []).length);
check(html.includes('role="tablist"') && html.includes('aria-orientation="vertical"'), "the side-nav is a real ARIA vertical tablist");
check(html.includes("Every dollar figure, date, and site name on this page is a"), "the top-level illustrative-data disclaimer is present");
check(html.includes('robots" content="noindex,nofollow"'), "page is noindex,nofollow");

console.log("--- Fabrication guard: confirmed-wrong claims never asserted as fact ---");
// This dashboard exists specifically to CORRECT these claims -- they must appear only inside the
// correction cards that name them to reject them, never asserted bare as if true.
const wrongClaimStrings = ["EBOM to MBOM to PBOM", "EBOM → MBOM → PBOM"];
const correctionCardMatch = html.match(/<div class="card">\s*<div class="card-head"><h2>Confirmed corrections[\s\S]*?<\/ul>\s*<\/div>/);
check(!!correctionCardMatch, "found the corrections card that is allowed to name the wrong claims (in order to correct them)");
const bomTabCardMatch = html.match(/<div class="card-head"><h2>EBOM → MBOM Synchronization<\/h2>[\s\S]*?<\/div>\s*<\/div>/);
check(!!bomTabCardMatch, "found the Baseline tab's own BOM-sync card (which also names the wrong 3-tier claim once, to correct it)");
let htmlOutsideCorrectionCards = html;
if (correctionCardMatch) htmlOutsideCorrectionCards = htmlOutsideCorrectionCards.replace(correctionCardMatch[0], "");
if (bomTabCardMatch) htmlOutsideCorrectionCards = htmlOutsideCorrectionCards.replace(bomTabCardMatch[0], "");
const foundWrongOutside = wrongClaimStrings.filter((s) => htmlOutsideCorrectionCards.includes(s));
check(foundWrongOutside.length === 0, "the wrong EBOM/MBOM/PBOM sequencing claim is not asserted as fact anywhere outside the two cards that correct it", JSON.stringify(foundWrongOutside));
// Scoped the same way as the EBOM/MBOM/PBOM check above (exclude the correction card(s), then
// inspect what's left) rather than an unscoped OR -- an OR against "does this phrase exist
// ANYWHERE in the document" can't catch a stray bare "CBS" mention elsewhere as long as the
// correction sentence exists somewhere else on the page.
const cbsOutsideCorrections = [...htmlOutsideCorrectionCards.matchAll(/.{0,30}"CBS".{0,10}/g)].map((m) => m[0]);
check(cbsOutsideCorrections.every((s) => /not/i.test(s)), "every \"CBS\" mention outside the correction card(s) sits in a \"not CBS\" framing (a pointer to the correction), never asserted as a real pillar term", JSON.stringify(cbsOutsideCorrections));
const vpiOccurrences = [...html.matchAll(/.{0,20}VPI.{0,10}/g)].map((m) => m[0]);
check(vpiOccurrences.length === 3, "found the expected number of \"VPI\" mentions to check (pre-registered by grep before this check was written)", JSON.stringify(vpiOccurrences));
check(vpiOccurrences.every((s) => /not\b|CORRECTED/i.test(s)), "every single mention of \"VPI\" in the whole page sits inside a correction context (\"not VPI\" / \"CORRECTED\"), never asserted as if it were a real standard", JSON.stringify(vpiOccurrences));

// The fabrication guard above previously covered only 3 of the ~10 corrected claims named in the
// README/Methodology tab (EBOM/MBOM/PBOM, CBS, VPI). Extending the same "every occurrence sits in
// a correction context" idiom to the rest, so a future regression on any of them is actually
// caught here instead of relying on a one-time manual grep.
function checkTermOnlyInCorrectionContext(term, expectedCount, correctionIndicatorRe, contextChars) {
  const c = contextChars || 20;
  const re = new RegExp(`.{0,${c}}${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.{0,${c}}`, "g");
  const occurrences = [...html.matchAll(re)].map((m) => m[0]);
  check(occurrences.length === expectedCount, `found the expected number of "${term}" mentions to check (pre-registered by grep before this check was written)`, JSON.stringify(occurrences));
  check(occurrences.every((s) => correctionIndicatorRe.test(s)), `every mention of "${term}" sits inside a correction context, never asserted as if it were a real/verified claim`, JSON.stringify(occurrences));
}
checkTermOnlyInCorrectionContext("WIP Value-at-Risk", 1, /CORRECTED|not an established/i);
checkTermOnlyInCorrectionContext("CDE", 4, /construction\/BIM-native|corrected|not CDE/i, 60);
checkTermOnlyInCorrectionContext("ISA-95", 2, /does not match/i, 50);
checkTermOnlyInCorrectionContext("ISA-101", 2, /separate/i, 50);
checkTermOnlyInCorrectionContext("three click", 1, /CORRECTED/i, 30);

console.log("--- Executing the real inline script in a stubbed DOM ---");
const scriptMatch = html.match(/<script>\s*\(function\(\)\{[\s\S]*?\}\)\(\);\s*<\/script>/);
check(!!scriptMatch, "found the inline IIFE script block to execute");
if (!scriptMatch) { console.error("FATAL: cannot continue without the script block"); process.exit(1); }
const pageScript = scriptMatch[0].replace(/^<script>/, "").replace(/<\/script>$/, "");

// Default values exactly as they appear in the HTML's own <input>/<select> value= attributes.
const DEFAULTS = {
  baseTotalCA: "8", baseMappedCA: "6",
  baseEbomCount: "420", baseMbomCount: "414", baseBomMismatches: "9",
  ccChainComplete: "50", ccBufferConsumed: "55",
  taktTarget: "180", taktZones: "175,182,190,178,185",
  evmBac: "45000000", evmPv: "18000000", evmEv: "16200000", evmAc: "17500000", evmEtcBottomUp: "29500000",
  qsraMin: "180", qsraMode: "210", qsraMax: "270",
  rccaD1: "0", rccaD3: "4", rccaD8: "32",
  ppapFramework: "aiag", ppapComplete: "14",
  tierCriticalParts: "42", tierMappedParts: "31",
  dualCriticalParts: "42", dualSourcedParts: "18",
  fatContractValue: "2400000", fatPct: "20", satPct: "12",
  scOtif: "91.5", scPpm: "340", scBilling: "2.1",
  ecoCycleTimes: "6,11,8,14,7,10",
  dtUnits: "1200", dtComplete: "1092",
  scopeCustomerDirected: "340000", scopeContractorRework: "95000", scopeReaRecovered: "298000",
  cqTotal: "24", cqSignedOff: "19",
};
// Cross-check DEFAULTS against the HTML's own value= attributes, so this harness can't silently
// drift from the real page if a default is ever changed there and not here. This regex only
// matches <input value="..."> shapes -- a <select> carries its default on a child <option>, not
// on the <select> tag itself, so ppapFramework (the one <select> in DEFAULTS) is cross-checked
// separately below rather than silently skipped by the `if (m)` guard.
Object.keys(DEFAULTS).forEach((id) => {
  if (id === "ppapFramework") return;
  const re = new RegExp(`id="${id}"[^>]*value="([^"]*)"|value="([^"]*)"[^>]*id="${id}"`);
  const m = html.match(re);
  check(!!m, `harness default for #${id} has a matching value= attribute in the HTML to cross-check against`);
  if (m) {
    const real = m[1] !== undefined ? m[1] : m[2];
    check(real === DEFAULTS[id], `harness default for #${id} matches the HTML's own value= attribute`, `harness=${DEFAULTS[id]} html=${real}`);
  }
});
// ppapFramework: no <option> carries `selected`, so the browser (and the DOM stub, which reads
// DEFAULTS directly) defaults to the FIRST <option>'s value.
const ppapSelectMatch = html.match(/<select id="ppapFramework">([\s\S]*?)<\/select>/);
check(!!ppapSelectMatch, "found the ppapFramework <select> block to cross-check its default against");
if (ppapSelectMatch) {
  check(!ppapSelectMatch[1].includes(" selected"), "no <option> in ppapFramework carries `selected` -- confirms the first option really is the default, not an assumption");
  const firstOptionMatch = ppapSelectMatch[1].match(/<option value="([^"]*)"/);
  check(!!firstOptionMatch, "found ppapFramework's first <option> to read its value from");
  if (firstOptionMatch) {
    check(firstOptionMatch[1] === DEFAULTS.ppapFramework, "harness default for #ppapFramework matches the HTML's first <option>'s value", `harness=${DEFAULTS.ppapFramework} html=${firstOptionMatch[1]}`);
  }
}

const elements = {};
function makeElement(id) {
  if (elements[id]) return elements[id];
  const listeners = {};
  const attrs = {};
  const classes = new Set();
  const el = {
    id, value: DEFAULTS[id] !== undefined ? DEFAULTS[id] : "",
    textContent: "", innerHTML: "", style: {}, className: "", dataset: {},
    classList: {
      toggle(c, force) { const has = classes.has(c); const on = force === undefined ? !has : !!force; if (on) classes.add(c); else classes.delete(c); return on; },
      add(...cs) { cs.forEach((c) => classes.add(c)); },
      remove(...cs) { cs.forEach((c) => classes.delete(c)); },
      contains(c) { return classes.has(c); },
    },
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null; },
    setAttribute(name, v) { attrs[name] = String(v); },
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(attrs, name); },
    appendChild() {},
    click() { (listeners.click || []).forEach((fn) => fn.call(el)); },
    focus() { documentStub.activeElement = el; },
    fire(type, evt) { (listeners[type] || []).forEach((fn) => fn.call(el, evt || {})); },
  };
  elements[id] = el;
  return el;
}
const NAVTAB_IDS = [...html.matchAll(/id="(navtab-[a-z]+)"/g)].map((m) => m[1]);
const TABPANEL_IDS = [...html.matchAll(/id="(tab-[a-z]+)"/g)].map((m) => m[1]);
function makeNavTab(id) {
  const el = makeElement(id);
  if (el.getAttribute("data-tab") === null) el.setAttribute("data-tab", id.replace("navtab-", ""));
  return el;
}
const documentStub = {
  getElementById: (id) => makeElement(id),
  querySelectorAll: (sel) => {
    if (sel === '.sidenav-item[role="tab"]') return NAVTAB_IDS.map(makeNavTab);
    if (sel === '.tabpanel') return TABPANEL_IDS.map(makeElement);
    return [];
  },
  querySelector: (sel) => makeElement("__q_" + Math.random()),
  documentElement: makeElement("__documentElement"),
  createElement: () => makeElement("__created_" + Math.random()),
  addEventListener() {},
  activeElement: null,
};
const sandbox = { document: documentStub, localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; } }, console, Math, Object, Array, parseFloat, isFinite, JSON };
sandbox.window = sandbox;
vm.createContext(sandbox);
try {
  vm.runInContext(pageScript, sandbox);
  check(true, "the real inline script executed without throwing in the stubbed DOM");
} catch (e) {
  check(false, "the real inline script executed without throwing in the stubbed DOM", e.stack);
  process.exit(1);
}

console.log("--- Vertical side navigation: behavioral checks ---");
check(typeof sandbox.activateTab === "function", "window.activateTab is exposed as a function");
sandbox.activateTab("evm", { focus: false });
check(elements["navtab-evm"].getAttribute("aria-selected") === "true", "activateTab('evm') marks navtab-evm aria-selected=true");
check(elements["navtab-exec"].getAttribute("aria-selected") === "false", "activateTab('evm') marks navtab-exec aria-selected=false");
check(elements["tab-evm"].classList.contains("active"), "activateTab('evm') shows the tab-evm panel");
check(!elements["tab-exec"].classList.contains("active"), "activateTab('evm') hides the tab-exec panel");
sandbox.activateTab("exec", { focus: false }); // restore default before later checks

console.log("--- Baseline & WBS Governance: golden values ---");
const baseInt = sandbox.calcControlAccountIntegrity();
check(baseInt.rate === 75, "Control Account Integrity Rate matches golden value (6/8)", baseInt.rate);
check(elements.baseIntegrityOut.textContent === "75.00%", "rendered integrity rate matches golden value", elements.baseIntegrityOut.textContent);
const bom = sandbox.calcBomSync();
check(bom.mismatches === 9, "BOM Sync Variance Count matches golden value", bom.mismatches);
check(elements.baseBomVarianceOut.textContent === "9", "rendered BOM variance count matches golden value", elements.baseBomVarianceOut.textContent);

console.log("--- Schedule & Constraint Engineering: golden values ---");
check(Array.isArray(sandbox.DCMA_CHECKS), "window.DCMA_CHECKS is exposed as an array");
check(sandbox.DCMA_CHECKS.length === 14, "exactly 14 DCMA checks are modeled (the real DCMA 14-Point Assessment)", sandbox.DCMA_CHECKS.length);
const EXPECTED_DCMA_NAMES = ["Logic", "Leads", "Lags", "Relationship Types", "Hard Constraints", "High Float", "Negative Float", "High Duration", "Invalid Dates", "Resources", "Missed Tasks", "Critical Path Test", "Critical Path Length Index (CPLI)", "Baseline Execution Index (BEI)"];
check(JSON.stringify(sandbox.DCMA_CHECKS.map((c) => c.name)) === JSON.stringify(EXPECTED_DCMA_NAMES), "the 14 DCMA check names match the real, hand-verified list in order", JSON.stringify(sandbox.DCMA_CHECKS.map((c) => c.name)));
// Inspecting the state the page's own init-time call to renderDcma() already produced, rather than
// invoking renderDcma() a second time here: its "re-render" branch reads current values back out of
// document.getElementById() on the *already-rendered* inputs, which real browsers resolve against the
// real DOM renderDcma()'s own innerHTML assignment created -- but this stub doesn't parse innerHTML
// strings into real queryable elements, so a second call would read blank/NaN from fresh auto-vivified
// stub elements instead. Accepted limitation, same class as other innerHTML-driven re-render paths in
// this dashboard family; the first (real, load-bearing) render is fully verified below.
check(elements.dcmaPassRateOut.textContent === "11/14 (78.57%)", "rendered DCMA pass-rate text matches golden value (3 checks fail with the seeded defaults: Lags, High Float, CPLI)", elements.dcmaPassRateOut.textContent);
check((elements.dcmaBody.innerHTML.match(/status-pill green/g) || []).length === 11, "exactly 11 of 14 rendered DCMA rows show a green (pass) status pill", (elements.dcmaBody.innerHTML.match(/status-pill green/g) || []).length);
check((elements.dcmaBody.innerHTML.match(/status-pill red/g) || []).length === 3, "exactly 3 of 14 rendered DCMA rows show a red (fail) status pill", (elements.dcmaBody.innerHTML.match(/status-pill red/g) || []).length);
const cc = sandbox.calcCriticalChain();
check(cc.status === "amber", "Critical Chain fever status matches golden value (55% consumed vs 50% complete -- within the 10-point amber band)", cc.status);
const takt = sandbox.calcTakt();
check(takt.adherence === 80, "Takt adherence matches golden value (4 of 5 zones within +/-5% of 180s target)", takt.adherence);

console.log("--- EVM & Cost Engineering: golden values (pre-registered via Node before this file was written) ---");
const evm = sandbox.calcEvm();
check(evm.CV === -1300000, "CV = EV - AC matches golden value", evm.CV);
check(evm.SV === -1800000, "SV = EV - PV matches golden value", evm.SV);
check(Math.abs(evm.CPI - 0.9257142857142857) < 1e-9, "CPI = EV/AC matches golden value", evm.CPI);
check(evm.SPI === 0.9, "SPI = EV/PV matches golden value", evm.SPI);
check(Math.abs(evm.TCPI_BAC - 1.0472727272727274) < 1e-9, "TCPI (to hit BAC) matches golden value", evm.TCPI_BAC);
check(Math.abs(evm.TCPI_EAC - 0.8331428571428571) < 1e-9, "TCPI (to hit current EAC, using EAC-3) matches golden value", evm.TCPI_EAC);
check(evm.EAC1 === 46300000, "EAC-1 (one-time variance) matches golden value", evm.EAC1);
check(Math.abs(evm.EAC2 - 48611111.11111111) < 0.01, "EAC-2 (typical, BAC/CPI) matches golden value", evm.EAC2);
check(Math.abs(evm.EAC3 - 52067901.2345679) < 0.01, "EAC-3 (cost+schedule weighted, the most conservative of the four) matches golden value", evm.EAC3);
check(evm.EAC4 === 47000000, "EAC-4 (bottom-up ETC) matches golden value", evm.EAC4);
check(Math.abs(evm.spreadPct - 12.817558299039785) < 1e-6, "EAC spread as % of BAC matches golden value, and correctly exceeds the 10% materiality flag", evm.spreadPct);
check(elements.eacSpreadFlag.textContent.includes("Spread exceeds 10%"), "the materiality flag correctly fires given the golden 12.8% spread", elements.eacSpreadFlag.textContent);

console.log("--- Quality, Yield & Risk: golden values ---");
const qsra = sandbox.calcQsra();
check(Math.abs(qsra.p50 - 218.21812316737456) < 1e-6, "QSRA P50 matches golden value (seed=42, 5000 trials, triangular(180,210,270))", qsra.p50);
check(Math.abs(qsra.p80 - 237.54018609712512) < 1e-6, "QSRA P80 matches golden value", qsra.p80);
check(Math.abs(qsra.p95 - 254.20217116947586) < 1e-6, "QSRA P95 matches golden value", qsra.p95);
const qsraRun2 = sandbox.calcQsra();
check(qsra.p50 === qsraRun2.p50 && qsra.p95 === qsraRun2.p95, "calling calcQsra() twice with the same inputs reproduces identical results (deterministic seeded PRNG, not Math.random())", `run1=${qsra.p50}/${qsra.p95} run2=${qsraRun2.p50}/${qsraRun2.p95}`);
check(typeof sandbox.actionPriority === "function", "window.actionPriority is exposed as a function");
check(sandbox.actionPriority(9, 3, 4) === "High", "a severity-9 failure is Action-Priority HIGH even with low RPN (108) -- exactly the case RPN alone would under-rank", sandbox.actionPriority(9, 3, 4));
check(sandbox.actionPriority(3, 8, 8) === "Low", "a low-severity, high-RPN (192) failure is Action-Priority LOW -- exactly the case a naive RPN threshold would over-rank", sandbox.actionPriority(3, 8, 8));
const fmea = sandbox.renderFmea();
check(fmea.items.length === 5, "exactly 5 FMEA items are modeled", fmea.items.length);
check(elements.fmeaDivergenceNote.textContent.includes("Spindle bearing seizure") && elements.fmeaDivergenceNote.textContent.includes("RPN=108"), "the rendered divergence note correctly identifies the specific RPN-vs-AP mismatch case", elements.fmeaDivergenceNote.textContent);
// All 5 demo rows previously resolved to only High or Low -- actionPriority()'s Medium branch
// (rpn>=200, s<9, not the s*o>=40&&d>=5 High rule) was never exercised by any visible example.
check(sandbox.actionPriority(3, 8, 9) === "Medium", "the Cosmetic surface finish item (s=3,o=8,d=9, rpn=216) now demonstrates the Medium Action-Priority branch, previously unexercised by any FMEA_ITEMS row", sandbox.actionPriority(3, 8, 9));
check((elements.fmeaBody.innerHTML.match(/;font-weight:700">Medium</g) || []).length === 1, "exactly one rendered FMEA row shows Action-Priority Medium", elements.fmeaBody.innerHTML);
const fpy = sandbox.renderFpy();
check(fpy.sites.length === 4, "exactly 4 FPY sites are modeled", fpy.sites.length);
// Per-row, not just "GREEN and AMBER appear somewhere" -- that weaker form would still pass on a
// scrambled site-to-status mapping. Golden bands pre-registered from statusOf(fpy, 95, 90):
// Site A 97.2 -> green, Site B 94.8 -> amber, Site C 91.5 -> amber, Site D 98.1 -> green.
const fpyGoldenBands = { "Site A": "GREEN", "Site B": "AMBER", "Site C": "AMBER", "Site D": "GREEN" };
Object.keys(fpyGoldenBands).forEach((site) => {
  const rowRe = new RegExp(`<td>${site}</td><td class="mono">[\\d.]+%</td><td>.*?>${fpyGoldenBands[site]}<`);
  check(rowRe.test(elements.fpyBody.innerHTML), `${site} is specifically banded ${fpyGoldenBands[site]}, not just present somewhere in the table`, elements.fpyBody.innerHTML);
});
const rcca = sandbox.calcRcca();
check(rcca.contain === 4, "RCCA containment cycle time (D1->D3) matches golden value", rcca.contain);
check(rcca.total === 32, "RCCA total cycle time (D1->D8) matches golden value", rcca.total);
const ppap = sandbox.calcPpap();
check(ppap.total === 18, "AIAG PPAP framework has 18 elements (the real, correct count)", ppap.total);
check(Math.abs(ppap.pct - (14 / 18) * 100) < 1e-9, "PPAP gate completion matches golden value (14/18 AIAG elements)", ppap.pct);
check(sandbox.PPAP_FRAMEWORKS.as9145.total === 11, "the AS9145 aerospace framework is modeled separately with its real, correct count (11 deliverables), not conflated with automotive PPAP's 18", sandbox.PPAP_FRAMEWORKS.as9145.total);

console.log("--- Supply Chain & Procurement: golden values ---");
const tier = sandbox.calcTierCoverage();
check(Math.abs(tier.pct - 73.80952380952381) < 1e-9, "Tier-N visibility coverage matches golden value (31/42)", tier.pct);
const dual = sandbox.calcDualSource();
check(Math.abs(dual.pct - 42.857142857142854) < 1e-9, "Dual-source coverage matches golden value (18/42)", dual.pct);
const fatSat = sandbox.calcFatSat();
check(fatSat.fatAmt === 480000, "FAT milestone release $ matches golden value (20% of $2.4M)", fatSat.fatAmt);
check(fatSat.satAmt === 288000, "SAT milestone release $ matches golden value (12% of $2.4M)", fatSat.satAmt);
check(Math.abs(fatSat.finalAmt - 1632000) < 0.01, "final-acceptance release $ matches golden value (68% of $2.4M)", fatSat.finalAmt);
const sc = sandbox.calcSupplierScorecard();
check(sc.otif === 91.5 && sc.ppm === 340 && sc.billing === 2.1, "supplier scorecard values (OTIF/PPM/billing variance) match golden values -- correctly-named metrics, not a fabricated \"VPI\"", JSON.stringify(sc));

console.log("--- Change Governance & Traceability: golden values ---");
const eco = sandbox.calcEco();
check(Math.abs(eco.avg - 9.333333333333334) < 1e-9, "average ECO cycle time matches golden value", eco.avg);
const dt = sandbox.calcDigitalThread();
check(dt.pct === 91, "Digital Thread completeness matches golden value (1092/1200)", dt.pct);
const scope = sandbox.calcScopeCreep();
check(Math.abs(scope.rate - 87.6470588235294) < 1e-6, "REA recovery rate matches golden value (298000/340000)", scope.rate);
const cq = sandbox.calcCq();
check(Math.abs(cq.pct - 79.16666666666666) < 1e-9, "C&Q completion matches golden value (19/24)", cq.pct);

console.log("--- Diagnostic Playbook: structural checks ---");
check(Array.isArray(sandbox.PLAYBOOK), "window.PLAYBOOK is exposed as an array");
check(sandbox.PLAYBOOK.length === 12, "exactly 12 playbook items are modeled", sandbox.PLAYBOOK.length);
check(new Set(sandbox.PLAYBOOK.map((p) => p.num)).size === 12, "all 12 playbook item numbers are unique");
["method", "tag", "note"].forEach((field) => {
  const allNonEmpty = sandbox.PLAYBOOK.every((p) => typeof p[field] === "string" && p[field].length > 0);
  check(allNonEmpty, `every playbook item has a non-empty "${field}" field`);
});
const VALID_TAGS = ["real", "real-contested", "real-partial", "real-overclaimed", "corrected", "unverified"];
check(sandbox.PLAYBOOK.every((p) => VALID_TAGS.includes(p.tag)), "every playbook item uses one of the 6 defined verification tags, not a stray/typo'd tag");
const pb = sandbox.renderPlaybook();
check(pb.count === 12, "renderPlaybook() reports the correct count", pb.count);
check((elements.pbList.innerHTML.match(/class="card"/g) || []).length === 12, "rendered exactly 12 playbook cards", (elements.pbList.innerHTML.match(/class="card"/g) || []).length);

console.log("--- Executive Overview: structural checks ---");
check(Array.isArray(sandbox.EXEC_RAG) && sandbox.EXEC_RAG.length === 3, "exactly 3 programs in the Portfolio Status Matrix", sandbox.EXEC_RAG ? sandbox.EXEC_RAG.length : null);
check(Array.isArray(sandbox.EXEC_RISKS) && sandbox.EXEC_RISKS.length === 5, "exactly 5 risks in the Top-5 Risk table", sandbox.EXEC_RISKS ? sandbox.EXEC_RISKS.length : null);
check(sandbox.EXEC_RISKS.every((r, i) => i === 0 || sandbox.EXEC_RISKS[i - 1].p80 >= r.p80), "the 5 risks are pre-sorted descending by P80 exposure, matching a real Pareto-style top-risk view", JSON.stringify(sandbox.EXEC_RISKS.map((r) => r.p80)));

console.log("");
console.log(failures === 0 ? "All stress checks passed." : `${failures} stress check(s) FAILED (${passes} passed).`);
process.exit(failures === 0 ? 0 : 1);
