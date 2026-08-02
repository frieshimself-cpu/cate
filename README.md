# /prompt/cate — the cat that compiles

Launch site for **CATE**, a pump.fun / Solana memecoin with a coding-terminal
identity, built in the imfebu.com vein: dark, ember-orange, ASCII, CRT, occult.

No framework, no build step, no dependencies, no trackers, no backend. Open
`index.html` and it works.

```
config.js     ← the only file you edit at launch
index.html    markup and copy
styles.css    tokens, layout, atmosphere, responsive rules
main.js       every system below — cat, market, chain, forge, console…
vercel.json   headers (CSP + security + caching), clean URLs
og.png        1200×630 share card
robots.txt    crawl policy
```

## 🚀 Launching with your pump.fun coin

**One line.** Open `config.js`, paste the mint, deploy:

```js
window.CATE_CONFIG = {
  contract: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',   // ← your mint
  rpc: 'https://api.mainnet-beta.solana.com',
  socials: { x: 'https://x.com/…', telegram: '…', github: '…' },
};
```

That single value drives **everything**: the contract display and copy button,
the live DexScreener feed, the on-chain verifier, the pools table, the raid-kit
posts, the share card, and every chart / pump.fun / rugcheck / solscan link.
Nothing else needs editing.

### Before you have a mint

Leave `contract: ''`. The site runs in **pre-launch mode** — the contract row
says "not launched", the copy button hides, and every live panel shows an honest
"no contract yet" state instead of faking data. The warning line even reads
*"anyone posting an address for this token right now is lying."*

### Testing an address without committing it

While `contract` is empty you can preview any mint with `?ca=<address>`. A loud
red banner marks it as unofficial.

> **Once `contract` is set in `config.js`, `?ca=` is ignored entirely.** That is
> deliberate: otherwise anyone could send your holders a
> `yoursite.com/?ca=<scam>` link and the page would render a scam address inside
> your own branding. Verified: with a contract configured, the override is
> dropped and no banner appears.

### Launch phases — the LP-burn claim handles itself

You never burn anything manually. pump.fun creates the liquidity pool and burns
the LP tokens itself at graduation. The site reads which stage the coin is in and
words the claim accordingly, so it is never wrong:

| stage | banner | `cate.config.toml` | safety check |
| --- | --- | --- | --- |
| no contract set | hidden | `burned = unknown` | unchecked |
| **bonding curve** | "no liquidity pool yet — pump.fun creates it and burns the LP automatically at graduation" | `burned = false`, `locked = "on curve"` | `[~] lp burned — pending graduation` |
| **graduated** | "live on a DEX pool. LP was burned by pump.fun at graduation" | `burned = true`, `locked = "forever"` | `[✓] lp burned` |

Graduation is detected by a real DEX pool (pumpswap / raydium / orca / meteora)
appearing in the DexScreener feed. `phase` in the console prints the current
stage.

### What works on a fresh pump.fun launch

- **Token-2022 mints are handled.** New pump.fun tokens are Token-2022, not
  classic SPL — the verifier detects and labels both.
- **Bonding curve before graduation.** A brand-new mint has no DexScreener pool
  for a while. Instead of erroring, the market panel says *"contract is live but
  dexscreener has not indexed a pool yet — normal for a fresh pump.fun mint"* and
  the status reads `bonding curve`.
- **`pump.fun` badge** appears automatically next to the contract when the mint
  ends in `pump`.

### About the RPC

`getAccountInfo` works fine on the free public endpoint. **`getTokenLargestAccounts`
does not** — `api.mainnet-beta.solana.com` returns
`429 Too many requests for a specific RPC call` for that method, so the top-holders
panel will show a "set a dedicated endpoint" message with a Solscan fallback link
for most visitors. Drop in Helius / QuickNode / Triton in `config.js` and it
lights up.

> ⚠ If you change `rpc`, add the new origin to `connect-src` in `vercel.json`
> or the browser will block the request.

## Running it

```sh
python3 -m http.server 8000   # or: npx serve .
```

## Deploying to Vercel

There's no build step, so Vercel serves the repo root as-is.

**Dashboard:** New Project → import this repo → Framework Preset **Other** →
leave Build Command and Output Directory empty → Deploy. Make sure the
Production Branch matches the branch you're pushing to
(Settings → Git → Production Branch).

**CLI:**

