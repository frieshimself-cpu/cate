# $CATE // the cat that compiles

Launch site for **$CATE** — a Solana memecoin with a coding/terminal identity,
built in the imfebu.com vein: dark, ember-orange, ASCII, CRT, occult.

No framework, no build step, no dependencies, no trackers, no backend. Open
`index.html` and it works.

```
index.html    markup + all copy + the contract address
styles.css    tokens, layout, atmosphere, responsive rules
main.js       rain, boot, forge, lives, lore, colony, console, live feed
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
| — | hero | ASCII wordmark, skull sigil, contract + copy, buy/chart, six live metrics |
| 00 | transmission | the "this is not a shrine" opener |
| 01 | readme.md | lore — compiled, not minted |
| 02 | the nine lives | 9 interactive cards: 4 spent, 1 burning, 4 sealed. Click to open |
| 03 | tokenomics | supply/tax/authorities as TOML, distribution bar, safety checks |
| 04 | how to buy | five steps, wallet → swap |
| 05 | lore wars | contested threads, filterable by status |
| 06 | the litterbox | seeded generative sigil forge + a curated wall |
| 07 | git log | roadmap as a commit graph |
| 08 | the tech | chain, site, data, ritual + `verify.sh` |
| 09 | the colony | sect picker, manifest signing, local counter |
| 10 | faq | six answers |
| — | disclaimer | not financial advice |

## The systems

**ASCII rain** — canvas behind everything, capped at ~18fps, pauses on tab hide,
picks up whatever the current palette accent is. Off entirely under
`prefers-reduced-motion`.

**The sigil forge** (`06`) — deterministic generative art. A seeded PRNG
(mulberry32) carves a sigil out of *strokes* — a spine, symmetric arms, diagonal
crowns, then speckle — rather than pure noise, which is why they read as runes
instead of dust. Same seed, same sigil, forever. Dig a random one, paste someone
else's seed, or click the wall. `dig <seed>` works in the console too, and
<kbd>g</kbd> digs from anywhere.

**Live market data** — the hero metrics and the sticky header strip pull from the
public [DexScreener API](https://docs.dexscreener.com/api/reference): client-side
`fetch`, no key, no backend, no CORS proxy. Picks the deepest-liquidity pool,
refreshes every 60s, colours 24h green/red. Degrades to `—` with an explanatory
note when there's no pool, no network, or no real CA. Sub-cent prices render in
full (`$0.00000275`), not scientific notation.

**The colony** (`09`) — pick a sect, write an oath, sign a manifest. Everything is
generated in the browser and **nothing is transmitted anywhere**; the page says so
on screen. The counter is `localStorage`, per-browser. If you want real
submissions, point the form at Formspree or a worker.

## The console

Press <kbd>/</kbd>. It's a real command parser.

| command | does |
| --- | --- |
| `ca`, `copy` | print / copy the contract address |
| `price` | live price, mcap, 24h, liq, txns, dex |
| `buy`, `chart` | jump to how-to-buy, open the chart |
| `tokenomics`, `verify` | the numbers, and how to check them |
| `lives` | the nine lives manifest |
| `lore [status]` | threads, optionally filtered |
| `dig [seed]` | forge a sigil in the terminal |
| `whoami`, `ls`, `cd <s>`, `cat <f>` | navigation |
| `theme [name]` | `ember` · `acid` · `blood` · `bone` · `void` |
| `neofetch`, `date`, `echo`, `clear`, `exit` | as expected |

Arrow keys walk history, <kbd>Esc</kbd> closes. Undocumented: `wen`, `moon`,
`pet`, `sudo`, `rm`. There's also a Konami code.

**Keyboard:** <kbd>/</kbd> console · <kbd>t</kbd> palette · <kbd>g</kbd> dig a
sigil · <kbd>1</kbd>–<kbd>7</kbd> jump to sections.

## Everything to swap before launch

| What | Where |
| --- | --- |
| **Contract address** | `#ca-value` in `index.html` (see above) |
| Socials (X, Telegram, GitHub) | `#colony` — the `href="#"` links |
| Supply / tax / authorities | the TOML block in `#tokenomics` **and** the `tokenomics` console command in `main.js` |
| The nine lives | `#lives` cards in HTML **and** the `LIVES` map in `main.js` |
| Lore threads | `<li class="thread">` entries in `#lore` |
| Roadmap | `<li class="commit">` entries in `#commits` |
| FAQ | `<details>` in `#faq` |
| Wall seeds | `GALLERY_SEEDS` in `main.js` |
| Colours | `:root` and `[data-theme]` at the top of `styles.css` |
| Typewriter / boot text | `PHRASES` / `BOOT_LINES` in `main.js` |
| Share card | `og.png` — regenerate or replace; referenced from `<head>` |

The tokenomics claims (1B supply, 0/0 tax, revoked authorities, burned LP, 0%
team) are written to match a standard fair launch — **make them true, or change
them.** They're the first thing anyone will check.

## Accessibility & robustness

Skip link, semantic landmarks, visible focus rings, `aria-current` on the active
nav item, `aria-expanded` on the lives cards, labelled controls, `aria-live` on
the forge. A full `prefers-reduced-motion` branch disables the boot sequence,
rain, embers, glitch, flicker, typewriter and scroll reveals. An inline `html.js`
class gates JS-only affordances, so the page stays readable with JavaScript
disabled. Clipboard falls back to `execCommand` on non-secure origins.

Verified in headless Chromium: no console errors, zero horizontal overflow at
390px, every interactive system exercised (lives, lore filters, forge determinism,
colony signing, console commands), live feed run against a real DexScreener
payload, and the whole page re-tested behind the exact production headers from
`vercel.json` — zero CSP violations.
