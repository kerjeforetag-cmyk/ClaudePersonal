# Mimra — the sales hub

**Mimra** (app.mimra) is a modern B2B sales platform built around one idea: the sales manager
should spend their time selling, not doing administration, graphic design or market research.
Mimra does that part.

This repository contains **Mimra v1** — a fully working, dependency-free product prototype.
Every screen is real HTML/CSS/JS with realistic demo data; there is no build step and no backend
required, so it can be opened locally or hosted on any static host.

## The idea

You create a **hub** for each customer and invite their buying team into it. The hub is the
gathering place between you (the sales manager) and the customer: customer-specific prices,
technical documents, proposals and generated presentations — always current, every view tracked.

The flagship feature is the **Presentation Studio**: point it at a hub and it generates a
polished HTML presentation from your live data. Two tiers keep the economics honest:

| Tier | Price | What it is |
|------|-------|-----------|
| **Essential** | Included | Template-based HTML deck from hub data — clean, fast, on-brand |
| **Signature** | €29 / deck | Code-generated bespoke presentation — narrative, charts and layout composed for that specific customer. Best results. |

## Modules

- **Dashboard** — pipeline, hub engagement, generated decks, next best trip and territory news in one morning view
- **Customer hubs** — the shared workspace per customer: price list, technical data, proposals, presentations, activity log
- **Presentation studio** — the generator: pick customer → objective → tier → generate
- **Market flow** — news filtered to the territories you actually sell in (regulation, tenders, fairs, market moves)
- **Travel planner** — every day scored by customer availability, events, flight cost and weather; recommends the window where one trip does the most work
- **Competitor pricing** — two confidence classes, never mixed: **Verified** (seen in a real document, with source and date) vs **Estimated OEM** (modeled price where no document exists)
- **Key persons** — decision makers, influencers and gatekeepers per country, with how they work and where to meet them
- **Help notes** — every section explains itself with a dismissible note; the `? Help` button brings them back
- **Global search** — customers, SKUs, documents, people, news and competitor prices from the top bar
- **View as customer** — one click inside any hub shows exactly what the invited team sees (deal value, stage and pulse analytics hidden)
- **Live deck generation** — `assets/generator.js` builds complete standalone HTML decks from any hub's data (all customers × 4 objectives × both tiers), with in-app preview, HTML download and a Print/PDF button in every deck
- **New hubs that stick** — create a hub from a modal; it persists in localStorage, joins search, the studio and notifications. Reset from Settings.
- **Notifications** — a bell aggregating customer activity across every hub
- **Settings** — workspace branding (name + four accent themes applied live), the simple pricing model (€49/mo base, Essential included, Signature €29/deck), team roles, integrations, demo reset
- **Calendar export** — "Plan this trip" downloads an .ics with the suggested meetings
- **Fully editable, fully persistent** — add/edit/remove price-list rows, share documents, create proposals, log activity, add key persons and competitor prices; every change persists in localStorage (reset from Settings)
- **Proposals module** — every offer across every hub in one table, with open and accepted totals
- **Customer invite links** — "Invite customer" produces a `?customer=<hub>` link that opens the hub in a locked customer-only mode: no sidebar, no internal data, "powered by mimra"
- **Territory summary** — Market Flow leads with where you sell: hubs, open value and news per territory
- **Next best actions** — a rule-based insight engine reads your hubs, proposals, competitor prices and travel windows and puts the day's highest-leverage moves on the dashboard (and per-hub under "Mimra suggests")
- **Win-likelihood scores** — every deal scored from stage, engagement trend and hub health; the pipeline shows a likelihood-weighted total
- **Quote builder** — enter quantities in any hub price list and a sticky quote bar totals at hub prices; one click turns it into a proposal
- **Price positioning** — the competitor view opens with a computed summary of where you stand vs verified market prices, and which estimated OEM prices undercut you
- **Trip stacking** — each travel window lists who else and which hubs are in that country
- **Keyboard-first** — Ctrl/⌘+K jumps to search; arrow keys navigate results
- **Forecast** — every open deal lands in its expected close month at value × win likelihood; best case / expected / commit totals and a monthly revenue chart
- **Deck engagement analytics** — per-section viewing time on shared decks, with the dominant section called out ("the tell") and fed into Next best actions
- **First-run tour** — a three-door welcome on first sign-in (see your day / open a hub / generate a deck)
- **Landing page** — `index.html`: the public face (product, studio showcase, pricing, FAQ); the app lives at `app.html`
- **Account & admin** — editable display name (live everywhere), 2FA toggle, sign out; team management with invites, role changes and removal, all persisted
- **Objective-aware decks** — generated presentations carry a middle act per objective (rollout plan / product trio / phase-one results from real hub history / compliance evidence) and wear the workspace accent color
- **Decks that sell** — every generated deck now includes a per-SKU "negotiated advantage" chart computed from the hub's price list, a rollout timeline anchored to the deal's expected close month, reference cases pulled from your other proven hubs, a document reference number + validity date, and your real sender name/workspace; when deck analytics show the customer dwells on pricing, the next deck **automatically leads with the commercial section**
- **Dark mode** — full token-level theming (app + landing): follows the system by default, with a topbar toggle and a System/Light/Dark picker in Settings; chart palettes re-validated against the dark surface; accents carry light and dark variants
- **Decks live in hubs** — "Share to hub" saves the generated deck into that hub's Presentations tab (persisted, capped at five stored decks per hub) where it reopens in the built-in viewer
- **Workspace backup** — export the whole working dataset + branding as JSON from Settings, and import it on any machine

