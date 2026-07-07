/* ============================================================
   Minra — application
   Hash-routed SPA. No dependencies, no build step.
   ============================================================ */

(function () {
  "use strict";
  const D = window.MINRA;
  const $ = (sel, el) => (el || document).querySelector(sel);
  const view = $("#view");

  /* ---------- utils ---------- */
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fmtEUR = (n) => "€" + Number(n).toLocaleString("en-US");
  const fmtM = (n) => "€" + (n / 1e6).toFixed(2) + "M";
  const deltaHTML = (v, suffix) =>
    `<span class="delta ${v >= 0 ? "up" : "down"}">${v >= 0 ? "▲" : "▼"} ${Math.abs(v)}${suffix || "%"} <span style="color:var(--ink-3);font-weight:500">vs last quarter</span></span>`;

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- shared tooltip ---------- */
  const tip = document.createElement("div");
  tip.className = "tipbox";
  document.body.appendChild(tip);
  document.addEventListener("mouseover", (e) => {
    const el = e.target.closest("[data-tip]");
    if (!el) { tip.classList.remove("show"); return; }
    tip.textContent = el.getAttribute("data-tip");
    tip.classList.add("show");
    const r = el.getBoundingClientRect();
    tip.style.left = Math.min(window.innerWidth - tip.offsetWidth - 12, Math.max(8, r.left + r.width / 2 - tip.offsetWidth / 2)) + "px";
    tip.style.top = Math.max(8, r.top - tip.offsetHeight - 8) + "px";
  });

  /* ---------- charts ---------- */
  // sparkline: single series — de-emphasized line, accent end-dot (stat-tile spec)
  function sparkline(points, w, h, opts) {
    w = w || 150; h = h || 36; opts = opts || {};
    const line = opts.line || "#c3c2b7";
    const dot = opts.dot || "var(--s1)";
    const min = Math.min(...points), max = Math.max(...points);
    const span = (max - min) || 1;
    const pad = 4;
    const px = (i) => pad + (i / (points.length - 1)) * (w - pad * 2);
    const py = (v) => h - pad - ((v - min) / span) * (h - pad * 2);
    const d = points.map((v, i) => (i ? "L" : "M") + px(i).toFixed(1) + " " + py(v).toFixed(1)).join(" ");
    const lx = px(points.length - 1), ly = py(points[points.length - 1]);
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="trend">
      <path d="${d}" fill="none" stroke="${line}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${lx}" cy="${ly}" r="4" fill="${dot}" stroke="var(--card)" stroke-width="2"/>
    </svg>`;
  }

  // horizontal bar rows: single hue, value at tip (dataviz mark spec)
  function barChart(rows, unitLabel) {
    const max = Math.max(...rows.map((r) => r.value));
    return `<div class="bar-chart">` + rows.map((r) => `
      <div class="bc-row" data-tip="${esc(r.stage)}: ${fmtEUR(r.value)}">
        <div class="bc-label">${esc(r.stage)}</div>
        <div class="bc-track"><div class="bc-fill" style="width:${(r.value / max * 100).toFixed(1)}%"></div></div>
        <div class="bc-val">${fmtEUR(r.value / 1000)}k</div>
      </div>`).join("") +
      `</div><div class="axis-note">${esc(unitLabel)}</div>`;
  }

  // 14-day travel strip — sequential ramp by score, best days flagged
  // ordinal ramp: sequential blue, 5 validated steps (monotone L, ≥0.06 gaps, light end ≥2:1)
  const seqRamp = ["#86b6ef", "#3987e5", "#256abf", "#184f95", "#0d366b"];
  const seqFor = (score) => seqRamp[Math.min(4, Math.floor(score / 100 * 4.99))];
  function dayStrip(days) {
    const best = Math.max(...days.map((d) => d.s));
    return `<div class="day-strip">` + days.map((d) => `
      <div class="day-cell ${d.s >= best - 6 ? "best" : ""}" data-tip="${esc(d.d)} — score ${d.s}/100">
        <div class="bar-slot"><div class="bar" style="height:${Math.max(8, d.s * 0.64)}px;background:${seqFor(d.s)}"></div></div>
        <div class="d">${esc(d.d.replace(/^\w+ /, ""))}</div>
      </div>`).join("") + `</div>
      <div class="axis-note">Day score 0–100 — customer availability · events · travel cost · weather. Darker = better.</div>`;
  }

  /* ---------- help notes ---------- */
  const HELP = {
    dashboard: ["Your day, already sorted", "Minra pulls your pipeline, hub activity, market news and travel into one morning view — so you start with the three things that move revenue, not with admin."],
    hubs: ["What is a hub?", "A hub is a private space you share with one customer: their prices, technical documents, proposals and generated presentations. You invite the buying team — everyone sees the same, always-current facts."],
    hub: ["What your customer sees", "Everything in this hub is visible to the invited customer team, except tabs marked internal. Prices here override list prices. Every view and download is tracked in Activity."],
    studio: ["Two ways to generate", "Essential decks are template-based and included in your plan — fast and on-brand. Signature decks are code-generated: layout, charts and narrative composed specifically for this customer. Both are HTML — they open anywhere, animate smoothly and print clean."],
    flow: ["News that follows your territories", "Market Flow watches the regions you sell in and surfaces only what affects your accounts: regulation, tenders, fairs and market moves. Tap a territory to focus."],
    travel: ["Why these days?", "Minra scores every day by customer availability, trade fairs and tenders nearby, flight-price index and weather — then recommends the window where one trip does the most work."],
    pricing: ["Verified vs estimated", "A Verified price was actually seen — a tender award, a distributor list, a quote a customer shared. An Estimated OEM price is our model of what the competitor charges OEMs when no document exists. Never mix them up in a negotiation."],
    people: ["Know who matters before you land", "The people who decide, influence or block your deals — per country, with how they work and where to meet them. Add your own notes after every meeting."]
  };
  function helpNote(key) {
    if (localStorage.getItem("minra.hn." + key) === "off") return "";
    const [t, b] = HELP[key];
    return `<div class="help-note" data-hn="${key}">
      <div class="hn-ico">?</div>
      <div><b>${esc(t)}</b><p>${esc(b)}</p></div>
      <button class="hn-close" data-hn-close="${key}" aria-label="Dismiss">×</button>
    </div>`;
  }

  /* ---------- nav ---------- */
  const NAV = [
    { hash: "#/dashboard", name: "Dashboard", ico: "M3 13h7V3H3v10Zm0 8h7v-6H3v6Zm11 0h7V11h-7v10Zm0-18v6h7V3h-7Z" },
    { hash: "#/hubs", name: "Customer hubs", ico: "M12 3 2 9l10 6 10-6-10-6Zm-6 9.5V17l6 3.5 6-3.5v-4.5" },
    { hash: "#/studio", name: "Presentation studio", ico: "M4 4h16v11H4z M8 20l4-3 4 3" },
    { hash: "#/flow", name: "Market flow", ico: "M3 12h4l2-6 4 12 2-6h6" },
    { hash: "#/travel", name: "Travel planner", ico: "M2 16l20-6-8 4-2 6-2-4-8 0Z" },
    { hash: "#/pricing", name: "Competitor pricing", ico: "M12 2v20 M7 7h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8" },
    { hash: "#/people", name: "Key persons", ico: "M16 11a4 4 0 1 0-8 0 M4 21c0-4 4-6 8-6s8 2 8 6" }
  ];
  function renderNav(active) {
    $("#nav").innerHTML = `<div class="nav-label">Workspace</div>` + NAV.map((n) => `
      <a class="nav-item ${active === n.hash ? "active" : ""}" href="${n.hash}">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${n.ico}"/></svg>
        ${n.name}</a>`).join("");
  }

  /* ---------- views ---------- */
  const stageBadge = (s) => {
    const map = { "Qualified": "neutral", "Hub invited": "brand", "Proposal sent": "warn", "Negotiation": "warn", "Verbal commit": "good" };
    return `<span class="badge ${map[s] || "neutral"}"><span class="dot"></span>${esc(s)}</span>`;
  };
  const healthBadge = (h) =>
    h === "good" ? `<span class="badge good">● Healthy</span>` :
    h === "warning" ? `<span class="badge warn">● Cooling off</span>` :
    `<span class="badge crit">● At risk</span>`;

  function vDashboard() {
    const k = D.kpis;
    const nextTrip = D.travel.suggestions[0];
    const topNews = D.news.slice(0, 3);
    return `
    ${helpNote("dashboard")}
    <div class="hero ambient rise">
      <div class="hero-row">
        <div class="grow">
          <h1>Good morning, ${esc(D.tenant.user.name.split(" ")[0])}.</h1>
          <p>Müller viewed your Signature deck yesterday — 6 minutes on the pricing slides. The Stuttgart window opens in 11 weeks.</p>
        </div>
        <div>
          <div style="font-size:12.5px;color:#cdc9ba">Open pipeline</div>
          <div class="hero-kpi">${fmtM(k.pipelineValue)}<small>${k.pipelineDelta >= 0 ? "▲" : "▼"} ${Math.abs(k.pipelineDelta)}%</small></div>
        </div>
      </div>
    </div>

    <div class="grid cols-4">
      <div class="card stat rise rise-1"><span class="label">Hub engagement (30d)</span><span class="value">${k.hubEngagement}%</span>${deltaHTML(k.engagementDelta, " pts")}${sparkline([64,70,68,74,72,78,76,80,82,81,85,87])}</div>
      <div class="card stat rise rise-2"><span class="label">Decks generated (Q)</span><span class="value">${k.decksGenerated}</span>${deltaHTML(k.decksDelta, "")}${sparkline([12,14,13,17,19,18,22,24,26,29,31,34])}</div>
      <div class="card stat rise rise-3"><span class="label">Open proposals</span><span class="value">${k.openProposals}</span>${deltaHTML(k.proposalsDelta, "")}${sparkline([15,14,16,15,13,14,12,13,12,11,12,11])}</div>
      <div class="card stat rise rise-4"><span class="label">Pipeline trend (12 mo)</span><span class="value">${fmtM(k.pipelineValue)}</span>${deltaHTML(k.pipelineDelta, "%")}${sparkline(k.pipelineTrend)}</div>
    </div>

    <div class="grid cols-2" style="margin-top:16px">
      <div class="card rise rise-2">
        <h3>Pipeline by stage</h3><p class="sub">Weighted open value, all hubs</p>
        <div style="margin-top:14px">${barChart(k.pipelineByStage, "Value in € thousands")}</div>
      </div>
      <div class="card rise rise-3">
        <h3>Next best trip</h3><p class="sub">${esc(nextTrip.destination)} · ${esc(nextTrip.window)}</p>
        ${dayStrip(nextTrip.days)}
        <a class="btn ghost sm" href="#/travel" style="margin-top:10px">Open travel planner →</a>
      </div>
    </div>

    <div class="section-head"><h2>In your territories</h2><span class="sub">from Market Flow</span><span class="grow"></span><a class="btn ghost sm" href="#/flow">All news →</a></div>
    <div class="grid cols-3">
      ${topNews.map((n, i) => newsCard(n, i)).join("")}
    </div>`;
  }

  function newsCard(n, i) {
    return `<div class="card news-card hover rise rise-${(i % 4) + 1}">
      <div class="news-top"><span class="badge neutral">${esc(n.territory)}</span><span class="badge brand">${esc(n.tag)}</span><span>${esc(n.date)}</span></div>
      <h3>${esc(n.title)}</h3><p>${esc(n.body)}</p>
      <div class="news-top">${esc(n.source)}</div>
    </div>`;
  }

  function vHubs() {
    return `
    ${helpNote("hubs")}
    <div class="section-head"><h2>Customer hubs</h2><span class="sub">${D.hubs.length} active</span><span class="grow"></span>
      <button class="btn primary sm" data-act="new-hub">+ New hub</button></div>
    <div class="grid cols-3">
      ${D.hubs.map((h, i) => `
      <a class="card hub-card hover rise rise-${(i % 4) + 1}" href="#/hub/${h.id}">
        <div class="hub-top">
          <div class="hub-mark">${h.flag}</div>
          <div><h3>${esc(h.company)}</h3><span class="sub">${esc(h.industry)}</span></div>
        </div>
        <div class="hub-meta">${stageBadge(h.stage)}${healthBadge(h.health)}</div>
        <div class="hub-meta"><span class="sub">Deal value</span><b style="font-size:15px">${fmtEUR(h.value)}</b></div>
        ${sparkline(h.activity30d, 220, 30)}
        <div class="hub-foot"><span>${h.members} members</span><span class="grow"></span><span>active ${esc(h.lastActivity)}</span></div>
      </a>`).join("")}
    </div>`;
  }

  function vHub(id, tab) {
    const h = D.hubs.find((x) => x.id === id);
    if (!h) return `<div class="empty">Hub not found.</div>`;
    tab = tab || "overview";
    const tabs = [
      ["overview", "Overview"], ["prices", "Price list"], ["docs", "Technical data"],
      ["proposals", "Proposals"], ["decks", "Presentations"], ["activity", "Activity"]
    ];
    let body = "";
    if (tab === "overview") {
      body = `<div class="grid cols-2">
        <div class="card"><h3>About this customer</h3><p class="sub" style="margin-top:8px;font-size:13.5px;line-height:1.6">${esc(h.about)}</p></div>
        <div class="card"><h3>Hub pulse</h3><p class="sub">Customer actions, last 30 days</p>
          <div style="margin-top:14px">${sparkline(h.activity30d, 380, 56)}</div>
          <div class="hub-meta" style="margin-top:12px">${healthBadge(h.health)}<span class="sub">${h.members} members · last active ${esc(h.lastActivity)}</span></div>
        </div>
      </div>`;
    } else if (tab === "prices") {
      body = h.priceList.length ? `<div class="table-wrap"><table class="data">
        <thead><tr><th>SKU</th><th>Product</th><th class="num">List price</th><th class="num">Your hub price</th><th class="num">MOQ</th></tr></thead>
        <tbody>${h.priceList.map((p) => `<tr>
          <td style="font-family:var(--mono);font-size:12px">${esc(p.sku)}</td><td>${esc(p.name)}</td>
          <td class="num" style="color:var(--ink-3);text-decoration:line-through">${fmtEUR(p.list)}</td>
          <td class="num"><b>${fmtEUR(p.hub)}</b></td><td class="num">${p.moq}</td></tr>`).join("")}
        </tbody></table></div>
        <p class="axis-note" style="margin-top:10px">Hub prices are customer-specific and visible to invited members only. Valid Q3 2026.</p>`
        : `<div class="card"><div class="empty">No customer-specific price list yet. <br><br><button class="btn primary sm" data-act="demo">Publish price list</button></div></div>`;
    } else if (tab === "docs") {
      body = h.docs.length ? `<div class="card">${h.docs.map((d) => `
        <div class="doc-row"><div class="doc-ico">${esc(d.type)}</div>
        <div style="flex:1"><b>${esc(d.name)}</b><span class="src">Updated ${esc(d.updated)} · ${esc(d.size)}</span></div>
        <button class="btn ghost sm" data-act="demo">Share</button></div>`).join("")}</div>`
        : `<div class="card"><div class="empty">No documents shared yet.</div></div>`;
    } else if (tab === "proposals") {
      body = h.proposals.length ? `<div class="table-wrap"><table class="data">
        <thead><tr><th>Proposal</th><th class="num">Value</th><th>Status</th><th>Sent</th></tr></thead>
        <tbody>${h.proposals.map((p) => `<tr><td><b>${esc(p.name)}</b></td><td class="num">${fmtEUR(p.value)}</td>
        <td><span class="badge ${p.status === "Accepted" ? "good" : "warn"}">${esc(p.status)}</span></td><td>${esc(p.sent)}</td></tr>`).join("")}
        </tbody></table></div>`
        : `<div class="card"><div class="empty">No proposals yet — generate one in the studio.</div></div>`;
    } else if (tab === "decks") {
      body = h.presentations.length ? `<div class="grid cols-2">${h.presentations.map((p) => `
        <div class="card deck-result hover">
          <div class="deck-thumb ${p.tier === "Essential" ? "light" : ""}">${esc(p.tier)}</div>
          <div style="flex:1"><b style="font-size:14px">${esc(p.name)}</b>
            <span class="src" style="display:block">Generated ${esc(p.generated)} · ${p.views} customer views</span>
            <a class="btn dark sm" style="margin-top:8px" href="${esc(p.url)}" target="_blank" rel="noopener">Open deck ↗</a>
          </div></div>`).join("")}</div>`
        : `<div class="card"><div class="empty">No presentations yet.<br><br><a class="btn primary sm" href="#/studio">Generate one →</a></div></div>`;
    } else if (tab === "activity") {
      body = h.timeline.length ? `<div class="card"><ul class="timeline">${h.timeline.map((t) => `
        <li><span class="t-when">${esc(t.when)}</span><span><b>${esc(t.who)}</b> — ${esc(t.what)}</span></li>`).join("")}</ul></div>`
        : `<div class="card"><div class="empty">No activity yet.</div></div>`;
    }
    return `
    ${helpNote("hub")}
    <div class="hub-hero ambient">
      <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-start">
        <div><h1>${h.flag} ${esc(h.company)}</h1><div class="sub">${esc(h.industry)} · ${esc(h.contact)}, ${esc(h.contactRole)}</div></div>
        <div style="text-align:right"><div style="font-size:12px;color:#cdc9ba">Deal value</div>
        <div style="font-size:28px;font-weight:650">${fmtEUR(h.value)}</div></div>
      </div>
      <div class="hub-hero-row">${stageBadge(h.stage)}
        <button class="btn primary sm" data-act="invite">+ Invite customer</button>
        <a class="btn ghost sm" style="background:transparent;color:#efede4;border-color:#5a574b" href="#/studio">Generate presentation</a>
      </div>
    </div>
    <div class="tabs">${tabs.map(([k, n]) => `<a class="tab ${tab === k ? "on" : ""}" href="#/hub/${h.id}/${k}">${n}</a>`).join("")}</div>
    <div class="view">${body}</div>`;
  }

  /* ---------- studio ---------- */
  const studioState = { customer: "mueller", objective: "proposal", tier: "signature" };

  function vStudio() {
    const s = studioState;
    return `
    ${helpNote("studio")}
    <div class="section-head"><h2>Presentation studio</h2><span class="sub">from hub data to a deck your customer remembers</span></div>

    <div class="step-head"><div class="step-num">1</div><h3>Who is it for?</h3></div>
    <div class="grid cols-3">
      ${D.hubs.slice(0, 3).map((h) => `
      <div class="pick ${s.customer === h.id ? "on" : ""}" data-pick="customer" data-val="${h.id}">
        <b>${h.flag} ${esc(h.company)}</b><p>${esc(h.industry)} — ${esc(h.stage)}</p>
      </div>`).join("")}
    </div>

    <div class="step-head"><div class="step-num">2</div><h3>What should it achieve?</h3></div>
    <div class="grid cols-4">
      ${D.studio.objectives.map((o) => `
      <div class="pick ${s.objective === o.id ? "on" : ""}" data-pick="objective" data-val="${o.id}">
        <b>${esc(o.name)}</b><p>${esc(o.desc)}</p>
      </div>`).join("")}
    </div>

    <div class="step-head"><div class="step-num">3</div><h3>Pick your tier</h3></div>
    <div class="grid cols-2">
      ${D.studio.tiers.map((t) => `
      <div class="pick ${s.tier === t.id ? "on" : ""}" data-pick="tier" data-val="${t.id}">
        ${t.recommended ? `<span class="rec badge brand">Recommended</span>` : ""}
        <b>${esc(t.name)}</b><div class="price">${esc(t.price)}</div><p>${esc(t.desc)}</p>
        <ul>${t.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
      </div>`).join("")}
    </div>

    <div class="card gen-panel" id="gen-panel" style="margin-top:24px">
      <button class="btn primary" id="gen-btn" style="padding:13px 34px;font-size:15px">Generate presentation</button>
      <p class="axis-note" style="margin-top:12px">HTML output — opens in any browser, shares as a hub link, prints clean.</p>
    </div>`;
  }

  function runGeneration() {
    const s = studioState;
    const hub = D.hubs.find((h) => h.id === s.customer);
    const tier = D.studio.tiers.find((t) => t.id === s.tier);
    const panel = $("#gen-panel");
    const steps = s.tier === "signature"
      ? ["Reading hub data & price list…", "Choosing the narrative for " + hub.contact + "…", "Composing layout & typography…", "Building live charts from your numbers…", "Adding ambient motion…", "Polishing — final render…"]
      : ["Reading hub data & price list…", "Filling your brand template…", "Rendering deck…"];
    panel.innerHTML = `<div class="gen-orb"></div><div class="gen-status" id="gen-status"></div><div class="gen-log" id="gen-log"></div>`;
    let i = 0;
    const stepT = s.tier === "signature" ? 850 : 700;
    const tick = () => {
      if (i < steps.length) {
        $("#gen-status").textContent = steps[i];
        $("#gen-log").textContent = "minra compose · " + tier.name.toLowerCase() + " · step " + (i + 1) + "/" + steps.length;
        i++; setTimeout(tick, stepT);
      } else {
        const url = s.tier === "signature" ? "presentations/mueller-signature.html" : "presentations/mueller-essential.html";
        const note = s.customer === "mueller" ? "" :
          `<p class="axis-note" style="margin-top:10px">Demo workspace: sample output shown for Müller Fördertechnik.</p>`;
        panel.innerHTML = `
          <div class="deck-result">
            <div class="deck-thumb ${s.tier === "essential" ? "light" : ""}">${esc(tier.name)}</div>
            <div style="flex:1">
              <b style="font-size:15px">${esc(hub.company)} — ${esc(D.studio.objectives.find((o) => o.id === s.objective).name)}</b>
              <span class="src" style="display:block">Generated just now · ${esc(tier.price)} · HTML</span>
              <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                <a class="btn primary sm" href="${url}" target="_blank" rel="noopener">Open deck ↗</a>
                <button class="btn ghost sm" data-act="share-deck">Share to hub</button>
                <button class="btn ghost sm" id="gen-again">Generate another</button>
              </div>${note}
            </div>
          </div>`;
        $("#gen-again").addEventListener("click", () => { render(); });
      }
    };
    tick();
  }

  /* ---------- flow ---------- */
  let flowFilter = "All";
  function vFlow() {
    const terrs = ["All", ...D.tenant.territories];
    const items = D.news.filter((n) => flowFilter === "All" || n.territory === flowFilter);
    return `
    ${helpNote("flow")}
    <div class="section-head"><h2>Market flow</h2><span class="sub">news scoped to where you sell</span></div>
    <div class="chips" style="margin-bottom:18px">
      ${terrs.map((t) => `<button class="chip ${flowFilter === t ? "on" : ""}" data-terr="${esc(t)}">${esc(t)}</button>`).join("")}
    </div>
    <div class="grid cols-2">${items.map((n, i) => newsCard(n, i)).join("") || `<div class="empty">Nothing new here.</div>`}</div>`;
  }

  /* ---------- travel ---------- */
  function vTravel() {
    return `
    ${helpNote("travel")}
    <div class="section-head"><h2>Travel planner</h2><span class="sub">one trip, maximum coverage</span></div>
    ${D.travel.suggestions.map((t, i) => `
    <div class="card rise rise-${i + 1}" style="margin-bottom:18px">
      <div class="trip-head">
        <div class="trip-score" style="background:conic-gradient(var(--s2) ${t.score * 3.6}deg, var(--card-2) 0deg)">
          <span style="background:var(--card);border-radius:50%;width:48px;height:48px;display:grid;place-items:center">${t.score}</span>
        </div>
        <div style="flex:1"><h3 style="font-size:19px">${esc(t.destination)}</h3>
          <span class="sub">Recommended window: <b style="color:var(--ink)">${esc(t.window)}</b></span></div>
        <button class="btn primary sm" data-act="plan-trip" data-dest="${esc(t.destination)}">Plan this trip</button>
      </div>
      ${dayStrip(t.days)}
      <div class="grid cols-2" style="margin-top:16px">
        <div><b style="font-size:13.5px">Why this window</b>${t.reasons.map((r) => `<div class="reason">${esc(r)}</div>`).join("")}</div>
        <div><b style="font-size:13.5px">Suggested meetings</b>
          ${t.meetings.map((m) => `<div class="reason"><span><b>${esc(m.slot)}</b> — ${esc(m.who)}<br><span class="src">${esc(m.note)}</span></span></div>`).join("")}
        </div>
      </div>
    </div>`).join("")}`;
  }

  /* ---------- pricing ---------- */
  let priceFilter = "all";
  function vPricing() {
    const rows = D.competitors.filter((c) => priceFilter === "all" || c.kind === priceFilter);
    const our = { "NC-LI4880": 11900, "NC-CHG30": 6400, "NC-BMS-FLEET": 240 };
    return `
    ${helpNote("pricing")}
    <div class="section-head"><h2>Competitor pricing</h2><span class="sub">what the market actually pays</span><span class="grow"></span>
      <div class="chips">
        <button class="chip ${priceFilter === "all" ? "on" : ""}" data-pf="all">All</button>
        <button class="chip ${priceFilter === "verified" ? "on" : ""}" data-pf="verified">Verified only</button>
        <button class="chip ${priceFilter === "estimated" ? "on" : ""}" data-pf="estimated">Estimated OEM</button>
      </div></div>
    <div class="table-wrap"><table class="data">
      <thead><tr><th>Competitor</th><th>Product</th><th>Comparable to</th><th class="num">Price</th><th>Confidence</th><th>Source</th></tr></thead>
      <tbody>${rows.map((c) => {
        const ours = our[c.comparableTo];
        const diff = ours ? Math.round((c.price - ours) / ours * 100) : null;
        return `<tr>
        <td><b>${esc(c.vendor)}</b></td><td>${esc(c.product)}</td>
        <td><span style="font-family:var(--mono);font-size:12px">${esc(c.comparableTo)}</span>${diff != null ? `<span class="src" style="display:block">${diff >= 0 ? "+" : ""}${diff}% vs our list</span>` : ""}</td>
        <td class="num"><b>${fmtEUR(c.price)}</b></td>
        <td>${c.kind === "verified"
          ? `<span class="badge verified">✓ Verified</span>`
          : `<span class="badge estimated">≈ Estimated OEM</span>`}</td>
        <td class="src">${esc(c.source)}<br>checked ${esc(c.checked)}</td></tr>`;
      }).join("")}</tbody></table></div>
    <p class="axis-note" style="margin-top:10px">Verified = seen in a real document (tender, price list, shared quote). Estimated OEM = modeled price where no document exists — treat as a hypothesis.</p>`;
  }

  /* ---------- people ---------- */
  function vPeople() {
    const byCountry = {};
    D.people.forEach((p) => { (byCountry[p.country] = byCountry[p.country] || []).push(p); });
    return `
    ${helpNote("people")}
    <div class="section-head"><h2>Key persons</h2><span class="sub">who decides, who influences, where to meet them</span></div>
    ${Object.entries(byCountry).map(([country, people]) => `
      <div class="section-head" style="margin-top:22px"><h2 style="font-size:16px">${people[0].flag} ${esc(country)}</h2></div>
      <div class="grid cols-3">
        ${people.map((p, i) => `
        <div class="card person hover rise rise-${(i % 4) + 1}">
          <div class="person-top">
            <div class="avatar">${esc(p.name.split(" ").map((w) => w[0]).join("").slice(0, 2))}</div>
            <div><h3>${esc(p.name)}</h3><span class="sub">${esc(p.role)} · ${esc(p.org)}</span></div>
          </div>
          <p class="note">${esc(p.note)}</p>
          <span class="meet">Meet: ${esc(p.meet)}</span>
        </div>`).join("")}
      </div>`).join("")}`;
  }

  /* ---------- router ---------- */
  const ROUTES = {
    dashboard: { title: "Dashboard", fn: vDashboard },
    hubs: { title: "Customer hubs", fn: vHubs },
    studio: { title: "Presentation studio", fn: vStudio },
    flow: { title: "Market flow", fn: vFlow },
    travel: { title: "Travel planner", fn: vTravel },
    pricing: { title: "Competitor pricing", fn: vPricing },
    people: { title: "Key persons", fn: vPeople }
  };

  function render() {
    const hash = location.hash || "#/dashboard";
    const parts = hash.replace(/^#\//, "").split("/");
    let html, crumb, navActive;
    if (parts[0] === "hub" && parts[1]) {
      html = vHub(parts[1], parts[2]);
      const h = D.hubs.find((x) => x.id === parts[1]);
      crumb = `<a href="#/hubs" style="color:var(--ink-3);text-decoration:none">Customer hubs</a> / <b>${esc(h ? h.company : "Hub")}</b>`;
      navActive = "#/hubs";
    } else {
      const r = ROUTES[parts[0]] || ROUTES.dashboard;
      html = r.fn();
      crumb = `<b>${r.title}</b>`;
      navActive = "#/" + (ROUTES[parts[0]] ? parts[0] : "dashboard");
    }
    view.innerHTML = `<div class="view">${html}</div>`;
    $("#crumb").innerHTML = crumb;
    renderNav(navActive);
    $("#sidebar").classList.remove("open");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  /* ---------- events ---------- */
  document.addEventListener("click", (e) => {
    const hn = e.target.closest("[data-hn-close]");
    if (hn) { localStorage.setItem("minra.hn." + hn.dataset.hnClose, "off"); hn.closest(".help-note").remove(); return; }

    const pick = e.target.closest("[data-pick]");
    if (pick) { studioState[pick.dataset.pick] = pick.dataset.val; render(); return; }

    const terr = e.target.closest("[data-terr]");
    if (terr) { flowFilter = terr.dataset.terr; render(); return; }

    const pf = e.target.closest("[data-pf]");
    if (pf) { priceFilter = pf.dataset.pf; render(); return; }

    if (e.target.closest("#gen-btn")) { runGeneration(); return; }

    const act = e.target.closest("[data-act]");
    if (act) {
      const a = act.dataset.act;
      if (a === "invite") toast("Invitation link copied — send it to your customer's team.");
      else if (a === "new-hub") toast("Demo workspace: hub creation is disabled.");
      else if (a === "share-deck") toast("Deck shared to the hub — the customer team was notified.");
      else if (a === "plan-trip") toast("Trip added to your calendar: " + act.dataset.dest);
      else toast("This is a demo action.");
      return;
    }
  });

  $("#help-toggle").addEventListener("click", () => {
    Object.keys(HELP).forEach((k) => localStorage.removeItem("minra.hn." + k));
    render();
    toast("Help notes restored on every page.");
  });
  $("#menu-btn").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

  /* ---------- login ---------- */
  const login = $("#login");
  function enter() {
    sessionStorage.setItem("minra.auth", "1");
    login.classList.add("gone");
  }
  $("#login-btn").addEventListener("click", enter);
  login.addEventListener("keydown", (e) => { if (e.key === "Enter") enter(); });
  if (sessionStorage.getItem("minra.auth")) login.classList.add("gone");

  /* ---------- boot ---------- */
  const u = D.tenant.user;
  $("#user-avatar").textContent = u.initials;
  $("#user-name").textContent = u.name;
  $("#user-role").textContent = u.role;
  window.addEventListener("hashchange", render);
  render();
})();
