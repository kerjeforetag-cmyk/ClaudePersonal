# Minra — the sales hub

**Minra** (app.minra) is a modern B2B sales platform built around one idea: the sales manager
should spend their time selling, not doing administration, graphic design or market research.
Minra does that part.

This repository contains **Minra v1** — a fully working, dependency-free product prototype.
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

## Try it

```bash
# any static server works
python3 -m http.server 8000
# open http://localhost:8000
```

Or just open `index.html` in a browser. Sign in with any credentials (demo workspace).

Generated presentation examples (what the Studio produces):

- `presentations/mueller-signature.html` — Signature tier, commercial proposal: full-bleed scroll deck with live TCO chart
- `presentations/mueller-essential.html` — Essential tier, same proposal as a clean template document
- `presentations/kowalski-intro-signature.html` — Signature tier, company introduction composed for a different customer and objective

## Structure

```
index.html                        app shell (login, sidebar, topbar)
assets/styles.css                 design system — ink on ivory, terracotta accent, ambient motion
assets/app.js                     hash-routed SPA: views, charts, generator, help notes
assets/data.js                    demo dataset (fictional tenant: NordCell Power AB)
presentations/*.html              generated deck examples (self-contained files)
```

Design notes: chart colors follow a CVD-validated palette (categorical + sequential ramps),
marks follow fixed specs (thin bars, 2px lines, surface-ringed markers), motion honors
`prefers-reduced-motion`, and everything is responsive down to phone width.

## Demo data

All companies, people, prices and news items are **fictional**, invented for the demo:
tenant *NordCell Power AB*, customers *Müller Fördertechnik*, *Vestfjord Aqua*, *Baltika Marine*,
*Kowalski Logistyka*, *Lindqvist Automation*. Replace `assets/data.js` with live data to make it real.

## Roadmap (v2+)

- Real authentication, multi-tenant workspaces and customer-side hub view
- Presentation generation service (LLM-composed Signature decks from hub data)
- News ingestion per territory; travel scoring from live fair/flight/weather feeds
- Proposal e-signing, hub notifications, PDF export
