/* ============================================================
   Mimra — demo dataset
   Fictional tenant: NordCell Power AB (industrial battery systems)
   All companies, people, prices and news items are invented for
   the product demo. Replace with live data via the Mimra API.
   ============================================================ */

window.MIMRA = {

  tenant: {
    name: "NordCell Power AB",
    tagline: "Industrial battery systems & charging",
    user: { name: "Alex Kjellberg", email: "alex@nordcell.se", role: "Sales Manager, Northern & Central Europe", initials: "AK" },
    members: [
      { name: "Alex Kjellberg", role: "Sales Manager", level: "Owner" },
      { name: "Maja Berg", role: "Inside Sales", level: "Editor" },
      { name: "Tomas Ek", role: "Finance", level: "Viewer" }
    ],
    territories: ["Nordics", "DACH", "Baltics", "Poland"],
    currency: "EUR"
  },

  kpis: {
    pipelineValue: 2840000,
    pipelineDelta: +12.4,
    hubEngagement: 87,        // % of invited customers active last 30 days
    engagementDelta: +6,
    decksGenerated: 34,
    decksDelta: +9,
    openProposals: 11,
    proposalsDelta: -2,
    pipelineTrend: [1.62, 1.71, 1.68, 1.80, 1.94, 2.02, 1.97, 2.21, 2.30, 2.42, 2.61, 2.84], // €M, 12 months
    pipelineByStage: [
      { stage: "Qualified", value: 640000 },
      { stage: "Hub invited", value: 520000 },
      { stage: "Proposal sent", value: 880000 },
      { stage: "Negotiation", value: 560000 },
      { stage: "Verbal commit", value: 240000 }
    ]
  },

  hubs: [
    {
      id: "mueller",
      company: "Müller Fördertechnik GmbH",
      country: "Germany", flag: "🇩🇪",
      industry: "Intralogistics & forklift fleets",
      contact: "Jürgen Bade",
      contactRole: "Head of Procurement",
      stage: "Proposal sent",
      expectedClose: "2026-10",
      value: 480000,
      health: "good",
      lastActivity: "2026-07-06",
      members: 6,
      activity30d: [2,4,3,6,5,8,7,9,6,11,9,12],
      accent: "#2a78d6",
      about: "Family-owned intralogistics operator in Baden-Württemberg running a mixed fleet of ~310 forklifts across 4 distribution sites. Evaluating full conversion from lead-acid to Li-ion with opportunity charging.",
      priceList: [
        { sku: "NC-LI4880", name: "NordCell Li-ion 48V / 800Ah pack", list: 11900, hub: 10400, moq: 10 },
        { sku: "NC-LI4860", name: "NordCell Li-ion 48V / 600Ah pack", list: 9200, hub: 8100, moq: 10 },
        { sku: "NC-CHG30", name: "SmartCharge 30kW opportunity charger", list: 6400, hub: 5700, moq: 4 },
        { sku: "NC-CHG10", name: "SmartCharge 10kW depot charger", list: 2900, hub: 2560, moq: 8 },
        { sku: "NC-BMS-FLEET", name: "FleetView telemetry & BMS license (per unit / yr)", list: 240, hub: 190, moq: 50 }
      ],
      docs: [
        { name: "NC-LI4880 technical datasheet", type: "PDF", size: "2.1 MB", updated: "2026-06-28" },
        { name: "SmartCharge 30kW installation guide", type: "PDF", size: "4.8 MB", updated: "2026-06-12" },
        { name: "CE & UN38.3 certificates bundle", type: "ZIP", size: "9.3 MB", updated: "2026-05-30" },
        { name: "FleetView API reference", type: "HTML", size: "—", updated: "2026-06-20" }
      ],
      proposals: [
        { name: "Fleet electrification — Phase 1 (Ludwigsburg site)", value: 480000, status: "Awaiting customer", sent: "2026-06-30" },
        { name: "Pilot: 12 trucks + 4 chargers", value: 96000, status: "Accepted", sent: "2026-04-14" }
      ],
      presentations: [
        { name: "Fleet Electrification Proposal — Signature", tier: "Signature", url: "presentations/mueller-signature.html", generated: "2026-07-05", views: 14,
          slideStats: [["Cover", 18], ["Situation", 42], ["Proposal", 55], ["The numbers", 96], ["Pricing", 128], ["Technical fit", 64], ["Rollout", 31], ["Next step", 22]] },
        { name: "Fleet Electrification Proposal — Essential", tier: "Essential", url: "presentations/mueller-essential.html", generated: "2026-07-05", views: 5 }
      ],
      timeline: [
        { when: "2026-07-06 14:12", who: "Jürgen Bade", what: "Viewed Signature presentation (slides 1–9, 6 min)" },
        { when: "2026-07-04 09:30", who: "Alex Kjellberg", what: "Shared updated hub price list (Q3 rates)" },
        { when: "2026-07-01 16:44", who: "Petra Vogel", what: "Downloaded CE & UN38.3 certificates bundle" },
        { when: "2026-06-30 11:05", who: "Alex Kjellberg", what: "Sent proposal: Fleet electrification — Phase 1" },
        { when: "2026-06-24 10:18", who: "Jürgen Bade", what: "Commented on NC-LI4880 datasheet: \"Need C-rate at −10°C\"" }
      ]
    },
    {
      id: "vestfjord",
      company: "Vestfjord Aqua AS",
      country: "Norway", flag: "🇳🇴",
      industry: "Aquaculture workboats",
      contact: "Ingrid Solheim",
      contactRole: "Technical Director",
      stage: "Negotiation",
      expectedClose: "2026-09",
      value: 340000,
      health: "good",
      lastActivity: "2026-07-03",
      members: 4,
      activity30d: [1,3,2,4,4,5,3,6,7,5,8,7],
      accent: "#1baf7a",
      about: "Operates 22 electric workboats servicing salmon farms in Nordland. Hybrid-to-full-electric refit program 2026–2028.",
      priceList: [
        { sku: "NC-MR4890", name: "Marine Li-ion 48V / 900Ah IP67 pack", list: 14800, hub: 13200, moq: 4 },
        { sku: "NC-MR2445", name: "Marine Li-ion 24V / 450Ah IP67 pack", list: 7600, hub: 6900, moq: 4 },
        { sku: "NC-SHORE22", name: "ShorePower 22kW quay charger", list: 8900, hub: 8200, moq: 2 },
        { sku: "NC-BMS-MAR", name: "FleetView Marine telemetry (per vessel / yr)", list: 320, hub: 260, moq: 8 }
      ],
      docs: [
        { name: "NC-MR4890 marine datasheet (IP67, DNV)", type: "PDF", size: "1.9 MB", updated: "2026-06-15" },
        { name: "DNV-GL type approval certificate", type: "PDF", size: "3.2 MB", updated: "2026-05-08" },
        { name: "Enova subsidy application — pre-filled template", type: "DOCX", size: "410 kB", updated: "2026-07-01" }
      ],
      proposals: [
        { name: "Workboat refit — batch 2 (8 vessels)", value: 340000, status: "In negotiation", sent: "2026-06-18" },
        { name: "Batch 1 pilot — 3 vessels", value: 128000, status: "Accepted", sent: "2025-11-02" }
      ],
      presentations: [],
      timeline: [
        { when: "2026-07-03 10:20", who: "Ingrid Solheim", what: "Downloaded Enova subsidy template" },
        { when: "2026-06-30 15:41", who: "Alex Kjellberg", what: "Updated batch-2 pricing after Enova ceiling raise" },
        { when: "2026-06-18 09:02", who: "Alex Kjellberg", what: "Sent proposal: Workboat refit — batch 2" }
      ]
    },
    {
      id: "baltika",
      company: "Baltika Marine OÜ",
      country: "Estonia", flag: "🇪🇪",
      industry: "Harbor & ferry operations",
      contact: "Marten Kask",
      contactRole: "Fleet Manager",
      stage: "Hub invited",
      expectedClose: "2026-12",
      value: 210000,
      health: "warning",
      lastActivity: "2026-06-21",
      members: 2,
      activity30d: [3,2,1,2,1,0,1,0,0,1,0,0],
      accent: "#eda100",
      about: "Tallinn harbor services company. Interest in shore-charging infrastructure; procurement paused until Q4 budget review.",
      priceList: [],
      docs: [
        { name: "Shore charging for harbor fleets — whitepaper", type: "PDF", size: "5.4 MB", updated: "2026-05-20" }
      ],
      proposals: [],
      presentations: [],
      timeline: [
        { when: "2026-06-21 11:05", who: "Marten Kask", what: "Viewed shore-charging whitepaper (2 min)" },
        { when: "2026-05-19 14:30", who: "Alex Kjellberg", what: "Invited Baltika Marine team to the hub" }
      ]
    },
    {
      id: "kowalski",
      company: "Kowalski Logistyka Sp. z o.o.",
      country: "Poland", flag: "🇵🇱",
      industry: "3PL warehousing",
      contact: "Agnieszka Nowak",
      contactRole: "COO",
      stage: "Qualified",
      expectedClose: "2026-11",
      value: 390000,
      health: "good",
      lastActivity: "2026-07-05",
      members: 3,
      activity30d: [0,1,2,2,3,4,4,6,5,7,8,9],
      accent: "#4a3aa7",
      about: "Fast-growing 3PL with new 60,000 m² facility near Łódź. Greenfield opportunity — full Li-ion fleet from day one.",
      priceList: [
        { sku: "NC-LI4880", name: "NordCell Li-ion 48V / 800Ah pack", list: 11900, hub: 10900, moq: 10 },
        { sku: "NC-CHG30", name: "SmartCharge 30kW opportunity charger", list: 6400, hub: 5950, moq: 4 },
        { sku: "NC-BMS-FLEET", name: "FleetView telemetry & BMS license (per unit / yr)", list: 240, hub: 200, moq: 40 }
      ],
      docs: [
        { name: "Greenfield charging layout guide (indoor, PL code 2027)", type: "PDF", size: "3.7 MB", updated: "2026-06-29" },
        { name: "NC-LI4880 technical datasheet", type: "PDF", size: "2.1 MB", updated: "2026-06-28" }
      ],
      proposals: [],
      presentations: [
        { name: "Company introduction — Signature", tier: "Signature", url: "presentations/kowalski-intro-signature.html", generated: "2026-07-06", views: 3,
          slideStats: [["Cover", 12], ["Who we are", 34], ["What we make", 48], ["Greenfield", 87], ["Proof", 40], ["How we work", 25], ["Next step", 15]] }
      ],
      timeline: [
        { when: "2026-07-05 16:12", who: "Agnieszka Nowak", what: "Viewed company introduction deck (full, 4 min)" },
        { when: "2026-07-02 09:44", who: "Alex Kjellberg", what: "Shared greenfield charging layout guide" },
        { when: "2026-06-26 13:00", who: "Agnieszka Nowak", what: "Asked in hub: \"Can FleetView export to our WMS?\"" }
      ]
    },
    {
      id: "lindqvist",
      company: "Lindqvist Automation AB",
      country: "Sweden", flag: "🇸🇪",
      industry: "AGV & warehouse automation",
      contact: "Sara Lindqvist",
      contactRole: "CEO",
      stage: "Verbal commit",
      expectedClose: "2027-01",
      value: 240000,
      health: "good",
      lastActivity: "2026-07-07",
      members: 5,
      activity30d: [4,5,6,5,7,8,9,8,10,9,11,12],
      accent: "#e34948",
      about: "OEM partner integrating NordCell packs into AGV platforms. Frame agreement for 2027 in verbal commit.",
      priceList: [
        { sku: "NC-OEM48", name: "48V OEM battery module (per module, volume tier)", list: 2100, hub: 1680, moq: 100 },
        { sku: "NC-BMS-OEM", name: "Embedded BMS license (per platform / yr)", list: 190, hub: 150, moq: 100 }
      ],
      docs: [
        { name: "OEM integration handbook (CAN, mechanical, thermal)", type: "PDF", size: "6.1 MB", updated: "2026-06-10" },
        { name: "Frame agreement 2027 — draft v3", type: "DOCX", size: "290 kB", updated: "2026-07-04" }
      ],
      proposals: [
        { name: "Frame agreement 2027 — 1,200 modules", value: 240000, status: "Verbal commit", sent: "2026-06-12" }
      ],
      presentations: [],
      timeline: [
        { when: "2026-07-07 08:55", who: "Sara Lindqvist", what: "Commented on frame agreement draft v3: \"Legal OK from our side\"" },
        { when: "2026-07-04 11:20", who: "Alex Kjellberg", what: "Uploaded frame agreement draft v3" },
        { when: "2026-06-12 10:00", who: "Alex Kjellberg", what: "Sent proposal: Frame agreement 2027" }
      ]
    }
  ],

  news: [
    { territory: "DACH", date: "2026-07-06", source: "Logistik Heute", tag: "Market",
      title: "German intralogistics orders up 9% in H1 as warehouse automation rebounds",
      body: "Order intake across German material-handling suppliers grew 9.2% year-on-year, driven by retrofit and electrification projects." },
    { territory: "DACH", date: "2026-07-04", source: "Handelsblatt", tag: "Regulation",
      title: "Berlin extends e-mobility depreciation scheme to industrial trucks",
      body: "Accelerated depreciation now covers Li-ion forklift fleets — a direct tailwind for conversion business cases." },
    { territory: "DACH", date: "2026-06-30", source: "LogiMAT press", tag: "Event",
      title: "LogiMAT 2027 exhibitor registration opens; hall 10 dedicated to energy systems",
      body: "Stuttgart fair confirms a dedicated energy hall. Early-bird stand booking closes October 15." },
    { territory: "Nordics", date: "2026-07-05", source: "Dagens Industri", tag: "Market",
      title: "Swedish 3PL sector consolidates: two major warehouse operators announce merger",
      body: "Combined entity will operate 14 sites — procurement contacts likely to be centralized in Gothenburg." },
    { territory: "Nordics", date: "2026-07-02", source: "IntraFish", tag: "Market", relatedHub: "vestfjord",
      title: "Norway raises subsidy ceiling for electric workboats to NOK 4.5m per vessel",
      body: "Enova scheme update improves ROI for aquaculture fleet electrification by 15–20%." },
    { territory: "Baltics", date: "2026-06-28", source: "ERR News", tag: "Tender", relatedHub: "baltika",
      title: "Port of Tallinn publishes tender for shore-power and charging infrastructure",
      body: "€8.2M framework, submissions due September 30. Baltika Marine named as an operating partner in the RFI." },
    { territory: "Poland", date: "2026-07-03", source: "Puls Biznesu", tag: "Market", relatedHub: "kowalski",
      title: "Łódź logistics corridor attracts record warehouse investment in Q2",
      body: "410,000 m² of new capacity signed — three greenfield operators without incumbent energy suppliers." },
    { territory: "Poland", date: "2026-06-25", source: "PSPA", tag: "Regulation",
      title: "Poland notifies EU of new energy-storage safety code for indoor charging rooms",
      body: "New ventilation and BMS-telemetry requirements from 2027 — favors suppliers with certified fleet telemetry." }
  ],

  travel: {
    suggestions: [
      {
        id: "stuttgart",
        destination: "Stuttgart, Germany",
        window: "Sep 21 – Sep 25, 2026",
        score: 94,
        reasons: [
          "Müller Fördertechnik board reviews Phase-1 proposal week 39",
          "Motek trade fair (Sep 22–25) — 4 key prospects exhibiting",
          "Flight index 18% below seasonal average that week",
          "Jürgen Bade confirmed availability Mon–Wed"
        ],
        days: [
          { d: "Sep 14", s: 55 }, { d: "Sep 15", s: 58 }, { d: "Sep 16", s: 60 }, { d: "Sep 17", s: 64 },
          { d: "Sep 18", s: 62 }, { d: "Sep 19", s: 40 }, { d: "Sep 20", s: 45 },
          { d: "Sep 21", s: 88 }, { d: "Sep 22", s: 96 }, { d: "Sep 23", s: 94 }, { d: "Sep 24", s: 90 },
          { d: "Sep 25", s: 82 }, { d: "Sep 26", s: 48 }, { d: "Sep 27", s: 42 }
        ],
        meetings: [
          { who: "Jürgen Bade — Müller Fördertechnik", slot: "Sep 22, 09:00", note: "Phase-1 proposal walkthrough (use Signature deck)", dtStart: "20260922T090000", dtEnd: "20260922T100000" },
          { who: "Anke Sommer — Süddeutsche Fördertechnik (distributor)", slot: "Sep 22, 15:30", note: "2027 stocking agreement", dtStart: "20260922T153000", dtEnd: "20260922T163000" },
          { who: "Motek hall 8 — prospect sweep", slot: "Sep 23, all day", note: "4 target OEMs exhibiting", dtStart: "20260923T090000", dtEnd: "20260923T170000" }
        ]
      },
      {
        id: "tallinn",
        destination: "Tallinn, Estonia",
        window: "Oct 5 – Oct 7, 2026",
        score: 78,
        reasons: [
          "Port of Tallinn tender Q&A session Oct 6",
          "Baltika Marine budget review completes Oct 1 — re-engage in person",
          "Combine with Helsinki ferry day-trip (2 dormant accounts)"
        ],
        days: [
          { d: "Sep 28", s: 40 }, { d: "Sep 29", s: 44 }, { d: "Sep 30", s: 52 }, { d: "Oct 1", s: 60 },
          { d: "Oct 2", s: 58 }, { d: "Oct 3", s: 35 }, { d: "Oct 4", s: 38 },
          { d: "Oct 5", s: 84 }, { d: "Oct 6", s: 90 }, { d: "Oct 7", s: 80 },
          { d: "Oct 8", s: 55 }, { d: "Oct 9", s: 50 }, { d: "Oct 10", s: 30 }, { d: "Oct 11", s: 28 }
        ],
        meetings: [
          { who: "Marten Kask — Baltika Marine", slot: "Oct 5, 13:00", note: "Reactivate hub; shore-charging scope", dtStart: "20261005T130000", dtEnd: "20261005T140000" },
          { who: "Port of Tallinn — tender Q&A", slot: "Oct 6, 10:00", note: "€8.2M framework, register by Sep 20", dtStart: "20261006T100000", dtEnd: "20261006T110000" }
        ]
      }
    ]
  },

  competitors: [
    {
      vendor: "VoltEdge Systems", product: "VE-48/800 Li-ion pack", comparableTo: "NC-LI4880",
      price: 12800, kind: "verified", source: "Public tender award, Hamburg Port Authority", checked: "2026-05-11"
    },
    {
      vendor: "VoltEdge Systems", product: "VE-Rapid 30kW charger", comparableTo: "NC-CHG30",
      price: 7100, kind: "verified", source: "Distributor price list Q2-2026 (Süddeutsche Fördertechnik)", checked: "2026-06-02"
    },
    {
      vendor: "Accumat GmbH", product: "AM-Power 48-750", comparableTo: "NC-LI4880",
      price: 10900, kind: "estimated", source: "OEM estimate — derived from AGV platform teardown pricing", checked: "2026-04-20"
    },
    {
      vendor: "Accumat GmbH", product: "AM-Charge 25kW", comparableTo: "NC-CHG30",
      price: 5900, kind: "estimated", source: "OEM estimate — reseller margin model (−22% off list)", checked: "2026-04-20"
    },
    {
      vendor: "PowerCore Industries", product: "PC-M48 800Ah", comparableTo: "NC-LI4880",
      price: 11750, kind: "verified", source: "Quote shared by Kowalski Logistyka (with permission)", checked: "2026-06-27"
    },
    {
      vendor: "PowerCore Industries", product: "PC-Fleet telemetry (per unit / yr)", comparableTo: "NC-BMS-FLEET",
      price: 310, kind: "estimated", source: "OEM estimate — SaaS pricing page, volume tier extrapolated", checked: "2026-06-27"
    }
  ],

  people: [
    { country: "Germany", flag: "🇩🇪", name: "Jürgen Bade", role: "Head of Procurement", org: "Müller Fördertechnik",
      note: "Decision maker for Phase 1. Data-driven; wants TCO at −10°C. Prefers morning meetings.", meet: "Motek, Sep 22–25" },
    { country: "Germany", flag: "🇩🇪", name: "Anke Sommer", role: "Managing Director", org: "Süddeutsche Fördertechnik (distributor)",
      note: "Covers 40+ mid-size fleets in Bavaria/BW. Key channel for 2027. Values exclusivity terms.", meet: "Motek, Sep 22" },
    { country: "Germany", flag: "🇩🇪", name: "Petra Vogel", role: "Site Engineering Lead", org: "Müller Fördertechnik",
      note: "Technical gatekeeper — owns charging-room compliance. Downloaded all certificates.", meet: "Site visit, Ludwigsburg" },
    { country: "Norway", flag: "🇳🇴", name: "Ingrid Solheim", role: "Technical Director", org: "Vestfjord Aqua",
      note: "Champion for full-electric refit. Needs Enova subsidy paperwork support.", meet: "Aqua Nor, Trondheim (Aug)" },
    { country: "Estonia", flag: "🇪🇪", name: "Marten Kask", role: "Fleet Manager", org: "Baltika Marine",
      note: "Engagement dropped since June — budget freeze until Q4. Tender partner for Port of Tallinn.", meet: "Tallinn, Oct 5" },
    { country: "Poland", flag: "🇵🇱", name: "Agnieszka Nowak", role: "COO", org: "Kowalski Logistyka",
      note: "Greenfield site decision by November. Comparing NordCell vs PowerCore. Responds fast in hub.", meet: "Video call, weekly" },
    { country: "Sweden", flag: "🇸🇪", name: "Sara Lindqvist", role: "CEO", org: "Lindqvist Automation",
      note: "OEM frame agreement in verbal commit. Wants co-marketing at LogiMAT 2027.", meet: "Gothenburg office" }
  ],

  studio: {
    objectives: [
      { id: "proposal", name: "Commercial proposal", desc: "Pricing, TCO, rollout plan — built to close." },
      { id: "intro", name: "Company introduction", desc: "First meeting — who you are, proof, references." },
      { id: "renewal", name: "Renewal / expansion", desc: "Results so far, next-phase scope and pricing." },
      { id: "tender", name: "Tender response", desc: "Structured compliance answer with evidence annexes." }
    ],
    tiers: [
      {
        id: "essential", name: "Essential", price: "Included",
        desc: "Template-based HTML deck from your hub data. Clean, fast, on-brand.",
        bullets: ["Generated in ~20 seconds", "Your logo, colors and price list", "Share as hub link or PDF"]
      },
      {
        id: "signature", name: "Signature", price: "€29 / deck",
        desc: "Bespoke, code-generated presentation — layout, charts and copy composed for this customer.",
        bullets: ["Custom narrative & data storytelling", "Live charts from hub data", "Ambient motion, print-perfect", "Best results — recommended for proposals"],
        recommended: true
      }
    ]
  }
};
