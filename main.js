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

  /* ── contract ──────────────────────────────────────── */
  const CA = ($('#ca-value')?.textContent || '').trim();

  // a real solana mint is base58, 32-44 chars. the shipped placeholder
  // deliberately contains characters that fail this test.
  const CA_IS_REAL = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(CA) && !/p1aceho/i.test(CA);

  const DEX_API   = 'https://api.dexscreener.com/latest/dex/tokens/';
  const DEX_PAGE  = 'https://dexscreener.com/solana/';
  const PUMP_PAGE = 'https://pump.fun/coin/';

  /* ── boot sequence ─────────────────────────────────── */
  const BOOT_LINES = [
    'den bios v4.3.1 — 0x43415445',
    'checking memory ........... 65536k ok',
    'mounting /dev/bone ........ ok',
    'loading cate.elf .......... ok',
    'spl-token authority ....... revoked',
    'liquidity pool ............ burned',
    'entropy pool .............. warm',
    'no telemetry module found. good.',
    '',
    '  ⛧ the cat compiles ⛧',
    '',
  ];

  async function boot() {
    const el   = $('#boot');
    const log  = $('#boot-log');
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
      setTimeout(() => el.remove(), 450);
      document.removeEventListener('keydown', finish);
      startTyper();
    };

    if (seen || reduced) { finish(); return; }

    document.addEventListener('keydown', finish);
    skip?.addEventListener('click', finish);
    el.addEventListener('click', finish);

    for (const line of BOOT_LINES) {
      if (done) return;
      log.textContent += line + '\n';
      await sleep(line === '' ? 90 : 145);
    }
    await sleep(300);
    finish();
  }

  /* ── hero typewriter ───────────────────────────────── */
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

  /* ── copy the contract ─────────────────────────────── */
  async function copyCA() {
    const btn = $('#ca-copy');
    const box = $('#ca');
    if (!btn) return false;

    let ok = false;
    try {
      await navigator.clipboard.writeText(CA);
      ok = true;
    } catch {
      // clipboard API needs a secure context — fall back to selection
      try {
        const ta = document.createElement('textarea');
        ta.value = CA;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        ta.remove();
      } catch { ok = false; }
    }

    btn.textContent = ok ? '[ copied ]' : '[ select it ]';
    btn.dataset.done = String(ok);
    box?.classList.add('is-flash');
    setTimeout(() => {
      btn.textContent = '[ copy ]';
      btn.dataset.done = 'false';
      box?.classList.remove('is-flash');
    }, 1800);
    return ok;
  }

  function initCA() {
    $('#ca-copy')?.addEventListener('click', copyCA);

    // point the buy/chart links at the real token once a real CA is in
    if (CA_IS_REAL) {
      const chart = $('#chart-link');
      const buy   = $('#buy-link');
      if (chart) chart.href = DEX_PAGE + CA;
      if (buy)   buy.href   = PUMP_PAGE + CA;
      $$('a[href="https://dexscreener.com/solana"]').forEach((a) => { a.href = DEX_PAGE + CA; });
      $$('a[href="https://pump.fun"]').forEach((a) => { a.href = PUMP_PAGE + CA; });
      $$('a[href="https://rugcheck.xyz"]').forEach((a) => { a.href = `https://rugcheck.xyz/tokens/${CA}`; });
    }

    // "copy button up top" shortcut inside the how-to-buy steps
    $$('[data-scroll]').forEach((b) => b.addEventListener('click', () => {
      const t = $(b.dataset.scroll);
      t?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      t?.classList.add('is-flash');
      setTimeout(() => t?.classList.remove('is-flash'), 1200);
    }));
  }

  /* ── live market data (dexscreener, no key, no backend) ─ */
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
    const units = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
    for (const [size, suffix] of units) {
      if (n >= size) return '$' + (n / size).toFixed(2) + suffix;
    }
    return '$' + n.toFixed(0);
  };

  let lastStats = null;

  async function pullStats() {
    const box  = $('#metrics');
    const note = $('#metrics-note');
    if (!box) return;

    if (!CA_IS_REAL) {
      box.dataset.state = 'idle';
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

      $('#m-price').textContent = fmtUsd(price);
      $('#m-mcap').textContent  = fmtBig(pair.marketCap || pair.fdv);
      $('#m-liq').textContent   = fmtBig(pair.liquidity?.usd);
      $('#m-vol').textContent   = fmtBig(pair.volume?.h24);

      const chg = $('#m-change');
      if (isFinite(change)) {
        chg.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
        chg.classList.toggle('up', change >= 0);
        chg.classList.toggle('down', change < 0);
      } else {
        chg.textContent = '—';
      }

      box.dataset.state = 'live';
      if (note) note.textContent = `live · ${pair.dexId} · updated ${new Date().toLocaleTimeString()}`;
      lastStats = { price, change, mcap: pair.marketCap || pair.fdv, liq: pair.liquidity?.usd, dex: pair.dexId };
    } catch (err) {
      box.dataset.state = 'idle';
      if (note) note.textContent = `live feed unavailable (${err.message}) — the chart link still works.`;
    }
  }

  function initStats() {
    pullStats();
    if (CA_IS_REAL) setInterval(pullStats, 60000);
  }

  /* ── clock ─────────────────────────────────────────── */
  function chrono() {
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ── palette ───────────────────────────────────────── */
  const THEMES = ['green', 'amber', 'blood', 'bone'];

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
    setTheme(saved && THEMES.includes(saved) ? saved : 'green');
    $('#theme-btn')?.addEventListener('click', cycleTheme);
  }

  function cycleTheme() {
    const cur = document.documentElement.dataset.theme || 'green';
    setTheme(THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length]);
  }

  /* ── nav: mobile toggle + scroll spy ───────────────── */
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

  /* ── reveal on scroll ──────────────────────────────── */
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
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  }

  /* ── console ───────────────────────────────────────── */
  const SECTIONS = ['readme', 'tokenomics', 'buy', 'commits', 'stack', 'community'];

  const FILES = {
    'README.md':
      'cate was not minted. she was compiled — assembled out of dead repos,\n' +
      'abandoned branches, and code people delete at 4am.',
    'cate.config.toml':
      'supply = 1_000_000_000   tax = 0/0\n' +
      'mint = revoked   freeze = revoked   lp = burned',
    'secrets.txt':
      'permission denied. (nice try.)',
  };

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
        '  verify            how to check every claim yourself\n' +
        '  whoami            who is cate\n' +
        '  ls                list sections    (ls -a for files)\n' +
        '  cd <section>      scroll to a section\n' +
        '  cat <file>        read a file\n' +
        '  theme [name]      green | amber | blood | bone\n' +
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
          `dex     ${s.dex}`
        );
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
        'supply    1,000,000,000\n' +
        'tax       0 / 0\n' +
        'mint      revoked\n' +
        'freeze    revoked\n' +
        'lp        burned\n' +
        'team      0%'
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
          write('~');
          return;
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
        '         deps    0\n' +
        '         theme   ' + (document.documentElement.dataset.theme || 'green')
      ),

      date:  () => write(new Date().toString()),
      echo:  (args) => write(args.join(' ')),
      clear: () => { out.textContent = ''; },
      exit:  () => { setOpen(false); },
      sudo:  () => write('cate is not in the sudoers file. this incident has been logged. ⛧'),
      rm:    () => write('nice try.'),
      wen:   () => write('now. it already launched. scroll up.'),
      moon:  () => write('the cat does not do price predictions. the cat does commits.'),
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
        setOpen(false);
        input.blur();
      }
    });

    /* global shortcuts */
    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '/' && !typing) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key.toLowerCase() === 't' && !typing) {
        cycleTheme();
      } else if (/^[1-5]$/.test(e.key) && !typing) {
        const link = $(`#nav a[data-key="${e.key}"]`);
        if (link) {
          const id = link.getAttribute('href').slice(1);
          document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
        }
      }
    });
  }

  /* ── go ────────────────────────────────────────────── */
  initTheme();
  initNav();
  initReveal();
  initCA();
  initStats();
  initConsole();
  chrono();
  boot();
})();
