# $CATE // the cat that compiles

Launch site for **$CATE** — a Solana memecoin with a coding/terminal identity,
built in the imfebu.com vein: dark, ember-orange, ASCII, CRT, occult.

No framework, no build step, no dependencies, no trackers, no backend. Open
`index.html` and it works.

```
index.html    markup, copy, and the contract address
styles.css    tokens, layout, atmosphere, responsive rules
main.js       every system below — rain, cat, market, forge, console…
vercel.json   headers (CSP + security + caching), clean URLs
og.png        1200×630 share card
robots.txt    crawl policy
```

## ⚠ Before you launch — the one thing you must change

The contract address is a **placeholder**. It lives in exactly one place:

```html
<!-- index.html -->
<code class="ca__value" id="ca-value">CATEp1acehoLderpLacehoLderpLacehoLderpump</code>
```

Paste your real mint there and everything downstream wires itself up:

- the copy button copies it
- the live price feed and the header strip start polling
- the chart / pump.fun / rugcheck links rewrite themselves to point at your token

`main.js` reads that element as the single source of truth — there is no second
copy to keep in sync. It validates the string as base58, 32–44 chars; the shipped
placeholder deliberately fails that test, which is why the feed sits idle until
you replace it.

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
  `object-src 'none'`, `frame-ancestors 'none'`. `connect-src` allows exactly one
  external origin: `https://api.dexscreener.com`.
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
| — | hero | ASCII wordmark, the cat, contract + copy, six live metrics |
| 00 | transmission | the "this is not a shrine" opener |
| 01 | readme.md | lore + count-up stat tiles |
| 02 | the nine lives | 9 cards: 4 spent, 1 burning, 4 sealed. Click to open |
| 03 | tokenomics | tabbed: `cate.config.toml` / `verify.sh` / `risks.md` |
| 04 | market | live chart, buy/sell pressure, timeframes, every pool |
| 05 | how to buy | five steps, wallet → swap |
| 06 | lore wars | filterable threads that expand into arguments |
| 07 | the litterbox | seeded sigil forge with PNG export + a curated wall |
| 08 | the ledger | append-only record of the den |
| 09 | git log | roadmap as a commit graph |
| 10 | the tech | chain, site, data, render, ritual |
| 11 | the colony | sect picker, manifest signing, live sect roll |
| 12 | faq | eight answers |
| — | disclaimer | not financial advice |

## The systems

**The cat** — the ASCII skull in the hero blinks on her own schedule (with the
occasional double-blink) and her pupils track your cursor. Pure text swapping in
a `<pre>`, throttled to one rAF per mousemove. Static under
`prefers-reduced-motion`.

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