```sh
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

`vercel.json` ships with:

- **`cleanUrls`** — `/index.html` serves at `/`
- **Security headers** — `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options: DENY`, `Permissions-Policy`, HSTS
- **A strict CSP** — `default-src 'self'`, no `unsafe-inline` scripts,
  `object-src 'none'`, `frame-ancestors 'none'`. `connect-src` allows exactly two
  external origins: `api.dexscreener.com` and `api.mainnet-beta.solana.com`.
- **Cache-Control** — HTML/CSS/JS revalidate (so a contract-address fix goes live
  immediately); images are immutable for a year.

Worth having on a coin site specifically: the CSP means an injected script can't
run and quietly swap the contract address on your visitors.

> ⚠ **The CSP pins the one inline script in `index.html` by SHA-256 hash.** If you
> edit that script, recompute the hash and update `script-src` in `vercel.json`,
> or the page breaks in production (it will still work locally, which is exactly
> how this bites people):
>
> ```sh
> printf "%s" "document.documentElement.className = 'js';" \
>   | openssl dgst -sha256 -binary | base64
> ```
>
> If you add a third-party script (analytics, a wallet SDK, a chart widget), add
> its origin to `script-src` — and any API it calls to `connect-src`.

**Other hosts:** plain static output, so Netlify, Cloudflare Pages, GitHub Pages
and `rsync` all work — they'll ignore `vercel.json`, so port the headers yourself.

## Sections

| # | Section | What's in it |
| --- | --- | --- |
| — | hero | wordmark, the cat, contract + copy, six live metrics |
| 00 | transmission | the "this is not a shrine" opener |
| 01 | readme.md | lore + count-up stat tiles |
| 02 | the nine lives | 9 cards: 4 spent, 1 burning, 4 sealed |
| 03 | tokenomics | tabbed config / verify.sh / risks.md |
| 04 | market | live chart, buy/sell pressure, timeframes, price watch, every pool |
| 05 | **on-chain** | **live RPC verification of mint/freeze/supply + top holders** |
| 06 | how to buy | five steps, wallet → swap |
| 07 | **raid kit** | **prewritten posts with the CA filled in + share-card generator** |
| 08 | lore wars | filterable threads that expand into arguments |
| 09 | the litterbox | seeded sigil forge with PNG export + a curated wall |
| 10 | the ledger | append-only record of the den |
| 11 | git log | roadmap as a commit graph |
| 12 | the tech | chain, site, data, render, ritual |
| 13 | the colony | sect picker, manifests, sect roll, achievements |
| 14 | faq | eight answers |
| — | disclaimer | not financial advice |

## The systems

**The cat** — a chunky pixel cat (ears, whiskers, nose) generated on a grid so
the symmetry is exact. She blinks on her own schedule, with occasional
double-blinks, and her pupils track your cursor. Pure text swapping in a `<pre>`,
throttled to one rAF per mousemove. Static under `prefers-reduced-motion`.

**On-chain verifier** (`05`) — the safety claims are not asserted, they're
*checked*, live, from the visitor's browser against a Solana JSON-RPC:
mint authority, freeze authority, total supply, decimals and token program each
get a real PASS/FAIL. The results feed back into the tokenomics checklist, so a
claim that fails on-chain turns red there too. Claims that can't be verified
on-chain (0% team, 0/0 tax) are marked `[·] asserted` rather than dressed up as
verified.

**Raid kit** (`07`) — five prewritten posts with the contract auto-filled, each
with copy and post buttons, plus a **share-card generator** that renders a
1200×630 PNG with the wordmark, the cat, your live price and your current sigil.

**Achievements** — six unlockables tracked in `localStorage`, with a counter in
the rail HUD.

**Price watch** — arm a percentage in the market panel and get a toast when price
moves that far. Tab-local, no notifications permission.

**ASCII rain** — canvas behind everything, capped at ~18fps, pauses on tab hide,
picks up the current palette accent.

**Live market panel** (`04`) — everything comes from the public
[DexScreener API](https://docs.dexscreener.com/api/reference): client-side
`fetch`, no key, no backend, no CORS proxy.
- a canvas price chart with area fill and glow
- buy/sell pressure bar from the 24h txn split
- 5m / 1h / 6h / 24h change grid
- a table of **every pool** holding the token, deepest liquidity first
- a mini sparkline in the sticky header strip

> The chart is **reconstructed** by walking backwards from the current price
> using the 24h/6h/1h/5m change figures — five points, not tick data. The panel
> says so on screen. DexScreener's free endpoint doesn't return candles; if you
> want real OHLC you'll need a different data source.

**The sigil forge** (`07`) — deterministic generative art. A seeded PRNG
(mulberry32) carves from *strokes* — a spine, symmetric arms, diagonal crowns,
then speckle — rather than pure noise, which is why they read as runes instead
of dust. Size and density sliders, seed loading, clipboard copy, and **PNG
export** (rendered to canvas, downloaded as a blob). Same seed + same settings,
same sigil, forever.

**Command palette** — <kbd>ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd>. Subsequence
matching, so `gtm` finds "go to market". Jumps to sections, runs console
commands, switches themes.

**Side rail** — on screens ≥1400px: section markers that track scroll position,
plus a HUD with session id, uptime and scroll percentage. There's also a thin
progress bar under the header at every size.

**The colony** (`11`) — pick a sect, write an oath, sign a manifest. Everything
is generated in the browser and **nothing is transmitted anywhere**; the page
and the FAQ both say so. Per-sect tallies live in `localStorage` and render as
a live roll.

Plus: cursor-tracked spotlight on panels, staggered section reveals, count-up
stats, toast notifications, film grain, and a Konami code.

## The console

Press <kbd>/</kbd>. It's a real command parser.

| command | does |
| --- | --- |
| `ca`, `copy` | print / copy the contract address |
| `price` | live price, mcap, 24h, liq, vol, txns, dex |
| `pools` | every pool, ranked by liquidity |
| `chart`, `buy` | open the chart, jump to how-to-buy |
| `tokenomics`, `verify` | the numbers, and how to check them |
| `lives`, `lore [status]`, `ledger` | the lore surfaces |
| `dig [seed]`, `png` | forge a sigil, export it |
| `whoami`, `ls`, `cd <s>`, `cat <f>` | navigation |
| `theme [name]` | `ember` · `acid` · `blood` · `bone` · `void` |
| `neofetch`, `date`, `echo`, `clear`, `exit` | as expected |

Arrow keys walk history, <kbd>Esc</kbd> closes. Undocumented: `wen`, `moon`,
`pet`, `sudo`, `rm`.

**Keyboard:** <kbd>/</kbd> console · <kbd>ctrl</kbd>+<kbd>k</kbd> palette ·
<kbd>t</kbd> theme · <kbd>g</kbd> dig a sigil · <kbd>1</kbd>–<kbd>7</kbd> jump.

## Everything to swap before launch

Most content is data at the top of `main.js` — edit the arrays, not the markup.

| What | Where |
| --- | --- |
| **Contract address** | `#ca-value` in `index.html` (see above) |
| Socials (X, Telegram, GitHub) | `#colony` — the `href="#"` links |
| Supply / tax / authorities | the TOML block in `#tokenomics` **and** the `tokenomics` console command |
| Risks copy | the `risks.md` tab pane in `#tokenomics` |
| The nine lives | `LIVES` in `main.js` |
| Lore threads | `THREADS` in `main.js` |
| Ledger entries | `LEDGER` in `main.js` |
| Roadmap | `COMMITS` in `main.js` |
| FAQ | `FAQ` in `main.js` |
| Sects | `SECTS` in `main.js` + the radio inputs in `#colony` |
| Wall seeds | `GALLERY_SEEDS` in `main.js` |
| Colours | `:root` and `[data-theme]` at the top of `styles.css` |
| Typewriter / boot text | `PHRASES` / `BOOT_LINES` in `main.js` |
| Share card | `og.png` — replace or regenerate |

The tokenomics claims (1B supply, 0/0 tax, revoked authorities, burned LP, 0%
team) are written to match a standard fair launch — **make them true, or change
them.** They're the first thing anyone will check.

## Accessibility & robustness

Skip link, semantic landmarks, visible focus rings, `aria-current` on the active
nav item, `aria-expanded` on the lives cards and lore threads, labelled
controls, `aria-live` on the forge, `role="dialog"` on the palette. A full
`prefers-reduced-motion` branch disables the boot sequence, rain, embers, grain,
glitch, flicker, typewriter, cursor tracking and scroll reveals. An inline `html.js`
class gates JS-only affordances, so the page stays readable with JavaScript
disabled. Clipboard falls back to `execCommand` on non-secure origins.

Verified in headless Chromium: no console errors, zero horizontal overflow at
390px, and every interactive system exercised — cursor tracking, tabs, count-up
stats, thread expansion, forge sliders, PNG export, command palette, colony
signing, console commands. The market panel was run against a **real
DexScreener payload** (chart pixels asserted drawn, 30 pools rendered), and the
whole page re-tested behind the exact production headers from `vercel.json` —
zero CSP violations.
