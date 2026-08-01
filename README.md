# cate // den

A terminal / ASCII personal site in the vein of [imfebu.com](https://imfebu.com) —
dark, monospace, CRT-flavoured, deliberately underground.

No framework, no build step, no dependencies, no trackers. Three files and a
readme. Open `index.html` in a browser and it works.

```
index.html    markup + all copy
styles.css    tokens, layout, CRT overlays, responsive rules
main.js       boot sequence, typewriter, scroll-spy, console
```

## Running it

```sh
python3 -m http.server 8000   # or: npx serve .
```

Then visit <http://localhost:8000>. Opening the file directly with `file://`
also works.

## Deploying

It's static, so anything serves it. For GitHub Pages: **Settings → Pages →
Deploy from a branch**, pick this branch and the `/` root. Netlify, Vercel,
Cloudflare Pages and a plain `rsync` all work with zero configuration.

## What's in it

- **Boot sequence** — fake BIOS post on first load, once per tab
  (`sessionStorage`), skippable with any key or click.
- **CRT layer** — scanlines, vignette, and an occasional flicker.
- **Hero** — ASCII cat-skull sigil, glitching headline, looping typewriter
  prompt, live clock and session uptime.
- **Sections** — manifest, works, stack, log, transmit. All reveal on scroll.
- **Palettes** — `green` (default), `amber`, `blood`, `bone`. Click the swatch
  in the nav or press <kbd>t</kbd>; the choice persists in `localStorage`.
- **Console** — a real command parser pinned to the bottom of the page. Press
  <kbd>/</kbd> to open it.

  | command | does |
  | --- | --- |
  | `help` | list commands |
  | `whoami` | bio |
  | `ls` / `ls -a` | sections / files |
  | `cd <section>` | scroll to a section |
  | `cat <file>` | print a file |
  | `theme [name]` | set or cycle the palette |
  | `neofetch` | ASCII system card |
  | `date`, `echo`, `clear`, `exit` | as expected |

  Arrow keys walk the command history; <kbd>Esc</kbd> closes.
- **Keyboard** — <kbd>1</kbd>–<kbd>5</kbd> jump between sections.

## Accessibility

Skip link, semantic landmarks, visible focus rings, `aria-current` on the
active nav item, labelled form controls, and a full `prefers-reduced-motion`
branch that disables the boot sequence, glitch, flicker, typewriter and scroll
animations. Everything is readable with JavaScript disabled — only the console
and boot sequence are lost.

## Making it yours

All copy lives in `index.html` as plain text; there's no CMS to fight.

| What | Where |
| --- | --- |
| Name, tagline, blurb | `.hero` in `index.html` |
| ASCII wordmark and sigil | the `<pre>` blocks in `.brand` and `.hero` |
| Projects | `<article class="card">` entries under `#works` |
| Posts | `<li class="log__row">` entries under `#log` |
| Email address | the `mailto:` in `#transmit` **and** `initForm()` in `main.js` |
| Colours | the `:root` and `[data-theme]` blocks at the top of `styles.css` |
| Typewriter lines | `PHRASES` in `main.js` |
| Boot text | `BOOT_LINES` in `main.js` |
| Console files | `FILES` in `main.js` |

The contact form has no backend — it validates, then hands off to the visitor's
mail client via `mailto:`. Point it at Formspree, a worker, or your own endpoint
if you want real submissions.

Content is placeholder-by-design: the project entries, log posts, PGP block and
`cate@example.com` address are all fictional. Swap them before shipping.
