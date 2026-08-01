/* ══════════════════════════════════════════════════════════
   cate // den — behaviour
   vanilla, no dependencies, degrades to a readable page.
   ══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ── boot sequence ─────────────────────────────────── */
  const BOOT_LINES = [
    'den bios v4.3.1 — 0x43415445',
    'checking memory ........... 65536k ok',
    'mounting /dev/bone ........ ok',
    'loading assembler ......... ok',
    'verifying signatures ...... 6/6 ok',
    'entropy pool .............. warm',
    'no telemetry module found. good.',
    '',
    '  ⛧ welcome to the den ⛧',
    '',
  ];

  async function boot() {
    const el   = $('#boot');
    const log  = $('#boot-log');
    const skip = $('#boot-skip');
    if (!el) return;

    // only the first visit per tab gets the ceremony
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

    document.addEventListener('keydown', finish, { once: false });
    skip?.addEventListener('click', finish);
    el.addEventListener('click', finish);

    for (const line of BOOT_LINES) {
      if (done) return;
      log.textContent += line + '\n';
      await sleep(line === '' ? 90 : 150);
    }
    await sleep(320);
    finish();
  }

  /* ── hero typewriter ───────────────────────────────── */
  const PHRASES = [
    'whoami',
    'cat manifest.txt',
    'make things that outlive the platform',
    './assemble --from scratch',
    'rm -rf ./frameworks',
    'echo "i am my own assembler"',
  ];

  let typerRunning = false;

  async function startTyper() {
    const out = $('#typed');
    if (!out || typerRunning) return;
    typerRunning = true;

    if (reduced) { out.textContent = PHRASES[0]; return; }

    let i = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
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

  /* ── clock + uptime ────────────────────────────────── */
  function chrono() {
    const clock  = $('#clock');
    const uptime = $('#uptime');
    const t0 = Date.now();

    const pad = (n) => String(n).padStart(2, '0');

    const tick = () => {
      const now = new Date();
      if (clock) clock.textContent =
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      if (uptime) {
        const s = Math.floor((Date.now() - t0) / 1000);
        uptime.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
      }
    };
    tick();
    setInterval(tick, 1000);

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

    // close the drawer after tapping a link
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

  /* ── contact form (no backend — hands off to mail) ─── */
  function initForm() {
    const form = $('#contact-form');
    const note = $('#form-note');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const mail = (data.get('email') || '').toString().trim();
      const body = (data.get('message') || '').toString().trim();

      const fail = (msg) => {
        note.dataset.err = 'true';
        note.textContent = `✗ ${msg}`;
      };

      if (!name || !mail || !body) return fail('all three fields, please.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return fail('that return address won\'t route.');

      note.dataset.err = 'false';
      note.textContent = '✓ transmission queued — your mail client is opening.';

      const subject = encodeURIComponent(`transmission from ${name}`);
      const text = encodeURIComponent(`${body}\n\n— ${name} <${mail}>`);
      window.location.href = `mailto:cate@example.com?subject=${subject}&body=${text}`;
      form.reset();
    });
  }

  /* ── console ───────────────────────────────────────── */
  const SECTIONS = ['manifest', 'works', 'stack', 'log', 'transmit'];

  const FILES = {
    'manifest.txt':
      'i write software the way other people carve things — slowly, by hand,\n' +
      'until the shape stops arguing.',
    'readme.md':
      'this site is four files and no build step. view-source is the docs.',
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
        '  help              this\n' +
        '  whoami            who is cate\n' +
        '  ls                list sections\n' +
        '  cd <section>      scroll to a section\n' +
        '  cat <file>        read a file (try `ls -a`)\n' +
        '  theme [name]      green | amber | blood | bone\n' +
        '  neofetch          system info\n' +
        '  date              current time\n' +
        '  echo <text>       say it back\n' +
        '  clear             wipe the buffer\n' +
        '  exit              close the console'
      ),

      whoami: () => write(
        'cate — builder, assembler, occasional arsonist of legacy code.\n' +
        'operates the den. answers to signal, not to notifications.'
      ),

      ls: (args) => {
        if (args[0] === '-a') {
          write(Object.keys(FILES).join('  '));
          return;
        }
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
        '  ▄▄▄▄   cate@den\n' +
        ' █▓▓▓▓█  ─────────\n' +
        ' █░▄▄░█  os      den/linux\n' +
        ' █░▀▀░█  shell   handmade\n' +
        '  ▀██▀   deps    0\n' +
        '         build   none\n' +
        '         files   4\n' +
        '         theme   ' + (document.documentElement.dataset.theme || 'green')
      ),

      date:  () => write(new Date().toString()),
      echo:  (args) => write(args.join(' ')),
      clear: () => { out.textContent = ''; },
      exit:  () => { setOpen(false); },
      sudo:  () => write('cate is not in the sudoers file. this incident has been logged. ⛧'),
      rm:    () => write('nice try.'),
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
  initForm();
  initConsole();
  chrono();
  boot();
})();
