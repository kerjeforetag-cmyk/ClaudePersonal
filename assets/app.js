/* ============================================================
   Mimra — application
   Hash-routed SPA. No dependencies, no build step.
   ============================================================ */

(function () {
  "use strict";
  const D = window.MIMRA;
  const $ = (sel, el) => (el || document).querySelector(sel);
  const view = $("#view");

  /* ---------- utils ---------- */
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fmtEUR = (n) => "€" + Number(n).toLocaleString("en-US");
  const fmtM = (n) => "€" + (n / 1e6).toFixed(2) + "M";
  const deltaHTML = (v, suffix) =>
    `<span class="delta ${v >= 0 ? "up" : "down"}">${v >= 0 ? "▲" : "▼"} ${Math.abs(v)}${suffix || "%"} <span style="color:var(--ink-3);font-weight:500">vs last quarter</span></span>`;

  // storage can throw in sandboxed embeds — fall back to in-memory
  const store = {
    _m: {},
    get(k) { try { return localStorage.getItem(k); } catch (e) { return this._m[k] || null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { this._m[k] = v; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { delete this._m[k]; } }
  };
  const session = {
    _m: {},
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return this._m[k] || null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { this._m[k] = v; } },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) { delete this._m[k]; } }
  };

  // one-time migration: the product was briefly named "minra" — carry saved data over
  try {
    [localStorage, sessionStorage].forEach((st) => {
      Object.keys(st).filter((k) => k.indexOf("minra.") === 0).forEach((k) => {
        const nk = "mimra." + k.slice(6);
        if (st.getItem(nk) === null) st.setItem(nk, st.getItem(k));
        st.removeItem(k);
      });
    });
  } catch (e) { /* sandboxed */ }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- persistence: full working dataset ---------- */
  (() => {
    // migrate pre-v4 custom hubs, then load the working dataset if one exists
    try {
      const legacy = JSON.parse(store.get("mimra.hubs.custom") || "[]");
      legacy.forEach((h) => { if (!D.hubs.some((x) => x.id === h.id)) D.hubs.push(h); });
    } catch (e) { /* ignore */ }
    try {
      const saved = JSON.parse(store.get("mimra.data.v1") || "null");
      if (saved) {
        ["hubs", "people", "competitors"].forEach((k) => { if (Array.isArray(saved[k])) D[k] = saved[k]; });
        if (Array.isArray(saved.members)) D.tenant.members = saved.members;
      }
    } catch (e) { /* ignore */ }
    normalizeHubs();
  })();
  // guarantee every hub carries the arrays the UI iterates, so partial/edited
  // imports can never throw at boot and strand the user on a dead login screen
  function normalizeHubs() {
    if (!Array.isArray(D.hubs)) { D.hubs = []; return; }
    D.hubs = D.hubs.filter((h) => h && typeof h === "object" && h.id).map((h) => {
      ["priceList", "docs", "proposals", "presentations", "timeline"].forEach((k) => {
        if (!Array.isArray(h[k])) h[k] = [];
      });
      if (!Array.isArray(h.activity30d) || h.activity30d.length < 2) h.activity30d = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      if (typeof h.company !== "string") h.company = "Untitled hub";
      if (typeof h.flag !== "string") h.flag = "🏳️";
      if (typeof h.value !== "number") h.value = 0;
      return h;
    });
    if (!Array.isArray(D.people)) D.people = [];
    if (!Array.isArray(D.competitors)) D.competitors = [];
  }
  function persist() {
    store.set("mimra.data.v1", JSON.stringify({ hubs: D.hubs, people: D.people, competitors: D.competitors, members: D.tenant.members }));
  }

  // each accent carries light + dark variants; CSS resolves via --acc-* indirection
  const ACCENTS = {
    terracotta: { accent: "#c96442", strong: "#b4552f", softL: "#f4e3da", softD: "#3a2419", inkL: "#7c3a1e", inkD: "#e8a284" },
    forest: { accent: "#4a7c59", strong: "#3b6647", softL: "#e0eee4", softD: "#1f2e23", inkL: "#2d5238", inkD: "#a8cbb0" },
    indigo: { accent: "#4a5ec4", strong: "#3b4cae", softL: "#e3e6f7", softD: "#232849", inkL: "#2e3a80", inkD: "#aab6ef" },
    plum: { accent: "#8a4a7c", strong: "#713a65", softL: "#f0e0ec", softD: "#33202f", inkL: "#5a2d50", inkD: "#d8a8cc" }
  };
  function applyAccent(key) {
    const a = ACCENTS[key] || ACCENTS.terracotta;
    const r = document.documentElement.style;
    r.setProperty("--acc", a.accent); r.setProperty("--acc-strong", a.strong);
    r.setProperty("--acc-soft-l", a.softL); r.setProperty("--acc-soft-d", a.softD);
    r.setProperty("--acc-ink-l", a.inkL); r.setProperty("--acc-ink-d", a.inkD);
    store.set("mimra.accent", key);
  }
  applyAccent(store.get("mimra.accent") || "terracotta");

  /* ---------- theme (system / light / dark) ---------- */
  function isDark() {
    const t = document.documentElement.dataset.theme;
    if (t) return t === "dark";
    try { return matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) { return false; }
  }
  function applyTheme(pref) {
    if (pref === "light" || pref === "dark") {
      document.documentElement.dataset.theme = pref;
      store.set("mimra.theme", pref);
    } else {
      delete document.documentElement.dataset.theme;
      store.del("mimra.theme");
    }
    const tb = $("#theme-btn");
    if (tb) {
      tb.textContent = isDark() ? "☀️" : "🌙";
      tb.title = isDark() ? "Switch to light" : "Switch to dark";
      tb.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");
      tb.setAttribute("aria-pressed", String(isDark()));
    }
  }
  applyTheme(store.get("mimra.theme") || "");
  try {
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (!document.documentElement.dataset.theme) { applyTheme(""); render(); }
    });
  } catch (e) { /* older engines */ }

  // ?customer=<hubId> turns this session into the shared customer view of one hub
  const lockedCustomer = (() => {
    try { return new URLSearchParams(location.search).get("customer"); } catch (e) { return null; }
  })();

  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  function downloadFile(name, content, type) {
    try {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([content], { type }));
      a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      return true;
    } catch (e) { toast("Downloads are blocked in this embedded preview — use the repo version."); return false; }
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
    if (!Array.isArray(points) || points.length < 2 || points.some((v) => typeof v !== "number" || !isFinite(v))) {
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="no trend yet"><line x1="4" y1="${h - 4}" x2="${w - 4}" y2="${h - 4}" stroke="var(--spark)" stroke-width="2" stroke-linecap="round"/></svg>`;
    }
    const line = opts.line || "var(--spark)";
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
  // ordinal ramps: sequential blue, 5 validated steps per theme (validator: light & dark surfaces)
  const seqRampLight = ["#86b6ef", "#3987e5", "#256abf", "#184f95", "#0d366b"];
  const seqRampDark = ["#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95"];
  const seqFor = (score) => (isDark() ? seqRampDark : seqRampLight)[Math.min(4, Math.floor(score / 100 * 4.99))];
  function dayStrip(days) {
    const best = Math.max(...days.map((d) => d.s));
    return `<div class="day-strip">` + days.map((d) => `
      <div class="day-cell ${d.s >= best - 6 ? "best" : ""}" data-tip="${esc(d.d)} — score ${d.s}/100">
        <div class="bar-slot"><div class="bar" style="height:${Math.max(8, d.s * 0.64)}px;background:${seqFor(d.s)}"></div></div>
        <div class="d">${esc(d.d.replace(/^\w+ /, ""))}</div>
      </div>`).join("") + `</div>
      <div class="axis-note">Day score 0–100 — customer availability · events · travel cost · weather. Best days highlighted.</div>`;
  }

  /* ---------- intelligence: deal scores & next best actions ---------- */
  const STAGE_BASE = { "Qualified": 20, "Hub invited": 35, "Proposal sent": 55, "Negotiation": 70, "Verbal commit": 90 };
  function engagementDelta(hub) {
    const a = hub.activity30d || [];
    if (a.length < 6) return 0;
    const recent = a.slice(-3).reduce((x, y) => x + y, 0);
    const prior = a.slice(-6, -3).reduce((x, y) => x + y, 0);
    if (prior === 0) return recent > 0 ? 1 : 0;
    return (recent - prior) / prior;
  }
  function dealScore(hub) {
    let s = STAGE_BASE[hub.stage] || 20;
    const d = engagementDelta(hub);
    s += d > 0.3 ? 8 : d < -0.3 ? -10 : 0;
    if (hub.health === "warning") s -= 12;
    if (hub.health === "critical") s -= 25;
    if ((hub.presentations || []).some((p) => p.views > 5)) s += 5;
    return Math.max(5, Math.min(95, Math.round(s)));
  }
  const daysSince = (iso) => Math.max(0, Math.round((Date.now() - new Date(iso + "T12:00:00").getTime()) / 86400000));
  function computeInsights(onlyHubId) {
    const out = [];
    D.hubs.forEach((h) => {
      if (onlyHubId && h.id !== onlyHubId) return;
      const drop = engagementDelta(h);
      if ((h.health === "warning" || drop < -0.4) && daysSince(h.lastActivity) > 7) {
        const reason = drop < -0.05
          ? "Hub activity fell " + Math.round(Math.abs(drop) * 100) + "% and nobody has touched the hub in " + daysSince(h.lastActivity) + " days."
          : "Engagement has cooled — nobody has touched the hub in " + daysSince(h.lastActivity) + " days.";
        out.push({ pr: 1, hub: h, title: "Re-engage " + h.company, why: reason, label: "Open hub", hash: "#/hub/" + h.id });
      }
      (h.proposals || []).forEach((p) => {
        if (p.status === "Awaiting customer" && daysSince(p.sent) >= 5) {
          const viewed = (h.presentations || []).find((x) => x.views > 0);
          out.push({ pr: 1, hub: h, title: "Follow up: " + p.name, why: "Sent " + daysSince(p.sent) + " days ago, no answer yet." + (viewed ? " " + h.contact + " viewed the deck recently — it's warm." : ""), label: "Open proposals", hash: "#/hub/" + h.id + "/proposals" });
        }
      });
      if (h.stage === "Verbal commit") {
        out.push({ pr: 2, hub: h, title: "Close " + h.company, why: "Verbal commit on the table — send the final agreement while the momentum holds.", label: "Open hub", hash: "#/hub/" + h.id + "/proposals" });
      }
      if (!(h.priceList || []).length && h.stage !== "Qualified") {
        out.push({ pr: 3, hub: h, title: "Publish prices for " + h.company, why: "The hub is live but has no customer price list — buyers can't move without numbers.", label: "Price list", hash: "#/hub/" + h.id + "/prices" });
      }
      const news = D.news.find((n) => n.relatedHub === h.id);
      if (news && !onlyHubId) {
        out.push({ pr: 2, hub: h, title: "News affects " + h.company, why: news.title + ".", label: "Read it", hash: "#/flow" });
      }
      const statDeck = (h.presentations || []).find((p) => p.slideStats && p.views > 3);
      if (statDeck) {
        const total = statDeck.slideStats.reduce((a, s) => a + s[1], 0);
        const top = statDeck.slideStats.reduce((a, b) => (b[1] > a[1] ? b : a));
        const pct = Math.round(top[1] / total * 100);
        if (pct >= 25) out.push({ pr: 2, hub: h, title: "“" + top[0] + "” is the tell at " + h.company, why: h.contact + "'s team spends " + pct + "% of deck time on “" + top[0] + "” — open that conversation, not another feature demo.", label: "See engagement", hash: "#/hub/" + h.id + "/decks" });
      }
    });
    if (!onlyHubId) {
      const ourList = { "NC-LI4880": 11900, "NC-CHG30": 6400, "NC-BMS-FLEET": 240 };
      D.competitors.forEach((c) => {
        const ours = ourList[c.comparableTo];
        if (ours && c.price < ours) {
          out.push({ pr: 3, hub: null, title: "Price pressure on " + c.comparableTo, why: c.vendor + " " + (c.kind === "verified" ? "(verified)" : "(est. OEM)") + " sits " + Math.round((ours - c.price) / ours * 100) + "% under your list — have the value story ready.", label: "Pricing intel", hash: "#/pricing" });
        }
      });
      const trip = D.travel.suggestions[0];
      if (trip) out.push({ pr: 3, hub: null, title: "Lock the " + trip.destination.split(",")[0] + " window", why: trip.reasons[0] + ".", label: "Travel planner", hash: "#/travel" });
    }
    out.sort((a, b) => a.pr - b.pr);
    const seen = new Set();
    return out.filter((i) => { const k = i.title; if (seen.has(k)) return false; seen.add(k); return true; });
  }
  const scoreBadge = (s) =>
    `<span class="badge ${s >= 65 ? "good" : s >= 40 ? "neutral" : "warn"}" data-tip="Win likelihood — stage, engagement trend and hub health">${s}% likely</span>`;

  /* ---------- help notes ---------- */
  const HELP = {
    dashboard: ["Your day, already sorted", "Mimra pulls your pipeline, hub activity, market news and travel into one morning view — so you start with the three things that move revenue, not with admin."],
    hubs: ["What is a hub?", "A hub is a private space you share with one customer: their prices, technical documents, proposals and generated presentations. You invite the buying team — everyone sees the same, always-current facts."],
    hub: ["What your customer sees", "Everything in this hub is visible to the invited customer team, except tabs marked internal. Prices here override list prices. Every view and download is tracked in Activity."],
    studio: ["Two ways to generate", "Essential decks are template-based and included in your plan — fast and on-brand. Signature decks are code-generated: layout, charts and narrative composed specifically for this customer. Both are HTML — they open anywhere, animate smoothly and print clean."],
    flow: ["News that follows your territories", "Market Flow watches the regions you sell in and surfaces only what affects your accounts: regulation, tenders, fairs and market moves. Tap a territory to focus."],
    travel: ["Why these days?", "Mimra scores every day by customer availability, trade fairs and tenders nearby, flight-price index and weather — then recommends the window where one trip does the most work."],
    pricing: ["Verified vs estimated", "A Verified price was actually seen — a tender award, a distributor list, a quote a customer shared. An Estimated OEM price is our model of what the competitor charges OEMs when no document exists. Never mix them up in a negotiation."],
    people: ["Know who matters before you land", "The people who decide, influence or block your deals — per country, with how they work and where to meet them. Add your own notes after every meeting."],
    settings: ["Make it yours", "Branding flows into every hub and generated deck. The plan is simple on purpose: one monthly price, Essential decks included, Signature decks pay-as-you-go — no seats, no tiers."],
    proposals: ["One pipeline, many hubs", "Every offer from every hub in one table — open value, accepted value, and where each deal stands. Create proposals here or inside a hub; both land in the same place."],
    forecast: ["Revenue you can plan around", "Every open deal lands in its expected close month, weighted by win likelihood. Best case is everything; expected is what the math says; commit is only deals above 70% likely."]
  };
  function helpNote(key) {
    if (store.get("mimra.hn." + key) === "off") return "";
    const [t, b] = HELP[key];
    return `<div class="help-note" data-hn="${key}">
      <div class="hn-ico">?</div>
      <div><b>${esc(t)}</b><p>${esc(b)}</p></div>
      <button class="hn-close" data-hn-close="${key}" aria-label="Dismiss">×</button>
    </div>`;
  }

  /* ---------- global search ---------- */
  const searchIndex = [];
  function buildSearchIndex() {
    searchIndex.length = 0;
    D.hubs.forEach((h) => {
      searchIndex.push({ t: "Hub", label: h.company, sub: h.industry + " · " + h.country, hash: "#/hub/" + h.id });
      h.priceList.forEach((p) => searchIndex.push({ t: "Price", label: p.sku + " — " + p.name, sub: h.company + " · " + fmtEUR(p.hub), hash: "#/hub/" + h.id + "/prices" }));
      h.docs.forEach((d) => searchIndex.push({ t: "Doc", label: d.name, sub: h.company, hash: "#/hub/" + h.id + "/docs" }));
    });
    D.people.forEach((p) => searchIndex.push({ t: "Person", label: p.name, sub: p.role + " · " + p.org, hash: "#/people" }));
    D.news.forEach((n) => searchIndex.push({ t: "News", label: n.title, sub: n.territory + " · " + n.source, hash: "#/flow" }));
    D.competitors.forEach((c) => searchIndex.push({ t: "Competitor", label: c.vendor + " — " + c.product, sub: (c.kind === "verified" ? "Verified · " : "Est. OEM · ") + fmtEUR(c.price), hash: "#/pricing" }));
  }
  buildSearchIndex();

  const sInput = $("#global-search"), sBox = $("#search-results");
  function goTo(hash) {
    sBox.hidden = true; sInput.value = "";
    const np = $("#notif-panel"); if (np) np.hidden = true;
    if (location.hash === hash) render(); else location.hash = hash;
  }
  function doSearch() {
    const q = sInput.value.trim().toLowerCase();
    if (q.length < 2) { sBox.hidden = true; return; }
    const hits = searchIndex.filter((e) => (e.label + " " + e.sub).toLowerCase().includes(q)).slice(0, 8);
    sBox.innerHTML = hits.length
      ? hits.map((h) => `<button class="sr-item" data-go="${esc(h.hash)}">
          <span class="badge neutral">${h.t}</span>
          <span><b>${esc(h.label)}</b><span class="sr-sub">${esc(h.sub)}</span></span></button>`).join("")
      : `<div class="sr-empty">No matches for “${esc(q)}”.</div>`;
    sBox.hidden = false;
  }
  let selIdx = -1;
  sInput.addEventListener("input", () => { selIdx = -1; doSearch(); });
  sInput.addEventListener("keydown", (e) => {
    const items = [...sBox.querySelectorAll("[data-go]")];
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && items.length) {
      e.preventDefault();
      selIdx = (selIdx + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items.forEach((el, i) => el.classList.toggle("sel", i === selIdx));
      return;
    }
    if (e.key === "Escape") { sBox.hidden = true; sInput.blur(); }
    if (e.key === "Enter") { const f = items[selIdx] || items[0]; if (f) goTo(f.dataset.go); }
  });
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-go]");
    if (g) { goTo(g.dataset.go); return; }
    if (!e.target.closest("#search-box")) sBox.hidden = true;
  });

  /* ---------- notifications ---------- */
  const notifBtn = $("#notif-btn"), notifPanel = $("#notif-panel"), notifDot = $("#notif-dot");
  function notifItems() {
    const items = [];
    D.hubs.forEach((h) => (h.timeline || []).forEach((t) => items.push({ when: t.when, who: t.who, what: t.what, hub: h })));
    items.sort((a, b) => b.when.localeCompare(a.when));
    return items.slice(0, 8);
  }
  function refreshNotifDot() {
    const seen = store.get("mimra.notif.seen") || "";
    notifDot.hidden = !notifItems().some((i) => i.when > seen);
  }
  notifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!notifPanel.hidden) { notifPanel.hidden = true; return; }
    const items = notifItems();
    notifPanel.innerHTML = `<div class="notif-head">Activity across your hubs</div>` +
      (items.map((i) => `<button class="notif-item" data-go="#/hub/${i.hub.id}/activity">
        <b>${esc(i.who)}</b> — ${esc(i.what)}<span class="src">${esc(i.hub.company)} · ${esc(i.when)}</span></button>`).join("") ||
        `<div class="sr-empty">No activity yet.</div>`);
    notifPanel.hidden = false;
    if (items[0]) store.set("mimra.notif.seen", items[0].when);
    refreshNotifDot();
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#notif-panel") && !e.target.closest("#notif-btn")) notifPanel.hidden = true;
  });
  refreshNotifDot();

  /* ---------- modal ---------- */
  const modalWrap = $("#modal-wrap"), modalEl = $("#modal");
  function openModal(html) { modalEl.innerHTML = html; modalWrap.hidden = false; }
  function closeModal() { modalWrap.hidden = true; modalEl.innerHTML = ""; }
  modalWrap.addEventListener("click", (e) => { if (e.target === modalWrap) closeModal(); });

  const FLAGS = { Germany: "🇩🇪", Sweden: "🇸🇪", Norway: "🇳🇴", Denmark: "🇩🇰", Finland: "🇫🇮", Estonia: "🇪🇪", Poland: "🇵🇱", Netherlands: "🇳🇱", Austria: "🇦🇹", Switzerland: "🇨🇭" };
  function newHubModal() {
    openModal(`
      <h3>New customer hub</h3><p class="sub">A private space you'll share with this customer's team.</p>
      <div class="field"><label>Company</label><input id="nh-company" placeholder="e.g. Bergmann Intralogistik GmbH" /></div>
      <div class="field"><label>Country</label><select id="nh-country">${Object.keys(FLAGS).map((c) => `<option>${c}</option>`).join("")}</select></div>
      <div class="field"><label>Industry</label><input id="nh-industry" placeholder="e.g. Cold-chain warehousing" /></div>
      <div class="field"><label>Primary contact</label><input id="nh-contact" placeholder="Name" /></div>
      <div class="field"><label>Contact role</label><input id="nh-role" placeholder="e.g. Head of Procurement" /></div>
      <div class="field"><label>Estimated deal value (€)</label><input id="nh-value" type="number" placeholder="250000" /></div>
      <div class="modal-actions">
        <button class="btn ghost sm" data-act="modal-close">Cancel</button>
        <button class="btn primary sm" data-act="create-hub">Create hub</button>
      </div>`);
    $("#nh-company").focus();
  }
  function createHub() {
    const val = (id) => $("#" + id).value.trim();
    const company = val("nh-company");
    if (!company) { toast("Give the hub a company name."); return; }
    const country = $("#nh-country").value;
    let id = slug(company).slice(0, 24) || "hub";
    while (D.hubs.some((x) => x.id === id)) id += "-2";
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const hub = {
      id, company, country, flag: FLAGS[country] || "🏳️",
      industry: val("nh-industry") || "B2B industry",
      contact: val("nh-contact") || "—", contactRole: val("nh-role") || "",
      stage: "Qualified", value: Number(val("nh-value")) || 0, health: "good",
      expectedClose: (() => { const ec = new Date(); ec.setMonth(ec.getMonth() + 3); return ec.getFullYear() + "-" + String(ec.getMonth() + 1).padStart(2, "0"); })(),
      lastActivity: today, members: 1,
      activity30d: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      about: (val("nh-industry") || "New customer") + " — hub created " + today + ". Publish a price list and invite the customer team to get started.",
      priceList: [], docs: [], proposals: [], presentations: [],
      timeline: [{ when: today + " " + now.toTimeString().slice(0, 5), who: D.tenant.user.name, what: "Created this hub" }]
    };
    D.hubs.push(hub); persist(); buildSearchIndex(); refreshNotifDot();
    closeModal(); toast("Hub created — invite the customer when you're ready.");
    location.hash = "#/hub/" + id;
  }

  /* ---------- generic form modal ---------- */
  const today = () => new Date().toISOString().slice(0, 10);
  const nowStamp = () => today() + " " + new Date().toTimeString().slice(0, 5);
  function formModal(title, sub, fields, saveAct, saveLabel) {
    openModal(`
      <h3>${esc(title)}</h3><p class="sub">${esc(sub)}</p>
      ${fields.map((f) => `<div class="field"><label>${esc(f.label)}</label>${
        f.type === "select"
          ? `<select id="${f.id}">${f.options.map((o) => `<option ${o === f.value ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`
          : `<input id="${f.id}" type="${f.type || "text"}" value="${esc(f.value || "")}" placeholder="${esc(f.placeholder || "")}" />`
      }</div>`).join("")}
      <div class="modal-actions">
        <button class="btn ghost sm" data-act="modal-close">Cancel</button>
        <button class="btn primary sm" data-act="${saveAct}">${esc(saveLabel || "Save")}</button>
      </div>`);
    const first = modalEl.querySelector("input, select");
    if (first) first.focus();
  }
  const fval = (id) => { const el = $("#" + id); return el ? el.value.trim() : ""; };
  const hubFromRoute = () => {
    const parts = (location.hash || "").replace(/^#\//, "").split("/");
    return parts[0] === "hub" ? D.hubs.find((x) => x.id === parts[1]) : null;
  };
  let editIndex = -1;

  const FORMS = {
    price: (p) => formModal(p ? "Edit product" : "Add product", "Customer-specific pricing for this hub.", [
      { id: "f-sku", label: "SKU", value: p && p.sku, placeholder: "NC-XXXX" },
      { id: "f-name", label: "Product name", value: p && p.name },
      { id: "f-list", label: "List price (€)", type: "number", value: p && p.list },
      { id: "f-hub", label: "Hub price (€)", type: "number", value: p && p.hub },
      { id: "f-moq", label: "MOQ", type: "number", value: p && p.moq }
    ], "save-price", p ? "Save changes" : "Add product"),
    doc: () => formModal("Share document", "Visible to everyone in this hub.", [
      { id: "f-name", label: "Document name", placeholder: "e.g. Technical datasheet" },
      { id: "f-type", label: "Type", type: "select", options: ["PDF", "DOCX", "XLSX", "ZIP", "HTML"] },
      { id: "f-size", label: "Size", placeholder: "e.g. 1.2 MB", value: "—" }
    ], "save-doc", "Share document"),
    proposal: (withHub) => formModal("New proposal", "Tracked in the hub and in Proposals.", [
      ...(withHub ? [{ id: "f-hub-id", label: "Customer hub", type: "select", options: D.hubs.map((h) => h.company) }] : []),
      { id: "f-name", label: "Proposal name", placeholder: "e.g. Phase 2 — full fleet" },
      { id: "f-value", label: "Value (€)", type: "number" },
      { id: "f-status", label: "Status", type: "select", options: ["Draft", "Awaiting customer", "In negotiation", "Accepted", "Declined"] }
    ], "save-proposal", "Create proposal"),
    note: () => formModal("Log activity", "Added to this hub's shared timeline.", [
      { id: "f-what", label: "What happened?", placeholder: "e.g. Call with Jürgen — asked for updated lead times" }
    ], "save-note", "Log it"),
    person: () => formModal("Add key person", "Someone who decides, influences or blocks deals.", [
      { id: "f-name", label: "Name" },
      { id: "f-role", label: "Role", placeholder: "e.g. Head of Procurement" },
      { id: "f-org", label: "Organization" },
      { id: "f-country", label: "Country", type: "select", options: Object.keys(FLAGS) },
      { id: "f-note", label: "Notes", placeholder: "How they work, what they care about" },
      { id: "f-meet", label: "Where to meet", placeholder: "e.g. LogiMAT, Stuttgart" }
    ], "save-person", "Add person"),
    member: () => formModal("Invite teammate", "They'll get an email with a join link (demo: added directly).", [
      { id: "f-name", label: "Name" },
      { id: "f-role", label: "Role", placeholder: "e.g. Inside Sales" },
      { id: "f-level", label: "Access level", type: "select", options: ["Editor", "Viewer"] }
    ], "save-member", "Send invite"),
    comp: () => formModal("Add competitor price", "Verified = seen in a real document. Estimated = your model.", [
      { id: "f-vendor", label: "Competitor" },
      { id: "f-product", label: "Product" },
      { id: "f-comp", label: "Comparable to (your SKU)", placeholder: "e.g. NC-LI4880" },
      { id: "f-price", label: "Price (€)", type: "number" },
      { id: "f-kind", label: "Confidence", type: "select", options: ["verified", "estimated"] },
      { id: "f-source", label: "Source", placeholder: "e.g. Public tender award, Hamburg 2026" }
    ], "save-comp", "Add price")
  };

  function saveForms(a) {
    const h = hubFromRoute();
    if (a === "save-price") {
      if (!h) return;
      const row = { sku: fval("f-sku") || "SKU", name: fval("f-name") || "Product", list: +fval("f-list") || 0, hub: +fval("f-hub") || 0, moq: +fval("f-moq") || 1 };
      if (editIndex >= 0) h.priceList[editIndex] = row; else h.priceList.push(row);
      h.timeline.unshift({ when: nowStamp(), who: D.tenant.user.name, what: (editIndex >= 0 ? "Updated" : "Published") + " price: " + row.sku });
    } else if (a === "save-doc") {
      if (!h) return;
      h.docs.push({ name: fval("f-name") || "Document", type: $("#f-type").value, size: fval("f-size") || "—", updated: today() });
      h.timeline.unshift({ when: nowStamp(), who: D.tenant.user.name, what: "Shared document: " + (fval("f-name") || "Document") });
    } else if (a === "save-proposal") {
      const target = $("#f-hub-id") ? D.hubs.find((x) => x.company === $("#f-hub-id").value) : h;
      if (!target) return;
      target.proposals.push({ name: fval("f-name") || "Proposal", value: +fval("f-value") || 0, status: $("#f-status").value, sent: today() });
      target.timeline.unshift({ when: nowStamp(), who: D.tenant.user.name, what: "Created proposal: " + (fval("f-name") || "Proposal") });
    } else if (a === "save-note") {
      if (!h || !fval("f-what")) return;
      h.timeline.unshift({ when: nowStamp(), who: D.tenant.user.name, what: fval("f-what") });
      h.lastActivity = today();
    } else if (a === "save-person") {
      const c = $("#f-country").value;
      D.people.push({ country: c, flag: FLAGS[c] || "🏳️", name: fval("f-name") || "—", role: fval("f-role"), org: fval("f-org"), note: fval("f-note"), meet: fval("f-meet") || "—" });
    } else if (a === "save-member") {
      if (fval("f-name")) D.tenant.members.push({ name: fval("f-name"), role: fval("f-role") || "Teammate", level: $("#f-level").value });
    } else if (a === "save-comp") {
      D.competitors.push({ vendor: fval("f-vendor") || "—", product: fval("f-product") || "—", comparableTo: fval("f-comp") || "—", price: +fval("f-price") || 0, kind: $("#f-kind").value, source: fval("f-source") || "—", checked: today() });
    }
    editIndex = -1;
    persist(); buildSearchIndex(); refreshNotifDot(); closeModal(); render();
    toast("Saved.");
  }

  /* ---------- deck overlay ---------- */
  let lastDeck = null;
  const deckOverlay = $("#deck-overlay"), deckFrame = $("#deck-frame"), deckTitle = $("#deck-title");
  function openDeckOverlay() {
    if (!lastDeck) return;
    deckTitle.textContent = lastDeck.title;
    deckFrame.srcdoc = lastDeck.html;
    deckOverlay.hidden = false;
  }
  $("#deck-close").addEventListener("click", () => { deckOverlay.hidden = true; deckFrame.srcdoc = ""; });
  $("#deck-download").addEventListener("click", () => {
    if (lastDeck && downloadFile(slug(lastDeck.title) + ".html", lastDeck.html, "text/html")) toast("Deck downloaded as HTML.");
  });

  /* ---------- travel calendar export ---------- */
  function downloadICS(trip) {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mimra//Travel//EN"];
    trip.meetings.forEach((m, i) => {
      lines.push("BEGIN:VEVENT", "UID:mimra-" + trip.id + "-" + i + "@mimra.app",
        "DTSTART:" + m.dtStart, "DTEND:" + m.dtEnd,
        "SUMMARY:" + m.who.replace(/,/g, "\\,"),
        "DESCRIPTION:" + m.note.replace(/,/g, "\\,"),
        "LOCATION:" + trip.destination.replace(/,/g, "\\,"), "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return downloadFile(trip.id + "-trip.ics", lines.join("\r\n"), "text/calendar");
  }

  /* ---------- nav ---------- */
  const NAV = [
    { hash: "#/dashboard", name: "Dashboard", ico: "M3 13h7V3H3v10Zm0 8h7v-6H3v6Zm11 0h7V11h-7v10Zm0-18v6h7V3h-7Z" },
    { hash: "#/hubs", name: "Customer hubs", ico: "M12 3 2 9l10 6 10-6-10-6Zm-6 9.5V17l6 3.5 6-3.5v-4.5" },
    { hash: "#/proposals", name: "Proposals", ico: "M6 2h9l5 5v15H6Z M14 2v6h6 M9 13h6 M9 17h4" },
    { hash: "#/forecast", name: "Forecast", ico: "M3 17l6-6 4 4 8-8 M15 7h6v6" },
    { hash: "#/studio", name: "Presentation studio", ico: "M4 4h16v11H4z M8 20l4-3 4 3" },
    { hash: "#/flow", name: "Market flow", ico: "M3 12h4l2-6 4 12 2-6h6" },
    { hash: "#/travel", name: "Travel planner", ico: "M2 16l20-6-8 4-2 6-2-4-8 0Z" },
    { hash: "#/pricing", name: "Competitor pricing", ico: "M12 2v20 M7 7h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8" },
    { hash: "#/people", name: "Key persons", ico: "M16 11a4 4 0 1 0-8 0 M4 21c0-4 4-6 8-6s8 2 8 6" },
    { hash: "#/settings", name: "Settings", ico: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19 12a7 7 0 0 0-.1-1.2l2.1-1.6-2-3.4-2.4 1a7 7 0 0 0-2.1-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2.1 1.2l-2.4-1-2 3.4 2.1 1.6a7 7 0 0 0 0 2.4L3 14.8l2 3.4 2.4-1a7 7 0 0 0 2.1 1.2L10 21h4l.5-2.6a7 7 0 0 0 2.1-1.2l2.4 1 2-3.4-2.1-1.6c.07-.4.1-.8.1-1.2Z" }
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
    const actions = computeInsights().slice(0, 4);
    const weighted = D.hubs.reduce((a, h) => a + (h.value || 0) * dealScore(h) / 100, 0);
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
          <a href="#/forecast" style="font-size:12px;color:#cdc9ba" data-tip="Each deal weighted by its win likelihood — open the forecast">${fmtM(weighted)} weighted · see forecast →</a>
        </div>
      </div>
    </div>

    <div class="section-head" style="margin-top:4px"><h2>Next best actions</h2><span class="sub">what moves revenue today — computed from your hubs, proposals and market</span></div>
    <div class="grid cols-2" style="margin-bottom:22px">
      ${actions.map((a, i) => `
      <div class="card hover rise rise-${(i % 4) + 1}" style="display:flex;gap:14px;align-items:flex-start">
        <div class="num-chip">${i + 1}</div>
        <div style="flex:1"><b style="font-size:14.5px">${esc(a.title)}</b>
          <p class="sub" style="margin:4px 0 10px;font-size:13px;line-height:1.5">${esc(a.why)}</p>
          <a class="btn ghost sm" href="${a.hash}">${esc(a.label)} →</a>
        </div>
      </div>`).join("")}
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
    const rel = n.relatedHub ? D.hubs.find((x) => x.id === n.relatedHub) : null;
    return `<div class="card news-card hover rise rise-${(i % 4) + 1}">
      <div class="news-top"><span class="badge neutral">${esc(n.territory)}</span><span class="badge brand">${esc(n.tag)}</span><span>${esc(n.date)}</span></div>
      <h3>${esc(n.title)}</h3><p>${esc(n.body)}</p>
      <div class="news-top">${esc(n.source)}${rel ? `<span class="grow"></span><a class="badge good" href="#/hub/${rel.id}" style="text-decoration:none" data-tip="This news affects an account of yours">→ ${esc(rel.company.split(" ")[0])} hub</a>` : ""}</div>
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
        <div class="hub-meta">${stageBadge(h.stage)}${healthBadge(h.health)}${scoreBadge(dealScore(h))}</div>
        <div class="hub-meta"><span class="sub">Deal value</span><b style="font-size:15px">${fmtEUR(h.value)}</b></div>
        ${sparkline(h.activity30d, 220, 30)}
        <div class="hub-foot"><span>${h.members} members</span><span class="grow"></span><span>active ${esc(h.lastActivity)}</span></div>
      </a>`).join("")}
    </div>`;
  }

  let custView = false, custViewHub = null;

  function vHub(id, tab) {
    const h = D.hubs.find((x) => x.id === id);
    if (!h) return `<div class="empty">Hub not found.</div>`;
    if (custViewHub !== id) { custView = false; custViewHub = id; }
    if (lockedCustomer === id) custView = true;
    tab = tab || "overview";
    const tabs = [
      ["overview", "Overview"], ["prices", "Price list"], ["docs", "Technical data"],
      ["proposals", "Proposals"], ["decks", "Presentations"], ["activity", "Activity"]
    ];
    let body = "";
    if (tab === "overview") {
      const aboutCard = `<div class="card"><h3>About ${custView ? "this partnership" : "this customer"}</h3><p class="sub" style="margin-top:8px;font-size:13.5px;line-height:1.6">${esc(h.about)}</p></div>`;
      if (custView) {
        const ws = store.get("mimra.wsname") || (D.tenant && D.tenant.name) || "your supplier";
        const plural = (n, u) => n + " " + u + (n === 1 ? "" : "s");
        const index = [
          ["prices", "€", "Your price list", plural(h.priceList.length, "product"), h.priceList.length],
          ["docs", "▤", "Technical documents", plural(h.docs.length, "document"), h.docs.length],
          ["proposals", "✎", "Proposals", plural(h.proposals.length, "proposal"), h.proposals.length],
          ["decks", "▦", "Presentations", plural(h.presentations.length, "presentation"), h.presentations.length],
        ];
        const indexCard = `<div class="card"><h3>What's in your hub</h3>
          <p class="sub" style="margin-top:4px">Shared by ${esc(ws)} — always the current version.</p>
          <div style="margin-top:10px">${index.map(([t, ico, label, count, n]) => `
            <a class="doc-row hub-link" href="#/hub/${h.id}/${t}">
              <div class="doc-ico">${ico}</div>
              <div style="flex:1"><b>${label}</b><span class="src">${n ? count : "Nothing shared yet"}</span></div>
              <span class="hub-link-arrow" aria-hidden="true">→</span></a>`).join("")}</div></div>`;
        const latest = (h.presentations || [])[0];
        const latestCard = latest ? `<div class="card" style="margin-top:16px">
          <div class="deck-result">
            <div class="deck-thumb ${latest.tier === "Essential" ? "light" : ""}">${esc(latest.tier)}</div>
            <div style="flex:1">
              <span class="src" style="display:block;text-transform:uppercase;letter-spacing:.08em;font-size:11px">Latest presentation for you</span>
              <b style="font-size:15px">${esc(latest.name)}</b>
              <span class="src" style="display:block">Shared ${esc(latest.generated)}</span>
              <div style="margin-top:10px">${latest.url
                ? `<a class="btn primary sm" href="${esc(latest.url)}" target="_blank" rel="noopener">Open presentation ↗</a>`
                : `<button class="btn primary sm" data-act="open-saved" data-i="0">Open presentation</button>`}</div>
            </div></div></div>` : "";
        body = `<div class="grid cols-2">${aboutCard}${indexCard}</div>${latestCard}`;
      } else {
        const pulse = `
          <div class="card"><h3>Hub pulse <span class="badge neutral">internal</span></h3><p class="sub">Customer actions, last 30 days</p>
            <div style="margin-top:14px">${sparkline(h.activity30d, 380, 56)}</div>
            <div class="hub-meta" style="margin-top:12px">${healthBadge(h.health)}<span class="sub">${h.members} members · last active ${esc(h.lastActivity)}</span></div>
          </div>`;
        const tips = computeInsights(h.id).slice(0, 2);
        body = `<div class="grid cols-2">${aboutCard}${pulse}</div>
        ${tips.length ? `<div class="card" style="margin-top:16px"><h3>Mimra suggests <span class="badge neutral">internal</span></h3>
          ${tips.map((t) => `<div class="reason" style="margin-top:8px"><span><b>${esc(t.title)}</b> — ${esc(t.why)} <a href="${t.hash}" style="color:var(--accent-ink);font-weight:600">${esc(t.label)} →</a></span></div>`).join("")}
        </div>` : ""}`;
      }
    } else if (tab === "prices") {
      const addBtn = custView ? "" : `<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn ghost sm" data-act="add-price">+ Add product</button></div>`;
      body = h.priceList.length ? `${addBtn}<div class="table-wrap"><table class="data">
        <thead><tr><th>SKU</th><th>Product</th><th class="num">List price</th><th class="num">Your hub price</th><th class="num">MOQ</th><th class="num">Qty</th>${custView ? "" : "<th></th>"}</tr></thead>
        <tbody>${h.priceList.map((p, i) => `<tr>
          <td style="font-family:var(--mono);font-size:12px">${esc(p.sku)}</td><td>${esc(p.name)}</td>
          <td class="num" style="color:var(--ink-3);text-decoration:line-through">${fmtEUR(p.list)}</td>
          <td class="num"><b>${fmtEUR(p.hub)}</b></td><td class="num">${p.moq}</td>
          <td class="num"><input class="qty-in" data-i="${i}" type="number" min="0" placeholder="0" aria-label="Quantity for ${esc(p.sku)}" /></td>
          ${custView ? "" : `<td class="num" style="white-space:nowrap"><button class="icon-btn" data-act="edit-price" data-i="${i}" title="Edit">✎</button><button class="icon-btn" data-act="del-price" data-i="${i}" title="Remove">×</button></td>`}</tr>`).join("")}
        </tbody></table></div>
        <div class="quote-bar" id="quote-bar" hidden>
          <b>Quote: <span id="quote-total">€0</span></b><span style="font-size:12.5px;color:#cdc9ba"><span id="quote-items">0</span> units at hub prices</span>
          <span class="grow"></span>
          <button class="btn primary sm" data-act="quote-proposal">${custView ? "Request as proposal" : "Turn into proposal"}</button>
        </div>
        <p class="axis-note" style="margin-top:10px">Hub prices are customer-specific and visible to invited members only. Valid Q3 2026. Enter quantities to build a quote.</p>`
        : `<div class="card"><div class="empty">No customer-specific price list yet.${custView ? "" : `<br><br><button class="btn primary sm" data-act="add-price">Publish price list</button>`}</div></div>`;
    } else if (tab === "docs") {
      const addBtn = custView ? "" : `<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn ghost sm" data-act="add-doc">+ Share document</button></div>`;
      body = h.docs.length ? `${addBtn}<div class="card">${h.docs.map((d, i) => `
        <div class="doc-row"><div class="doc-ico">${esc(d.type)}</div>
        <div style="flex:1"><b>${esc(d.name)}</b><span class="src">Updated ${esc(d.updated)} · ${esc(d.size)}</span></div>
        ${custView ? `<button class="btn ghost sm" data-act="demo">Download</button>` : `<button class="icon-btn" data-act="del-doc" data-i="${i}" title="Remove">×</button>`}</div>`).join("")}</div>`
        : `<div class="card"><div class="empty">No documents shared yet.${custView ? "" : `<br><br><button class="btn primary sm" data-act="add-doc">+ Share document</button>`}</div></div>`;
    } else if (tab === "proposals") {
      const addBtn = custView ? "" : `<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn ghost sm" data-act="add-proposal">+ New proposal</button></div>`;
      body = h.proposals.length ? `${addBtn}<div class="table-wrap"><table class="data">
        <thead><tr><th>Proposal</th><th class="num">Value</th><th>Status</th><th>Sent</th></tr></thead>
        <tbody>${h.proposals.map((p) => `<tr><td><b>${esc(p.name)}</b></td><td class="num">${fmtEUR(p.value)}</td>
        <td><span class="badge ${p.status === "Accepted" ? "good" : p.status === "Declined" ? "crit" : "warn"}">${esc(p.status)}</span></td><td>${esc(p.sent)}</td></tr>`).join("")}
        </tbody></table></div>`
        : `<div class="card"><div class="empty">No proposals yet.${custView ? "" : `<br><br><button class="btn primary sm" data-act="add-proposal">+ New proposal</button>`}</div></div>`;
    } else if (tab === "decks") {
      const statDeck = custView ? null : h.presentations.find((p) => p.slideStats);
      let engagement = "";
      if (statDeck) {
        const total = statDeck.slideStats.reduce((a, s) => a + s[1], 0);
        const max = Math.max(...statDeck.slideStats.map((s) => s[1]));
        const top = statDeck.slideStats.reduce((a, b) => (b[1] > a[1] ? b : a));
        const fmtS = (s) => s >= 60 ? Math.floor(s / 60) + "m " + (s % 60) + "s" : s + "s";
        engagement = `<div class="card" style="margin-top:16px">
          <h3>Deck engagement <span class="badge neutral">internal</span></h3>
          <p class="sub">${esc(statDeck.name)} — where ${esc(h.contact)}'s team actually spends its time</p>
          <div class="bar-chart" style="margin-top:12px">
            ${statDeck.slideStats.map(([name, secs]) => `
            <div class="bc-row" data-tip="${esc(name)}: ${fmtS(secs)} of ${fmtS(total)} total">
              <div class="bc-label">${esc(name)}</div>
              <div class="bc-track"><div class="bc-fill" style="width:${(secs / max * 100).toFixed(1)}%"></div></div>
              <div class="bc-val">${fmtS(secs)}</div>
            </div>`).join("")}
          </div>
          <div class="axis-note">Viewing time per section, all customer sessions combined.</div>
          <div class="reason" style="margin-top:10px"><span><b>“${esc(top[0])}” holds ${Math.round(top[1] / total * 100)}% of viewing time.</b> That's the conversation your customer wants to have — open with it.</span></div>
        </div>`;
      }
      body = h.presentations.length ? `<div class="grid cols-2">${h.presentations.map((p, i) => `
        <div class="card deck-result hover">
          <div class="deck-thumb ${p.tier === "Essential" ? "light" : ""}">${esc(p.tier)}</div>
          <div style="flex:1"><b style="font-size:14px">${esc(p.name)}</b>
            <span class="src" style="display:block">Generated ${esc(p.generated)} · ${p.views} customer views</span>
            ${p.url
              ? `<a class="btn dark sm" style="margin-top:8px" href="${esc(p.url)}" target="_blank" rel="noopener">Open deck ↗</a>`
              : `<button class="btn dark sm" style="margin-top:8px" data-act="open-saved" data-i="${i}">Open deck</button>`}
          </div></div>`).join("")}</div>${engagement}`
        : `<div class="card"><div class="empty">No presentations yet.<br><br><button class="btn primary sm" data-act="gen-for" data-hub="${h.id}">Generate one →</button></div></div>`;
    } else if (tab === "activity") {
      const addBtn = custView ? "" : `<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn ghost sm" data-act="add-note">+ Log activity</button></div>`;
      body = h.timeline.length ? `${addBtn}<div class="card"><ul class="timeline">${h.timeline.map((t) => `
        <li><span class="t-when">${esc(t.when)}</span><span><b>${esc(t.who)}</b> — ${esc(t.what)}</span></li>`).join("")}</ul></div>`
        : `<div class="card"><div class="empty">No activity yet.${custView ? "" : `<br><br><button class="btn primary sm" data-act="add-note">+ Log activity</button>`}</div></div>`;
    }
    const banner = custView && !lockedCustomer ? `
      <div class="cust-banner"><span class="badge">Customer preview</span>
        <span>This is what ${esc(h.contact)}'s team sees. Deal value, stage and pulse analytics are hidden.</span>
        <span class="grow"></span>
        <button class="btn sm" style="background:#efede4;color:#1a1915" data-act="cust-view">Back to internal view</button>
      </div>` : "";
    const heroRight = custView ? "" : `
        <div style="text-align:right"><div style="font-size:12px;color:#cdc9ba">Deal value</div>
        <div style="font-size:28px;font-weight:650">${fmtEUR(h.value)}</div>
        <div style="font-size:12px;color:#cdc9ba">win likelihood ${dealScore(h)}%</div></div>`;
    const heroActions = custView
      ? `<span class="badge brand">Shared with ${h.members} members</span>`
      : `${stageBadge(h.stage)}
        <button class="btn primary sm" data-act="invite">+ Invite customer</button>
        <button class="btn ghost sm" style="background:transparent;color:#efede4;border-color:#5a574b" data-act="gen-for" data-hub="${h.id}">Generate presentation</button>
        <button class="btn ghost sm" style="background:transparent;color:#efede4;border-color:#5a574b" data-act="cust-view">View as customer</button>`;
    return `
    ${custView ? "" : helpNote("hub")}
    ${banner}
    <div class="hub-hero ambient">
      <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-start">
        <div><h1>${h.flag} ${esc(h.company)}</h1><div class="sub">${custView ? "Partner hub · NordCell Power AB" : [esc(h.industry), [h.contact && esc(h.contact), h.contactRole && esc(h.contactRole)].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</div></div>
        ${heroRight}
      </div>
      <div class="hub-hero-row">${heroActions}</div>
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
      ${D.hubs.map((h) => `
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
        $("#gen-log").textContent = "mimra compose · " + tier.name.toLowerCase() + " · step " + (i + 1) + "/" + steps.length;
        i++; setTimeout(tick, stepT);
      } else {
        const objName = D.studio.objectives.find((o) => o.id === s.objective).name;
        // reference cases: other hubs with proven outcomes
        const references = D.hubs
          .filter((x) => x.id !== hub.id && ((x.proposals || []).some((p) => p.status === "Accepted") || x.stage === "Verbal commit"))
          .slice(0, 3)
          .map((x) => ({ company: x.company, flag: x.flag, line: ((x.about || "").split(". ")[0] || "A reference fleet.").replace(/\.?$/, ".") }));
        // engagement tell: if their team dwells on pricing, lead with it
        let emphasis = null;
        const statDeck = (hub.presentations || []).find((p) => p.slideStats && p.views > 3);
        if (statDeck) {
          const total = statDeck.slideStats.reduce((a, x) => a + x[1], 0);
          const top = statDeck.slideStats.reduce((a, b) => (b[1] > a[1] ? b : a));
          if (/pric|number|commercial/i.test(top[0]) && top[1] / total >= 0.2) emphasis = "pricing";
        }
        const accentKey = store.get("mimra.accent") || "terracotta";
        // people on the customer's side (org matches the hub company)
        const coreName = hub.company.split(" ").slice(0, 2).join(" ").toLowerCase();
        const people = D.people.filter((x) => {
          const org = (x.org || "").toLowerCase();
          return org && (hub.company.toLowerCase().includes(org) || org.includes(coreName.split(" ")[0]));
        });
        const built = window.MimraGen.buildDeck(hub, s.objective, s.tier, {
          accent: (ACCENTS[accentKey] || ACCENTS.terracotta).accent,
          accentInk: (ACCENTS[accentKey] || ACCENTS.terracotta).inkL,
          sender: { name: D.tenant.user.name, email: D.tenant.user.email },
          workspace: store.get("mimra.wsname") || D.tenant.name,
          references, emphasis, people, take: s.take || 1
        });
        lastDeck = {
          html: built.html,
          meta: built.meta,
          title: hub.company + " — " + objName + " · " + tier.name
        };
        const EXAMPLES = {
          mueller: { signature: "presentations/mueller-signature.html", essential: "presentations/mueller-essential.html" },
          kowalski: { signature: "presentations/kowalski-intro-signature.html" }
        };
        const ex = EXAMPLES[s.customer] && EXAMPLES[s.customer][s.tier];
        panel.innerHTML = `
          <div class="deck-result">
            <div class="deck-thumb ${s.tier === "essential" ? "light" : ""}">${esc(tier.name)}</div>
            <div style="flex:1">
              <b style="font-size:15px">${esc(hub.company)} — ${esc(objName)}</b>
              <span class="src" style="display:block">Generated just now from hub data · ${esc(tier.price)} · standalone HTML</span>
              <div class="hub-meta" style="margin-top:8px">
                ${lastDeck.meta.savingsAvg ? `<span class="badge good">−${lastDeck.meta.savingsAvg}% avg advantage charted</span>` : ""}
                ${lastDeck.meta.references ? `<span class="badge neutral">${lastDeck.meta.references} reference case${lastDeck.meta.references > 1 ? "s" : ""}</span>` : ""}
                ${lastDeck.meta.hasTimeline ? `<span class="badge neutral">rollout timeline</span>` : ""}
                ${lastDeck.meta.pricingFirst ? `<span class="badge brand" data-tip="Their team spends most of its deck time on pricing — so this deck leads with it">pricing moved up front</span>` : ""}
                ${(s.take || 1) > 1 ? `<span class="badge neutral">take ${s.take}</span>` : ""}
              </div>
              <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                <button class="btn primary sm" data-act="deck-preview">Preview deck</button>
                <button class="btn ghost sm" data-act="deck-retake" data-tip="Recompose this deck — a different headline, framing and closing, same facts">↻ New take</button>
                <button class="btn ghost sm" data-act="deck-dl">Download HTML</button>
                <button class="btn ghost sm" data-act="share-deck">Share to hub</button>
                ${ex ? `<a class="btn ghost sm" href="${ex}" target="_blank" rel="noopener">Hand-polished example ↗</a>` : ""}
                <button class="btn ghost sm" id="gen-again">Generate another</button>
              </div>
            </div>
          </div>`;
        $("#gen-again").addEventListener("click", () => { render(); });
      }
    };
    tick();
  }

  /* ---------- flow ---------- */
  let flowFilter = "All";
  const TERRITORY_COUNTRIES = {
    Nordics: ["Sweden", "Norway", "Denmark", "Finland"],
    DACH: ["Germany", "Austria", "Switzerland"],
    Baltics: ["Estonia", "Latvia", "Lithuania"],
    Poland: ["Poland"]
  };
  function vFlow() {
    const terrs = ["All", ...D.tenant.territories];
    const items = D.news.filter((n) => flowFilter === "All" || n.territory === flowFilter);
    const terrCards = D.tenant.territories.map((t, i) => {
      const countries = TERRITORY_COUNTRIES[t] || [];
      const hubs = D.hubs.filter((h) => countries.includes(h.country));
      const value = hubs.reduce((a, h) => a + (h.value || 0), 0);
      const news = D.news.filter((n) => n.territory === t).length;
      return `<button class="card hover rise rise-${i + 1}" data-terr="${esc(t)}" style="text-align:left;display:block">
        <b style="font-size:15px">${esc(t)}</b>
        <div class="sub" style="margin-top:4px">${hubs.length} hub${hubs.length === 1 ? "" : "s"} · ${fmtEUR(value)} open</div>
        <div class="sub">${news} news item${news === 1 ? "" : "s"} this week</div>
      </button>`;
    }).join("");
    return `
    ${helpNote("flow")}
    <div class="section-head"><h2>Market flow</h2><span class="sub">where you sell, and what's moving there</span></div>
    <div class="grid cols-4" style="margin-bottom:18px">${terrCards}</div>
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
      ${(() => {
        const country = (t.destination.split(", ")[1] || "").trim();
        const nearbyPeople = D.people.filter((p) => p.country === country && !t.meetings.some((m) => m.who.includes(p.name)));
        const nearbyHubs = D.hubs.filter((hh) => hh.country === country);
        if (!nearbyPeople.length && !nearbyHubs.length) return "";
        return `<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line-soft)">
          <b style="font-size:13px">Also in ${esc(country)} while you're there</b>
          <div class="chips" style="margin-top:8px">
            ${nearbyHubs.map((hh) => `<a class="chip" href="#/hub/${hh.id}" style="text-decoration:none">${hh.flag} ${esc(hh.company)}</a>`).join("")}
            ${nearbyPeople.slice(0, 3).map((p) => `<a class="chip" href="#/people" style="text-decoration:none">${esc(p.name)} · ${esc(p.org)}</a>`).join("")}
          </div></div>`;
      })()}
    </div>`).join("")}`;
  }

  /* ---------- pricing ---------- */
  let priceFilter = "all";
  function vPricing() {
    const rows = D.competitors.filter((c) => priceFilter === "all" || c.kind === priceFilter);
    const our = { "NC-LI4880": 11900, "NC-CHG30": 6400, "NC-BMS-FLEET": 240 };
    const comps = D.competitors.filter((c) => our[c.comparableTo]);
    const verifiedDeltas = comps.filter((c) => c.kind === "verified").map((c) => Math.round((c.price - our[c.comparableTo]) / our[c.comparableTo] * 100));
    const undercuts = comps.filter((c) => c.price < our[c.comparableTo]);
    const positioning = verifiedDeltas.length ? `
      <div class="card" style="margin-bottom:16px"><h3>Your position, computed</h3>
        <p class="sub" style="margin-top:6px;font-size:13.5px;line-height:1.6">
          Verified market prices on comparable items run <b style="color:var(--ink)">${Math.min(...verifiedDeltas) >= 0 ? "+" : ""}${Math.min(...verifiedDeltas)}% to +${Math.max(...verifiedDeltas)}%</b> against your list — you are not the expensive option where it's provable.
          ${undercuts.length ? `Watch: <b style="color:var(--ink)">${undercuts.map((u) => esc(u.vendor) + " " + esc(u.product) + " (" + (u.kind === "verified" ? "verified" : "est. OEM") + ", −" + Math.round((our[u.comparableTo] - u.price) / our[u.comparableTo] * 100) + "%)").join(", ")}</b> — bring the TCO story, not a discount.` : ""}
        </p>
      </div>` : "";
    return `
    ${helpNote("pricing")}
    ${positioning}
    <div class="section-head"><h2>Competitor pricing</h2><span class="sub">what the market actually pays</span><span class="grow"></span>
      <div class="chips">
        <button class="chip ${priceFilter === "all" ? "on" : ""}" data-pf="all">All</button>
        <button class="chip ${priceFilter === "verified" ? "on" : ""}" data-pf="verified">Verified only</button>
        <button class="chip ${priceFilter === "estimated" ? "on" : ""}" data-pf="estimated">Estimated OEM</button>
      </div>
      <button class="btn primary sm" data-act="add-comp">+ Add price</button></div>
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
    <div class="section-head"><h2>Key persons</h2><span class="sub">who decides, who influences, where to meet them</span><span class="grow"></span>
      <button class="btn primary sm" data-act="add-person">+ Add person</button></div>
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

  /* ---------- proposals (aggregate) ---------- */
  function vProposals() {
    const rows = [];
    D.hubs.forEach((h) => (h.proposals || []).forEach((p) => rows.push({ p, hub: h })));
    rows.sort((a, b) => (b.p.sent || "").localeCompare(a.p.sent || ""));
    const open = rows.filter((r) => !["Accepted", "Declined"].includes(r.p.status)).reduce((a, r) => a + (r.p.value || 0), 0);
    const won = rows.filter((r) => r.p.status === "Accepted").reduce((a, r) => a + (r.p.value || 0), 0);
    return `
    ${helpNote("proposals")}
    <div class="section-head"><h2>Proposals</h2><span class="sub">every offer, across every hub</span><span class="grow"></span>
      <button class="btn primary sm" data-act="add-proposal-any">+ New proposal</button></div>
    <div class="grid cols-3" style="margin-bottom:16px">
      <div class="card stat rise rise-1"><span class="label">Open value</span><span class="value">${fmtEUR(open)}</span></div>
      <div class="card stat rise rise-2"><span class="label">Accepted value</span><span class="value">${fmtEUR(won)}</span></div>
      <div class="card stat rise rise-3"><span class="label">Proposals total</span><span class="value">${rows.length}</span></div>
    </div>
    <div class="table-wrap"><table class="data">
      <thead><tr><th>Proposal</th><th>Customer</th><th class="num">Value</th><th>Status</th><th>Sent</th></tr></thead>
      <tbody>${rows.map((r) => `<tr>
        <td><b>${esc(r.p.name)}</b></td>
        <td><a href="#/hub/${r.hub.id}/proposals" style="text-decoration:none">${r.hub.flag} ${esc(r.hub.company)}</a></td>
        <td class="num">${fmtEUR(r.p.value)}</td>
        <td><span class="badge ${r.p.status === "Accepted" ? "good" : r.p.status === "Declined" ? "crit" : "warn"}">${esc(r.p.status)}</span></td>
        <td>${esc(r.p.sent)}</td></tr>`).join("") || `<tr><td colspan="5"><div class="empty">No proposals yet.</div></td></tr>`}
      </tbody></table></div>`;
  }

  /* ---------- forecast ---------- */
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function monthLabel(ym) {
    const [y, m] = ym.split("-").map(Number);
    return MONTH_NAMES[m - 1] + (y > new Date().getFullYear() ? " ’" + String(y).slice(2) : "");
  }
  function nextMonths(n) {
    const d = new Date(); d.setDate(1);
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
      d.setMonth(d.getMonth() + 1);
    }
    return out;
  }
  function vForecast() {
    const months = nextMonths(7);
    const deals = D.hubs.filter((h) => h.value > 0).map((h) => {
      let close = h.expectedClose || months[3];
      if (close < months[0]) close = months[0];
      if (close > months[months.length - 1]) close = months[months.length - 1];
      const score = dealScore(h);
      return { h, close, score, weighted: Math.round(h.value * score / 100) };
    }).sort((a, b) => a.close.localeCompare(b.close));
    const byMonth = months.map((m) => deals.filter((d) => d.close === m).reduce((a, d) => a + d.weighted, 0));
    const best = deals.reduce((a, d) => a + d.h.value, 0);
    const expected = deals.reduce((a, d) => a + d.weighted, 0);
    const commit = deals.filter((d) => d.score >= 70).reduce((a, d) => a + d.h.value, 0);
    const maxM = Math.max(...byMonth, 1);
    return `
    ${helpNote("forecast")}
    <div class="section-head"><h2>Forecast</h2><span class="sub">expected revenue by close month, weighted by win likelihood</span></div>
    <div class="grid cols-3" style="margin-bottom:16px">
      <div class="card stat rise rise-1"><span class="label">Best case (everything closes)</span><span class="value">${fmtEUR(best)}</span></div>
      <div class="card stat rise rise-2"><span class="label">Expected (likelihood-weighted)</span><span class="value">${fmtEUR(expected)}</span></div>
      <div class="card stat rise rise-3"><span class="label">Commit (≥70% likely only)</span><span class="value">${fmtEUR(commit)}</span></div>
    </div>
    <div class="card rise rise-2" style="margin-bottom:16px">
      <h3>Expected revenue by month</h3><p class="sub">Next ${months.length} months, € weighted</p>
      <div class="col-chart">
        ${months.map((m, i) => `
        <div class="col" data-tip="${monthLabel(m)}: ${fmtEUR(byMonth[i])} expected">
          <div class="v"${byMonth[i] ? "" : ' style="opacity:.4"'}>${byMonth[i] ? "€" + Math.round(byMonth[i] / 1000) + "k" : "€0"}</div>
          <div class="bar-slot"><div class="bar${byMonth[i] ? "" : " empty"}" style="height:${byMonth[i] ? Math.max(10, byMonth[i] / maxM * 120) : 4}px"></div></div>
          <div class="m">${monthLabel(m)}</div>
        </div>`).join("")}
      </div>
      <div class="axis-note">Deals land in their expected close month at value × win likelihood.</div>
    </div>
    <div class="table-wrap"><table class="data">
      <thead><tr><th>Deal</th><th>Close month</th><th class="num">Value</th><th class="num">Likelihood</th><th class="num">Weighted</th></tr></thead>
      <tbody>${deals.map((d) => `<tr>
        <td><a href="#/hub/${d.h.id}" style="text-decoration:none"><b>${d.h.flag} ${esc(d.h.company)}</b></a><span class="src" style="display:block">${esc(d.h.stage)}</span></td>
        <td>${monthLabel(d.close)}</td>
        <td class="num">${fmtEUR(d.h.value)}</td>
        <td class="num">${scoreBadge(d.score)}</td>
        <td class="num"><b>${fmtEUR(d.weighted)}</b></td></tr>`).join("")}
      </tbody></table></div>`;
  }

  /* ---------- settings ---------- */
  function vSettings() {
    const accentKey = store.get("mimra.accent") || "terracotta";
    const ws = store.get("mimra.wsname") || D.tenant.name;
    const integrations = [
      { k: "crm", name: "CRM sync", desc: "HubSpot / Pipedrive — hubs and stages stay in sync" },
      { k: "erp", name: "ERP export", desc: "Orders and price lists to your ERP (SAP, Monitor, Fortnox)" },
      { k: "wms", name: "Customer WMS webhook", desc: "FleetView telemetry into the customer's WMS" },
      { k: "cal", name: "Calendar", desc: "Travel plans and meetings to Outlook / Google Calendar" }
    ];
    return `
    ${helpNote("settings")}
    <div class="section-head"><h2>Settings</h2><span class="sub">workspace, plan and integrations</span></div>
    <div class="grid cols-2">
      <div class="card">
        <h3>Branding</h3><p class="sub">Your hubs and generated decks wear your identity.</p>
        <div class="field" style="margin-top:14px"><label>Workspace name</label><input id="ws-name" value="${esc(ws)}" /></div>
        <label style="font-size:12px;font-weight:600;color:var(--ink-2)">Accent color</label>
        <div class="swatch-row">
          ${Object.entries(ACCENTS).map(([k, a]) => `<button class="swatch ${k === accentKey ? "on" : ""}" data-accent="${k}" style="background:${a.accent}" title="${k}" aria-label="${k}"></button>`).join("")}
        </div>
        <label style="font-size:12px;font-weight:600;color:var(--ink-2);display:block;margin-top:18px">Theme</label>
        <div class="chips" style="margin-top:8px">
          ${[["", "System"], ["light", "Light"], ["dark", "Dark"]].map(([v, l]) =>
            `<button class="chip ${(store.get("mimra.theme") || "") === v ? "on" : ""}" data-theme-pick="${v}">${l}</button>`).join("")}
        </div>
      </div>
      <div class="card">
        <h3>Plan &amp; billing</h3><p class="sub">Studio plan · billed monthly · cancel anytime</p>
        <div class="grid cols-2" style="margin-top:14px">
          <div class="stat"><span class="label">Base plan</span><span class="value" style="font-size:24px">€49<span style="font-size:13px;color:var(--ink-3);font-weight:500">/mo</span></span><span class="sub">Hubs, market flow, travel &amp; pricing intel — unlimited. Essential decks included.</span></div>
          <div class="stat"><span class="label">Signature decks this month</span><span class="value" style="font-size:24px">6 × €29</span><span class="sub">Pay per deck. No seats, no tiers, no surprises.</span></div>
        </div>
        <div class="table-wrap" style="margin-top:14px"><table class="data">
          <thead><tr><th>Invoice</th><th class="num">Amount</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>June 2026</td><td class="num">€223</td><td><span class="badge good">Paid</span></td></tr>
            <tr><td>May 2026</td><td class="num">€136</td><td><span class="badge good">Paid</span></td></tr>
            <tr><td>April 2026</td><td class="num">€78</td><td><span class="badge good">Paid</span></td></tr>
          </tbody></table></div>
      </div>
      <div class="card">
        <h3>Your account</h3><p class="sub">How you appear across hubs, decks and the activity log.</p>
        <div class="field" style="margin-top:14px"><label>Display name</label><input id="acc-name" value="${esc(D.tenant.user.name)}" /></div>
        <div class="field"><label>Email</label><input value="${esc(D.tenant.user.email || "alex@nordcell.se")}" readonly style="color:var(--ink-3)" /></div>
        <div class="int-row" style="border-bottom:0;padding-bottom:0">
          <div class="grow"><b>Two-factor authentication</b><span class="src">Sign-ins require a code from your phone</span></div>
          <div class="toggle ${store.get("mimra.2fa") === "on" ? "on" : ""}" data-2fa role="switch" aria-checked="${store.get("mimra.2fa") === "on"}" tabindex="0"></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:14px">
          <button class="btn ghost sm" data-act="demo">Change password</button>
          <button class="btn ghost sm" data-act="sign-out" style="color:var(--critical)">Sign out</button>
        </div>
      </div>
      <div class="card">
        <h3>Team</h3><p class="sub">Everyone sees the same hubs. Roles control publishing.</p>
        ${D.tenant.members.map((m, i) => `
        <div class="int-row"><div class="avatar" ${m.level === "Owner" ? "" : 'style="background:var(--night)"'}>${esc(m.name.split(" ").map((w) => w[0]).join("").slice(0, 2))}</div>
          <div class="grow"><b>${esc(m.name)}</b><span class="src">${esc(m.role)}</span></div>
          ${m.level === "Owner"
            ? `<span class="badge brand">Owner · You</span>`
            : `<select class="member-level" data-i="${i}" style="border:1px solid var(--line);border-radius:8px;padding:5px 8px;font:inherit;font-size:12.5px;background:var(--card)">
                ${["Editor", "Viewer"].map((l) => `<option ${m.level === l ? "selected" : ""}>${l}</option>`).join("")}
              </select>
              <button class="icon-btn" data-act="del-member" data-i="${i}" title="Remove">×</button>`}
        </div>`).join("")}
        <button class="btn ghost sm" data-act="add-member" style="margin-top:12px">+ Invite teammate</button>
      </div>
      <div class="card">
        <h3>Integrations</h3><p class="sub">Mimra plays well with what you already run.</p>
        ${integrations.map((i) => {
          const on = store.get("mimra.int." + i.k) === "on";
          return `<div class="int-row"><div class="grow"><b>${esc(i.name)}</b><span class="src">${esc(i.desc)}</span></div>
            <div class="toggle ${on ? "on" : ""}" data-int="${i.k}" role="switch" aria-checked="${on}" tabindex="0"></div></div>`;
        }).join("")}
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <h3>Workspace data</h3><p class="sub">Your working data lives in this browser. Export it as JSON to back up or move machines; import restores everything including branding.</p>
      <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
        <button class="btn ghost sm" data-act="export-data">Export workspace (.json)</button>
        <button class="btn ghost sm" data-act="import-data">Import workspace</button>
        <button class="btn ghost sm" data-act="reset-demo" style="color:var(--critical)">Reset demo data</button>
      </div>
    </div>`;
  }

  /* ---------- router ---------- */
  const ROUTES = {
    dashboard: { title: "Dashboard", fn: vDashboard },
    hubs: { title: "Customer hubs", fn: vHubs },
    proposals: { title: "Proposals", fn: vProposals },
    forecast: { title: "Forecast", fn: vForecast },
    studio: { title: "Presentation studio", fn: vStudio },
    flow: { title: "Market flow", fn: vFlow },
    travel: { title: "Travel planner", fn: vTravel },
    pricing: { title: "Competitor pricing", fn: vPricing },
    people: { title: "Key persons", fn: vPeople },
    settings: { title: "Settings", fn: vSettings }
  };

  function render() {
    const hash = location.hash || "#/dashboard";
    const parts = hash.replace(/^#\//, "").split("/");
    let html, crumb, navActive;
    if (lockedCustomer && D.hubs.some((x) => x.id === lockedCustomer)) {
      const tab = parts[0] === "hub" && parts[1] === lockedCustomer ? parts[2] : undefined;
      const h = D.hubs.find((x) => x.id === lockedCustomer);
      view.innerHTML = `<div class="view">${vHub(lockedCustomer, tab)}</div>`;
      $("#crumb").innerHTML = `<b>${esc(h.company)}</b> <span style="color:var(--ink-3)">· shared by NordCell Power · powered by <b style="font-family:var(--serif)">mim<span style="color:var(--accent)">ra</span></b></span>`;
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
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
    $("#nav-scrim").classList.remove("show");
    const gs = $("#global-search"); if (gs) gs.value = "";
    const sr = $("#search-results"); if (sr) sr.hidden = true;
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  /* ---------- events ---------- */
  document.addEventListener("click", (e) => {
    const hn = e.target.closest("[data-hn-close]");
    if (hn) { store.set("mimra.hn." + hn.dataset.hnClose, "off"); hn.closest(".help-note").remove(); return; }

    const pick = e.target.closest("[data-pick]");
    if (pick) { studioState[pick.dataset.pick] = pick.dataset.val; studioState.take = 1; render(); return; }

    const terr = e.target.closest("[data-terr]");
    if (terr) { flowFilter = terr.dataset.terr; render(); return; }

    const pf = e.target.closest("[data-pf]");
    if (pf) { priceFilter = pf.dataset.pf; render(); return; }

    if (e.target.closest("#gen-btn")) { runGeneration(); return; }

    const tr = e.target.closest("[data-tour]");
    if (tr) {
      store.set("mimra.toured", "1");
      closeModal();
      if (tr.dataset.tour) { location.hash = tr.dataset.tour; render(); }
      return;
    }

    const sw = e.target.closest("[data-accent]");
    if (sw) { applyAccent(sw.dataset.accent); render(); toast("Accent updated across the workspace."); return; }

    const tp = e.target.closest("[data-theme-pick]");
    if (tp) { applyTheme(tp.dataset.themePick); render(); toast(tp.dataset.themePick ? tp.dataset.themePick[0].toUpperCase() + tp.dataset.themePick.slice(1) + " theme on." : "Following your system theme."); return; }

    const tfa = e.target.closest("[data-2fa]");
    if (tfa) {
      const on = store.get("mimra.2fa") === "on";
      store.set("mimra.2fa", on ? "off" : "on");
      tfa.classList.toggle("on", !on);
      tfa.setAttribute("aria-checked", String(!on));
      toast(on ? "Two-factor disabled." : "Two-factor enabled — codes via your authenticator app.");
      return;
    }

    const tg = e.target.closest("[data-int]");
    if (tg) {
      const k = "mimra.int." + tg.dataset.int;
      const on = store.get(k) === "on";
      store.set(k, on ? "off" : "on");
      tg.classList.toggle("on", !on);
      tg.setAttribute("aria-checked", String(!on));
      toast(on ? "Integration disconnected." : "Integration connected — syncing.");
      return;
    }

    const act = e.target.closest("[data-act]");
    if (act) {
      const a = act.dataset.act;
      if (a === "cust-view") { custView = !custView; render(); return; }
      if (a === "gen-for") { studioState.customer = act.dataset.hub; location.hash = "#/studio"; render(); return; }
      if (a === "modal-close") { closeModal(); return; }
      if (a === "create-hub") { createHub(); return; }
      if (a === "new-hub") { newHubModal(); return; }
      if (a === "deck-preview") { openDeckOverlay(); return; }
      if (a === "deck-retake") {
        studioState.take = (studioState.take || 1) + 1;
        runGeneration();
        toast("Recomposing — take " + studioState.take + ".");
        return;
      }
      if (a === "deck-dl") {
        if (lastDeck && downloadFile(slug(lastDeck.title) + ".html", lastDeck.html, "text/html")) toast("Deck downloaded as HTML.");
        return;
      }
      if (a === "reset-demo") {
        ["mimra.data.v1", "mimra.hubs.custom", "mimra.accent", "mimra.wsname", "mimra.notif.seen", "mimra.toured", "mimra.username", "mimra.2fa", "mimra.theme"].forEach((k) => store.del(k));
        Object.keys(HELP).forEach((k) => store.del("mimra.hn." + k));
        ["crm", "erp", "wms", "cal"].forEach((k) => store.del("mimra.int." + k));
        toast("Demo data reset.");
        setTimeout(() => location.reload(), 600);
        return;
      }
      if (a === "plan-trip") {
        const t = D.travel.suggestions.find((x) => x.destination === act.dataset.dest);
        if (t && downloadICS(t)) toast(t.meetings.length + " meetings exported — import the .ics into your calendar.");
        return;
      }
      if (a === "invite") {
        const h = hubFromRoute(); if (!h) return;
        const link = location.origin + location.pathname + "?customer=" + h.id;
        openModal(`
          <h3>Invite ${esc(h.company)}</h3>
          <p class="sub">Anyone with this link sees the customer view of this hub — prices, documents, proposals and presentations. Nothing internal.</p>
          <div class="field"><label>Customer link</label><input id="inv-link" readonly value="${esc(link)}" onclick="this.select()" /></div>
          <div class="modal-actions">
            <button class="btn ghost sm" data-act="modal-close">Done</button>
            <a class="btn ghost sm" href="${esc(link)}" target="_blank" rel="noopener">Open preview ↗</a>
            <button class="btn primary sm" data-act="copy-invite">Copy link</button>
          </div>`);
        return;
      }
      if (a === "copy-invite") {
        const el = $("#inv-link"); if (!el) return;
        el.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch (err) { /* fall through */ }
        try { if (navigator.clipboard) { navigator.clipboard.writeText(el.value); ok = true; } } catch (err) { /* fall through */ }
        toast(ok ? "Link copied — send it to your customer's team." : "Select the link and copy it manually.");
        return;
      }

      // CRUD forms
      if (a === "add-price") { editIndex = -1; FORMS.price(); return; }
      if (a === "edit-price") { const h = hubFromRoute(); if (!h) return; editIndex = +act.dataset.i; FORMS.price(h.priceList[editIndex]); return; }
      if (a === "del-price") { const h = hubFromRoute(); if (!h) return; h.priceList.splice(+act.dataset.i, 1); persist(); buildSearchIndex(); render(); toast("Removed from price list."); return; }
      if (a === "add-doc") { FORMS.doc(); return; }
      if (a === "del-doc") { const h = hubFromRoute(); if (!h) return; h.docs.splice(+act.dataset.i, 1); persist(); buildSearchIndex(); render(); toast("Document removed."); return; }
      if (a === "add-proposal") { FORMS.proposal(false); return; }
      if (a === "add-proposal-any") { FORMS.proposal(true); return; }
      if (a === "add-note") { FORMS.note(); return; }
      if (a === "add-person") { FORMS.person(); return; }
      if (a === "add-comp") { FORMS.comp(); return; }
      if (a === "add-member") { FORMS.member(); return; }
      if (a === "del-member") { D.tenant.members.splice(+act.dataset.i, 1); persist(); render(); toast("Teammate removed."); return; }
      if (a === "sign-out") {
        session.del("mimra.auth");
        location.hash = "#/dashboard";
        login.classList.remove("gone");
        toast("Signed out.");
        return;
      }
      if (a === "quote-proposal") {
        const q = quoteState();
        if (!q.total || !q.hub) return;
        q.hub.proposals.push({ name: "Quote " + today() + " — " + q.lines.join(", "), value: q.total, status: custView ? "Awaiting customer" : "Draft", sent: today() });
        q.hub.timeline.unshift({ when: nowStamp(), who: custView ? q.hub.contact : D.tenant.user.name, what: (custView ? "Requested proposal from quote: " : "Created proposal from quote: ") + fmtEUR(q.total) });
        persist(); refreshNotifDot();
        toast("Proposal created: " + fmtEUR(q.total));
        location.hash = "#/hub/" + q.hub.id + "/proposals"; render();
        return;
      }
      if (a.startsWith("save-")) { saveForms(a); return; }

      if (a === "share-deck") {
        if (!lastDeck) { toast("Generate a deck first."); return; }
        const hub = D.hubs.find((h) => h.id === studioState.customer);
        if (!hub) return;
        const saved = {
          name: lastDeck.title.split(" — ")[1] || lastDeck.title,
          tier: lastDeck.title.includes("Signature") ? "Signature" : "Essential",
          generated: today(), views: 0, html: lastDeck.html
        };
        hub.presentations.push(saved);
        const withHtml = hub.presentations.filter((p) => p.html);
        while (withHtml.length > 5) {
          const oldest = withHtml.shift();
          hub.presentations.splice(hub.presentations.indexOf(oldest), 1);
        }
        hub.timeline.unshift({ when: nowStamp(), who: D.tenant.user.name, what: "Shared deck to hub: " + saved.name });
        persist(); refreshNotifDot();
        toast("Deck saved to " + hub.company + "'s hub — the team was notified.");
        return;
      }
      if (a === "open-saved") {
        const h = hubFromRoute();
        const p = h && h.presentations[+act.dataset.i];
        if (p && p.html) { lastDeck = { html: p.html, title: p.name }; openDeckOverlay(); }
        return;
      }
      if (a === "export-data") {
        const payload = {
          version: 1, exported: new Date().toISOString(),
          data: { hubs: D.hubs, people: D.people, competitors: D.competitors, members: D.tenant.members },
          branding: { accent: store.get("mimra.accent"), wsname: store.get("mimra.wsname"), theme: store.get("mimra.theme"), username: store.get("mimra.username") }
        };
        if (downloadFile("mimra-workspace-" + today() + ".json", JSON.stringify(payload, null, 2), "application/json")) toast("Workspace exported as JSON.");
        return;
      }
      if (a === "import-data") { $("#import-file").click(); return; }
      toast("This is a demo action.");
      return;
    }
  });

  function quoteState() {
    const h = hubFromRoute();
    if (!h) return { total: 0, units: 0, lines: [] };
    let total = 0, units = 0; const lines = [];
    document.querySelectorAll(".qty-in").forEach((inp) => {
      const q = +inp.value || 0;
      const p = h.priceList[+inp.dataset.i];
      if (q > 0 && p) { total += q * p.hub; units += q; lines.push(q + " × " + p.sku); }
    });
    return { total, units, lines, hub: h };
  }
  document.addEventListener("input", (e) => {
    if (e.target.id === "ws-name") {
      const v = e.target.value.trim() || D.tenant.name;
      store.set("mimra.wsname", v);
      $(".logo-sub").textContent = v.toUpperCase();
    }
    if (e.target.id === "acc-name") {
      const v = e.target.value.trim() || "Alex Kjellberg";
      store.set("mimra.username", v);
      D.tenant.user.name = v;
      D.tenant.user.initials = v.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
      $("#user-name").textContent = v;
      $("#user-avatar").textContent = D.tenant.user.initials;
    }
    if (e.target.classList && e.target.classList.contains("qty-in")) {
      const q = quoteState();
      const bar = $("#quote-bar");
      if (!bar) return;
      bar.hidden = q.total === 0;
      $("#quote-total").textContent = fmtEUR(q.total);
      $("#quote-items").textContent = q.units;
    }
  });
  document.addEventListener("change", (e) => {
    if (e.target.classList && e.target.classList.contains("member-level")) {
      const m = D.tenant.members[+e.target.dataset.i];
      if (m) { m.level = e.target.value; persist(); toast(m.name + " is now " + m.level.toLowerCase() + "."); }
    }
  });
  document.addEventListener("keydown", (e) => {
    // switch-role toggles are divs — make Enter/Space flip them (WCAG 2.1.1)
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("toggle")) {
      e.preventDefault(); e.target.click(); return;
    }
    if (e.key === "Escape") {
      if (!deckOverlay.hidden) { deckOverlay.hidden = true; deckFrame.srcdoc = ""; }
      else if (!modalWrap.hidden) closeModal();
      else if (!notifPanel.hidden) notifPanel.hidden = true;
      else if (!sBox.hidden) sBox.hidden = true;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      sInput.focus(); sInput.select();
    }
  });

  $("#help-toggle").addEventListener("click", () => {
    Object.keys(HELP).forEach((k) => store.del("mimra.hn." + k));
    render();
    toast("Help notes restored on every page.");
  });
  const navScrim = $("#nav-scrim");
  function setNav(open) {
    $("#sidebar").classList.toggle("open", open);
    navScrim.classList.toggle("show", open);
  }
  $("#menu-btn").addEventListener("click", () => setNav(!$("#sidebar").classList.contains("open")));
  navScrim.addEventListener("click", () => setNav(false));
  $("#theme-btn").addEventListener("click", () => { applyTheme(isDark() ? "light" : "dark"); render(); });
  $("#import-file").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      let payload;
      try { payload = JSON.parse(rd.result); } catch (err) { toast("That file isn't valid JSON."); return; }
      const d = payload && payload.data;
      const ok = d && Array.isArray(d.hubs) && d.hubs.every((h) => h && typeof h === "object" && h.id) &&
        (d.people === undefined || Array.isArray(d.people)) &&
        (d.competitors === undefined || Array.isArray(d.competitors));
      if (!ok) { toast("That file isn't a Mimra workspace export."); return; }
      if (!confirm("Import will replace your current workspace (" + D.hubs.length + " hubs) with this file. Export first if you want a backup. Continue?")) return;
      store.set("mimra.data.v1", JSON.stringify(d));
      const b = payload.branding || {};
      ["accent", "wsname", "theme", "username"].forEach((k) => {
        if (b[k]) store.set("mimra." + k, b[k]); else store.del("mimra." + k);
      });
      toast("Workspace imported — reloading.");
      setTimeout(() => location.reload(), 700);
    };
    rd.readAsText(f);
    e.target.value = "";
  });

  /* ---------- first-run tour ---------- */
  function maybeTour() {
    if (lockedCustomer || store.get("mimra.toured") || !modalWrap.hidden) return;
    openModal(`
      <h3>Welcome to Mimra</h3>
      <p class="sub">Three places do most of the work. Pick where to start — you can't break anything, and Settings can reset the demo anytime.</p>
      <div class="pick" data-tour="#/dashboard" style="margin-bottom:10px"><b>1 · See your day</b><p>Pipeline, next best actions, market news and travel in one morning view.</p></div>
      <div class="pick" data-tour="#/hub/mueller" style="margin-bottom:10px"><b>2 · Open a customer hub</b><p>The prices, documents, proposals and decks you share with one customer.</p></div>
      <div class="pick" data-tour="#/studio" style="margin-bottom:10px"><b>3 · Generate a presentation</b><p>From hub data to a deck your customer remembers — in seconds.</p></div>
      <div class="modal-actions"><button class="btn ghost sm" data-tour="">Skip, I'll explore</button></div>`);
  }

  /* ---------- login ---------- */
  const login = $("#login");
  function enter() {
    session.set("mimra.auth", "1");
    login.classList.add("gone");
    setTimeout(maybeTour, 650);
  }
  $("#login-btn").addEventListener("click", enter);
  login.addEventListener("keydown", (e) => { if (e.key === "Enter") enter(); });
  if (session.get("mimra.auth")) { login.classList.add("gone"); setTimeout(maybeTour, 600); }

  /* ---------- boot ---------- */
  const savedName = store.get("mimra.username");
  if (savedName) {
    D.tenant.user.name = savedName;
    D.tenant.user.initials = savedName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }
  const u = D.tenant.user;
  $("#user-avatar").textContent = u.initials;
  $("#user-name").textContent = u.name;
  $("#user-role").textContent = u.role;
  const wsn = store.get("mimra.wsname");
  if (wsn) $(".logo-sub").textContent = wsn.toUpperCase();
  if (lockedCustomer) {
    document.body.classList.add("customer-mode");
    login.classList.add("gone");
  }
  window.addEventListener("hashchange", render);
  render();
})();
