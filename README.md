# $CATE // the cat that compiles

Launch site for **$CATE** — a Solana memecoin with a coding/terminal identity,
built in the imfebu.com vein: dark, monospace, ASCII, CRT.

No framework, no build step, no dependencies, no trackers, no backend. Four
files. Open `index.html` and it works.

```
index.html    markup + all copy + the contract address
styles.css    tokens, layout, CRT overlays, responsive rules
main.js       boot, typewriter, CA copy, live market feed, console
```

## ⚠ Before you launch — the one thing you must change

The contract address is a **placeholder**. It lives in exactly one place:

```html
<!-- index.html -->
<code class="ca__value" id="ca-value">CATEp1acehoLderpLacehoLderpLacehoLderpump</code>
```

Paste your real mint there and everything downstream wires itself up:

- the copy button copies it
- the live price feed starts polling
- the chart / pump.fun / rugcheck links rewrite themselves to point at your token

`main.js` reads that element as the single source of truth — there is no second
copy to keep in sync. It validates the string as base58, 32–44 chars; the
shipped placeholder deliberately fails that test, which is why the live feed
sits idle until you replace it.

## Running it

```sh
python3 -m http.server 8000   # or: npx serve .
```

## Deploying

Static, so anything serves it. GitHub Pages: **Settings → Pages → Deploy from a
branch**, pick the branch and `/` root. Netlify / Vercel / Cloudflare Pages work
with zero config.

## Live market data

The hero metrics bar (price, mcap, 24h, liquidity, 24h volume) pulls from the
public [DexScreener API](https://docs.dexscreener.com/api/reference) —
client-side `fetch`, no key, no backend, no CORS proxy. It picks the pool with
the deepest liquidity, refreshes every 60s, and colours 24h green/red.

If the token has no pool yet, the API is down, or the CA is still the
placeholder, the bar degrades to `—` with an explanatory note and the rest of
the page is unaffected. Sub-cent prices render in full (`$0.00000275`), not
scientific notation.

## Sections

| # | Section | What's in it |
| --- | --- | --- |
| — | hero | sigil, tagline, contract + copy, buy/chart, live metrics |
| 01 | readme.md | the lore — compiled, not minted |
| 02 | tokenomics | supply/tax/authorities as a TOML config, distribution bar, safety checks |
| 03 | how to buy | five steps, wallet → swap |
| 04 | git log | roadmap as a commit graph (merged / building / queued / sealed) |
| 05 | the tech | chain, site, data, tooling + a `verify.sh` block |
| 06 | the colony | socials |
| — | disclaimer | not financial advice |

## The console

Press <kbd>/</kbd>. It's a real command parser, not a gimmick.

| command | does |
| --- | --- |
| `ca` | print the contract address |
| `copy` | copy it to the clipboard |
| `price` | live price / mcap / 24h / liq / dex |
| `buy`, `chart` | jump to how-to-buy, open the chart |
| `tokenomics`, `verify` | the numbers, and how to check them |
| `whoami`, `ls`, `cd <s>`, `cat <f>` | navigation |
| `theme [name]` | `green` · `amber` · `blood` · `bone` |
| `neofetch`, `date`, `echo`, `clear`, `exit` | as expected |

Arrow keys walk history, <kbd>Esc</kbd> closes. There are a couple of undocumented
replies — try `wen`, `moon`, `sudo`. Palette also cycles with <kbd>t</kbd>;
<kbd>1</kbd>–<kbd>5</kbd> jump between sections.

## Everything else to swap before launch

| What | Where |
| --- | --- |
| **Contract address** | `#ca-value` in `index.html` (see above) |
| Socials (X, Telegram, GitHub) | `#community` — the `href="#"` links |
| Supply / tax / authorities | the TOML block in `#tokenomics` **and** the `tokenomics` console command in `main.js` |
| Safety checks | `.checks` list in `#tokenomics` |
| Roadmap | `<li class="commit">` entries in `#commits` |
| Lore / copy | `#readme` and the hero blurb |
| Colours | `:root` and `[data-theme]` at the top of `styles.css` |
| Typewriter lines | `PHRASES` in `main.js` |
| Boot text | `BOOT_LINES` in `main.js` |
| OG / share image | `<meta property="og:*">` in `<head>` — add a real image before you post links |

The tokenomics claims (1B supply, 0/0 tax, revoked authorities, burned LP, 0%
team) are written to match a standard fair launch — **make them true, or change
them.** They're the first thing anyone will check.

## Accessibility & robustness

Skip link, semantic landmarks, visible focus rings, `aria-current` on the active
nav item, labelled controls. Full `prefers-reduced-motion` branch disables the
boot sequence, glitch, flicker, typewriter and scroll reveals. An inline
`html.js` class gates JS-only affordances, so the whole page stays readable with
JavaScript disabled. Clipboard falls back to `execCommand` on non-secure origins.

Verified in headless Chromium: no console errors, zero horizontal overflow at
390px, live feed exercised against a real DexScreener payload.
