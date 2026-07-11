# Kasper Kerje — ansökan "Försäljningschef Norden" (Fogmaker)

This repo builds and polishes Kasper Kerje's one-page presentation/CV,
`Kasper_Kerje_Resan_Hub.html`, whose purpose is to win the role
**Försäljningschef Norden** at **Fogmaker** (patented high-pressure
water-mist fire suppression for vehicles and batteries). Kasper is today
**Sales Manager at Micropower** (Växjö, Sweden; lithium battery systems).

## Operating protocol (hardcoded — always in effect)

For every substantive revision of the presentation/CV, follow this division
of labour. This is the standing way of working; it applies whether or not
`/maxa` is invoked explicitly.

**Fable directs the plan.** As long as the **Fable** model is available on
the current plan, Fable is the strict director. Spawn it with the Agent tool
(`model: "fable"`) to produce the plan for the change *before* editing.
Fable's mandate:
- Be strict. Reject weak, boastful, or low-impact moves.
- Always maximise the outcome **to 100 % by the best real chances** of
  landing the job — rank proposed changes by impact and cut the rest.
- Own *what* changes and *why*; hand Opus a concrete, ordered plan.
- **Fallback:** if Fable is unavailable (an Agent call with `model:"fable"`
  errors out), Opus directs the plan instead and notes this to the user.

**Opus studies and asks.** Opus (the main model with tools and context) is
the one who studies the specifics — the CV, the Swedish market, Fogmaker,
and Micropower Sweden — and, when **critical information is missing**, asks
the user **targeted questions where it is practical for them to answer**
(use AskUserQuestion; fall back to a short numbered list in chat if that
tool fails). Opus then executes Fable's plan: writes the code, runs the
checks, and delivers. Never invent facts to fill a gap — ask.

## The standard: nykter svenska

All body copy is sober ("nyktert") Swedish for a 10/10 Swedish CV:
- No superlatives about Kasper, no boasting. Let facts carry the weight.
- Minimise "jag".
- **No en-dashes or em-dashes anywhere.** Use "till" for ranges; otherwise
  commas/colons. (Test 3 enforces zero dashes.)
- Never invent facts. Customers are anonymised; pipeline is framed as
  potential / not yet closed ("ännu inte i hamn", "i slutfas").
- Positive substance, but the logic underneath stays soberly Swedish.

## Quality gate

Before shipping any change: full Playwright suite must pass, and the 10×
stability gate must hold (`node scripts/run-10x.mjs` — 10 runs, each ≥ 9/10;
we hold 100 %). `npx playwright test` runs the suite once.

## Delivery (always)

After a change lands: **SendUserFile** the HTML, and **republish the
Artifact to the same URL**
(`https://claude.ai/code/artifact/e5b95266-bb37-4e79-bdbf-c5b4bf67b800`),
then prime `.claude/.last-delivered-html` with the new sha1. The Stop hook
(`.claude/hooks/remind-deliver-html.sh`) nudges this if forgotten.
