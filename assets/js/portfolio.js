(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ---------- */
  function currentTheme() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.getElementById('theme-toggle').addEventListener('click', function () {
    var next = currentTheme() === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('af-theme', next); } catch (e) {}
  });

  /* ---------- Nav: scrolled state + mobile menu + active link ---------- */
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var menuBtn = document.getElementById('menu-btn');
  var menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('.hero, main section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal, .pipeline');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el, i) {
      var parent = el.parentElement;
      var siblings = parent ? Array.prototype.indexOf.call(parent.children, el) : 0;
      el.style.transitionDelay = Math.min(siblings, 5) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Count-up stats ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, target = +el.dataset.count, start = null;
        cio.unobserve(el);
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1400, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        }
        el.textContent = '0';
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- Terminal test-run animation ---------- */
  var term = document.getElementById('term');
  var lines = [
    { t: '$ npx playwright test', c: 't-dim' },
    { t: '' },
    { t: 'Running 6 tests using 1 worker', c: 't-dim' },
    { t: '  ✓ finds edge cases early', c: 't-pass' },
    { t: '  ✓ writes clear repro steps', c: 't-pass' },
    { t: '  ✓ automates the boring parts', c: 't-pass' },
    { t: '  ✓ tests on real devices', c: 't-pass' },
    { t: '  ✓ speaks dev & product', c: 't-pass' },
    { t: '  ✓ ships with confidence', c: 't-pass' },
    { t: '' },
    { t: '  6 passed (7+ years)', c: 't-sum' }
  ];
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function renderTerm(n, partial) {
    var html = lines.slice(0, n).map(function (l) {
      return l.c ? '<span class="' + l.c + '">' + esc(l.t) + '</span>' : esc(l.t);
    }).join('\n');
    if (partial != null) html += (n ? '\n' : '') + '<span class="t-dim">' + esc(partial) + '</span>';
    term.innerHTML = html + '<span class="t-cursor"></span>';
  }
  if (reduceMotion) {
    renderTerm(lines.length);
  } else {
    var cmd = lines[0].t, i = 0;
    (function type() {
      if (i <= cmd.length) { renderTerm(0, cmd.slice(0, i++)); setTimeout(type, 45); return; }
      var n = 1;
      (function next() {
        renderTerm(n);
        if (n++ < lines.length) setTimeout(next, n < 4 ? 350 : 420);
      })();
    })();
  }

  /* ---------- Expertise tabs (ARIA) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function stagger(panel) {
    panel.querySelectorAll('.cases li').forEach(function (li, i) { li.style.setProperty('--i', i); });
  }
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute('aria-controls'));
      p.hidden = !on;
      if (on) {
        // restart animations
        p.style.animation = 'none'; void p.offsetWidth; p.style.animation = '';
        p.querySelectorAll('.cases li').forEach(function (li) { li.style.animation = 'none'; void li.offsetWidth; li.style.animation = ''; });
        stagger(p);
      }
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, idx) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowDown' || k === 'ArrowRight') n = tabs[(idx + 1) % tabs.length];
      if (k === 'ArrowUp' || k === 'ArrowLeft') n = tabs[(idx - 1 + tabs.length) % tabs.length];
      if (k === 'Home') n = tabs[0];
      if (k === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); select(n, true); }
    });
  });
  document.querySelectorAll('[role="tabpanel"]').forEach(stagger);

  /* ---------- Toast ---------- */
  var toastEl = document.getElementById('toast'), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  /* ---------- Copy email ---------- */
  var copyBtn = document.getElementById('copy-email');
  copyBtn.addEventListener('click', function () {
    var email = copyBtn.dataset.email;
    function done() { toast('Email copied — talk soon! ✉️'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(done, function () { toast(email); });
    } else {
      toast(email);
    }
  });

  /* ---------- Hidden bug hunt ---------- */
  var bugs = document.querySelectorAll('[data-bug]');
  var found = 0;
  var foundEl = document.getElementById('bugs-found');
  document.getElementById('bugs-total').textContent = bugs.length;
  var msgs = ['Nice catch! 🐞', 'Another one squashed.', 'Sharp eyes — that’s the QA spirit.', 'Almost there…'];
  function squash(b) {
    if (b.classList.contains('squashed')) return;
    b.classList.add('squashed');
    b.setAttribute('aria-hidden', 'true');
    b.tabIndex = -1;
    found++;
    foundEl.textContent = found;
    if (found === bugs.length) {
      document.querySelector('.bug-counter').classList.add('done');
      toast('All ' + bugs.length + ' bugs found. You’d make a great QA! ✓');
    } else {
      toast(msgs[(found - 1) % msgs.length] + ' (' + found + '/' + bugs.length + ')');
    }
  }
  bugs.forEach(function (b) {
    b.addEventListener('click', function () { squash(b); });
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); squash(b); } });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
