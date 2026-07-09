# Verification suite — Kasper Kerje presentation hub

Automated checks for `Kasper_Kerje_Resan_Hub.html`, implementing the
verification checklist from `Prompt_Perfektion.md`.

## Running

```bash
npm install            # installs @playwright/test (browsers are provided by the environment)
npm test               # one pass of all ten checks
npm run test:10x       # ten consecutive passes; each must score >= 9/10 (90%)
```

## The ten checks (`tests/presentation.spec.js`)

1. **No JavaScript errors** — no console errors or uncaught exceptions on load or while scrolling through every section.
2. **Tag and brace balance** — equal opening/closing `style`, `script`, `section`, `svg`, `g`, `div`, `canvas`, `table`, `tr`, `p`, `a`, `button` tags, and balanced CSS braces.
3. **No en/em dashes** — none in the source or the rendered visible text; intervals use "till".
4. **No horizontal overflow — desktop** (1280px).
5. **No horizontal overflow — tablet** (768px).
6. **No horizontal overflow — mobile** (390px and 414px). Elements inside horizontal scroll containers are excluded, as the spec allows.
7. **Reveal engine** — deep content is still hidden at load (animations do not all fire at once) and reveals when scrolled into view.
8. **Map animation** — the expansion map starts drawing only once it is scrolled into view.
9. **Fonts embedded / offline-safe** — all faces are embedded as base64, no external font `src`, and the page issues zero external network requests.
10. **Print / PDF** — the print stylesheet keeps individual blocks and graphics whole at page breaks (`break-inside: avoid`), and Chromium renders the PDF the hub's download button produces.

## Browsers

The suite targets **Chromium**, which is pre-installed. It is engine-portable:
`playwright.config.js` adds a **WebKit** project automatically wherever the
WebKit browser is present. In this environment WebKit's download is blocked by
the network egress policy, so only Chromium runs here.
