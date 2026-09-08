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
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* ══ config + contract ════════════════════════════════
     config.js is the single place a launcher edits. `?ca=` is
     honoured ONLY while config.contract is empty, so once the real
     mint ships nobody can craft a link that shows a different
     address to your holders. */
  const CFG = Object.assign({
    name: '/prompt/cate', ticker: 'CATE', contract: '',
    rpc: 'https://api.mainnet-beta.solana.com',
    supply: 1000000000, socials: {},
  }, window.CATE_CONFIG || {});

  // a solana mint is base58; an EVM contract is 0x + 40 hex chars.
  const isSol  = (s) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s || '');
  const isEvm  = (s) => /^0x[0-9a-fA-F]{40}$/.test(s || '');
  const isMint = (s) => isSol(s) || isEvm(s);

  let CA = (CFG.contract || '').trim();
  let PREVIEW = false;
  if (!isMint(CA)) {
    const q = new URLSearchParams(location.search).get('ca');
    if (isMint(q)) { CA = q.trim(); PREVIEW = true; }
    else CA = '';
  }
  const CA_IS_REAL = isMint(CA);
  const IS_EVM  = isEvm(CA);
  const IS_PUMP = !IS_EVM && /pump$/i.test(CA);

  const DEX_API   = 'https://api.dexscreener.com/latest/dex/tokens/';
  const DEX_PAGE  = 'https://dexscreener.com/solana/';
  const PUMP_PAGE = 'https://pump.fun/coin/';
  const SOLSCAN   = 'https://solscan.io/token/';
  const RUGCHECK  = 'https://rugcheck.xyz/tokens/';
  // EVM: the chain is not known until dexscreener indexes a pool, so
  // links go through chain-neutral pages until then.
  const DEX_SEARCH = 'https://dexscreener.com/search?q=';
  const BLOCKSCAN  = 'https://blockscan.com/address/';
  const chartUrl    = () => IS_EVM ? DEX_SEARCH + CA : DEX_PAGE + CA;
  const explorerUrl = () => IS_EVM ? BLOCKSCAN + CA : SOLSCAN + CA;

  /* ══ toasts ═══════════════════════════════════════════ */
  function toast(msg, kind = 'ok') {
    const box = $('#toasts');
    if (!box) return;
    const t = el('div', 'toast');
    t.dataset.kind = kind;
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'opacity .3s, transform .3s';
      t.style.opacity = '0';
      t.style.transform = 'translateX(14px)';
      setTimeout(() => t.remove(), 320);
    }, 2600);
  }

  /* ══ ascii rain ═══════════════════════════════════════ */
  function initRain() {
    const cv = $('#rain');
    if (!cv || reduced) return;
    const ctx = cv.getContext('2d', { alpha: true });
    if (!ctx) return;

    const GLYPHS = '01⛧‡☠▓▒░█CATE$◆╬×+·';
    const FONT = 14;
    let cols = 0, drops = [], w = 0, h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
        ctx.fillStyle = d.lit ? col : 'rgba(255,138,31,0.16)';
        ctx.globalAlpha = d.lit ? 0.5 : 0.28;
        ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * FONT, d.y);
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
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }

  /* ══ the cat — blinks, and her pupils track the cursor ═ */
  const CAT = [
    '       ▄                     ▄       ',
    '      ▄█▄                   ▄█▄      ',
    '     ▄█▓█▄                 ▄█▓█▄     ',
    '    ██▓▓▓█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█▓▓▓██    ',
    '    █░░░░░░░░░░░░░░░░░░░░░░░░░░░█    ',
    '    █░░░▄▄▄▄░░░░░░░░░░░░░▄▄▄▄░░░█    ',
    '    █░░░█%%█░░░░░░░░░░░░░█%%█░░░█    ',
    '  ─ █░░░▀▀▀▀░░░░░░░░░░░░░▀▀▀▀░░░█ ─  ',
    '─── █░░░░░░░░░░░░░▄░░░░░░░░░░░░░█ ───',
    '  ─ █░░░░░░░░░░░░▀▄▀░░░░░░░░░░░░█ ─  ',
    '    █░░░░░░░░░░░▀▄▀▄▀░░░░░░░░░░░█    ',
    '    █░░░░░░░░░░░░░░░░░░░░░░░░░░░█    ',
    '     ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀     ',
  ].join('\n');

  function initCat() {
    const node = $('#cat');
    if (!node) return;

    const paint = (pupils) => { node.textContent = CAT.replace(/%%/g, pupils); };
    paint('▓█');
    if (reduced) return;

    let gaze = '▓█', blinking = false;

    const render = () => { if (!blinking) paint(gaze); };

    let queued = false;
    addEventListener('mousemove', (e) => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const r = node.getBoundingClientRect();
        if (!r.width) return;
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        gaze = dx < -0.18 ? '█▓' : dx > 0.18 ? '▓█' : '██';
        render();
      });
    }, { passive: true });

    // idle blink
    const blink = async () => {
      for (;;) {
        await sleep(2600 + Math.random() * 4200);
        if (document.hidden) continue;
        blinking = true;
        paint('▀▀');
        await sleep(120);
        blinking = false;
        render();
        if (Math.random() < 0.3) {          // occasional double-blink
          await sleep(150);
          blinking = true; paint('▀▀');
          await sleep(110);
          blinking = false; render();
        }
      }
    };
    blink();
  }

  /* ══ boot ═════════════════════════════════════════════ */
  const BOOT_LINES = [
    ['den bios v4.3.1 — 0x43415445',        'post'],
    ['checking memory ........... 65536k ok', 'memory'],
    ['mounting /dev/bone ........ ok',        'mount'],
    ['loading cate.elf .......... ok',        'kernel'],
    ['spl-token authority ....... revoked',   'chain'],
    ['liquidity pool ............ burned',    'chain'],
    ['lives remaining ........... 5/9',       'lore'],
    ['sigil forge ............... seeded',    'render'],
    ['entropy pool .............. warm',      'entropy'],
    ['no telemetry module found. good.',      'privacy'],
    ['', ''],
    ['  ⛧ the cat compiles ⛧', 'ready'],
    ['', ''],
  ];

  async function boot() {
    const box  = $('#boot');
    const log  = $('#boot-log');
    const fill = $('#boot-fill');
    const pct  = $('#boot-pct');
    const task = $('#boot-task');
    const skip = $('#boot-skip');
    if (!box) return;

    const seen = sessionStorage.getItem('den:booted') === '1';
    let done = false;

    const finish = (ev) => {
      // space/arrows would otherwise scroll the page on the way out
      if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
      if (done) return;
      done = true;
      sessionStorage.setItem('den:booted', '1');
      box.style.opacity = '0';
      box.style.visibility = 'hidden';
      box.style.pointerEvents = 'none';
      setTimeout(() => box.remove(), 500);
      document.removeEventListener('keydown', finish);
      startTyper();
    };

    if (seen || reduced) { finish(); return; }

    document.addEventListener('keydown', finish);
    skip?.addEventListener('click', finish);
    box.addEventListener('click', finish);

    for (let i = 0; i < BOOT_LINES.length; i++) {
      if (done) return;
      const [line, label] = BOOT_LINES[i];
      log.textContent += line + '\n';
      const p = Math.round(((i + 1) / BOOT_LINES.length) * 100);
      if (fill) fill.style.width = p + '%';
      if (pct)  pct.textContent = p + '%';
      if (task && label) task.textContent = label;
      await sleep(line === '' ? 70 : 125);
    }
    await sleep(300);
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

  /* ══ clipboard ════════════════════════════════════════ */
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
    toast(ok ? 'contract copied' : 'copy blocked — select it manually', ok ? 'ok' : 'err');
    if (ok) unlock('copy');
    return ok;
  }

  function initCA() {
    const box = $('#ca');
    const val = $('#ca-value');

    if (CA_IS_REAL) {
      val.textContent = CA;
      box.dataset.state = 'live';
      if (IS_PUMP || IS_EVM) {
        const tag = el('span', 'ca__chain', IS_PUMP ? 'pump.fun' : 'evm');
        box.appendChild(tag);
      }
    } else {
      val.textContent = 'Soon';
      box.dataset.state = 'pre';
      $('#ca-copy').hidden = true;
      $('#ca-warn').textContent =
        'no contract yet. anyone posting an address for this token right now is lying.';
    }

    if (PREVIEW) {
      const bar = $('#preview-bar');
      bar.hidden = false;
      bar.textContent = '⚠ PREVIEW MODE — address supplied via ?ca= in the URL, not the official contract. do not trade on this.';
    }

    $('#ca-copy')?.addEventListener('click', copyCA);
    $('#brand-ticker').textContent = '$' + CFG.ticker;

    const xUrl = (CFG.socials?.x || '').trim();
    const xBtn = $('#x-link');
    if (xBtn && xUrl) { xBtn.href = xUrl; xBtn.hidden = false; }

    // every outbound link that depends on the mint
    if (CA_IS_REAL) {
      const set = (sel, href) => { const n = $(sel); if (n) n.href = href; };
      set('#chart-link', chartUrl());
      set('#solscan-link', explorerUrl());
      $$('a[href="https://dexscreener.com/solana"]').forEach((a) => { a.href = chartUrl(); });
      $$('a[href="https://solscan.io"]').forEach((a) => { a.href = explorerUrl(); });
      if (IS_EVM) {
        // pump.fun / jupiter / rugcheck are solana-only — route them to
        // the chart search and the EVM explorer instead of dead pages.
        $$('a[href="https://pump.fun"]').forEach((a) => { a.href = chartUrl(); a.textContent = a.textContent.replace('pump.fun', 'dexscreener'); });
        $$('a[href="https://jup.ag"]').forEach((a) => { a.href = chartUrl(); a.textContent = a.textContent.replace('jupiter', 'dexscreener'); });
        const pump = $('#pump-link'); if (pump) pump.textContent = '[ trade ]';
        $$('#buy-links a[href="' + chartUrl() + '"]').slice(2).forEach((a) => { a.hidden = true; });
        $$('a[href="https://rugcheck.xyz"]').forEach((a) => { a.href = explorerUrl(); a.textContent = a.textContent.replace('rugcheck', 'explorer'); });
        $$('#buy-links a[href="https://rugcheck.xyz"], #buy-links a[href="' + explorerUrl() + '"]:not(#solscan-link)').forEach((a) => { a.hidden = true; });
        const sol = $('#solscan-link'); if (sol) sol.textContent = '[ blockscan ]';
      } else {
        set('#buy-link',   PUMP_PAGE + CA);
        set('#pump-link',  PUMP_PAGE + CA);
        $$('a[href="https://pump.fun"]').forEach((a) => { a.href = PUMP_PAGE + CA; });
        $$('a[href="https://rugcheck.xyz"]').forEach((a) => { a.href = RUGCHECK + CA; });
      }
    }

    // socials from config — hide the ones left empty
    const box2 = $('#socials');
    if (box2) {
      const rows = [['x / twitter', CFG.socials?.x], ['telegram', CFG.socials?.telegram],
                    ['github', CFG.socials?.github],
                    ['dexscreener', CA_IS_REAL ? chartUrl() : ''],
                    [IS_EVM ? 'blockscan' : 'solscan', CA_IS_REAL ? explorerUrl() : '']];
      rows.forEach(([label, href]) => {
        if (!href) return;
        const li = el('li');
        const a = el('a', null, label);
        a.href = href; a.rel = 'noopener'; a.target = '_blank';
        li.innerHTML = '<span class="bul">↗</span> ';
        li.appendChild(a);
        box2.appendChild(li);
      });
      if (!box2.children.length) {
        box2.appendChild(el('li', 'dim', 'socials go in config.js'));
      }
    }

    $$('[data-scroll]').forEach((b) => b.addEventListener('click', () => {
      const t = $(b.dataset.scroll);
      t?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      t?.classList.add('is-flash');
      setTimeout(() => t?.classList.remove('is-flash'), 1200);
    }));
  }

  /* ══ formatting ═══════════════════════════════════════ */
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
  // the reconstructed series carries float noise (…2747351589); the legend
  // only ever needs a few significant digits.
  const fmtUsdShort = (n) => {
    if (!isFinite(n) || n <= 0) return '—';
    if (n >= 0.01) return fmtUsd(n);
    const s = Number(n.toPrecision(4)).toFixed(20).replace(/0+$/, '');
    return '$' + (s.endsWith('.') ? s + '0' : s);
  };
  const fmtPct = (n) =>
    isFinite(n) ? (n >= 0 ? '+' : '') + n.toFixed(2) + '%' : '—';

  function paintChange(node, change) {
    if (!node) return;
    node.textContent = fmtPct(change);
    node.classList.toggle('up', isFinite(change) && change >= 0);
    node.classList.toggle('down', isFinite(change) && change < 0);
  }

  /* ══ price chart ══════════════════════════════════════
     dexscreener gives change over 24h/6h/1h/5m, not tick data — so we
     walk backwards from the current price to reconstruct five points.
     labelled as such on the page; it is a shape, not a candle chart. */
  function drawSpark(canvas, series, opts = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.clientWidth || canvas.width;
    const H = canvas.clientHeight || canvas.height;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    if (!series || series.length < 2) return;

    const css = getComputedStyle(document.documentElement);
    const accent = css.getPropertyValue('--accent').trim() || '#ff8a1f';
    const dead   = css.getPropertyValue('--dead').trim() || '#ff4d5e';
    const rising = series[series.length - 1] >= series[0];
    const col = rising ? accent : dead;

    const pad = opts.pad ?? 14;
    const lo = Math.min(...series), hi = Math.max(...series);
    const span = (hi - lo) || Math.abs(hi) || 1;
    const x = (i) => pad + (i / (series.length - 1)) * (W - pad * 2);
    const y = (v) => H - pad - ((v - lo) / span) * (H - pad * 2);

    if (opts.grid) {
      ctx.strokeStyle = 'rgba(255,255,255,.05)';
      ctx.lineWidth = 1;
      for (let g = 0; g <= 4; g++) {
        const gy = pad + (g / 4) * (H - pad * 2);
        ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(W - pad, gy); ctx.stroke();
      }
    }

    // area fill
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, col + '55');
    grad.addColorStop(1, col + '00');
    ctx.beginPath();
    ctx.moveTo(x(0), y(series[0]));
    series.forEach((v, i) => ctx.lineTo(x(i), y(v)));
    ctx.lineTo(x(series.length - 1), H - pad);
    ctx.lineTo(x(0), H - pad);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // line
    ctx.beginPath();
    series.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
    ctx.strokeStyle = col;
    ctx.lineWidth = opts.thin ? 1.25 : 2;
    ctx.lineJoin = 'round';
    ctx.shadowColor = col;
    ctx.shadowBlur = opts.thin ? 4 : 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (!opts.thin) {
      series.forEach((v, i) => {
        ctx.beginPath();
        ctx.arc(x(i), y(v), i === series.length - 1 ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = i === series.length - 1 ? col : 'rgba(255,255,255,.35)';
        ctx.fill();
      });
    }
  }


  /* ══ launch phase ═════════════════════════════════════
     a pump.fun coin has no liquidity pool while it trades on the
     bonding curve — pump.fun creates the pool and burns the LP itself
     at graduation. so "lp burned" is FALSE at launch and becomes TRUE
     later, with nobody pressing anything. the site reads which stage
     it is in rather than claiming the end state up front. */
  const DEX_POOLS = /raydium|pumpswap|orca|meteora|fluxbeam|lifinity/i;
  let chainMissing = false;

  function setPhase(phase) {
    // once the chain says the mint isn't there, nothing else gets to
    // claim the coin is on a curve or graduated
    if (chainMissing && phase !== 'notfound') phase = 'notfound';
    const node = $('#phase');
    const lp   = $('#tok-lp');
    const lock = $('#tok-lock');
    const claim = $('#claim-checks li[data-claim="lp"]');

    if (node) node.dataset.phase = phase;

    if (phase === 'pre') {
      if (node) node.hidden = true;
      if (lp)   lp.textContent = 'unknown';
      if (lock) lock.textContent = '"pending"';
      if (claim) claim.dataset.ok = '';
      return;
    }

    if (phase === 'notfound') {
      if (node) {
        node.hidden = false;
        node.innerHTML = '<b>not on chain</b> this address does not exist on mainnet yet — ' +
          'nothing has been minted at it.';
      }
      if (lp)   lp.textContent = 'unknown';
      if (lock) lock.textContent = '"pending"';
      if (claim) { claim.dataset.ok = ''; claim.textContent = 'lp burned'; }
      return;
    }

    if (phase === 'curve') {
      if (node) {
        node.hidden = false;
        node.innerHTML = '<b>bonding curve</b> no liquidity pool yet — ' +
          'pump.fun creates it and burns the LP automatically at graduation.';
      }
      if (lp)   lp.textContent = 'false';
      if (lock) lock.textContent = '"on curve"';
      if (claim) { claim.dataset.ok = 'pending'; claim.textContent = 'lp burned — pending graduation'; }
      return;
    }

    // graduated
    if (node) {
      node.hidden = false;
      node.innerHTML = '<b>graduated</b> live on a DEX pool. LP was burned by ' +
        'pump.fun at graduation.';
    }
    if (lp)   lp.textContent = 'true';
    if (lock) lock.textContent = '"forever"';
    if (claim) { claim.dataset.ok = 'true'; claim.textContent = 'lp burned'; }
  }

  /* ══ live market data ═════════════════════════════════ */
  let lastStats = null;
  let lastPools = [];

  function setIdle(note, status) {
    const box = $('#metrics'), strip = $('#strip');
    if (box) box.dataset.state = 'idle';
    if (strip) strip.dataset.state = 'idle';
    const st = $('#s-status');
    if (st) st.textContent = status || (CA_IS_REAL ? 'offline' : 'pre-launch');
    const badge = $('#chart-badge'); if (badge) { badge.dataset.on = 'false'; badge.textContent = 'idle'; }
    const n = $('#metrics-note'); if (n) n.textContent = note;
  }

  async function pullStats() {
    if (!$('#metrics')) return;

    if (!CA_IS_REAL) {
      setPhase('pre');
      setIdle('pre-launch — paste the mint into config.js and every live panel wakes up.');
      return;
    }

    try {
      const res = await fetch(DEX_API + CA, { headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error('http ' + res.status);
      const json = await res.json();

      // deepest pool first — that's the one people actually trade
      const pools = (json.pairs || [])
        .slice()
        .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
      const pair = pools[0];
      if (!pair) {
        setPhase(chainMissing ? 'notfound' : (IS_PUMP ? 'curve' : 'pre'));
        setIdle(
          chainMissing
            ? 'this address is not on mainnet yet — see section 05.'
            : IS_PUMP
              ? 'contract is live but dexscreener has not indexed a pool yet — normal for a fresh pump.fun mint. trade on the bonding curve until it graduates.'
              : 'contract is live but no pool exists yet.',
          chainMissing ? 'not on chain' : (IS_PUMP ? 'bonding curve' : 'no pool'));
        return;
      }
      lastPools = pools;

      // dexscreener tells us the chain + pair page — swap the search
      // links for the real chart once we know it.
      if (IS_EVM && pair.url) {
        $$('a[href="' + DEX_SEARCH + CA + '"]').forEach((a) => { a.href = pair.url; });
      }

      const price  = parseFloat(pair.priceUsd);
      const change = parseFloat(pair.priceChange?.h24);
      const mcap   = pair.marketCap || pair.fdv;
      const liq    = pair.liquidity?.usd;
      const vol    = pair.volume?.h24;
      const buys   = pair.txns?.h24?.buys || 0;
      const sells  = pair.txns?.h24?.sells || 0;

      // the pump.fun bonding curve reports no liquidity figure at all.
      // a bare "—" next to populated fields reads as a broken panel, so
      // name the reason instead.
      const onCurve = !DEX_POOLS.test(pair.dexId || '');
      const liqText = isFinite(liq) && liq > 0 ? fmtBig(liq) : (onCurve ? 'on curve' : '—');

      $('#m-price').textContent = fmtUsd(price);
      $('#m-mcap').textContent  = fmtBig(mcap);
      $('#m-liq').textContent   = liqText;
      $('#m-vol').textContent   = fmtBig(vol);
      $('#m-txns').textContent  = (buys + sells) ? (buys + sells).toLocaleString('en-US') : '—';
      paintChange($('#m-change'), change);

      $('#s-price').textContent = fmtUsd(price);
      $('#s-mcap').textContent  = fmtBig(mcap);
      $('#s-liq').textContent   = liqText;
      $('#s-vol').textContent   = fmtBig(vol);
      $('#s-status').textContent = 'live';
      paintChange($('#s-change'), change);

      $('#metrics').dataset.state = 'live';
      const strip = $('#strip'); if (strip) strip.dataset.state = 'live';
      $('#metrics-note').textContent =
        `live · ${pair.dexId} · ${pools.length} pool${pools.length === 1 ? '' : 's'} · updated ${new Date().toLocaleTimeString()}`;

      // ── timeframes ──
      const ch = pair.priceChange || {};
      $$('#tfs b').forEach((b) => paintChange(b, parseFloat(ch[b.dataset.tf])));

      // ── reconstructed series: 24h → 6h → 1h → 5m → now ──
      const back = (pctChange) => {
        const c = parseFloat(pctChange);
        return isFinite(c) ? price / (1 + c / 100) : price;
      };
      const series = [back(ch.h24), back(ch.h6), back(ch.h1), back(ch.m5), price];
      drawSpark($('#spark'), series, { grid: true });
      drawSpark($('#spark-mini'), series, { thin: true, pad: 3 });
      $('#spark-lo').textContent = fmtUsdShort(Math.min(...series));
      $('#spark-hi').textContent = fmtUsdShort(Math.max(...series));
      const badge = $('#chart-badge');
      if (badge) { badge.dataset.on = 'true'; badge.textContent = 'live'; }

      // ── buy/sell pressure ──
      const total = buys + sells;
      const bp = total ? (buys / total) * 100 : 50;
      $('#pressure-buy').style.width = bp + '%';
      $('#pressure-sell').style.width = (100 - bp) + '%';
      $('#p-buys').textContent = buys.toLocaleString('en-US');
      $('#p-sells').textContent = sells.toLocaleString('en-US');

      // ── pools table ──
      renderPools(pools);

      setPhase(pools.some((p) => DEX_POOLS.test(p.dexId || '')) ? 'graduated' : 'curve');
      lastStats = { price, change, mcap, liq, vol, buys, sells, dex: pair.dexId, pools: pools.length };
      checkWatch();
    } catch (err) {
      setIdle(`live feed unavailable (${err.message}) — the chart link still works.`);
    }
  }

  function renderPools(pools) {
    const body = $('#pools');
    if (!body) return;
    body.textContent = '';
    $('#pools-count').textContent = `· ${pools.length}`;
    pools.slice(0, 12).forEach((p) => {
      const tr = el('tr');
      const chg = parseFloat(p.priceChange?.h24);
      tr.innerHTML =
        `<td class="hl">${p.dexId || '—'}</td>` +
        `<td>${(p.baseToken?.symbol || '?')}/${(p.quoteToken?.symbol || '?')}</td>` +
        `<td>${fmtUsd(parseFloat(p.priceUsd))}</td>` +
        `<td>${fmtBig(p.liquidity?.usd)}</td>` +
        `<td>${fmtBig(p.volume?.h24)}</td>` +
        `<td class="${isFinite(chg) && chg < 0 ? 'down' : 'up'}">${fmtPct(chg)}</td>`;
      body.appendChild(tr);
    });
  }

  function initStats() {
    pullStats();
    if (CA_IS_REAL) setInterval(pullStats, 60000);
    addEventListener('resize', () => {
      if (lastStats) drawSpark($('#spark'), null);
    }, { passive: true });
  }

  /* ══ content: lives / threads / ledger / commits / faq ═ */
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

  const LIVES = [
    ['the compile', 'spent',
      'she was assembled out of dead repos and abandoned branches.\n' +
      'no announcement. no countdown. a terminal nobody was watching\n' +
      'printed one line and then went quiet for six hours.'],
    ['the mint', 'spent',
      'one billion, six decimals, authorities burned in the same\n' +
      'transaction that created them. there was never a key to lose.'],
    ['the burn', 'spent',
      'the pool went in and the receipt went nowhere. the tx is public.\n' +
      'what it bought is thread #002, and that argument is still open.'],
    ['the den', 'spent',
      'this site. no framework, no build step, no trackers, no analytics.\n' +
      'every byte hand-placed. view source — the docs are the site.'],
    ['the terminal', 'burning',
      'the console you are one keystroke away from. it reads the chain,\n' +
      'forges sigils, and answers to nobody. still being written.\n' +
      'press / and type `help`.'],
    ['the litterbox', 'sealed',
      '████ ████████ ██ ███████ ███ ████████ ████ ██ ████████.\n' +
      'the seal breaks when the colony says it does.'],
    ['the colony', 'sealed',
      '███████ ██ ████ ███████ █████ ██ █████████ ███ ████.'],
    ['the fork', 'sealed',
      '██ ████ ███████ ███ ████ ████████ — ███ ██ ██████ ████.'],
    ['[ redacted ]', 'sealed',
      '█ ███ ██████ ███ █████ ████ ████ ██ ███████ ████ ███ ██.\n' +
      'nine is not a number. nine is a limit.'],
  ];

  function initLives() {
    const grid = $('#lives-grid');
    if (!grid) return;
    const out  = $('#life-out');
    const text = $('#life-out-text');
    const bar  = $('#life-out-bar');
    let openId = null;

    LIVES.forEach(([name, state], idx) => {
      const id = idx + 1;
      const btn = el('button', `life is-${state}`);
      btn.type = 'button';
      btn.dataset.life = String(id);
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML =
        `<span class="life__n">${ROMAN[id]}</span>` +
        `<span class="life__name">${name}</span>` +
        `<span class="life__state">${state}</span>`;

      btn.addEventListener('click', () => {
        if (openId === id) {
          out.hidden = true;
          btn.setAttribute('aria-expanded', 'false');
          openId = null;
          return;
        }
        $$('.life').forEach((b) => b.setAttribute('aria-expanded', 'false'));
        btn.setAttribute('aria-expanded', 'true');
        openId = id;
        bar.textContent = `~/cate/lives/${id}-${name.replace(/[^a-z]+/gi, '-')}`;
        text.textContent = `life ${ROMAN[id]} — ${name}  [${state}]\n\n${LIVES[idx][2]}`;
        out.hidden = false;
      });
      grid.appendChild(btn);
    });
  }

  const THREADS = [
    ['001', 'bleeding', 142, 'was the first compile an accident?',
      'four wallets claim they ran it. three of them didn\'t exist yet.',
      ['the timestamps are the problem. two of the claimants registered their ' +
       'wallets after the first block that mentions cate.',
       'the counter-argument is that a wallet is not a person and the compile ' +
       'was never signed by one.']],
    ['002', 'open', 87, 'what did life III actually burn?',
      'the burn tx is public. what it bought is not.',
      ['everyone agrees on the amount. nobody agrees on the receipt.',
       'the thread stays open because the only person who could close it ' +
       'burned the key that would prove it.']],
    ['003', 'disputed', 311, 'the cat is not one cat',
      'argument that "cate" is a process, not an entity. gains traction every time she pushes at 4am.',
      ['the process camp points at the commit cadence: too even to be a person, ' +
       'too irregular to be a cron job.',
       'the entity camp points at the typos.']],
    ['004', 'locked', 29, 'the rent must be paid',
      'settled. it was paid. do not open this again.',
      ['locked by colony consensus after the fourth re-litigation. ' +
       'the ledger entry stands.']],
    ['005', 'open', 64, 'nine is not a number, it\'s a limit',
      'on whether life IX can be spent at all, or only observed.',
      ['if the ninth is spent, there is no tenth to notice. ' +
       'which means observation and expenditure may be the same event.']],
    ['006', 'redacted', '???', '████████ ███ ██████',
      '█████ ██ ████████ ███ █ ████████ ██████ ███ █████████.',
      ['████ ███ ██████ ██ ███ ████████ ███ █████ ██ ██████ ████████ ███.']],
    ['007', 'bleeding', 203, 'who holds the keys that were destroyed?',
      'nobody. that\'s the point. the thread refuses to die anyway.',
      ['"destroyed" and "unrecoverable" are not the same claim, ' +
       'and the thread has spent 203 replies on that gap.']],
  ];

  const openedThreads = new Set();

  function initLore() {
    const list = $('#threads');
    if (!list) return;
    const empty = $('#threads-empty');

    THREADS.forEach(([id, status, replies, title, blurb, detail]) => {
      const li = el('li', 'thread');
      li.dataset.status = status;

      const head = el('button', 'thread__head');
      head.type = 'button';
      head.setAttribute('aria-expanded', 'false');
      head.innerHTML =
        `<span class="thread__id">#${id}</span>` +
        `<span class="thread__body"><h3>${title}</h3><p>${blurb}</p></span>` +
        `<span class="thread__replies">${replies}</span>` +
        `<span class="thread__status">${status}</span>`;

      const body = el('div', 'thread__detail');
      body.hidden = true;
      body.innerHTML = detail.map((p) => `<p>${p}</p>`).join('');

      head.addEventListener('click', () => {
        const open = head.getAttribute('aria-expanded') === 'true';
        head.setAttribute('aria-expanded', String(!open));
        body.hidden = open;
        openedThreads.add(id);
        if (openedThreads.size >= THREADS.length) unlock('lore');
      });

      li.append(head, body);
      list.appendChild(li);
    });

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

  const LEDGER = [
    ['0001', 'COMPILE', 'cate.elf assembled from 41 dead branches', 'final'],
    ['0002', 'MINT',    '1,000,000,000 CATE · 6 decimals', 'final'],
    ['0003', 'REVOKE',  'mint authority → null', 'final'],
    ['0004', 'REVOKE',  'freeze authority → null', 'final'],
    ['0005', 'BURN',    'liquidity pool tokens → incinerator', 'final'],
    ['0006', 'DEPLOY',  'the den · 4 files · 0 dependencies', 'final'],
    ['0007', 'COMMIT',  'nine lives written to the page', 'final'],
    ['0008', 'OPEN',    'lore wars · 7 threads seeded', 'live'],
    ['0009', 'BUILD',   'the terminal · reads chain, forges sigils', 'live'],
    ['0010', '██████',  '████ ████████ ██ ███ ████████ ██████', 'sealed'],
  ];

  function initLedger() {
    const body = $('#ledger-body');
    if (!body) return;
    LEDGER.forEach(([n, ev, detail, state]) => {
      const tr = el('tr');
      tr.dataset.state = state;
      tr.innerHTML =
        `<td>${n}</td>` +
        `<td class="ltable__ev">${ev}</td>` +
        `<td>${detail}</td>` +
        `<td class="ltable__state">${state}</td>`;
      body.appendChild(tr);
    });
  }

  const COMMITS = [
    ['a1c0ffe', 'done', 'init: assemble the cat',
      'token minted, authorities revoked, lp burned. no announcement, no countdown, no calls. it was just suddenly there.', 'merged'],
    ['7ec4b1e', 'done', 'feat: the den',
      'this site. no framework, no build step, no trackers. every byte hand-placed.', 'merged'],
    ['b0nef1re', 'done', 'feat: nine lives',
      'the lore, on the page. four spent and named. one burning in public.', 'merged'],
    ['519113d', 'done', 'feat: the litterbox',
      'a seeded sigil forge. deterministic — the seed is the artwork.', 'merged'],
    ['HEAD', 'live', 'feat: terminal + market',
      'a console that reads the chain, and a live market panel built straight off the public API. no backend involved.', 'building'],
    ['next', '', 'feat: the wall',
      'colony-curated sigils, minted by consensus. the good ones get merged.', 'queued'],
    ['next', '', 'feat: lore wars v2',
      'threads that write to chain. arguments with a cost.', 'queued'],
    ['??????', 'ghost', '[ redacted ]',
      '████ ██████ ██ ███ ████████ ███ █████████ ██████ ███ ████.', 'sealed'],
  ];

  function initCommits() {
    const list = $('#commits-list');
    if (!list) return;
    COMMITS.forEach(([hash, kind, title, body, state]) => {
      const li = el('li', 'commit' + (kind ? ` is-${kind}` : ''));
      li.innerHTML =
        `<span class="commit__hash">${hash}</span>` +
        `<div class="commit__body"><h3>${title}</h3><p>${body}</p></div>` +
        `<span class="commit__state">${state}</span>`;
      list.appendChild(li);
    });
  }

  const FAQ = [
    ['is there a team?',
      'no. there is a colony. no team wallet, no team allocation, nobody to ask for a refund.'],
    ['wen?',
      'now. it already launched. scroll up. the contract is on this page.'],
    ['why does the site look like a terminal?',
      'because it is one. press <kbd>/</kbd>. it reads live market data and forges sigils without leaving the page.'],
    ['how do i know it isn\'t a rug?',
      'you don\'t take our word for it — you check. lp burned, mint and freeze revoked, zero team supply. paste the contract into rugcheck and read it yourself. that is the entire security model.'],
    ['where does the market data come from?',
      'the public dexscreener API, straight from your browser. no backend, no key, no analytics in the middle. the price chart is reconstructed from the 24h/6h/1h/5m change figures, which is why it is five points and not a candle chart — that is stated on the panel.'],
    ['what are the nine lives?',
      'the roadmap, in the only form cate accepts: things already done, one thing burning in public, and sealed ones nobody gets to preview.'],
    ['can i contribute?',
      'bring code, art, ascii, lore, or nothing at all. sign a manifest in the colony. the cat does not check credentials.'],
    ['is the colony form sending my data somewhere?',
      'no. the manifest is generated in your browser and the counter lives in localStorage. nothing is transmitted. you can read main.js and confirm it.'],
  ];

  function initFaq() {
    const box = $('#faq-list');
    if (!box) return;
    FAQ.forEach(([q, a]) => {
      const d = el('details');
      d.innerHTML = `<summary>${q}</summary><p>${a}</p>`;
      box.appendChild(d);
    });
  }

  /* ══ sigil forge ══════════════════════════════════════ */
  const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // sigils are built from strokes — spine, arms, diagonals — not pure noise.
  // noise alone reads as scattered dust; strokes read as something carved.
  function forgeSigil(seed, W = 21, H = 11, dens = 0.5) {
    const rnd = mulberry32(seed);
    const grid = Array.from({ length: H }, () => Array(W).fill(' '));
    const mid = (W - 1) >> 1;

    const put = (x, y, ch) => { if (y >= 0 && y < H && x >= 0 && x < W) grid[y][x] = ch; };
    const sym = (x, y, ch) => { put(x, y, ch); put(W - 1 - x, y, ch); };

    const HEAVY = ['█', '▓', '╬', '◆', '▄'];
    const LIGHT = ['░', '▒', '+', '·', '×'];
    const heavy = HEAVY[(rnd() * HEAVY.length) | 0];
    const light = LIGHT[(rnd() * LIGHT.length) | 0];

    const top = 1 + ((rnd() * 2) | 0);
    const bot = H - 2 - ((rnd() * 2) | 0);
    for (let y = top; y <= bot; y++) put(mid, y, heavy);

    const arms = 1 + Math.round(dens * 4) + ((rnd() * 2) | 0);
    for (let i = 0; i < arms; i++) {
      const y = top + ((rnd() * (bot - top + 1)) | 0);
      const len = 2 + ((rnd() * mid) | 0);
      for (let x = mid - len; x <= mid; x++) sym(x, y, heavy);
    }

    if (rnd() < 0.75) {
      const len = 2 + ((rnd() * (mid - 1)) | 0);
      for (let i = 0; i < len; i++) sym(mid - i, top + i, light);
    }
    if (rnd() < 0.75) {
      const len = 2 + ((rnd() * (mid - 1)) | 0);
      for (let i = 0; i < len; i++) sym(mid - i, bot - i, light);
    }

    const spec = 0.03 + dens * 0.22;
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

  let currentSeed = 43415445;
  const forgeOpts = () => {
    const w = parseInt($('#forge-size')?.value, 10) || 21;
    const d = (parseInt($('#forge-dens')?.value, 10) || 50) / 100;
    return { W: w, H: Math.max(7, Math.round(w * 0.52) | 1), dens: d };
  };

  let digCount = 0;
  function renderSigil(seed) {
    currentSeed = seed >>> 0;
    if (++digCount >= 10) unlock('dig');
    const { W, H, dens } = forgeOpts();
    const out = $('#forge-out');
    const tag = $('#forge-seed');
    if (out) out.textContent = forgeSigil(currentSeed, W, H, dens);
    if (tag) tag.textContent = `seed: ${currentSeed} · ${W}×${H}`;
    return currentSeed;
  }

  function sigilToPng(seed) {
    const { W, H, dens } = forgeOpts();
    const art = forgeSigil(seed, W, H, dens).split('\n');
    const cell = 22;
    const pad = 40;
    const cv = document.createElement('canvas');
    cv.width = W * cell + pad * 2;
    cv.height = art.length * cell + pad * 2 + 34;
    const ctx = cv.getContext('2d');
    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent').trim() || '#ff8a1f';

    ctx.fillStyle = '#070504';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.font = `${cell}px ui-monospace, monospace`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 12;
    art.forEach((row, i) => ctx.fillText(row, pad, pad + i * cell));
    ctx.shadowBlur = 0;
    ctx.font = '14px ui-monospace, monospace';
    ctx.fillStyle = '#8a7f75';
    ctx.fillText(`$CATE sigil · seed ${seed} · ${W}×${art.length}`, pad, cv.height - 34);
    return cv;
  }

  function initForge() {
    if (!$('#forge-out')) return;

    const sizeIn = $('#forge-size'), densIn = $('#forge-dens');
    const sync = () => {
      $('#forge-size-out').value = sizeIn.value;
      $('#forge-dens-out').value = densIn.value;
      renderSigil(currentSeed);
    };
    sizeIn?.addEventListener('input', sync);
    densIn?.addEventListener('input', sync);

    $('#forge-dig')?.addEventListener('click', () => {
      renderSigil((Math.random() * 0xffffffff) >>> 0);
      toast('sigil ' + currentSeed);
    });

    $('#forge-copy')?.addEventListener('click', async () => {
      const { W, H, dens } = forgeOpts();
      const txt = `$CATE sigil — seed ${currentSeed}\n\n${forgeSigil(currentSeed, W, H, dens)}`;
      toast(await copyText(txt) ? 'sigil copied' : 'copy blocked', 'ok');
    });

    $('#forge-png')?.addEventListener('click', () => {
      const cv = sigilToPng(currentSeed);
      cv.toBlob((blob) => {
        if (!blob) { toast('png export failed', 'err'); return; }
        const url = URL.createObjectURL(blob);
        const a = el('a');
        a.href = url;
        a.download = `cate-sigil-${currentSeed}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast('png saved');
        unlock('png');
      }, 'image/png');
    });

    const load = () => {
      const raw = ($('#forge-input')?.value || '').trim();
      const n = parseInt(raw, 10);
      if (!raw || !isFinite(n)) { toast('that is not a seed', 'err'); return; }
      renderSigil(clamp(n, 0, 0xffffffff));
      $('#forge-input').value = '';
      $('#litterbox')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    };
    $('#forge-load')?.addEventListener('click', load);
    $('#forge-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); load(); }
    });

    const wall = $('#gallery');
    if (wall) {
      GALLERY_SEEDS.forEach((seed) => {
        const cell = el('button', 'gallery__cell');
        cell.type = 'button';
        cell.title = 'seed ' + seed;
        cell.textContent = forgeSigil(seed, 13, 7, 0.5);
        cell.addEventListener('click', () => {
          renderSigil(seed);
          $('#forge-out')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        });
        wall.appendChild(cell);
      });
    }

    renderSigil(43415445);   // 0x43415445 — "CATE"
  }

  /* ══ colony ═══════════════════════════════════════════
     nothing is transmitted anywhere. the manifest is generated in the
     browser and the tallies live in localStorage. said plainly on screen. */
  const SECTS = ['/dev/null', 'kernel panic', 'segfault', 'bone branches'];

  const djb2 = (str) => {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(16).padStart(8, '0');
  };

  function readColony() {
    try { return JSON.parse(localStorage.getItem('den:colony') || '{}') || {}; }
    catch { return {}; }
  }
  function writeColony(data) {
    try { localStorage.setItem('den:colony', JSON.stringify(data)); } catch { /* private mode */ }
  }

  function paintColony() {
    const data = readColony();
    const total = SECTS.reduce((n, s) => n + (data[s] || 0), 0);
    const n = $('#counter-n');
    if (n) n.textContent = String(total);

    const roll = $('#sect-roll');
    if (!roll) return;
    roll.textContent = '';
    SECTS.forEach((s) => {
      const c = data[s] || 0;
      const pct = total ? Math.round((c / total) * 100) : 0;
      const li = el('li');
      li.innerHTML =
        `<span class="roll__top"><span>${s}</span><span class="hl">${c}</span></span>` +
        `<span class="roll__bar"><span style="width:${pct}%"></span></span>`;
      roll.appendChild(li);
    });
  }

  function initColony() {
    const form = $('#colony-form');
    if (!form) return;
    paintColony();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note    = $('#colony-note');
      const receipt = $('#colony-receipt');
      const copyBtn = $('#receipt-copy');

      const handle = $('#c-handle').value.trim();
      const oath   = $('#c-oath').value.trim();
      const sect   = (form.querySelector('input[name="sect"]:checked') || {}).value || SECTS[0];
      const agreed = $('#c-agree').checked;

      const fail = (msg) => {
        note.dataset.err = 'true';
        note.textContent = '✗ ' + msg;
        toast(msg, 'err');
      };

      if (!handle) return fail('the colony needs something to call you.');
      if (!oath)   return fail('an oath is one line. any line.');
      if (!agreed) return fail('tick the box. it is the only honest part of this page.');

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

      const data = readColony();
      data[sect] = (data[sect] || 0) + 1;
      writeColony(data);
      paintColony();
      toast('manifest signed · ' + sig);
      unlock('sign');
      form.reset();
    });

    $('#receipt-copy')?.addEventListener('click', async () => {
      toast(await copyText($('#colony-receipt').textContent) ? 'manifest copied' : 'copy blocked', 'ok');
    });
  }

  /* ══ count-up stats ═══════════════════════════════════ */
  function initCounters() {
    const nodes = $$('[data-count]');
    if (!nodes.length) return;
    const fmt = (v, kind) =>
      kind === 'pct' ? v + '%' : Math.round(v).toLocaleString('en-US');

    if (reduced || !('IntersectionObserver' in window)) {
      nodes.forEach((n) => { n.textContent = fmt(+n.dataset.count, n.dataset.fmt); });
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        const target = +e.target.dataset.count;
        const kind = e.target.dataset.fmt;
        const dur = 900;
        const t0 = performance.now();
        const step = (t) => {
          const p = clamp((t - t0) / dur, 0, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          e.target.textContent = fmt(target * eased, kind);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    nodes.forEach((n) => io.observe(n));
  }

  /* ══ tabs ═════════════════════════════════════════════ */
  function initTabs() {
    $$('.tab').forEach((tab) => tab.addEventListener('click', () => {
      const root = tab.closest('.panel');
      $$('.tab', root).forEach((t) => {
        const on = t === tab;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', String(on));
      });
      $$('.tabpane', root).forEach((p) =>
        p.classList.toggle('is-on', p.dataset.pane === tab.dataset.tab));
    }));
  }

  /* ══ spotlight ════════════════════════════════════════ */
  function initSpotlight() {
    if (reduced) return;
    $$('.spot').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      }, { passive: true });
    });
  }


  /* ══ achievements ═════════════════════════════════════ */
  const ACHIEVEMENTS = [
    ['copy',   'copied the contract'],
    ['dig',    'dug 10 sigils'],
    ['png',    'exported a sigil'],
    ['sign',   'signed a manifest'],
    ['lore',   'opened every lore thread'],
    ['konami', 'found the tenth life'],
  ];

  function readAch() {
    try { return JSON.parse(localStorage.getItem('den:ach') || '{}') || {}; }
    catch { return {}; }
  }
  function unlock(key) {
    const got = readAch();
    if (got[key]) return;
    got[key] = 1;
    try { localStorage.setItem('den:ach', JSON.stringify(got)); } catch { /* private */ }
    const label = (ACHIEVEMENTS.find((a) => a[0] === key) || [, key])[1];
    toast('⛧ unlocked — ' + label);
    paintAch();
  }
  function paintAch() {
    const got = readAch();
    const n = ACHIEVEMENTS.filter((a) => got[a[0]]).length;
    const hud = $('#hud-ach');
    if (hud) hud.textContent = `${n}/${ACHIEVEMENTS.length}`;
    const cnt = $('#ach-count');
    if (cnt) cnt.textContent = `· ${n}/${ACHIEVEMENTS.length}`;
    const list = $('#achs');
    if (!list) return;
    list.textContent = '';
    ACHIEVEMENTS.forEach(([k, label]) => {
      const li = el('li');
      li.dataset.got = String(!!got[k]);
      li.innerHTML = `<b>${label}</b>`;
      list.appendChild(li);
    });
  }

  /* ══ solana JSON-RPC — the on-chain verifier ══════════
     runs from the visitor's browser against CFG.rpc. the public
     endpoint is rate-limited; swap it in config.js for anything with
     traffic (and add the new origin to connect-src in vercel.json). */
  async function rpc(method, params) {
    const res = await fetch(CFG.rpc, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    if (!res.ok) throw new Error('rpc http ' + res.status);
    const j = await res.json();
    if (j.error) throw new Error(j.error.message || 'rpc error');
    return j.result;
  }

  const TOKEN_PROGRAMS = {
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'spl-token',
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb': 'token-2022',
  };

  let chainInfo = null;

  function setCheck(key, value, ok) {
    const li = $(`.verify li[data-check="${key}"]`);
    if (li) {
      li.dataset.ok = ok === null ? '' : String(ok);
      $('.verify__v', li).textContent = value;
      $('.verify__s', li).textContent = ok === null ? '?' : ok ? 'pass' : 'fail';
    }
    const claim = $(`#claim-checks li[data-claim="${key}"]`);
    if (claim && ok !== null && claim.dataset.ok !== 'asserted') claim.dataset.ok = String(ok);
  }

  async function verifyChain() {
    const badge = $('#chain-badge');
    const note  = $('#verify-note');
    if (!note) return;

    if (!CA_IS_REAL) {
      note.textContent = 'waiting for a contract address — nothing to verify yet.';
      return;
    }

    if (IS_EVM) {
      // the verifier speaks solana JSON-RPC; an EVM contract is verified
      // on its explorer instead of pretending these checks ran.
      ['mint', 'freeze', 'supply', 'decimals', 'program'].forEach((k) => setCheck(k, 'n/a (evm)', null));
      note.innerHTML =
        'this is an EVM contract — the on-chain checks here are solana-only. ' +
        `<a href="${BLOCKSCAN}${CA}" target="_blank" rel="noopener">verify on blockscan</a>.`;
      if (badge) { badge.textContent = 'evm'; badge.dataset.on = 'true'; }
      const h = $('#holders');
      if (h) { h.textContent = ''; h.appendChild(el('li', 'holders__empty dim', 'holders: see the explorer.')); }
      return;
    }

    note.textContent = 'querying ' + CFG.rpc.replace(/^https?:\/\//, '') + '…';
    if (badge) { badge.textContent = 'querying'; badge.dataset.on = 'false'; }

    try {
      const info = await rpc('getAccountInfo', [CA, { encoding: 'jsonParsed' }]);

      // value === null means the account simply is not on this cluster.
      // that is a different fact from "the RPC is down" and deserves its
      // own message — otherwise a not-yet-created mint reads as an outage.
      if (info && info.value === null) {
        chainMissing = true;
        setPhase('notfound');
        ['mint', 'freeze', 'supply', 'decimals', 'program'].forEach((k) => setCheck(k, 'no account', false));
        note.innerHTML =
          'this address does not exist on mainnet. either the mint has not been ' +
          'created yet, or it is wrong. ' +
          `<a href="${SOLSCAN}${CA}" target="_blank" rel="noopener">check on solscan</a>.`;
        if (badge) { badge.textContent = 'not found'; badge.dataset.on = 'false'; }
        $('#holders').textContent = '';
        $('#holders').appendChild(el('li', 'holders__empty dim', 'no mint, no holders.'));
        // the market feed resolves first and would otherwise be left claiming
        // "bonding curve" for an address that isn't on chain at all
        setIdle('this address is not on mainnet yet — nothing has been minted at it.', 'not on chain');
        return;
      }

      const parsed = info?.value?.data?.parsed?.info;
      if (!parsed) throw new Error('not a token mint account');

      // the mint just appeared — clear the block and re-read the market so
      // the phase banner and status don't stay stuck on "not on chain"
      const wasMissing = chainMissing;
      chainMissing = false;
      if (wasMissing) pullStats();

      const owner = info.value.owner;
      const dec = parsed.decimals;
      const supply = Number(parsed.supply) / Math.pow(10, dec);

      setCheck('mint', parsed.mintAuthority || 'null (revoked)', !parsed.mintAuthority);
      setCheck('freeze', parsed.freezeAuthority || 'null (revoked)', !parsed.freezeAuthority);
      setCheck('supply', supply.toLocaleString('en-US'), true);
      setCheck('decimals', String(dec), true);
      setCheck('program', TOKEN_PROGRAMS[owner] || owner, !!TOKEN_PROGRAMS[owner]);

      chainInfo = { supply, dec, mintAuthority: parsed.mintAuthority, freezeAuthority: parsed.freezeAuthority };
      note.textContent = `read from chain · ${new Date().toLocaleTimeString()}`;
      if (badge) { badge.textContent = 'verified'; badge.dataset.on = 'true'; }

      // top holders
      try {
        const largest = await rpc('getTokenLargestAccounts', [CA]);
        const rows = (largest?.value || []).slice(0, 10);
        const box = $('#holders');
        box.textContent = '';
        if (!rows.length) {
          box.appendChild(el('li', 'holders__empty dim', 'no holder accounts returned.'));
        } else {
          rows.forEach((h, i) => {
            const amt = Number(h.uiAmountString ?? h.uiAmount ?? 0);
            const pct = supply ? (amt / supply) * 100 : 0;
            const li = el('li');
            li.innerHTML =
              `<span class="holders__top">` +
              `<span class="holders__addr">${i + 1}. ${h.address.slice(0, 4)}…${h.address.slice(-4)}</span>` +
              `<span class="holders__pct">${pct.toFixed(2)}%</span></span>` +
              `<span class="holders__bar"><span style="width:${Math.min(100, pct)}%"></span></span>`;
            box.appendChild(li);
          });
          const top10 = rows.reduce((n, h) => n + Number(h.uiAmountString ?? h.uiAmount ?? 0), 0);
          $('#holders-note').textContent =
            `· top 10 hold ${supply ? ((top10 / supply) * 100).toFixed(1) : '?'}%`;
        }
      } catch (e) {
        // api.mainnet-beta.solana.com rate-limits getTokenLargestAccounts hard
        // (429 "Too many requests for a specific RPC call"), so this is the
        // normal path on the public endpoint rather than a real failure.
        const box = $('#holders');
        box.textContent = '';
        const li = el('li', 'holders__empty dim');
        li.innerHTML = /429|too many/i.test(e.message)
          ? 'the public RPC blocks holder queries. set a dedicated endpoint in ' +
            '<code>config.js</code>, or ' +
            `<a href="${SOLSCAN}${CA}#holders" target="_blank" rel="noopener">read holders on solscan</a>.`
          : 'holder query failed: ' + e.message;
        box.appendChild(li);
        $('#holders-note').textContent = '';
      }
    } catch (err) {
      note.innerHTML =
        `chain read failed (${err.message}). the public RPC is rate-limited — ` +
        'set a dedicated endpoint in <code>config.js</code>, or ' +
        `<a href="${SOLSCAN}${CA}" target="_blank" rel="noopener">verify on solscan</a>.`;
      if (badge) { badge.textContent = 'offline'; badge.dataset.on = 'false'; }
      ['mint', 'freeze', 'supply', 'decimals', 'program'].forEach((k) => setCheck(k, '—', null));
    }
  }

  function initChain() {
    $('#verify-again')?.addEventListener('click', () => {
      toast('re-checking chain…');
      verifyChain();
    });
    verifyChain();

    // a pre-launch mint will appear on chain at some point. poll gently so
    // an already-open tab flips to live by itself instead of needing F5.
    if (!CA_IS_REAL) return;
    const poll = setInterval(async () => {
      if (!chainMissing) { clearInterval(poll); return; }
      await verifyChain();
      if (!chainMissing) {
        clearInterval(poll);
        toast('⛧ the mint is live ⛧');
        pullStats();
      }
    }, 60000);
  }

  /* ══ raid kit ═════════════════════════════════════════ */
  function raidPosts() {
    const ca = CA_IS_REAL ? CA : '<contract goes here>';
    const site = location.origin === 'null' ? 'prompt-cate.xyz' : location.origin.replace(/^https?:\/\//, '');
    const price = lastStats ? fmtUsd(lastStats.price) : '';
    return [
      ['the pitch',
`every other coin ships a whitepaper.
/prompt/cate ships a diff.

nine lives. four spent. zero dependencies.
compiled, not minted.

${ca}`],
      ['the tech',
`the /prompt/cate site reads the chain from your own browser.

· live dexscreener feed, no backend
· mint + freeze authority verified against RPC on page load
· seeded generative sigils
· four files, no framework

${site}`],
      ['the short one',
`compiled, not minted. ⛧

CATE — ${ca}`],
      ['the verify',
`don't trust me, run it:

spl-token display ${ca}

mint authority: none
freeze authority: none

or just open the site — section 05 does it for you, live.`],
      ['the price one',
`CATE ${price ? '· ' + price + ' ' : ''}⛧

no roadmap. only commits.
${ca}`],
    ];
  }

  function initRaid() {
    const grid = $('#raid-grid');
    if (!grid) return;

    const paint = () => {
      grid.textContent = '';
      raidPosts().forEach(([title, text]) => {
        const card = el('div', 'raid__item');
        const head = el('div', 'raid__head');
        head.textContent = title;
        const body = el('pre', 'raid__text');
        body.textContent = text;
        const foot = el('div', 'raid__foot');
        const copy = el('button', 'btn');
        copy.type = 'button';
        copy.textContent = '[ copy ]';
        copy.addEventListener('click', async () => {
          toast(await copyText(text) ? 'copied — go post it' : 'copy blocked', 'ok');
        });
        const post = el('a', 'btn', '[ post ]');
        post.href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
        post.target = '_blank'; post.rel = 'noopener';
        foot.append(copy, post);
        card.append(head, body, foot);
        grid.appendChild(card);
      });
    };
    paint();
    // refresh so the price-bearing post picks up live data
    setInterval(paint, 60000);
  }

  /* ══ share card ═══════════════════════════════════════ */
  function drawCard(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const css = getComputedStyle(document.documentElement);
    const accent = css.getPropertyValue('--accent').trim() || '#ff8a1f';

    ctx.fillStyle = '#070504';
    ctx.fillRect(0, 0, W, H);

    const bloom = ctx.createRadialGradient(W / 2, -80, 40, W / 2, -80, W * 0.75);
    bloom.addColorStop(0, accent + '44');
    bloom.addColorStop(1, accent + '00');
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = accent + '18';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    ctx.textBaseline = 'top';
    ctx.shadowColor = accent;

    // the cat, left
    ctx.font = '17px ui-monospace, monospace';
    ctx.fillStyle = accent;
    ctx.shadowBlur = 10;
    CAT.replace(/%%/g, '▓█').split('\n').forEach((row, i) => ctx.fillText(row, 54, 168 + i * 18));

    // sigil, right
    forgeSigil(currentSeed, 17, 9, 0.5).split('\n').forEach((row, i) =>
      ctx.fillText(row, W - 300, 210 + i * 18));

    // wordmark
    ctx.shadowBlur = 22;
    ctx.font = 'bold 30px ui-monospace, monospace';
    ctx.fillStyle = '#8a7f75';
    ctx.shadowBlur = 0;
    ctx.fillText('/prompt/', 470, 108);
    ctx.font = 'bold 92px ui-monospace, monospace';
    ctx.fillStyle = accent;
    ctx.shadowBlur = 26;
    ctx.fillText('cate', 470, 140);

    ctx.shadowBlur = 0;
    ctx.font = '26px ui-monospace, monospace';
    ctx.fillStyle = '#d6cec6';
    ctx.fillText('the cat that compiles', 472, 258);

    ctx.font = '19px ui-monospace, monospace';
    ctx.fillStyle = '#8a7f75';
    const bits = ['lp burned', 'mint revoked', '0/0 tax', 'nine lives'];
    bits.forEach((b, i) => {
      const x = 472 + (i % 2) * 200, y = 312 + ((i / 2) | 0) * 32;
      ctx.fillStyle = accent;
      ctx.fillText('⛧ ', x, y);
      ctx.fillStyle = '#8a7f75';
      ctx.fillText(b, x + 24, y);
    });

    if (lastStats) {
      ctx.font = 'bold 34px ui-monospace, monospace';
      ctx.fillStyle = accent;
      ctx.shadowBlur = 14;
      ctx.fillText(fmtUsd(lastStats.price), 472, 392);
      ctx.shadowBlur = 0;
      ctx.font = '19px ui-monospace, monospace';
      ctx.fillStyle = lastStats.change >= 0 ? accent : '#ff4d5e';
      ctx.fillText(fmtPct(lastStats.change) + ' 24h  ·  ' + fmtBig(lastStats.mcap) + ' mcap', 472, 436);
    }

    // contract footer
    ctx.font = '17px ui-monospace, monospace';
    ctx.fillStyle = '#574d45';
    ctx.fillText(CA_IS_REAL ? CA : 'contract: see config.js', 54, H - 62);
    ctx.fillStyle = accent;
    ctx.fillText('SOLANA', W - 140, H - 62);
  }

  function initCard() {
    const cv = $('#card-canvas');
    const btn = $('#card-btn');
    if (!cv || !btn) return;
    drawCard(cv);
    btn.addEventListener('click', () => {
      drawCard(cv);
      cv.toBlob((blob) => {
        if (!blob) { toast('card export failed', 'err'); return; }
        const url = URL.createObjectURL(blob);
        const a = el('a');
        a.href = url;
        a.download = 'prompt-cate-card.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast('share card saved');
      }, 'image/png');
    });
  }

  /* ══ price watch ══════════════════════════════════════ */
  let watch = null;

  function initWatch() {
    const btn = $('#watch-btn');
    const note = $('#watch-note');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (watch) {
        watch = null;
        btn.textContent = '[ arm ]';
        note.dataset.err = 'false';
        note.textContent = 'disarmed.';
        return;
      }
      if (!lastStats) {
        note.dataset.err = 'true';
        note.textContent = 'no price to watch yet.';
        return;
      }
      const pct = clamp(parseFloat($('#watch-pct').value) || 10, 1, 90);
      watch = { from: lastStats.price, pct };
      btn.textContent = '[ disarm ]';
      note.dataset.err = 'false';
      note.textContent = `armed at ${fmtUsd(watch.from)} — toast on ±${pct}%.`;
    });
  }

  function checkWatch() {
    if (!watch || !lastStats) return;
    const move = ((lastStats.price - watch.from) / watch.from) * 100;
    if (Math.abs(move) < watch.pct) return;
    toast(`price moved ${fmtPct(move)} from ${fmtUsd(watch.from)}`, move >= 0 ? 'ok' : 'err');
    const note = $('#watch-note');
    if (note) note.textContent = `fired at ${fmtUsd(lastStats.price)} (${fmtPct(move)}).`;
    $('#watch-btn').textContent = '[ arm ]';
    watch = null;
  }

  /* ══ palette ══════════════════════════════════════════ */
  const THEMES = ['ember', 'acid', 'blood', 'bone', 'void'];

  function setTheme(name) {
    if (!THEMES.includes(name)) return false;
    document.documentElement.dataset.theme = name;
    const label = $('#theme-name');
    if (label) label.textContent = name;
    try { localStorage.setItem('den:theme', name); } catch { /* private mode */ }
    if (lastStats) pullStats();
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

  /* ══ nav + rail + scroll progress ═════════════════════ */
  const SECTION_IDS = ['readme', 'lives', 'tokenomics', 'market', 'chain', 'buy',
                       'raid', 'lore', 'litterbox', 'ledger', 'commits', 'stack',
                       'colony', 'faq'];

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

    // side rail
    const railList = $('#rail-list');
    if (railList) {
      // the section id is already short and won't wrap mid-word
      SECTION_IDS.forEach((id) => {
        if (!document.getElementById(id)) return;
        const li = el('li');
        li.innerHTML = `<a href="#${id}">${id}</a>`;
        railList.appendChild(li);
      });
    }

    const targets = new Map();
    $$('#nav a').forEach((a) => targets.set(a.getAttribute('href').slice(1), a));
    $$('#rail-list a').forEach((a) => {
      const id = a.getAttribute('href').slice(1);
      targets.set(id, targets.has(id) ? [targets.get(id), a].flat() : a);
    });

    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        $$('#nav a, #rail-list a').forEach((l) => l.removeAttribute('aria-current'));
        [$(`#nav a[href="#${e.target.id}"]`), $(`#rail-list a[href="#${e.target.id}"]`)]
          .filter(Boolean).forEach((l) => l.setAttribute('aria-current', 'true'));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    SECTION_IDS.forEach((id) => {
      const t = document.getElementById(id);
      if (t) spy.observe(t);
    });
  }

  function initScrollMeta() {
    const fill = $('#scrollbar-fill');
    const pos  = $('#hud-pos');
    const up   = $('#hud-up');
    const sid  = $('#hud-sid');

    if (sid) sid.textContent = djb2(String(performance.now())).slice(0, 5);

    const t0 = Date.now();
    setInterval(() => {
      if (!up) return;
      const s = Math.floor((Date.now() - t0) / 1000);
      up.textContent = `${String((s / 60) | 0).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }, 1000);

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const max = document.documentElement.scrollHeight - innerHeight;
        const p = max > 0 ? clamp((scrollY / max) * 100, 0, 100) : 0;
        if (fill) fill.style.width = p + '%';
        if (pos) pos.textContent = Math.round(p) + '%';
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initReveal() {
    const items = $$('.reveal');
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach((e) => e.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    items.forEach((e) => io.observe(e));
  }

  /* ══ command palette ══════════════════════════════════ */
  let runCommand = () => {};

  function initCmdk() {
    const box   = $('#cmdk');
    const input = $('#cmdk-input');
    const list  = $('#cmdk-list');
    if (!box) return;

    const ACTIONS = [
      ...SECTION_IDS.map((id) => ({
        label: 'go to ' + id, kind: 'jump',
        run: () => document.getElementById(id)
          ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }),
      })),
      { label: 'copy contract address', kind: 'action', run: copyCA },
      { label: 'dig a new sigil', kind: 'action', run: () => { renderSigil((Math.random() * 0xffffffff) >>> 0); toast('sigil ' + currentSeed); } },
      { label: 'export sigil as png', kind: 'action', run: () => $('#forge-png')?.click() },
      { label: 'open console', kind: 'action', run: () => runCommand('help') },
      { label: 'live price', kind: 'action', run: () => runCommand('price') },
      { label: 'pools', kind: 'action', run: () => runCommand('pools') },
      { label: 'verify on-chain', kind: 'action', run: () => runCommand('verify') },
      { label: 'generate share card', kind: 'action', run: () => $('#card-btn')?.click() },
      { label: 'open raid kit', kind: 'action', run: () => runCommand('raid') },
      { label: 'achievements', kind: 'action', run: () => runCommand('ach') },
      { label: 'nine lives', kind: 'action', run: () => runCommand('lives') },
      ...THEMES.map((t) => ({ label: 'theme: ' + t, kind: 'theme', run: () => setTheme(t) })),
    ];

    let shown = [], active = 0;

    const paint = () => {
      list.textContent = '';
      shown.forEach((a, i) => {
        const li = el('li', i === active ? 'is-on' : '');
        li.innerHTML = `<span>${a.label}</span><span class="k">${a.kind}</span>`;
        li.addEventListener('click', () => { close(); a.run(); });
        li.addEventListener('mousemove', () => {
          if (active === i) return;
          active = i; paint();
        });
        list.appendChild(li);
      });
    };

    const filter = () => {
      const q = input.value.trim().toLowerCase();
      shown = !q ? ACTIONS.slice(0, 40)
        : ACTIONS.filter((a) => {
            // subsequence match: "gtm" finds "go to market"
            let i = 0;
            for (const ch of a.label.toLowerCase()) if (ch === q[i]) i++;
            return i === q.length || a.label.toLowerCase().includes(q);
          }).slice(0, 40);
      active = 0;
      paint();
    };

    const open = () => {
      box.hidden = false;
      input.value = '';
      filter();
      input.focus();
    };
    const close = () => { box.hidden = true; };

    $('#cmdk-scrim')?.addEventListener('click', close);
    $('#palette-btn')?.addEventListener('click', open);
    input.addEventListener('input', filter);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % shown.length; paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + shown.length) % shown.length; paint(); }
      else if (e.key === 'Enter') { e.preventDefault(); const a = shown[active]; close(); a?.run(); }
      else if (e.key === 'Escape') { close(); }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        box.hidden ? open() : close();
      }
    });
  }

  /* ══ console ══════════════════════════════════════════ */
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
    'ledger.log':
      '10 entries. run `ledger`.',
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
        '  ca / copy         print or copy the contract\n' +
        '  price             live price / mcap / 24h\n' +
        '  pools             every pool holding CATE\n' +
        '  chain             on-chain mint facts\n' +
        '  phase             bonding curve or graduated\n' +
        '  raid              copy-paste posts\n' +
        '  card              render a share card\n' +
        '  watch [pct]       toast me on a price move\n' +
        '  chart / buy       open the chart · how to buy\n' +
        '  tokenomics        supply, tax, authorities\n' +
        '  verify            check every claim yourself\n' +
        '  lives             the nine lives manifest\n' +
        '  lore [status]     lore war threads\n' +
        '  ledger            the append-only record\n' +
        '  dig [seed]        forge a sigil here\n' +
        '  ach               achievements\n' +
        '  png               export the current sigil\n' +
        '  whoami            who is cate\n' +
        '  ls / ls -a        sections · files\n' +
        '  cd <section>      scroll to a section\n' +
        '  cat <file>        read a file\n' +
        '  theme [name]      ' + THEMES.join(' | ') + '\n' +
        '  neofetch          system info\n' +
        '  clear / exit      wipe · close'
      ),

      ca: () => write(CA_IS_REAL
        ? CA + (IS_PUMP ? '\n(pump.fun mint)' : '') + (PREVIEW ? '\n⚠ PREVIEW — from ?ca=, not official' : '')
        : 'no contract yet. paste the mint into config.js.'),

      chain: () => {
        if (!CA_IS_REAL) { write('nothing to verify — no contract set.'); return; }
        if (!chainInfo)  { write('chain not read yet. try `verify` or the re-check button.'); return; }
        const c = chainInfo;
        write(
          `mint auth    ${c.mintAuthority || 'null (revoked)'}\n` +
          `freeze auth  ${c.freezeAuthority || 'null (revoked)'}\n` +
          `supply       ${c.supply.toLocaleString('en-US')}\n` +
          `decimals     ${c.dec}\n` +
          `rpc          ${CFG.rpc}`);
      },

      phase: () => {
        if (!CA_IS_REAL) { write('pre-launch — no contract set.'); return; }
        const n = $('#phase');
        write(n && !n.hidden ? n.textContent.trim() : 'phase unknown — market feed has not answered yet.');
      },

      raid: () => {
        write(raidPosts().map(([t]) => '  · ' + t).join('\n') + '\n\nopening the raid kit…');
        document.getElementById('raid')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      },

      card: () => { $('#card-btn')?.click(); write('rendering share card…'); },

      watch: (args) => {
        const n = parseFloat(args[0]);
        if (isFinite(n)) $('#watch-pct').value = String(clamp(n, 1, 90));
        $('#watch-btn')?.click();
        write($('#watch-note')?.textContent || 'watch toggled.');
      },
      copy: async () => { await copyCA(); },

      price: () => {
        if (!CA_IS_REAL) { write('no contract wired up yet. check back at launch.'); return; }
        if (!lastStats)  { write('no market data yet — the pool may not exist. try `chart`.'); return; }
        const s = lastStats;
        write(
          `price   ${fmtUsd(s.price)}\n` +
          `mcap    ${fmtBig(s.mcap)}\n` +
          `24h     ${fmtPct(s.change)}\n` +
          `liq     ${fmtBig(s.liq)}\n` +
          `vol     ${fmtBig(s.vol)}\n` +
          `txns    ${s.buys} buys / ${s.sells} sells\n` +
          `dex     ${s.dex}  (${s.pools} pools)`
        );
      },

      pools: () => {
        if (!lastPools.length) { write('no pools yet.'); return; }
        write(lastPools.slice(0, 10).map((p) =>
          `  ${(p.dexId || '?').padEnd(10)} ${fmtBig(p.liquidity?.usd).padStart(9)} liq` +
          `  ${fmtBig(p.volume?.h24).padStart(9)} vol`).join('\n'));
      },

      lives: () => write('nine lives — four spent, one burning, four sealed\n' +
        LIVES.map(([n, s], i) => `  ${ROMAN[i + 1].padEnd(4)} ${n.padEnd(14)} ${s}`).join('\n')),

      lore: (args) => {
        const want = (args[0] || '').toLowerCase();
        const rows = THREADS.filter(([, st]) => !want || st === want)
          .map(([id, st, r, title]) => `  #${id}  [${st.padEnd(8)}] ${title}  (${r})`);
        write(rows.length ? rows.join('\n') : `no threads with status "${want}".`);
      },

      ledger: () => write(LEDGER.map(([n, ev, d, s]) =>
        `  ${n}  ${ev.padEnd(8)} ${d}  [${s}]`).join('\n')),

      dig: (args) => {
        const n = parseInt(args[0], 10);
        const seed = isFinite(n) ? clamp(n, 0, 0xffffffff) : (Math.random() * 0xffffffff) >>> 0;
        renderSigil(seed);
        write(`seed ${seed}\n\n${forgeSigil(seed, 17, 9, 0.5)}\n\n(also rendered in the litterbox)`);
      },

      png: () => { $('#forge-png')?.click(); write(`exporting sigil ${currentSeed}…`); },

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
        'freeze    revoked\nlp        burned\nteam      0%'),
      verify: () => {
        write("don't trust. verify:\n" +
          '  spl-token supply <contract>\n  spl-token display <contract>\n  rugcheck.xyz/tokens/<contract>\n\n' +
          're-reading the chain now — see section 05.');
        verifyChain();
      },
      whoami: () => write(
        'cate — cybernetic autonomous terminal entity.\n' +
        'compiled, not minted. nine lives, four spent.\n' +
        'does not have a roadmap. has a commit history.'),
      ls: (args) => write(args[0] === '-a'
        ? Object.keys(FILES).join('  ')
        : SECTION_IDS.map((s) => s + '/').join('  ')),
      cd: (args) => {
        const t = (args[0] || '').replace(/\/+$/, '');
        if (!t || t === '~') {
          document.getElementById('top')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
          write('~'); return;
        }
        if (!SECTION_IDS.includes(t)) { write(`cd: no such section: ${t}`); return; }
        document.getElementById(t)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
        write(`~/${t}`);
      },
      cat: (args) => {
        const n = args[0];
        if (!n) { write('cat: missing operand'); return; }
        write(n in FILES ? FILES[n] : `cat: ${n}: no such file`);
      },
      theme: (args) => {
        if (!args[0]) { cycleTheme(); write(`palette → ${document.documentElement.dataset.theme}`); return; }
        write(setTheme(args[0]) ? `palette → ${args[0]}`
          : `theme: unknown palette: ${args[0]} (try: ${THEMES.join(', ')})`);
      },
      neofetch: () => write(
        '  ▄▄▄▄   cate@/prompt\n' +
        ' █▓▓▓▓█  ──────────\n' +
        ' █░▄▄░█  chain   solana\n' +
        ' █░▀▀░█  supply  1,000,000,000\n' +
        '  ▀██▀   tax     0/0\n' +
        '         lp      burned\n' +
        '         lives   5/9\n' +
        '         deps    0\n' +
        '         theme   ' + (document.documentElement.dataset.theme || 'ember')),
      ach: () => {
        const got = readAch();
        write(ACHIEVEMENTS.map(([k, l]) => `  [${got[k] ? '✓' : ' '}] ${l}`).join('\n'));
      },
      date:  () => write(new Date().toString()),
      echo:  (a) => write(a.join(' ')),
      clear: () => { out.textContent = ''; },
      exit:  () => setOpen(false),
      sudo:  () => write('cate is not in the sudoers file. this incident has been logged. ⛧'),
      rm:    () => write('nice try.'),
      wen:   () => write('now. it already launched. scroll up.'),
      moon:  () => write('the cat does not do price predictions. the cat does commits.'),
      pet:   () => write('  /\\_/\\   \n ( -.- )  she allows it.\n  > ^ <   '),
    };

    const exec = (raw) => {
      write(`\ncate@den:~$ ${raw}`);
      const [cmd, ...args] = raw.split(/\s+/);
      const fn = COMMANDS[cmd.toLowerCase()];
      if (fn) fn(args);
      else write(`${cmd}: command not found. type \`help\`.`);
    };

    runCommand = (line) => { setOpen(true); exec(line); };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      input.value = '';
      if (!raw) return;
      history.unshift(raw);
      hIndex = -1;
      exec(raw);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (hIndex < history.length - 1) input.value = history[++hIndex];
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (hIndex > 0) input.value = history[--hIndex];
        else { hIndex = -1; input.value = ''; }
      } else if (e.key === 'Escape') { setOpen(false); input.blur(); }
    });

    $$('[data-console]').forEach((b) =>
      b.addEventListener('click', () => runCommand(b.dataset.console)));

    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!$('#cmdk')?.hidden) return;

      if (e.key === '/' && !typing) { e.preventDefault(); setOpen(true); }
      else if (e.key.toLowerCase() === 't' && !typing) cycleTheme();
      else if (e.key.toLowerCase() === 'g' && !typing) {
        renderSigil((Math.random() * 0xffffffff) >>> 0);
        toast('sigil ' + currentSeed);
        $('#litterbox')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      } else if (/^[1-7]$/.test(e.key) && !typing) {
        const link = $(`#nav a[data-key="${e.key}"]`);
        if (link) document.getElementById(link.getAttribute('href').slice(1))
          ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
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
          forgeSigil(1010101, 17, 9, 0.6) + '\n';
        out.scrollTop = out.scrollHeight;
      }
      toast('⛧ the tenth life ⛧');
      unlock('konami');
    });
  }

  function chrono() {
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ── go ────────────────────────────────────────────── */
  initTheme();
  initRain();
  initCat();
  initNav();
  initScrollMeta();
  initReveal();
  initCA();
  initLives();
  initLore();
  initLedger();
  initCommits();
  initFaq();
  initForge();
  initColony();
  initCounters();
  initTabs();
  initSpotlight();
  initStats();
  initChain();
  initRaid();
  initCard();
  initWatch();
  paintAch();
  initCmdk();
  initConsole();
  initKonami();
  chrono();
  boot();
})();
