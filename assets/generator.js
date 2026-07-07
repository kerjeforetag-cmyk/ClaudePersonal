/* ============================================================
   Minra — deck generator
   Builds complete, standalone HTML presentations from hub data.
   Essential = clean template document. Signature = full-bleed
   scroll deck with reveal motion. Both are self-contained files.
   ============================================================ */

(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const eur = (n) => "€" + Number(n).toLocaleString("en-US");

  const FAVICON = `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='46' fill='%23c96442'/><text x='50' y='68' font-size='56' font-family='Georgia' text-anchor='middle' fill='white'>m</text></svg>" />`;

  // objective-specific middle sections (cards used by both tiers)
  function middleCards(hub, objKey) {
    if (objKey === "intro") return [
      { t: "Li-ion packs", p: "Drop-in 24/48V packs for every major platform — integrated heating for cold environments, 7-year / 10,000-cycle warranty." },
      { t: "SmartCharge", p: "10–30 kW opportunity charging at the points where work naturally pauses. VDE 0510-48 compliant — no classified battery room." },
      { t: "FleetView", p: "Telemetry on every pack: state of health, utilization and the sizing data your next decision needs." }
    ];
    if (objKey === "renewal") {
      const won = (hub.proposals || []).filter((p) => p.status === "Accepted");
      const wonValue = won.reduce((a, p) => a + (p.value || 0), 0);
      return [
        { t: "Delivered together", p: won.length ? won.length + " accepted proposal" + (won.length > 1 ? "s" : "") + " worth " + eur(wonValue) + " — on time, on spec." : "Our first phase together — measured, not promised." },
        { t: "Measured, not claimed", p: "99.6% fleet uptime across all NordCell customers, trailing 12 months — including yours." },
        { t: "The next step", p: "FleetView data from phase one sizes phase two exactly. You buy what the operation needs, not a safety margin." }
      ];
    }
    if (objKey === "tender") return [
      { t: "Certified", p: "CE, UN 38.3, VDE 0510-48 and DNV-GL type approval — the full certificate bundle ships with this response." },
      { t: "Warranted", p: "7 years / 10,000 cycles to 80% capacity, underwriting the cost model in this bid." },
      { t: "Evidenced", p: "Every compliance answer references a test protocol or certificate in the shared hub — nothing is asserted without a document." }
    ];
    // proposal
    return [
      { t: "Contract & survey", p: "Site walkthrough with your engineers; final electrical layout and grid check before anything is ordered." },
      { t: "Install & training", p: "Conversion in planned windows — no production downtime — with your team trained on-site in one day." },
      { t: "Review & scale", p: "90-day telemetry review; the data sizes the next phase before you commit to it." }
    ];
  }

  const OBJ = {
    proposal: {
      name: "Commercial proposal",
      headline: (h) => `A proposal ${h.company.split(" ")[0]} can measure.`,
      lede: (h) => `Scope, pricing and rollout for ${h.company} — built from your hub data, priced at your hub rates, ready to decide on.`,
      cta: "Walk through it together"
    },
    intro: {
      name: "Company introduction",
      headline: () => `Who we are, in your terms.`,
      lede: (h) => `An introduction to NordCell Power for ${h.company}: what we make, what it changes for ${h.industry.toLowerCase()}, and the proof behind it.`,
      cta: "Book a first meeting"
    },
    renewal: {
      name: "Renewal & expansion",
      headline: () => `Phase one worked.\nHere's phase two.`,
      lede: (h) => `What we delivered together so far, what the data says, and the next step for ${h.company}.`,
      cta: "Plan the next phase"
    },
    tender: {
      name: "Tender response",
      headline: () => `Every requirement,\nanswered.`,
      lede: (h) => `A structured response for ${h.company} with compliance evidence, certified documentation and committed pricing.`,
      cta: "Review the compliance annex"
    }
  };

  function stats(hub) {
    const s = [];
    if (hub.value) s.push({ v: eur(hub.value), l: "engagement value on the table" });
    s.push({ v: "99.6%", l: "NordCell fleet uptime, trailing 12 months" });
    s.push({ v: "7 yr", l: "warranty — 10,000 cycles to 80% capacity" });
    return s.slice(0, 3);
  }

  function hubQuote(hub) {
    const t = (hub.timeline || []).find((x) => /["“]/.test(x.what));
    if (!t) return "";
    const q = t.what.match(/["“](.+?)["”]/);
    return q ? `<div class="hubnote"><b>From your hub:</b> “${esc(q[1])}” — answered in this document, and in your hub under Technical data.</div>` : "";
  }

  function priceTable(hub, dark) {
    if (!hub.priceList || !hub.priceList.length) return "";
    const rows = hub.priceList.map((p) => `
      <tr><td class="sku">${esc(p.sku)}</td><td>${esc(p.name)}</td>
      <td class="num strike">${eur(p.list)}</td><td class="num"><b>${eur(p.hub)}</b></td><td class="num">${p.moq}</td></tr>`).join("");
    return `
    <h2>Your hub pricing</h2>
    <p>Customer-specific rates as published in your Minra hub — not list prices.</p>
    <div class="table-scroll"><table>
      <thead><tr><th>SKU</th><th>Product</th><th class="num">List</th><th class="num">Your price</th><th class="num">MOQ</th></tr></thead>
      <tbody>${rows}</tbody></table></div>
    <p class="fine">Valid Q3 2026 · full commercial terms in your Minra hub.</p>`;
  }

  const MIDDLE_TITLE = { proposal: "How the rollout lands", intro: "What we make", renewal: "What phase one proved", tender: "Why this bid holds" };
  const printBtn = (acc) => `<button class="printbtn" onclick="window.print()">Print / PDF</button>
  <style>.printbtn{position:fixed;right:18px;bottom:18px;z-index:60;background:${acc};color:#fff;border:0;border-radius:999px;padding:11px 20px;font:600 13px system-ui;cursor:pointer;box-shadow:0 8px 24px -8px rgba(26,25,21,.4)}@media print{.printbtn{display:none}}</style>`;

  /* ---------- Essential: clean template document ---------- */
  function essential(hub, objKey, accent) {
    const o = OBJ[objKey] || OBJ.proposal;
    const st = stats(hub);
    const mid = middleCards(hub, objKey);
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>NordCell — ${esc(o.name)} for ${esc(hub.company)} (Essential)</title>${FAVICON}
<style>
:root{--paper:#fbfaf7;--ink:#1a1915;--ink2:#52514e;--ink3:#898781;--line:#e3e1d8;--accent:${accent};
--serif:"Charter","Iowan Old Style",Georgia,serif;--sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--sans);background:var(--paper);color:var(--ink);line-height:1.6;font-size:15.5px;-webkit-font-smoothing:antialiased}
h1,h2{font-family:var(--serif);font-weight:600;letter-spacing:-.01em}
.page{max-width:860px;margin:0 auto;padding:0 24px 80px}
header{border-bottom:3px solid var(--accent);padding:40px 0 26px;margin-bottom:40px}
.brand{font-family:var(--serif);font-size:22px}.brand em{font-style:normal;color:var(--accent)}
h1{font-size:36px;line-height:1.15;margin-top:18px;white-space:pre-line}
.meta{display:flex;gap:28px;flex-wrap:wrap;margin-top:16px;font-size:13px;color:var(--ink3)}.meta b{color:var(--ink2)}
h2{font-size:24px;margin:44px 0 12px;padding-top:22px;border-top:1px solid var(--line)}
p{color:var(--ink2);max-width:70ch}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:22px 0}
.stat{border:1px solid var(--line);border-radius:12px;padding:16px;background:#fff}
.stat b{display:block;font-size:24px}.stat span{font-size:12.5px;color:var(--ink3)}
table{width:100%;border-collapse:collapse;font-size:14px;margin-top:18px;background:#fff}
th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--ink3);padding:10px 12px;border-bottom:2px solid var(--line)}
td{padding:10px 12px;border-bottom:1px solid #eeece3}
.num{text-align:right;font-variant-numeric:tabular-nums}.strike{color:var(--ink3);text-decoration:line-through}
.sku{font-family:ui-monospace,monospace;font-size:12px;color:var(--ink2)}
.fine{font-size:12px;color:var(--ink3);margin-top:8px}
.hubnote{border-left:3px solid var(--accent);padding:6px 0 6px 18px;margin:26px 0;font-size:14.5px;color:var(--ink2)}.hubnote b{color:var(--ink)}
.cta-box{margin-top:50px;border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:12px;padding:22px;background:#fff}
.btn{display:inline-block;background:var(--accent);color:#fff;font-weight:600;font-size:14px;padding:11px 24px;border-radius:999px;text-decoration:none;margin-top:12px}
footer{margin-top:60px;font-size:12px;color:var(--ink3);text-align:center}footer em{font-style:normal;color:#7c3a1e;font-family:var(--serif)}
.table-scroll{overflow-x:auto}
@media(max-width:640px){.stats{grid-template-columns:1fr}h1{font-size:28px}}
@media print{.btn{display:none}}
</style></head><body><div class="page">
<header>
  <div class="brand">NordCell Power <span style="color:var(--ink3)">· prepared with</span> <em>minra</em></div>
  <h1>${esc(o.name)}\n${esc(hub.company)}</h1>
  <div class="meta"><div><b>For</b> ${esc(hub.contact)}, ${esc(hub.contactRole)}</div>
  <div><b>From</b> Alex Kjellberg, NordCell Power AB</div><div><b>Generated</b> from your Minra hub</div></div>
</header>
<h2>Summary</h2>
<p>${esc(o.lede(hub))}</p>
<p style="margin-top:10px">${esc(hub.about)}</p>
<div class="stats">${st.map((x) => `<div class="stat"><b>${esc(x.v)}</b><span>${esc(x.l)}</span></div>`).join("")}</div>
${hubQuote(hub)}
<h2>${esc(MIDDLE_TITLE[objKey] || MIDDLE_TITLE.proposal)}</h2>
<div class="stats">${mid.map((c) => `<div class="stat"><b style="font-size:16px">${esc(c.t)}</b><span style="font-size:13px;color:var(--ink2)">${esc(c.p)}</span></div>`).join("")}</div>
${priceTable(hub)}
<h2>How we work</h2>
<p>Everything in this document lives in your shared Minra hub — prices, technical data and every answer, visible to your whole team. Questions land with all of us, not one inbox.</p>
<div class="cta-box"><b>Next step:</b> ${esc(o.cta)} — reply in your hub or book directly.<br/>
<a class="btn" href="mailto:alex@nordcell.se?subject=${encodeURIComponent(o.name + " — " + hub.company)}">${esc(o.cta)}</a></div>
<footer>Generated with <em>minra</em> Essential · content sourced live from your customer hub</footer>
</div>${printBtn(accent)}</body></html>`;
  }

  /* ---------- Signature: full-bleed scroll deck ---------- */
  function signature(hub, objKey, accent) {
    const o = OBJ[objKey] || OBJ.proposal;
    const st = stats(hub);
    const mid = middleCards(hub, objKey);
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>NordCell × ${esc(hub.company)} — ${esc(o.name)}</title>${FAVICON}
<script>document.documentElement.className="js"</script>
<style>
:root{--paper:#f7f5ef;--card:#fcfcfb;--ink:#1a1915;--ink2:#52514e;--ink3:#898781;--line:#e3e1d8;
--accent:${accent};--accent-ink:#7c3a1e;--serif:"Charter","Iowan Old Style",Georgia,serif;
--sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--ease:cubic-bezier(.22,.8,.3,1)}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--paper);color:var(--ink);line-height:1.6;font-size:16px;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:var(--serif);font-weight:600;letter-spacing:-.015em}
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
.stat-value{font-size:34px;font-weight:650;font-family:var(--sans)}
.stat-note{font-size:12.5px;color:var(--ink3);margin-top:4px}
.hubnote{border-left:3px solid var(--accent);padding:6px 0 6px 20px;margin-top:26px;font-size:15px;color:var(--ink2)}.hubnote b{color:var(--ink)}
.table-scroll{overflow-x:auto;border:1px solid var(--line);border-radius:18px;background:var(--card);margin-top:28px}
table{width:100%;border-collapse:collapse;font-size:14.5px}
th{text-align:left;font-size:11.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--ink3);padding:14px 18px;border-bottom:1px solid var(--line)}
td{padding:14px 18px;border-bottom:1px solid #edebe2}tr:last-child td{border-bottom:0}
.num{text-align:right;font-variant-numeric:tabular-nums}.strike{color:var(--ink3);text-decoration:line-through}
.sku{font-family:ui-monospace,monospace;font-size:12px;color:var(--ink2)}
h2 + p, .sig-p{color:var(--ink2)}
.fine{font-size:12px;color:var(--ink3);margin-top:10px}
.closing{background:linear-gradient(150deg,#23221c,#4a3423);color:#efede4;text-align:center}
.closing h2{color:#fff}.closing .lede{color:#cdc9ba;margin-inline:auto}
.cta{display:inline-flex;gap:10px;background:var(--accent);color:#fff;font-weight:650;font-size:16px;padding:15px 34px;border-radius:999px;text-decoration:none;margin-top:34px;box-shadow:0 10px 30px -10px rgba(201,100,66,.8)}
.made-by{margin-top:70px;font-size:12px;color:#8a8779;letter-spacing:.06em}.made-by em{font-style:normal;color:#e9b18f;font-family:var(--serif)}
@media(max-width:860px){section{padding:70px 6vw;min-height:auto}.cols-3{grid-template-columns:1fr}}
@media print{section{min-height:auto;page-break-inside:avoid;padding:40px 6vw}.rv{opacity:1;transform:none}.amb::before,.amb::after{display:none}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}.rv{opacity:1;transform:none}}
</style></head><body>

<section class="cover amb">
  <div class="inner">
    <div class="brand-row rv"><b>NordCell Power</b> <span class="x">×</span> <b>${esc(hub.company)}</b></div>
    <div class="kicker rv d1">${esc(o.name)}</div>
    <h1 class="rv d1">${esc(o.headline(hub))}</h1>
    <p class="lede rv d2">${esc(o.lede(hub))}</p>
    <div class="cover-meta rv d2">
      <div><b>Prepared for</b> ${esc(hub.contact)}, ${esc(hub.contactRole)}</div>
      <div><b>Prepared by</b> Alex Kjellberg, NordCell Power AB</div>
      <div><b>Source</b> your Minra hub, live data</div>
    </div>
  </div>
</section>

<section>
  <div class="inner">
    <div class="kicker rv">The situation</div>
    <h2 class="rv">Where this starts.</h2>
    <p class="lede rv d1">${esc(hub.about)}</p>
    <div class="grid cols-3">
      ${st.map((x, i) => `<div class="card rv d${(i % 2) + 1}"><div class="stat-value">${esc(x.v)}</div><div class="stat-note">${esc(x.l)}</div></div>`).join("")}
    </div>
    ${hubQuote(hub)}
  </div>
</section>

<section>
  <div class="inner">
    <div class="kicker rv">${esc(o.name)}</div>
    <h2 class="rv">${esc(MIDDLE_TITLE[objKey] || MIDDLE_TITLE.proposal)}.</h2>
    <div class="grid cols-3">
      ${mid.map((c, i) => `<div class="card rv d${(i % 2) + 1}"><h3>${esc(c.t)}</h3><p>${esc(c.p)}</p></div>`).join("")}
    </div>
  </div>
</section>

${priceTable(hub) ? `<section><div class="inner"><div class="kicker rv">Commercial</div>${priceTable(hub).replace("<h2>", '<h2 class="rv">')}</div></section>` : ""}

<section class="closing amb">
  <div class="inner">
    <div class="kicker rv" style="color:#e9b18f">Next step</div>
    <h2 class="rv">${esc(o.cta)}.</h2>
    <p class="lede rv d1">Reply in your Minra hub — every question lands with the whole team — or book directly with ${esc(hub.contact.split(" ")[0])}'s calendar in mind.</p>
    <a class="cta rv d2" href="mailto:alex@nordcell.se?subject=${encodeURIComponent(o.name + " — " + hub.company)}">${esc(o.cta)} →</a>
    <div class="made-by rv d2">Composed for ${esc(hub.company)} · generated with <em>minra</em> Signature</div>
  </div>
</section>

${printBtn(accent)}
<script>
(function(){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.querySelectorAll(".rv").forEach(function(el){el.classList.add("in")})})},{threshold:.3});
document.querySelectorAll("section").forEach(function(s){io.observe(s)})})();
</script>
</body></html>`;
  }

  window.MinraGen = {
    buildDeck: (hub, objKey, tierKey, opts) => {
      const accent = (opts && opts.accent) || "#c96442";
      return tierKey === "signature" ? signature(hub, objKey, accent) : essential(hub, objKey, accent);
    },
    objectiveName: (objKey) => (OBJ[objKey] || OBJ.proposal).name
  };
})();