## Try it

```bash
# any static server works
python3 -m http.server 8000
# open http://localhost:8000
```

The landing page is `index.html`; the app is `app.html` (sign in with any credentials — demo workspace).
Pushes to the default branch auto-deploy to GitHub Pages via `.github/workflows/pages.yml`.

Generated presentation examples (what the Studio produces):

- `presentations/mueller-signature.html` — Signature tier, commercial proposal: full-bleed scroll deck with live TCO chart
- `presentations/mueller-essential.html` — Essential tier, same proposal as a clean template document
- `presentations/kowalski-intro-signature.html` — Signature tier, company introduction composed for a different customer and objective

## Structure

```
index.html                        public landing page (marketing)
app.html                          app shell (login, sidebar, topbar, overlays)
assets/styles.css                 design system — ink on ivory, terracotta accent, ambient motion
assets/app.js                     hash-routed SPA: views, charts, search, settings, notifications
assets/generator.js               deck generator — hub data → standalone HTML presentations
assets/data.js                    demo dataset (fictional tenant: NordCell Power AB)
assets/logo.svg / logo-mark.svg   the Mimra identity
presentations/*.html              hand-polished deck examples (self-contained files)
.github/workflows/pages.yml       GitHub Pages deployment
```

Design notes: chart colors follow a CVD-validated palette (categorical + sequential ramps),
marks follow fixed specs (thin bars, 2px lines, surface-ringed markers), motion honors
`prefers-reduced-motion`, and everything is responsive down to phone width.

## Demo data

All companies, people, prices and news items are **fictional**, invented for the demo:
tenant *NordCell Power AB*, customers *Müller Fördertechnik*, *Vestfjord Aqua*, *Baltika Marine*,
*Kowalski Logistyka*, *Lindqvist Automation*. Replace `assets/data.js` with live data to make it real.

## Roadmap (backend era)

- Real authentication, multi-tenant workspaces and a customer-side hub login
- LLM-composed Signature decks (the current generator is the template engine; Signature quality comes from composing narrative per customer — see the hand-polished examples)
- News ingestion per territory; travel scoring from live fair/flight/weather feeds
- Proposal e-signing and order flow
