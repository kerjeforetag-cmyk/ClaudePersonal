/* ============================================================
   Mimra — deck generator
   Builds complete, standalone HTML presentations from hub data.
   Essential = clean template document. Signature = full-bleed
   scroll deck with reveal motion, charts and adaptive ordering.
   Both are self-contained files that open anywhere and print clean.
   ============================================================ */

(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const eur = (n) => "€" + Number(n).toLocaleString("en-US");
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const FAVICON = `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='16' fill='%23c96442'/><path d='M16 45 V31 a8.5 8.5 0 0 1 17 0 V45 M33 45 V31 a8.5 8.5 0 0 1 17 0 V45' fill='none' stroke='white' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/><circle cx='50' cy='17' r='4.4' fill='white'/></svg>" />`;

  const OBJ = {
    proposal: { name: "Commercial proposal", cta: "Walk through it together" },
    intro: { name: "Company introduction", cta: "Book a first meeting" },
    renewal: { name: "Renewal & expansion", cta: "Plan the next phase" },
    tender: { name: "Tender response", cta: "Review the compliance annex" }
  };

  /* ============================================================
     Customer intelligence — derive a profile from the hub's own
     data, then compose copy specific to THIS customer. Two
     customers with the same objective get visibly different decks.
     ============================================================ */

  const numOf = (s) => { const m = String(s).replace(/,/g, "").match(/(\d+)/); return m ? +m[1] : null; };
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  // deterministic per-(customer, objective, take) randomness — same inputs
  // always compose the same deck; a new take recomposes differently
  function seededRng(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return ((h >>> 0) % 10000) / 10000;
    };
  }
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];

  function deriveProfile(hub) {
    const about = hub.about || "";
    const text = ((hub.industry || "") + " " + about).toLowerCase();

    let category = "general";
    if (/forklift|intralogist/.test(text)) category = "forklift";
    else if (/aquacultur|workboat|vessel|salmon|\bmarine\b|harbor|harbour|ferry|\bboat|shore[- ]?charg/.test(text)) category = "marine";
    else if (/3pl|warehous|distribution|\blogistics\b/.test(text)) category = "warehouse";
    else if (/\bagv\b|automation|\boem\b|integrat/.test(text)) category = "oem";

    let situation = "evaluating";
    if (/greenfield|from day one|\bday one\b|new [\w\s]{0,24}facilit/.test(text)) situation = "greenfield";
    else if (/lead-acid|conversion|convert|full conversion/.test(text)) situation = "conversion";
    else if (/refit|hybrid[\w\s-]{0,20}electric/.test(text)) situation = "refit";
    else if (/\boem\b|frame agreement|integrat/.test(text)) situation = "oem";

    const fm = about.match(/~?\s*([\d.,]+)\s*(?:[\w-]+\s+){0,3}?(m²|forklifts?|trucks?|workboats?|vessels?|boats?)/i);
    const fleet = fm ? { n: numOf(fm[1]), raw: fm[1].trim(), unit: fm[2].toLowerCase().replace(/s$/, "") } : null;
    const sm = about.match(/(\d+)\s*(?:distribution\s*)?sites?/i);
    const sites = sm ? +sm[1] : null;

    return { category, situation, fleet, sites, country: hub.country || "" };
  }

  function fleetPhrase(p) {
    if (!p.fleet) return "fleet";
    if (p.fleet.unit === "m²") return p.fleet.raw + " m²";
    return p.fleet.raw + " " + p.fleet.unit + "s";
  }

  // the customer's operating world, in a word — flavours copy
  const WORLD = {
    forklift: "the warehouse floor", marine: "the water", warehouse: "the aisles",
    oem: "your platform line", general: "your operation"
  };
  // which product leads for this customer
  const LEAD_PRODUCT = {
    forklift: { t: "Drop-in Li-ion packs", p: "48V and 24V packs that replace lead-acid one-for-one — same trays, no truck modifications, integrated heating for cold docks." },
    marine: { t: "IP67 marine packs", p: "Sealed 24/48V packs built for spray, vibration and sub-zero water — DNV-GL type-approved, integrated cell heating below 0 °C." },
    warehouse: { t: "Li-ion from day one", p: "A full Li-ion fleet designed into the building — no battery room in the floor plan, no swap shift ever scheduled." },
    oem: { t: "OEM battery modules", p: "48V modules with an embedded BMS and a documented CAN interface — designed to drop into your platform, not the other way round." },
    general: { t: "Li-ion packs", p: "Drop-in 24/48V packs for every major platform — integrated heating, 7-year / 10,000-cycle warranty." }
  };
  const CHARGE_PRODUCT = {
    marine: { t: "ShorePower", p: "Quay-side charging sized to your berth turnaround — top up alongside, no diesel genset running." },
    _default: { t: "SmartCharge", p: "10–30 kW opportunity charging at the points where work naturally pauses. VDE 0510-48 compliant — no classified battery room." }
  };

  // situation drives the headline & the "where this starts" framing.
  // headline/sitTitle are POOLS — the seeded rng picks per customer+take,
  // so two customers in the same category still open differently.
  const SITUATION = {
    conversion: {
      kicker: "From lead-acid to Li-ion",
      headlines: (p, h) => [
        "The last battery room\nyou'll ever run.",
        `${p.fleet ? p.fleet.raw + " " + p.fleet.unit + "s" : "Your fleet"}.\nZero swaps.`,
        "Retire the lead.\nKeep the trucks.",
        `Swap the chemistry,\nnot ${h.company.split(" ")[0]}'s rhythm.`
      ],
      sitTitles: ["Where this starts.", "What today costs.", "The lead-acid tax."],
      sitLede: (h, p) => `${h.company} runs ${fleetPhrase(p)}${p.sites ? ` across ${p.sites} sites` : ""} on lead-acid today — a dedicated battery room, mid-shift swaps, and a maintenance line that grows every year the fleet ages.`,
      stats: (h, p) => {
        const swaps = p.fleet && p.fleet.unit !== "m²" ? Math.round(p.fleet.n * 0.3) : null;
        return [
          swaps ? { v: swaps, l: "battery swaps a day, eliminated", n: `${p.fleet.raw} trucks × ~0.3 swaps per shift` } : { v: "0", l: "battery swaps once converted" },
          swaps ? { v: Math.round(swaps * 8 * 300 / 60).toLocaleString("en-US") + " h", l: "swap labor returned per year", n: `${swaps} swaps × 8 min × 300 days` } : { v: "−36%", l: "energy cost, from round-trip efficiency" },
          { v: "−36%", l: "energy cost", n: "Li-ion round-trip ~92% vs lead-acid ~72%" }
        ].slice(0, 3);
      }
    },
    refit: {
      kicker: "Hybrid to full-electric",
      headlines: (p, h) => [
        "Off diesel.\nStill on the water.",
        "Retire the genset.\nKeep the sea time.",
        `${p.fleet ? cap(p.fleet.raw) + " " + p.fleet.unit + "s" : "The fleet"}, fully electric.\nNo second thoughts.`
      ],
      sitTitles: ["Where this starts.", "Built for your water."],
      sitLede: (h, p) => `${h.company} operates ${fleetPhrase(p)} on a hybrid-to-full-electric program. The packs that survive a warehouse won't survive ${(h.country === "Norway") ? "a fjord in February" : "open water"} — this is built for yours.`,
      stats: (h, p) => [
        p.fleet ? { v: p.fleet.raw, l: cap(p.fleet.unit) + "s in the refit program", n: "from your hub" } : { v: "22", l: "vessels in the program" },
        { v: "99.6%", l: "uptime at −15 °C, trailing 12 months", n: "FleetView telemetry, all marine customers" },
        { v: "IP67", l: "sealed & DNV-GL type-approved" }
      ]
    },
    greenfield: {
      kicker: "A blank sheet",
      headlines: (p, h) => [
        "Zero lead,\nfrom day one.",
        `${p.fleet && p.fleet.unit === "m²" ? p.fleet.raw + " m²" : "A new site"}.\nNo battery room.`,
        "Design the building\naround the energy."
      ],
      sitTitles: ["The rare chance.", "Before the concrete."],
      sitLede: (h, p) => `${h.company}'s ${p.fleet && p.fleet.unit === "m²" ? p.fleet.raw + " m² " : "new "}facility is a blank sheet — the chance to design the building around Li-ion instead of retrofitting it in later. No battery room, no swap shift, no legacy to undo.`,
      stats: (h, p) => [
        { v: "0 m²", l: "battery room in the floor plan", n: "≈ 400 m² for a lead-acid fleet this size" },
        { v: "None", l: "swap shifts, ever" },
        { v: "Ready", l: "for the 2027 indoor-charging code", n: "ventilation + certified telemetry" }
      ]
    },
    oem: {
      kicker: "OEM partnership",
      headlines: (p, h) => [
        "One energy system.\nEvery platform you ship.",
        `Inside ${h.company.split(" ")[0]}'s platform,\ninvisible to your customer.`,
        "Your product.\nOur chemistry."
      ],
      sitTitles: ["Where this starts.", "The integration brief."],
      sitLede: (h) => `${h.company} integrates NordCell packs into its own platforms. That means the energy system has to disappear into your product — documented, certified, and consistent across every unit you ship.`,
      stats: () => [
        { v: "11,400+", l: "packs in daily operation, 14 countries" },
        { v: "99.6%", l: "fleet uptime, trailing 12 months" },
        { v: "CAN", l: "documented interface, embedded BMS" }
      ]
    },
    evaluating: {
      kicker: null,
      headlines: (p, h, o) => o.name === "Tender response"
        ? ["Every requirement,\nanswered."]
        : [`A case ${h.company.split(" ")[0]}\ncan measure.`, "The numbers first.\nThe handshake after.", `${h.country ? h.country + " runs" : "Fleets run"} on uptime.\nSo does this offer.`],
      sitTitles: ["Where this starts.", "The starting point."],
      sitLede: (h) => hub_about_or(h),
      stats: (h) => [
        hub_value_stat(h),
        { v: "99.6%", l: "NordCell fleet uptime, trailing 12 months" },
        { v: "7 yr", l: "warranty · 10,000 cycles to 80% capacity" }
      ]
    }
  };
  function hub_about_or(h) { return h.about || `An evaluation for ${h.company}, built from the data in your shared hub.`; }
  function hub_value_stat(h) { return h.value ? { v: eur(h.value), l: "engagement value on the table" } : { v: "Q3", l: "target decision window" }; }

  // compose everything the deck shell needs, specific to this customer + objective
  function composeContent(hub, objKey, opts) {
    const o = OBJ[objKey] || OBJ.proposal;
    const p = deriveProfile(hub);
    const sit = SITUATION[p.situation] || SITUATION.evaluating;
    const industry = (hub.industry || "your industry").toLowerCase();
    const take = (opts && opts.take) || 1;
    const rng = seededRng(hub.id + ":" + objKey + ":" + take);

    // headline: situation-led for proposal/intro; objective-led for renewal/tender
    let headline;
    if (objKey === "renewal") headline = pick(rng, ["Phase one worked.\nHere's phase two.", `The data is in.\nSo is ${hub.company.split(" ")[0]}'s next step.`, "Proven on your fleet.\nReady to scale."]);
    else if (objKey === "tender") headline = "Every requirement,\nanswered.";
    else headline = pick(rng, sit.headlines(p, hub, o));

    // lede: objective intent, woven with the customer's world
    const world = WORLD[p.category] || WORLD.general;
    let lede;
    const sized = p.fleet ? `sized to ${fleetPhrase(p)}` : `built around ${world}`;
    if (objKey === "proposal") lede = `Scope, pricing and rollout for ${hub.company} — ${sized}, priced at your hub rates, and built to decide on.`;
    else if (objKey === "intro") lede = `An introduction to NordCell Power for ${hub.company}: what we make, what it changes for ${industry}, and the proof from fleets already running on ${world}.`;
    else if (objKey === "renewal") { const won = (hub.proposals || []).filter((x) => x.status === "Accepted"); const v = won.reduce((a, x) => a + (x.value || 0), 0); lede = `What we've delivered with ${hub.company} so far${v ? ` — ${eur(v)} accepted and running` : ""}, what the telemetry says, and the next step for ${world}.`; }
    else lede = `A structured response for ${hub.company}: compliance evidence, certified documentation and committed pricing, every answer backed by a document in the shared hub.`;

    // stats: situation-specific, computed from their fleet where possible
    const stats = sit.stats(hub, p).slice(0, 3);

    // middle section: objective-shaped, but products chosen for this customer
    let middleTitle, middleCards;
    if (objKey === "intro") {
      middleTitle = "What we make";
      middleCards = [
        LEAD_PRODUCT[p.category] || LEAD_PRODUCT.general,
        CHARGE_PRODUCT[p.category] || CHARGE_PRODUCT._default,
        { t: "FleetView", p: "Telemetry on every pack: state of health, utilization and the sizing data your next decision needs — exportable to your systems." }
      ];
    } else if (objKey === "renewal") {
      const won = (hub.proposals || []).filter((x) => x.status === "Accepted");
      const v = won.reduce((a, x) => a + (x.value || 0), 0);
      middleTitle = "What phase one proved";
      middleCards = [
        { t: "Delivered together", p: won.length ? `${won.length} accepted proposal${won.length > 1 ? "s" : ""} worth ${eur(v)} — on time, on spec.` : "Our first phase together — measured, not promised." },
        { t: "Measured on your fleet", p: `Uptime, utilization and state-of-health data from ${fleetPhrase(p)}, not an industry average.` },
        { t: "The next step", p: "That data sizes phase two exactly — you buy what the operation needs, not a safety margin." }
      ];
    } else if (objKey === "tender") {
      middleTitle = "Why this bid holds";
      middleCards = [
        { t: "Certified", p: p.category === "marine" ? "CE, UN 38.3 and DNV-GL type approval — the full marine certificate bundle ships with this response." : "CE, UN 38.3 and VDE 0510-48 — the full certificate bundle ships with this response." },
        { t: "Warranted", p: "7 years / 10,000 cycles to 80% capacity, underwriting the cost model in this bid." },
        { t: "Evidenced", p: "Every compliance answer points to a test protocol or certificate in the shared hub — nothing is asserted without a document." }
      ];
    } else {
      middleTitle = "How the rollout lands";
      middleCards = [
        { t: "Contract & survey", p: `Walkthrough with your engineers${p.sites ? ` across all ${p.sites} sites` : ""}; final layout and grid check before anything is ordered.` },
        { t: p.category === "marine" ? "Refit & training" : "Install & training", p: `${p.situation === "greenfield" ? "Commissioned as the site opens" : "Converted in planned windows"} — no ${p.category === "marine" ? "vessels off the water" : "production downtime"} — with your team trained on-site in one day.` },
        { t: "Review & scale", p: "90-day telemetry review; the data sizes the next phase before you commit to it." }
      ];
    }

    // every question they actually asked in the hub → answered up front
    const qa = (hub.timeline || [])
      .map((t) => { const m = t.what.match(/["“](.+?)["”]/); return m ? { q: m[1], who: (t.who || "").split(" ")[0] } : null; })
      .filter(Boolean).slice(0, 3);

    // documents already shared → evidence the deck can point at
    const evidence = (objKey === "proposal" || objKey === "tender")
      ? (hub.docs || []).slice(0, 4).map((d) => d.name)
      : [];

    // the technical gatekeeper on their side, if we know one
    let personNote = null;
    const gk = (opts && opts.people || []).find((x) => /engineer|technical|site|fleet manager/i.test(x.role || ""));
    if (gk && (objKey === "proposal" || objKey === "tender")) {
      personNote = { name: gk.name, text: `The ${p.category === "marine" ? "DNV-GL" : "VDE 0510-48"} compliance annex is pre-assembled in your hub for ${gk.name}'s review — nothing to chase before sign-off.` };
    }

    // closing, contact-aware, seeded variant
    const first = (hub.contact || "").split(" ")[0] || "your team";
    const closingLede = pick(rng, [
      `Reply in your Mimra hub — every question lands with ${p.category === "oem" ? "engineering and procurement together" : "the whole team"} — or book directly with ${first}'s calendar in mind.`,
      `One reply in your Mimra hub reaches everyone on both sides. Or pick a slot that suits ${first} — the calendar link is live.`,
      `Everything in this document already lives in your shared hub. When ${first} is ready, so are we.`
    ]);

    return {
      objName: o.name, cta: o.cta, kicker: sit.kicker || o.name,
      headline, lede, sitTitle: pick(rng, sit.sitTitles), sitLede: sit.sitLede(hub, p),
      stats, middleTitle, middleCards, closingLede, qa, evidence, personNote, take, profile: p
    };
  }

  function qaBlock(c, max) {
    if (!c.qa || !c.qa.length) return "";
    return c.qa.slice(0, max || 2).map((x) =>
      `<div class="hubnote"><b>${esc(x.who)} asked:</b> “${esc(x.q)}” — answered in this document, and in your hub under Technical data.</div>`
    ).join("");
  }
  function evidenceBlock(c) {
    if (!c.evidence || !c.evidence.length) return "";
    return `<div class="ev-wrap"><span class="ev-label">Already in your shared hub</span>
      <div class="ev-chips">${c.evidence.map((d) => `<span class="ev-chip">📄 ${esc(d)}</span>`).join("")}</div></div>`;
  }
  function personBlock(c) {
    if (!c.personNote) return "";
    return `<div class="hubnote"><b>For ${esc(c.personNote.name)}:</b> ${esc(c.personNote.text)}</div>`;
  }

  // rollout timeline anchored to the deal's expected close month
  function timelineSteps(hub) {
    let y, m;
    if (hub.expectedClose && /^\d{4}-\d{2}$/.test(hub.expectedClose)) {
      const p = hub.expectedClose.split("-"); y = +p[0]; m = +p[1] - 1;
    } else {
      const d = new Date(); d.setMonth(d.getMonth() + 3); y = d.getFullYear(); m = d.getMonth();
    }
    const step = (off) => { const mm = (m + off) % 12, yy = y + Math.floor((m + off) / 12); return MONTHS[mm].slice(0, 3) + " " + yy; };
    return [
      { q: step(0), t: "Contract & site survey", p: "Final layout, electrical check, order placed." },
      { q: step(1), t: "Installation & training", p: "Converted in planned windows; team trained on-site." },
      { q: step(2), t: "Go-live", p: "Full operation with FleetView telemetry from day one." },
      { q: step(4), t: "Review & phase two", p: "90-day data review sizes the next step exactly." }
    ];
  }

  // negotiated-advantage chart from the hub's own price list
  function savingsBlock(hub, opts) {
    const rows = (hub.priceList || []).filter((p) => p.list > 0 && p.hub > 0 && p.hub < p.list).slice(0, 5);
    if (rows.length < 2) return null;
    const avg = Math.round(rows.reduce((a, p) => a + (1 - p.hub / p.list) * 100, 0) / rows.length);
    const bars = rows.map((p) => {
      const pct = Math.round((1 - p.hub / p.list) * 100);
      const w = Math.round(p.hub / p.list * 100);
      return `<div class="sv-row">
        <div class="sv-label">${esc(p.sku)}</div>
        <div class="sv-track"><div class="sv-fill" style="width:${w}%"></div></div>
        <div class="sv-val">−${pct}%</div>
      </div>`;
    }).join("");
    return {
      avg,
      html: `<div class="sv-card">
        <h3>Your negotiated advantage</h3>
        <p class="sv-sub">Hub rate as a share of list price, per item — on average <b>−${avg}% off list</b>, already locked into this document.</p>
        <div class="sv-chart">${bars}</div>
        <div class="sv-note">Grey track = list price. ${opts && opts.accentName ? "" : ""}Filled bar = your rate.</div>
      </div>`
    };
  }

  function priceTable(hub) {
    if (!hub.priceList || !hub.priceList.length) return "";
    const rows = hub.priceList.map((p) => `
      <tr><td class="sku">${esc(p.sku)}</td><td>${esc(p.name)}</td>
      <td class="num strike">${eur(p.list)}</td><td class="num"><b>${eur(p.hub)}</b></td><td class="num">${p.moq}</td></tr>`).join("");
    return `
    <h2>Your hub pricing</h2>
    <p>Customer-specific rates as published in your Mimra hub — not list prices.</p>
    <div class="table-scroll"><table>
      <thead><tr><th>SKU</th><th>Product</th><th class="num">List</th><th class="num">Your price</th><th class="num">MOQ</th></tr></thead>
      <tbody>${rows}</tbody></table></div>
    <p class="fine">Valid Q3 2026 · full commercial terms in your Mimra hub.</p>`;
  }

  function referencesBlock(refs) {
    if (!refs || !refs.length) return "";
    return refs.map((r) => `
      <div class="card ref"><span class="flag">${esc(r.flag || "🏳️")}</span>
        <div><h3>${esc(r.company)}</h3><p>${esc(r.line)}</p></div>
      </div>`).join("");
  }

  function docMeta(hub, o, opts) {
    const now = new Date();
    const valid = new Date(now); valid.setDate(valid.getDate() + 45);
    const fmt = (d) => MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    const ref = "MIM-" + String(hub.id).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) + "-" +
      now.getFullYear() + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");
    return {
      date: fmt(now), valid: fmt(valid), ref,
      sender: (opts && opts.sender && opts.sender.name) || "Alex Kjellberg",
      email: (opts && opts.sender && opts.sender.email) || "alex@nordcell.se",
      workspace: (opts && opts.workspace) || "NordCell Power AB"
    };
  }

  const printBtn = (acc) => `<button class="printbtn" onclick="window.print()">Print / PDF</button>
  <style>.printbtn{position:fixed;right:18px;bottom:18px;z-index:60;background:${acc};color:#fff;border:0;border-radius:999px;padding:11px 20px;font:600 13px system-ui;cursor:pointer;box-shadow:0 8px 24px -8px rgba(26,25,21,.4)}@media print{.printbtn{display:none}}</style>`;

  const SAVINGS_CSS = `
.ev-wrap{margin-top:26px}
.ev-label{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3,#898781);font-weight:700}
.ev-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.ev-chip{border:1px solid var(--line,#e3e1d8);border-radius:999px;padding:6px 14px;font-size:12px;color:var(--ink2,#52514e);background:var(--card,#fcfcfb)}
.stat-how{font-size:11px;color:var(--ink3,#898781);margin-top:6px;font-style:italic}
.sv-card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px;margin-top:28px;box-shadow:0 1px 2px rgba(26,25,21,.05),0 10px 30px -14px rgba(26,25,21,.15)}
.sv-card h3{font-size:19px;margin-bottom:6px}
.sv-sub{font-size:14px;color:var(--ink2,#52514e)}
.sv-sub b{color:var(--ink,#1a1915)}
.sv-chart{margin-top:16px}
.sv-row{display:grid;grid-template-columns:110px 1fr 52px;gap:12px;align-items:center;padding:6px 0}
.sv-label{font-family:ui-monospace,monospace;font-size:11.5px;color:var(--ink2,#52514e);text-align:right}
.sv-track{height:18px;background:#e6e4db;border-radius:4px;overflow:hidden}
.sv-fill{height:100%;background:#2a78d6;border-radius:0 4px 4px 0}
.sv-val{font-size:12.5px;font-weight:650;color:var(--ink,#1a1915);font-variant-numeric:tabular-nums}
.sv-note{font-size:11.5px;color:var(--ink3,#898781);margin-top:10px}`;

  /* ---------- Essential: clean template document ---------- */
  function essential(hub, objKey, accent, opts) {
    const o = OBJ[objKey] || OBJ.proposal;
    const c = composeContent(hub, objKey, opts);
    const st = c.stats;
    const meta = docMeta(hub, o, opts);
    const sv = savingsBlock(hub, opts);
    const tl = objKey === "proposal" ? timelineSteps(hub) : null;
    const refs = opts && opts.references;
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(meta.workspace)} — ${esc(o.name)} for ${esc(hub.company)} (Essential)</title>${FAVICON}
<style>
:root{--paper:#fbfaf7;--card:#ffffff;--ink:#1a1915;--ink2:#52514e;--ink3:#898781;--line:#e3e1d8;--accent:${accent};
--serif:"Charter","Iowan Old Style",Georgia,serif;--sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--sans);background:var(--paper);color:var(--ink);line-height:1.6;font-size:15.5px;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:var(--serif);font-weight:600;letter-spacing:-.01em}
.page{max-width:860px;margin:0 auto;padding:0 24px 80px}
header{border-bottom:3px solid var(--accent);padding:40px 0 26px;margin-bottom:40px}
.brand{font-family:var(--serif);font-size:22px}.brand em{font-style:normal;color:var(--accent)}
h1{font-size:36px;line-height:1.15;margin-top:18px;white-space:pre-line}
.meta{display:flex;gap:28px;flex-wrap:wrap;margin-top:16px;font-size:13px;color:var(--ink3)}.meta b{color:var(--ink2)}
h2{font-size:24px;margin:44px 0 12px;padding-top:22px;border-top:1px solid var(--line)}
h3{font-size:17px}
p{color:var(--ink2);max-width:70ch}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:22px 0}
.stat{border:1px solid var(--line);border-radius:12px;padding:16px;background:var(--card)}
.stat b{display:block;font-size:22px}.stat span{font-size:12.5px;color:var(--ink3)}
table{width:100%;border-collapse:collapse;font-size:14px;margin-top:18px;background:var(--card)}
th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--ink3);padding:10px 12px;border-bottom:2px solid var(--line)}
td{padding:10px 12px;border-bottom:1px solid #eeece3}
.num{text-align:right;font-variant-numeric:tabular-nums}.strike{color:var(--ink3);text-decoration:line-through}
.sku{font-family:ui-monospace,monospace;font-size:12px;color:var(--ink2)}
.fine{font-size:12px;color:var(--ink3);margin-top:8px}
.hubnote{border-left:3px solid var(--accent);padding:6px 0 6px 18px;margin:26px 0;font-size:14.5px;color:var(--ink2)}.hubnote b{color:var(--ink)}
.tl-list{list-style:none;margin-top:14px}
.tl-list li{display:flex;gap:14px;padding:9px 0;border-bottom:1px solid #eeece3;font-size:14px;color:var(--ink2)}
.tl-list li:last-child{border-bottom:0}
.tl-list .q{flex:none;width:88px;font-weight:700;color:var(--accent);font-size:12.5px;text-transform:uppercase;letter-spacing:.04em;padding-top:2px}
.tl-list b{color:var(--ink)}
.card.ref{display:flex;gap:12px;border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--card);margin-top:10px}
.card.ref .flag{font-size:22px}
.card.ref h3{font-size:15px}.card.ref p{font-size:13px}
.cta-box{margin-top:50px;border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:12px;padding:22px;background:var(--card)}
.btn{display:inline-block;background:var(--accent);color:#fff;font-weight:600;font-size:14px;padding:11px 24px;border-radius:999px;text-decoration:none;margin-top:12px}
footer{margin-top:60px;font-size:12px;color:var(--ink3);text-align:center}footer em{font-style:normal;color:var(--accent);font-family:var(--serif)}
.table-scroll{overflow-x:auto}
${SAVINGS_CSS}
@media(max-width:640px){.stats{grid-template-columns:1fr}h1{font-size:28px}}
@media print{.btn{display:none}}
</style></head><body><div class="page">
<header>
  <div class="brand">${esc(meta.workspace)} <span style="color:var(--ink3)">· prepared with</span> <em>mimra</em></div>
  <h1>${esc(o.name)}\n${esc(hub.company)}</h1>
  <div class="meta"><div><b>For</b> ${esc(hub.contact)}, ${esc(hub.contactRole)}</div>
  <div><b>From</b> ${esc(meta.sender)}, ${esc(meta.workspace)}</div>
  <div><b>Reference</b> ${meta.ref}</div><div><b>Valid until</b> ${meta.valid}</div></div>
</header>
<h2>Summary</h2>
<p>${esc(c.lede)}</p>
<p style="margin-top:10px">${esc(c.sitLede)}</p>
<div class="stats">${st.map((x) => `<div class="stat"><b>${esc(x.v)}</b><span>${esc(x.l)}</span>${x.n ? `<div class="stat-how">${esc(x.n)}</div>` : ""}</div>`).join("")}</div>
${qaBlock(c, 3)}
${personBlock(c)}
${evidenceBlock(c)}
<h2>${esc(c.middleTitle)}</h2>
<div class="stats">${c.middleCards.map((m) => `<div class="stat"><b style="font-size:16px">${esc(m.t)}</b><span style="font-size:13px;color:var(--ink2)">${esc(m.p)}</span></div>`).join("")}</div>
${sv ? sv.html : ""}
${priceTable(hub)}
${tl ? `<h2>Timeline</h2><ul class="tl-list">${tl.map((s) => `<li><span class="q">${esc(s.q)}</span><span><b>${esc(s.t)}</b> — ${esc(s.p)}</span></li>`).join("")}</ul>` : ""}
${refs && refs.length ? `<h2>Fleets like yours</h2>${referencesBlock(refs)}` : ""}
<h2>How we work</h2>
<p>Everything in this document lives in your shared Mimra hub — prices, technical data and every answer, visible to your whole team. Questions land with all of us, not one inbox.</p>
<div class="cta-box"><b>Next step:</b> ${esc(o.cta)} — reply in your hub or book directly.<br/>
<a class="btn" href="mailto:${esc(meta.email)}?subject=${encodeURIComponent(o.name + " — " + hub.company)}">${esc(o.cta)}</a></div>
<footer>${meta.ref} · generated with <em>mimra</em> Essential · content sourced live from your customer hub</footer>
</div>${printBtn(accent)}</body></html>`;
  }

  /* ---------- Signature: full-bleed scroll deck ---------- */
  function signature(hub, objKey, accent, opts) {
    const accentInk = (opts && opts.accentInk) || "#7c3a1e";
    const o = OBJ[objKey] || OBJ.proposal;
    const c = composeContent(hub, objKey, opts);
    const st = c.stats;
    const meta = docMeta(hub, o, opts);
    const sv = savingsBlock(hub, opts);
    const tl = objKey === "proposal" ? timelineSteps(hub) : null;
    const refs = opts && opts.references;
    const pricingFirst = !!(opts && opts.emphasis === "pricing" && hub.priceList && hub.priceList.length);

    const situationSection = `
<section>
  <div class="inner">
    <div class="kicker rv">The situation</div>
    <h2 class="rv">${esc(c.sitTitle)}</h2>
    <p class="lede rv d1">${esc(c.sitLede)}</p>
    <div class="grid cols-3">
      ${st.map((x, i) => `<div class="card rv d${(i % 2) + 1}"><div class="stat-value">${esc(x.v)}</div><div class="stat-note">${esc(x.l)}</div>${x.n ? `<div class="stat-how">${esc(x.n)}</div>` : ""}</div>`).join("")}
    </div>
    ${qaBlock(c, 2)}
    ${personBlock(c)}
  </div>
</section>`;

    const commercialSection = priceTable(hub) ? `
<section>
  <div class="inner">
    <div class="kicker rv">Commercial</div>
    ${priceTable(hub).replace("<h2>", '<h2 class="rv">')}
    ${sv ? `<div class="rv d1">${sv.html}</div>` : ""}
    <div class="rv d2">${evidenceBlock(c)}</div>
  </div>
</section>` : "";
    const evidenceFallback = !priceTable(hub) ? `<div class="rv d2">${evidenceBlock(c)}</div>` : "";

    const middleSection = `
<section>
  <div class="inner">
    <div class="kicker rv">${esc(o.name)}</div>
    <h2 class="rv">${esc(c.middleTitle)}.</h2>
    <div class="grid cols-3">
      ${c.middleCards.map((m, i) => `<div class="card rv d${(i % 2) + 1}"><h3>${esc(m.t)}</h3><p>${esc(m.p)}</p></div>`).join("")}
    </div>
    ${tl ? `<div class="tl rv d2">${tl.map((s) => `
      <div class="tl-item"><span class="q">${esc(s.q)}</span><b>${esc(s.t)}</b><span>${esc(s.p)}</span></div>`).join("")}</div>` : ""}
    ${evidenceFallback}
  </div>
</section>`;

    const refsSection = refs && refs.length ? `
<section>
  <div class="inner">
    <div class="kicker rv">Proof</div>
    <h2 class="rv">Fleets like yours, already running.</h2>
    <div class="grid cols-3">
      ${refs.map((r, i) => `<div class="card ref rv d${(i % 2) + 1}"><span class="flag">${esc(r.flag || "🏳️")}</span><div><h3>${esc(r.company)}</h3><p>${esc(r.line)}</p></div></div>`).join("")}
    </div>
  </div>
</section>` : "";

    const body = pricingFirst
      ? commercialSection + situationSection + middleSection + refsSection
      : situationSection + middleSection + commercialSection + refsSection;

    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(meta.workspace)} × ${esc(hub.company)} — ${esc(o.name)}</title>${FAVICON}
<script>document.documentElement.className="js"</script>
<style>
:root{--paper:#f7f5ef;--card:#fcfcfb;--ink:#1a1915;--ink2:#52514e;--ink3:#898781;--line:#e3e1d8;
--accent:${accent};--accent-ink:${accentInk};--serif:"Charter","Iowan Old Style",Georgia,serif;
--sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--ease:cubic-bezier(.22,.8,.3,1)}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--paper);color:var(--ink);line-height:1.6;font-size:16px;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:var(--serif);font-weight:600;letter-spacing:-.015em}
.progress{position:fixed;top:0;left:0;height:3px;background:var(--accent);width:0;z-index:50}
.dots{position:fixed;right:18px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;z-index:50}
.dots a{width:8px;height:8px;border-radius:50%;background:var(--ink3);opacity:.35;transition:all .3s var(--ease)}
.dots a.on{opacity:1;background:var(--accent);transform:scale(1.4)}
section{min-height:100vh;display:flex;align-items:center;padding:90px 8vw;position:relative;overflow:hidden}
.inner{max-width:980px;margin:0 auto;width:100%;position:relative;z-index:2}
.kicker{font-size:12.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent-ink);font-weight:700;margin-bottom:18px}
h1{font-size:clamp(38px,6vw,70px);line-height:1.06;white-space:pre-line}
h2{font-size:clamp(28px,4vw,44px);line-height:1.12;margin-bottom:18px}
.lede{font-size:clamp(17px,1.6vw,20px);color:var(--ink2);max-width:62ch;margin-top:18px}
.js .rv{opacity:0;transform:translateY(26px);transition:opacity .8s var(--ease),transform .8s var(--ease)}
.js .rv.in{opacity:1;transform:none}.js .rv.d1{transition-delay:.1s}.js .rv.d2{transition-delay:.2s}
.amb::before,.amb::after{content:"";position:absolute;border-radius:50%;filter:blur(80px);opacity:.45;z-index:0;pointer-events:none}
.amb::before{width:560px;height:560px;top:-200px;right:-140px;background:radial-gradient(circle at 40% 40%,#e9b18f,#d97757 55%,transparent 75%);animation:d1 30s var(--ease) infinite alternate}
.amb::after{width:480px;height:480px;bottom:-240px;left:-120px;background:radial-gradient(circle at 60% 40%,#cfd8bd,#a8b58f 55%,transparent 75%);animation:d2 36s var(--ease) infinite alternate}
@keyframes d1{to{transform:translate(-80px,60px) scale(1.18)}}@keyframes d2{to{transform:translate(70px,-50px) scale(1.12)}}
.cover{background:linear-gradient(150deg,#23221c,#35301f 55%,#4a3423);color:#efede4}
.cover .kicker{color:#e9b18f}.cover h1{color:#fff}.cover .lede{color:#cdc9ba}
.brand-row{display:flex;align-items:center;gap:14px;margin-bottom:44px;font-size:15px;color:#cdc9ba}
.brand-row .x{color:var(--accent);font-family:var(--serif);font-size:20px}.brand-row b{color:#fff}
.cover-meta{display:flex;gap:34px;margin-top:54px;flex-wrap:wrap;font-size:13.5px;color:#a5a294}
.cover-meta b{display:block;color:#efede4;font-size:14.5px}
.grid{display:grid;gap:18px;margin-top:36px}.cols-3{grid-template-columns:repeat(3,1fr)}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px;box-shadow:0 1px 2px rgba(26,25,21,.05),0 10px 30px -14px rgba(26,25,21,.15)}
.card h3{font-size:19px;margin-bottom:8px}.card p{font-size:14px;color:var(--ink2)}
.card.ref{display:flex;gap:14px;align-items:flex-start}.card.ref .flag{font-size:26px;line-height:1.2}
.card.ref h3{font-size:16px}
.stat-value{font-size:34px;font-weight:650;font-family:var(--sans)}
.stat-note{font-size:12.5px;color:var(--ink3);margin-top:4px}
.hubnote{border-left:3px solid var(--accent);padding:6px 0 6px 20px;margin-top:26px;font-size:15px;color:var(--ink2)}.hubnote b{color:var(--ink)}
.table-scroll{overflow-x:auto;border:1px solid var(--line);border-radius:18px;background:var(--card);margin-top:28px}
table{width:100%;border-collapse:collapse;font-size:14.5px}
th{text-align:left;font-size:11.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--ink3);padding:14px 18px;border-bottom:1px solid var(--line)}
td{padding:14px 18px;border-bottom:1px solid #edebe2}tr:last-child td{border-bottom:0}
.num{text-align:right;font-variant-numeric:tabular-nums}.strike{color:var(--ink3);text-decoration:line-through}
.sku{font-family:ui-monospace,monospace;font-size:12px;color:var(--ink2)}
h2 + p{color:var(--ink2)}
.fine{font-size:12px;color:var(--ink3);margin-top:10px}
.tl{margin-top:44px;display:grid;grid-template-columns:repeat(4,1fr);gap:0;position:relative}
.tl::before{content:"";position:absolute;top:9px;left:4%;right:4%;height:2px;background:var(--line)}
.tl-item{padding:0 14px;position:relative}
.tl-item::before{content:"";width:14px;height:14px;border-radius:50%;background:var(--accent);border:3px solid var(--paper);display:block;margin-bottom:14px;position:relative;z-index:1}
.tl-item b{font-size:14.5px;display:block;color:var(--ink)}
.tl-item span{font-size:12.5px;color:var(--ink2)}
.tl-item .q{font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-ink);font-weight:700;display:block;margin-bottom:4px}
${SAVINGS_CSS}
.closing{background:linear-gradient(150deg,#23221c,#4a3423);color:#efede4;text-align:center}
.closing h2{color:#fff}.closing .lede{color:#cdc9ba;margin-inline:auto}
.cta{display:inline-flex;gap:10px;background:var(--accent);color:#fff;font-weight:650;font-size:16px;padding:15px 34px;border-radius:999px;text-decoration:none;margin-top:34px;box-shadow:0 10px 30px -10px rgba(26,25,21,.5)}
.made-by{margin-top:70px;font-size:12px;color:#8a8779;letter-spacing:.06em}.made-by em{font-style:normal;color:#e9b18f;font-family:var(--serif)}
@media(max-width:860px){section{padding:70px 6vw;min-height:auto}.cols-3{grid-template-columns:1fr}.tl{grid-template-columns:1fr;gap:22px}.tl::before{display:none}.dots{display:none}}
@media print{section{min-height:auto;page-break-inside:avoid;padding:40px 6vw}.js .rv{opacity:1;transform:none}.amb::before,.amb::after{display:none}.dots,.progress{display:none}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}.js .rv{opacity:1;transform:none}}
</style></head><body>

<div class="progress" id="mprog"></div>
<nav class="dots" id="mdots" aria-label="Slides"></nav>

<section class="cover amb">
  <div class="inner">
    <div class="brand-row rv"><b>${esc(meta.workspace)}</b> <span class="x">×</span> <b>${esc(hub.company)}</b></div>
    <div class="kicker rv d1">${esc(o.name)} · ${meta.ref}</div>
    <h1 class="rv d1">${esc(c.headline)}</h1>
    <p class="lede rv d2">${esc(c.lede)}</p>
    <div class="cover-meta rv d2">
      <div><b>Prepared for</b> ${esc(hub.contact)}, ${esc(hub.contactRole)}</div>
      <div><b>Prepared by</b> ${esc(meta.sender)}, ${esc(meta.workspace)}</div>
      <div><b>Date</b> ${meta.date}</div>
      <div><b>Valid until</b> ${meta.valid}</div>
    </div>
  </div>
</section>
${body}
<section class="closing amb">
  <div class="inner">
    <div class="kicker rv" style="color:#e9b18f">Next step</div>
    <h2 class="rv">${esc(o.cta)}.</h2>
    <p class="lede rv d1">${esc(c.closingLede)}</p>
    <a class="cta rv d2" href="mailto:${esc(meta.email)}?subject=${encodeURIComponent(o.name + " — " + hub.company)}">${esc(o.cta)} →</a>
    <div class="made-by rv d2">${meta.ref} · composed for ${esc(hub.company)} · generated with <em>mimra</em> Signature</div>
  </div>
</section>

${printBtn(accent)}
<script>
(function(){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.querySelectorAll(".rv").forEach(function(el){el.classList.add("in")})})},{threshold:.3});
  var secs=[].slice.call(document.querySelectorAll("section"));
  secs.forEach(function(s,i){s.id=s.id||"ms"+i;io.observe(s)});
  var dots=document.getElementById("mdots");
  if(dots){dots.innerHTML=secs.map(function(s){return '<a href="#'+s.id+'" aria-label="'+s.id+'"></a>'}).join("");
    var dEls=[].slice.call(dots.children);
    var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var i=secs.indexOf(e.target);if(i>-1){dEls.forEach(function(d){d.classList.remove("on")});dEls[i].classList.add("on")}}})},{threshold:.5});
    secs.forEach(function(s){io2.observe(s)});}
  var bar=document.getElementById("mprog");
  if(bar)addEventListener("scroll",function(){var h=document.documentElement;bar.style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+"%"},{passive:true});
})();
</script>
</body></html>`;
  }

  window.MimraGen = {
    buildDeck: (hub, objKey, tierKey, opts) => {
      const accent = (opts && opts.accent) || "#c96442";
      const html = tierKey === "signature" ? signature(hub, objKey, accent, opts) : essential(hub, objKey, accent, opts);
      const sv = savingsBlock(hub, opts);
      return {
        html,
        meta: {
          sections: tierKey === "signature"
            ? 3 + (priceTable(hub) ? 1 : 0) + ((opts && opts.references && opts.references.length) ? 1 : 0)
            : null,
          priceLines: (hub.priceList || []).length,
          savingsAvg: sv ? sv.avg : null,
          pricingFirst: !!(opts && opts.emphasis === "pricing" && hub.priceList && hub.priceList.length),
          references: (opts && opts.references && opts.references.length) || 0,
          hasTimeline: objKey === "proposal"
        }
      };
    },
    objectiveName: (objKey) => (OBJ[objKey] || OBJ.proposal).name
  };
})();
