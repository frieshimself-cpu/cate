/* ══════════════════════════════════════════════════════════
   $CATE // den — behaviour
   vanilla, no dependencies, degrades to a readable page.

   the contract address has ONE source of truth: the text inside
   #ca-value in index.html. everything here reads it from the DOM.
   ══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  /* ── contract ──────────────────────────────────────── */
  const CA = ($('#ca-value')?.textContent || '').trim();
  // a real solana mint is base58, 32-44 chars. the shipped placeholder
  // deliberately contains characters that fail this test.
  const CA_IS_REAL = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(CA) && !/p1aceho/i.test(CA);

  const DEX_API   = 'https://api.dexscreener.com/latest/dex/tokens/';
  const DEX_PAGE  = 'https://dexscreener.com/solana/';
  const PUMP_PAGE = 'https://pump.fun/coin/';

  /* ══ ascii rain ═══════════════════════════════════════
     cheap, capped at ~18fps, pauses when the tab is hidden. */
  function initRain() {
    const cv = $('#rain');
    if (!cv || reduced) return;
    const ctx = cv.getContext('2d', { alpha: true });
    if (!ctx) return;

    const GLYPHS = '01⛧‡☠▓▒░█CATE$◆╬×+·';
    const FONT = 14;
    let cols = 0, drops = [], dpr = 1, w = 0, h = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FONT}px ui-monospace, monospace`;
      cols = Math.ceil(w / FONT);
      drops = Array.from({ length: cols }, () => ({
        y: Math.random() * -h,
        speed: 0.4 + Math.random() * 1.1,
        lit: Math.random() < 0.14,
      }));
    };

    const accent = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff8a1f';

    let last = 0, raf = 0;
    const frame = (t) => {
      raf = requestAnimationFrame(frame);
      if (t - last < 55) return;   // ~18fps is plenty for rain
      last = t;

      ctx.fillStyle = 'rgba(7,5,4,0.16)';
      ctx.fillRect(0, 0, w, h);

      const col = accent();
      for (let i = 0; i < cols; i++) {
        const d = drops[i];
        const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        ctx.fillStyle = d.lit ? col : 'rgba(255,138,31,0.16)';
        ctx.globalAlpha = d.lit ? 0.5 : 0.28;
        ctx.fillText(ch, i * FONT, d.y);
        d.y += FONT * d.speed;
        if (d.y > h + FONT) {
          d.y = -FONT * (Math.random() * 12);
          d.speed = 0.4 + Math.random() * 1.1;
          d.lit = Math.random() < 0.14;
        }
      }
      ctx.globalAlpha = 1;
    };

    const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const stop  = () => { cancelAnimationFrame(raf); raf = 0; };

    resize();
    addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    start();
  }

  /* ══ boot ═════════════════════════════════════════════ */
  const BOOT_LINES = [
    'den bios v4.3.1 — 0x43415445',
    'checking memory ........... 65536k ok',
    'mounting /dev/bone ........ ok',
    'loading cate.elf .......... ok',
    'spl-token authority ....... revoked',
    'liquidity pool ............ burned',
    'lives remaining ........... 5/9',
    'entropy pool .............. warm',
    'no telemetry module found. good.',
    '',
    '  ⛧ the cat compiles ⛧',
    '',
  ];

  async function boot() {
    const el   = $('#boot');
    const log  = $('#boot-log');
    const fill = $('#boot-fill');
    const skip = $('#boot-skip');
    if (!el) return;

    const seen = sessionStorage.getItem('den:booted') === '1';
    let done = false;

    const finish = (ev) => {
      // space/arrows would otherwise scroll the page on the way out
      if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
      if (done) return;
      done = true;
      sessionStorage.setItem('den:booted', '1');
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
      setTimeout(() => el.remove(), 500);
      document.removeEventListener('keydown', finish);
      startTyper();
    };

    if (seen || reduced) { finish(); return; }

    document.addEventListener('keydown', finish);
    skip?.addEventListener('click', finish);
    el.addEventListener('click', finish);

    for (let i = 0; i < BOOT_LINES.length; i++) {
      if (done) return;
      log.textContent += BOOT_LINES[i] + '\n';
      if (fill) fill.style.width = Math.round(((i + 1) / BOOT_LINES.length) * 100) + '%';
      await sleep(BOOT_LINES[i] === '' ? 80 : 135);
    }
    await sleep(320);
    finish();
  }

  /* ══ typewriter ═══════════════════════════════════════ */
  const PHRASES = [
    'whoami',
    'cat README.md',
    'git commit -m "nine lives"',
    'spl-token display $CATE',
    './cate --no-roadmap --only-commits',
    'echo "compiled, not minted"',
  ];

  let typerRunning = false;

  async function startTyper() {
    const out = $('#typed');
    if (!out || typerRunning) return;
    typerRunning = true;
    if (reduced) { out.textContent = PHRASES[0]; return; }

    let i = 0;
    for (;;) {
      const phrase = PHRASES[i % PHRASES.length];
      for (let c = 1; c <= phrase.length; c++) {
        out.textContent = phrase.slice(0, c);
        await sleep(48 + Math.random() * 45);
      }
      await sleep(1700);
      for (let c = phrase.length; c >= 0; c--) {
        out.textContent = phrase.slice(0, c);
        await sleep(22);
      }
      await sleep(320);
      i++;
    }
  }

  /* ══ copy helper ══════════════════════════════════════ */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // clipboard API needs a secure context — fall back to selection
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch { return false; }
    }
  }

  async function copyCA() {
    const btn = $('#ca-copy');
    const box = $('#ca');
    const ok = await copyText(CA);
    if (btn) {
      btn.textContent = ok ? '[ copied ]' : '[ select it ]';
      btn.dataset.done = String(ok);
      box?.classList.add('is-flash');
      setTimeout(() => {
        btn.textContent = '[ copy ]';
        btn.dataset.done = 'false';
        box?.classList.remove('is-flash');
      }, 1800);
    }
    return ok;
  }

  function initCA() {
    $('#ca-copy')?.addEventListener('click', copyCA);

    if (CA_IS_REAL) {
      const chart = $('#chart-link');
      const buy   = $('#buy-link');
      if (chart) chart.href = DEX_PAGE + CA;
      if (buy)   buy.href   = PUMP_PAGE + CA;
      $$('a[href="https://dexscreener.com/solana"]').forEach((a) => { a.href = DEX_PAGE + CA; });
      $$('a[href="https://pump.fun"]').forEach((a) => { a.href = PUMP_PAGE + CA; });
      $$('a[href="https://rugcheck.xyz"]').forEach((a) => { a.href = `https://rugcheck.xyz/tokens/${CA}`; });
    }

    $$('[data-scroll]').forEach((b) => b.addEventListener('click', () => {
      const t = $(b.dataset.scroll);
      t?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      t?.classList.add('is-flash');
      setTimeout(() => t?.classList.remove('is-flash'), 1200);
    }));
  }

  /* ══ live market data ═════════════════════════════════ */
  const fmtUsd = (n) => {
    if (!isFinite(n) || n <= 0) return '—';
    if (n >= 1)    return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (n >= 0.01) return '$' + n.toFixed(4);
    // memecoin territory: toPrecision would render "$1.23e-9". spell it out.
    const s = n.toFixed(15).replace(/0+$/, '');
    return '$' + (s.endsWith('.') ? s + '0' : s);
  };

  const fmtBig = (n) => {
    if (!isFinite(n) || n <= 0) return '—';
    for (const [size, suffix] of [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']]) {
      if (n >= size) return '$' + (n / size).toFixed(2) + suffix;
    }
    return '$' + n.toFixed(0);
  };

  let lastStats = null;

  function paintChange(el, change) {
    if (!el) return;
    if (isFinite(change)) {
      el.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
      el.classList.toggle('up', change >= 0);
      el.classList.toggle('down', change < 0);
    } else {
      el.textContent = '—';
    }
  }

  async function pullStats() {
    const box   = $('#metrics');
    const strip = $('#strip');
    const note  = $('#metrics-note');
    if (!box) return;

    if (!CA_IS_REAL) {
      box.dataset.state = 'idle';
      if (strip) strip.dataset.state = 'idle';
      const st = $('#s-status');
      if (st) st.textContent = 'pre-launch';
      if (note) note.textContent =
        'live feed idle — drop a real contract address into #ca-value and this wakes up.';
      return;
    }

    try {
      const res = await fetch(DEX_API + CA, { headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error('http ' + res.status);
      const json = await res.json();

      // pick the deepest pool — that's the one people actually trade
      const pair = (json.pairs || [])
        .slice()
        .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
      if (!pair) throw new Error('no pairs yet');

      const price  = parseFloat(pair.priceUsd);
      const change = parseFloat(pair.priceChange?.h24);
      const mcap   = pair.marketCap || pair.fdv;
      const liq    = pair.liquidity?.usd;
      const txns   = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);

      $('#m-price').textContent = fmtUsd(price);
      $('#m-mcap').textContent  = fmtBig(mcap);
      $('#m-liq').textContent   = fmtBig(liq);
      $('#m-vol').textContent   = fmtBig(pair.volume?.h24);
      $('#m-txns').textContent  = txns ? txns.toLocaleString('en-US') + ' txns' : '—';
      paintChange($('#m-change'), change);

      $('#s-price').textContent = fmtUsd(price);
      $('#s-mcap').textContent  = fmtBig(mcap);
      $('#s-liq').textContent   = fmtBig(liq);
      $('#s-status').textContent = 'live';
      paintChange($('#s-change'), change);

      box.dataset.state = 'live';
      if (strip) strip.dataset.state = 'live';
      if (note) note.textContent = `live · ${pair.dexId} · updated ${new Date().toLocaleTimeString()}`;
      lastStats = { price, change, mcap, liq, txns, dex: pair.dexId };
    } catch (err) {
      box.dataset.state = 'idle';
      if (strip) strip.dataset.state = 'idle';
      const st = $('#s-status');
      if (st) st.textContent = 'offline';
      if (note) note.textContent = `live feed unavailable (${err.message}) — the chart link still works.`;
    }
  }

  function initStats() {
    pullStats();
    if (CA_IS_REAL) setInterval(pullStats, 60000);
  }

  /* ══ nine lives ═══════════════════════════════════════ */
  const LIVES = {
    1: ['the compile', 'spent',
      'she was assembled out of dead repos and abandoned branches.\n' +
      'no announcement. no countdown. a terminal nobody was watching\n' +
      'printed one line and then went quiet for six hours.'],
    2: ['the mint', 'spent',
      'one billion, six decimals, authorities burned in the same\n' +
      'transaction that created them. there was never a key to lose.'],
    3: ['the burn', 'spent',
      'the pool went in and the receipt went nowhere. the tx is public.\n' +
      'what it bought is thread #002, and that argument is still open.'],
    4: ['the den', 'spent',
      'this site. no framework, no build step, no trackers, no analytics.\n' +
      'every byte hand-placed. view source — the docs are the site.'],
    5: ['the terminal', 'burning',
      'the console you are one keystroke away from. it reads the chain,\n' +
      'forges sigils, and answers to nobody. still being written.\n' +
      'press / and type `help`.'],
    6: ['the litterbox', 'sealed',
      '████ ████████ ██ ███████ ███ ████████ ████ ██ ████████.\n' +
      'the seal breaks when the colony says it does.'],
    7: ['the colony', 'sealed',
      '███████ ██ ████ ███████ █████ ██ █████████ ███ ████.'],
    8: ['the fork', 'sealed',
      '██ ████ ███████ ███ ████ ████████ — ███ ██ ██████ ████.'],
    9: ['[ redacted ]', 'sealed',
      '█ ███ ██████ ███ █████ ████ ████ ██ ███████ ████ ███ ██.\n' +
      'nine is not a number. nine is a limit.'],
  };

  function initLives() {
    const out  = $('#life-out');
    const text = $('#life-out-text');
    const bar  = $('#life-out-bar');
    let openId = null;

    $$('.life').forEach((btn) => btn.addEventListener('click', () => {
      const id = btn.dataset.life;
      const [name, state, body] = LIVES[id] || [];
      if (!body) return;

      if (openId === id) {   // toggle closed
        out.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        openId = null;
        return;
      }

      $$('.life').forEach((b) => b.setAttribute('aria-expanded', 'false'));
      btn.setAttribute('aria-expanded', 'true');
      openId = id;

      const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
      bar.textContent = `~/cate/lives/${id}-${name.replace(/[^a-z]+/gi, '-')}`;
      text.textContent = `life ${ROMAN[id] || id} — ${name}  [${state}]\n\n${body}`;
      out.hidden = false;
    }));
  }

  /* ══ lore war filters ═════════════════════════════════ */
  function initLore() {
    const empty = $('#threads-empty');
    $$('.chip').forEach((chip) => chip.addEventListener('click', () => {
      const want = chip.dataset.filter;
      $$('.chip').forEach((c) => c.classList.toggle('is-on', c === chip));
      let shown = 0;
      $$('.thread').forEach((t) => {
        const match = want === 'all' || t.dataset.status === want;
        t.hidden = !match;
        if (match) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    }));
  }

  /* ══ sigil forge ══════════════════════════════════════
     deterministic: the seed IS the artwork. same seed, same sigil. */
  const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // sigils are built from strokes — spine, arms, diagonals — not pure noise.
  // noise alone reads as scattered dust; strokes read as something carved.
  function forgeSigil(seed, W = 21, H = 11) {
    const rnd = mulberry32(seed);
    const grid = Array.from({ length: H }, () => Array(W).fill(' '));
    const mid = (W - 1) >> 1;

    const put = (x, y, ch) => {
      if (y >= 0 && y < H && x >= 0 && x < W) grid[y][x] = ch;
    };
    const sym = (x, y, ch) => { put(x, y, ch); put(W - 1 - x, y, ch); };

    const HEAVY = ['█', '▓', '╬', '◆', '▄'];
    const LIGHT = ['░', '▒', '+', '·', '×'];
    const heavy = HEAVY[(rnd() * HEAVY.length) | 0];
    const light = LIGHT[(rnd() * LIGHT.length) | 0];

    // spine
    const top = 1 + ((rnd() * 2) | 0);
    const bot = H - 2 - ((rnd() * 2) | 0);
    for (let y = top; y <= bot; y++) put(mid, y, heavy);

    // 2-4 symmetric arms
    const arms = 2 + ((rnd() * 3) | 0);
    for (let i = 0; i < arms; i++) {
      const y = top + ((rnd() * (bot - top + 1)) | 0);
      const len = 2 + ((rnd() * mid) | 0);
      for (let x = mid - len; x <= mid; x++) sym(x, y, heavy);
    }

    // diagonal crowns
    if (rnd() < 0.75) {
      const len = 2 + ((rnd() * (mid - 1)) | 0);
      for (let i = 0; i < len; i++) sym(mid - i, top + i, light);
    }
    if (rnd() < 0.75) {
      const len = 2 + ((rnd() * (mid - 1)) | 0);
      for (let i = 0; i < len; i++) sym(mid - i, bot - i, light);
    }

    // speckle only where nothing was carved
    const spec = 0.05 + rnd() * 0.13;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x <= mid; x++) {
        if (grid[y][x] === ' ' && rnd() < spec) sym(x, y, light);
      }
    }

    put(mid, H >> 1, rnd() < 0.5 ? '⛧' : '‡');
    return grid.map((r) => r.join('')).join('\n');
  }

  const GALLERY_SEEDS = [43415445, 1337, 8008135, 90210, 314159, 271828,
                         666, 42, 20260101, 999999, 123456, 7777];

  let currentSeed = null;

  function renderSigil(seed) {
    currentSeed = seed >>> 0;
    const out = $('#forge-out');
    const tag = $('#forge-seed');
    if (out) out.textContent = forgeSigil(currentSeed);
    if (tag) tag.textContent = 'seed: ' + currentSeed;
    const input = $('#forge-input');
    if (input) input.value = '';
    return currentSeed;
  }

  function initForge() {
    if (!$('#forge-out')) return;

    $('#forge-dig')?.addEventListener('click', () =>
      renderSigil((Math.random() * 0xffffffff) >>> 0));

    $('#forge-copy')?.addEventListener('click', async () => {
      if (currentSeed === null) return;
      const txt = `$CATE sigil — seed ${currentSeed}\n\n${forgeSigil(currentSeed)}`;
      const btn = $('#forge-copy');
      const ok = await copyText(txt);
      btn.textContent = ok ? '[ copied ]' : '[ failed ]';
      setTimeout(() => { btn.textContent = '[ copy ]'; }, 1600);
    });

    const load = () => {
      const raw = ($('#forge-input')?.value || '').trim();
      const n = parseInt(raw, 10);
      if (!raw || !isFinite(n)) return;
      renderSigil(clamp(n, 0, 0xffffffff));
      $('#litterbox')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    };
    $('#forge-load')?.addEventListener('click', load);
    $('#forge-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); load(); }
    });

    // the wall
    const wall = $('#gallery');
    if (wall) {
      GALLERY_SEEDS.forEach((seed) => {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'gallery__cell';
        cell.title = 'seed ' + seed;
        cell.textContent = forgeSigil(seed, 13, 7);
        cell.addEventListener('click', () => {
          renderSigil(seed);
          $('#forge-out')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        });
        wall.appendChild(cell);
      });
    }

    renderSigil(43415445);   // 0x43415445 — "CATE"
  }

  /* ══ colony manifest ══════════════════════════════════
     nothing is transmitted anywhere. the manifest is generated in the
     browser and the count lives in localStorage. said plainly on screen. */
  const djb2 = (str) => {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(16).padStart(8, '0');
  };

  function colonyCount(delta = 0) {
    let n = 0;
    try {
      n = parseInt(localStorage.getItem('den:colony') || '0', 10) || 0;
      if (delta) { n += delta; localStorage.setItem('den:colony', String(n)); }
    } catch { /* private mode */ }
    const el = $('#counter-n');
    if (el) el.textContent = String(n);
    return n;
  }

  function initColony() {
    const form = $('#colony-form');
    if (!form) return;
    colonyCount(0);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note    = $('#colony-note');
      const receipt = $('#colony-receipt');
      const copyBtn = $('#receipt-copy');

      const handle = $('#c-handle').value.trim();
      const oath   = $('#c-oath').value.trim();
      const sect   = (form.querySelector('input[name="sect"]:checked') || {}).value || '/dev/null';
      const agreed = $('#c-agree').checked;

      const fail = (msg) => { note.dataset.err = 'true'; note.textContent = '✗ ' + msg; };

      if (!handle)  return fail('the colony needs something to call you.');
      if (!oath)    return fail('an oath is one line. any line.');
      if (!agreed)  return fail('tick the box. it is the only honest part of this page.');

      const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const sig = djb2(`${handle}|${sect}|${oath}|${stamp}`);

      receipt.textContent =
        '─── $CATE COLONY MANIFEST ───\n' +
        `handle : ${handle}\n` +
        `sect   : ${sect}\n` +
        `oath   : ${oath}\n` +
        `stamp  : ${stamp} UTC\n` +
        `sig    : ${sig}\n` +
        '─────────────────────────────\n' +
        'generated in your browser. nothing was transmitted.\n' +
        'post it yourself, or don\'t. the cat does not check.';
      receipt.hidden = false;
      copyBtn.hidden = false;

      note.dataset.err = 'false';
      note.textContent = `✓ manifest signed — ${sig}. nothing left this browser.`;
      colonyCount(1);
      form.reset();
    });

    $('#receipt-copy')?.addEventListener('click', async () => {
      const btn = $('#receipt-copy');
      const ok = await copyText($('#colony-receipt').textContent);
      btn.textContent = ok ? '[ copied ]' : '[ failed ]';
      setTimeout(() => { btn.textContent = '[ copy manifest ]'; }, 1600);
    });
  }

  /* ══ palette ══════════════════════════════════════════ */
  const THEMES = ['ember', 'acid', 'blood', 'bone', 'void'];

  function setTheme(name) {
    if (!THEMES.includes(name)) return false;
    document.documentElement.dataset.theme = name;
    const label = $('#theme-name');
    if (label) label.textContent = name;
    try { localStorage.setItem('den:theme', name); } catch { /* private mode */ }
    return true;
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem('den:theme'); } catch { /* ignore */ }
    setTheme(saved && THEMES.includes(saved) ? saved : 'ember');
    $('#theme-btn')?.addEventListener('click', cycleTheme);
  }

  function cycleTheme() {
    const cur = document.documentElement.dataset.theme || 'ember';
    setTheme(THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length]);
  }

  /* ══ nav ══════════════════════════════════════════════ */
  function initNav() {
    const nav    = $('#nav');
    const toggle = $('#nav-toggle');

    toggle?.addEventListener('click', () => {
      const open = nav.dataset.open === 'true';
      nav.dataset.open = String(!open);
      toggle.setAttribute('aria-expanded', String(!open));
    });

    $$('#nav a').forEach((a) => a.addEventListener('click', () => {
      if (nav) nav.dataset.open = 'false';
      toggle?.setAttribute('aria-expanded', 'false');
    }));

    const links = new Map($$('#nav a').map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const link = links.get(e.target.id);
        if (!link) return;
        if (e.isIntersecting) {
          links.forEach((l) => l.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    links.forEach((_, id) => {
      const target = document.getElementById(id);
      if (target) spy.observe(target);
    });
  }

  /* ══ reveal ═══════════════════════════════════════════ */
  function initReveal() {
    const items = $$('.reveal');
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    items.forEach((el) => io.observe(el));
  }

  /* ══ console ══════════════════════════════════════════ */
  const SECTIONS = ['readme', 'lives', 'tokenomics', 'buy', 'lore',
                    'litterbox', 'commits', 'stack', 'colony', 'faq'];

  const FILES = {
    'README.md':
      'cate was not minted. she was compiled — assembled out of dead repos,\n' +
      'abandoned branches, and code people delete at 4am.',
    'cate.config.toml':
      'supply = 1_000_000_000   tax = 0/0\n' +
      'mint = revoked   freeze = revoked   lp = burned',
    'lives.txt':
      'nine lives. four spent, one burning, four sealed.\n' +
      'run `lives` for the manifest.',
    'secrets.txt':
      'permission denied. (nice try.)',
  };

  let consoleOpen = () => {};

  function initConsole() {
    const box    = $('#console');
    const handle = $('#console-handle');
    const form   = $('#console-form');
    const input  = $('#console-in');
    const out    = $('#console-out');
    if (!box) return;

    const history = [];
    let hIndex = -1;

    const write = (text = '') => {
      out.textContent += '\n' + text;
      out.scrollTop = out.scrollHeight;
    };

    const setOpen = (open) => {
      box.dataset.open = String(open);
      handle.setAttribute('aria-expanded', String(open));
      if (open) input.focus();
    };
    consoleOpen = setOpen;

    handle.addEventListener('click', () => setOpen(box.dataset.open !== 'true'));

    const COMMANDS = {
      help: () => write(
        'commands:\n' +
        '  ca                print the contract address\n' +
        '  copy              copy the contract to clipboard\n' +
        '  price             live price / mcap / 24h\n' +
        '  buy               where to swap\n' +
        '  chart             open the chart\n' +
        '  tokenomics        supply, tax, authorities\n' +
        '  verify            check every claim yourself\n' +
        '  lives             the nine lives manifest\n' +
        '  lore [status]     lore war threads\n' +
        '  dig [seed]        forge a sigil in the terminal\n' +
        '  whoami            who is cate\n' +
        '  ls                list sections    (ls -a for files)\n' +
        '  cd <section>      scroll to a section\n' +
        '  cat <file>        read a file\n' +
        '  theme [name]      ' + THEMES.join(' | ') + '\n' +
        '  neofetch          system info\n' +
        '  clear             wipe the buffer\n' +
        '  exit              close the console'
      ),

      ca: () => write(CA + (CA_IS_REAL ? '' : '\n(placeholder — not a live contract yet)')),

      copy: async () => write(await copyCA() ? 'contract copied to clipboard.' : 'copy blocked — select it manually.'),

      price: () => {
        if (!CA_IS_REAL) { write('no contract wired up yet. check back at launch.'); return; }
        if (!lastStats)  { write('no market data yet — the pool may not exist. try `chart`.'); return; }
        const s = lastStats;
        write(
          `price   ${fmtUsd(s.price)}\n` +
          `mcap    ${fmtBig(s.mcap)}\n` +
          `24h     ${isFinite(s.change) ? (s.change >= 0 ? '+' : '') + s.change.toFixed(2) + '%' : '—'}\n` +
          `liq     ${fmtBig(s.liq)}\n` +
          `txns    ${s.txns || '—'}\n` +
          `dex     ${s.dex}`
        );
      },

      lives: () => {
        const rows = Object.entries(LIVES).map(([n, [name, state]]) =>
          `  ${String(n).padStart(2)}  ${name.padEnd(14)} ${state}`);
        write('nine lives — four spent, one burning, four sealed\n' + rows.join('\n'));
      },

      lore: (args) => {
        const want = (args[0] || '').toLowerCase();
        const rows = $$('.thread')
          .filter((t) => !want || t.dataset.status === want)
          .map((t) => `  ${$('.thread__id', t).textContent}  [${t.dataset.status.padEnd(8)}] ` +
                      `${$('h3', t).textContent}`);
        if (!rows.length) { write(`no threads with status "${want}".`); return; }
        write(rows.join('\n'));
      },

      dig: (args) => {
        const n = parseInt(args[0], 10);
        const seed = isFinite(n) ? clamp(n, 0, 0xffffffff) : (Math.random() * 0xffffffff) >>> 0;
        renderSigil(seed);
        write(`seed ${seed}\n\n${forgeSigil(seed, 17, 9)}\n\n(also rendered in the litterbox)`);
      },

      buy: () => {
        write('pump.fun · jupiter · raydium — paste the contract, set slippage, confirm.');
        document.getElementById('buy')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      },

      chart: () => {
        const url = CA_IS_REAL ? DEX_PAGE + CA : 'https://dexscreener.com/solana';
        write('opening ' + url);
        window.open(url, '_blank', 'noopener');
      },

      tokenomics: () => write(
        'supply    1,000,000,000\ntax       0 / 0\nmint      revoked\n' +
        'freeze    revoked\nlp        burned\nteam      0%'
      ),

      verify: () => write(
        "don't trust. verify:\n" +
        '  spl-token supply <contract>\n' +
        '  spl-token display <contract>\n' +
        '  rugcheck.xyz/tokens/<contract>'
      ),

      whoami: () => write(
        'cate — cybernetic autonomous terminal entity.\n' +
        'compiled, not minted. nine lives, four spent.\n' +
        'does not have a roadmap. has a commit history.'
      ),

      ls: (args) => {
        if (args[0] === '-a') { write(Object.keys(FILES).join('  ')); return; }
        write(SECTIONS.map((s) => s + '/').join('  '));
      },

      cd: (args) => {
        const target = (args[0] || '').replace(/\/+$/, '');
        if (!target || target === '~') {
          document.getElementById('top')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
          write('~'); return;
        }
        if (!SECTIONS.includes(target)) { write(`cd: no such section: ${target}`); return; }
        document.getElementById(target)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
        write(`~/${target}`);
      },

      cat: (args) => {
        const name = args[0];
        if (!name) { write('cat: missing operand'); return; }
        if (name in FILES) { write(FILES[name]); return; }
        write(`cat: ${name}: no such file`);
      },

      theme: (args) => {
        if (!args[0]) { cycleTheme(); write(`palette → ${document.documentElement.dataset.theme}`); return; }
        if (setTheme(args[0])) write(`palette → ${args[0]}`);
        else write(`theme: unknown palette: ${args[0]} (try: ${THEMES.join(', ')})`);
      },

      neofetch: () => write(
        '  ▄▄▄▄   $CATE@den\n' +
        ' █▓▓▓▓█  ──────────\n' +
        ' █░▄▄░█  chain   solana\n' +
        ' █░▀▀░█  supply  1,000,000,000\n' +
        '  ▀██▀   tax     0/0\n' +
        '         lp      burned\n' +
        '         lives   5/9\n' +
        '         deps    0\n' +
        '         theme   ' + (document.documentElement.dataset.theme || 'ember')
      ),

      date:  () => write(new Date().toString()),
      echo:  (args) => write(args.join(' ')),
      clear: () => { out.textContent = ''; },
      exit:  () => { setOpen(false); },
      sudo:  () => write('cate is not in the sudoers file. this incident has been logged. ⛧'),
      rm:    () => write('nice try.'),
      wen:   () => write('now. it already launched. scroll up.'),
      moon:  () => write('the cat does not do price predictions. the cat does commits.'),
      pet:   () => write('  /\\_/\\   \n ( -.- )  she allows it.\n  > ^ <   '),
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      input.value = '';
      if (!raw) return;

      write(`\ncate@den:~$ ${raw}`);
      history.unshift(raw);
      hIndex = -1;

      const [cmd, ...args] = raw.split(/\s+/);
      const fn = COMMANDS[cmd.toLowerCase()];
      if (fn) fn(args);
      else write(`${cmd}: command not found. type \`help\`.`);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (hIndex < history.length - 1) input.value = history[++hIndex];
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (hIndex > 0) input.value = history[--hIndex];
        else { hIndex = -1; input.value = ''; }
      } else if (e.key === 'Escape') {
        setOpen(false); input.blur();
      }
    });

    $$('[data-console]').forEach((b) => b.addEventListener('click', () => {
      setOpen(true);
      input.value = b.dataset.console;
      form.requestSubmit();
    }));

    /* global shortcuts */
    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '/' && !typing) {
        e.preventDefault(); setOpen(true);
      } else if (e.key.toLowerCase() === 't' && !typing) {
        cycleTheme();
      } else if (e.key.toLowerCase() === 'g' && !typing) {
        renderSigil((Math.random() * 0xffffffff) >>> 0);
        $('#litterbox')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      } else if (/^[1-7]$/.test(e.key) && !typing) {
        const link = $(`#nav a[data-key="${e.key}"]`);
        if (link) {
          const id = link.getAttribute('href').slice(1);
          document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
        }
      }
    });
  }

  /* ══ the tenth life ═══════════════════════════════════ */
  function initKonami() {
    const SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft',
                 'ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let i = 0;
    document.addEventListener('keydown', (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = (k === SEQ[i]) ? i + 1 : (k === SEQ[0] ? 1 : 0);
      if (i !== SEQ.length) return;
      i = 0;
      setTheme('blood');
      consoleOpen(true);
      const out = $('#console-out');
      if (out) {
        out.textContent +=
          '\n\n⛧⛧⛧ THE TENTH LIFE ⛧⛧⛧\n' +
          'there was never a tenth life.\n' +
          'you found the place where one would go.\n\n' +
          forgeSigil(1010101, 17, 9) + '\n';
        out.scrollTop = out.scrollHeight;
      }
    });
  }

  /* ══ misc ═════════════════════════════════════════════ */
  function chrono() {
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ── go ────────────────────────────────────────────── */
  initTheme();
  initRain();
  initNav();
  initReveal();
  initCA();
  initStats();
  initLives();
  initLore();
  initForge();
  initColony();
  initConsole();
  initKonami();
  chrono();
  boot();
})();
