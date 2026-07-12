---
name: maxa
description: Maximise Kasper Kerje's Fogmaker application. Fable directs a strict, outcome-maximising plan; Opus studies the specifics (CV, Sweden, Fogmaker, Micropower) and asks about critical gaps; then executes, verifies against the 10x gate, and delivers. Use for any substantive revision of Kasper_Kerje_Resan_Hub.html.
---

# /maxa — Fable directs, Opus studies

Run this for any substantive change to `Kasper_Kerje_Resan_Hub.html`. It
encodes the hardcoded protocol in `CLAUDE.md`. Follow the steps in order.

## 1. Opus studies (before planning)
Read what the change touches. Ground yourself in the specifics:
- the CV / the section(s) in question,
- the Swedish market, Fogmaker (the role + product), Micropower Sweden.
Gather the concrete facts you already have (this repo, the conversation,
uploaded images). Note what is **missing and critical** to the change.

## 2. Opus asks (only what's critical + practical)
If a critical fact is missing or a choice is genuinely the user's, ask
**targeted** questions via AskUserQuestion (fall back to a short numbered
list in chat if that tool fails). Do not ask about things you can decide
from context or sensible defaults. Never invent facts to skip this.

## 3. Fable directs the plan
Spawn Fable as the strict director:
`Agent(subagent_type:"claude", model:"fable", run_in_background:false)`.
Give it: the goal (win Försäljningschef Norden), the nykter-svenska
standard, the concrete facts from step 1, the answers from step 2, and the
current text. Ask it to return an **ordered, impact-ranked plan** that
maximises the outcome to 100 % by the best real chances — and to cut weak
or boastful moves. For open creative copy, have Fable draft 2 variants and
pick/synthesise the stronger.
- **Fallback:** if the Fable agent errors (model unavailable on the plan),
  Opus writes the plan instead and tells the user Fable was unavailable.

## 4. Opus executes
Apply Fable's plan with Edit/Write. Keep every rule in `CLAUDE.md`
(nyktert, no dashes, minimal "jag", no invented facts). Screenshot the
touched sections (`node scripts/shot-sections.mjs <width> <tag>`) and read
them back to confirm layout on desktop and mobile.

## 5. Verify (gate)
`npx playwright test` (suite green), then `node scripts/run-10x.mjs`
(10 runs, each ≥ 9/10; hold 100 %). Fix and re-run until it holds.

## 6. Deliver
Commit + push to the working branch. Republish the Artifact to the **same
URL** in `CLAUDE.md`. `SendUserFile` the HTML. **Always paste the clickable
Artifact link in the reply** (not only the file). Re-prime
`.claude/.last-delivered-html` with the new sha1. Summarise what changed
and why it raises the odds.
