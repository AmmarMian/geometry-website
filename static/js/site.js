/* GEOMETRY — client behaviour: language + theme toggles, hero scroll driver,
   section reveal, hero intro, internal password gate. Plain JS, no build step. */
(function () {
  function toggleTheme() {
    var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('geoTheme', next); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-action]'); if (!b) return;
    var a = b.getAttribute('data-action');
    if (a === 'theme') toggleTheme();
  });

  function waitAnime(cb, t0) {
    t0 = t0 || Date.now();
    if (window.anime) return cb();
    if (Date.now() - t0 < 15000) setTimeout(function () { waitAnime(cb, t0); }, 120);
  }

  function initHero() {
    var el = document.querySelector('geo-hero[data-hero-fixed]');
    if (!el) return;
    var motion = el.getAttribute('data-motion') || 'scroll';
    function ready(cb, t0) {
      t0 = t0 || Date.now();
      if (el.orient) return cb();
      if (Date.now() - t0 < 15000) setTimeout(function () { ready(cb, t0); }, 200);
    }
    ready(function () {
      el.style.transform = 'translateX(20vw)';
      if (motion !== 'scroll') {
        if (motion === 'orbit') {
          anime({ targets: el.orient, y: Math.PI * 2, duration: 42000, loop: true, easing: 'linear' });
          anime({ targets: el.orient, x: [-0.12, 0.18], duration: 16000, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
        } else if (motion === 'drift') {
          anime({ targets: el.orient, y: [-0.4, 0.4], x: [-0.1, 0.14], duration: 24000, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
          var zz = { v: el.zoom }; anime({ targets: zz, v: el.zoom * 1.12, duration: 18000, direction: 'alternate', loop: true, easing: 'easeInOutSine', update: function () { el.zoom = zz.v; } });
        }
        return;
      }
      var DUR = 1000;
      var tl = anime.timeline({ autoplay: false, easing: 'linear' });
      // a gentle turn across the page, not a full tumble
      tl.add({ targets: el.orient, y: 4.2, x: 0.65, z: 0.95, duration: DUR, easing: 'easeInOutSine' });
      tl.add({ targets: el, translateX: [{ value: '-24vw', duration: DUR * 0.5 }, { value: '20vw', duration: DUR * 0.5 }], easing: 'easeInOutSine' }, 0);
      var compute = function () { var max = document.documentElement.scrollHeight - window.innerHeight; return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0; };

      // zoom dips to 50% by the time the "why geometry" section arrives, then eases back
      // up to full size by the end of the page
      var baseZoom = el.zoom || 1;
      var shrinkEl = document.querySelector('[data-hero-shrink]');
      var p1 = 0.3;
      var computeP1 = function () {
        if (!shrinkEl) return;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0) return;
        p1 = Math.min(0.9, Math.max(0.05, (shrinkEl.getBoundingClientRect().top + window.scrollY) / max));
      };
      computeP1();
      window.addEventListener('resize', computeP1, { passive: true });
      var smooth = function (t) { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
      var zoomFactor = function (t) {
        if (t <= p1) return 1 - smooth(t / p1) * 0.5;
        return 0.5 + smooth((t - p1) / (1 - p1)) * 0.5;
      };

      // continuous, frame-rate-independent exponential smoothing chasing the scroll target
      var target = compute(), cur = target, lastTs = 0, RATE = 3.2;
      function loop(ts) {
        var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016; lastTs = ts;
        var k = 1 - Math.exp(-RATE * dt);
        cur += (target - cur) * k;
        tl.seek(cur * DUR);
        el.zoom = baseZoom * zoomFactor(cur);
        el.progress = cur;
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
      window.addEventListener('scroll', function () { target = compute(); }, { passive: true });
    });
  }

  // easter egg: on load, pick a random visualization (torus or sphere-flow); a nearly-invisible
  // marker bottom-left of the hero reveals two tiny labels to switch manually
  var HERO_PICKS = {
    torus: ['winding', 'shear', 'twist'],
    flow: ['mix', 'zonal', 'sourcesink', 'transport']
  };
  function pickHero(el, variant) {
    var ps = HERO_PICKS[variant] || ['mix'];
    var pattern = ps[Math.floor(Math.random() * ps.length)];
    el.setAttribute('variant', variant);
    el.setAttribute('pattern', pattern);
  }
  function initHeroPicker() {
    var el = document.querySelector('geo-hero[data-hero-fixed]');
    var picker = document.querySelector('[data-hero-picker]');
    if (!el) return;
    var startVariant = Math.random() < 0.5 ? 'torus' : 'flow';
    pickHero(el, startVariant);
    if (!picker) return;
    picker.addEventListener('click', function (e) {
      var b = e.target.closest('[data-hero-pick]'); if (!b) return;
      pickHero(el, b.getAttribute('data-hero-pick'));
    });
  }

  function initReveal() {
    var els = [].slice.call(document.querySelectorAll('[data-sr]'));
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        anime({ targets: en.target, opacity: [0, 1], translateY: [44, 0], duration: 900, easing: 'easeOutQuad' });
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -18% 0px' });
    els.forEach(function (s) { s.style.opacity = '0'; io.observe(s); });
  }

  function initHeroIntro() {
    if (!document.querySelector('[data-hr]')) return;
    anime({ targets: '[data-hr]', translateY: [14, 0], opacity: [0, 1], delay: anime.stagger(110, { start: 150 }), duration: 750, easing: 'easeOutQuad' });
  }

  function sha256Hex(text) {
    var enc = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', enc).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    });
  }

  function initInternal() {
    var root = document.querySelector('[data-internal]'); if (!root) return;
    var pwHash = root.getAttribute('data-password-hash');
    var lock = root.querySelector('[data-internal-lock]');
    var content = root.querySelector('[data-internal-content]');
    var form = root.querySelector('[data-internal-form]');
    var input = root.querySelector('[data-internal-pw]');
    var err = root.querySelector('[data-internal-error]');
    function show(authed) {
      lock.style.display = authed ? 'none' : '';
      content.style.display = authed ? '' : 'none';
    }
    var authed = false;
    try { authed = sessionStorage.getItem('geoAuth') === '1'; } catch (e) {}
    show(authed);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      sha256Hex(input.value).then(function (h) {
        if (h === pwHash) {
          try { sessionStorage.setItem('geoAuth', '1'); } catch (er) {}
          err.style.display = 'none'; show(true);
        } else { err.style.display = ''; }
      });
    });
    var out = root.querySelector('[data-internal-logout]');
    if (out) out.addEventListener('click', function () {
      try { sessionStorage.removeItem('geoAuth'); } catch (er) {}
      show(false); input.value = '';
    });
  }

  function boot() {
    initInternal();
    initHeroPicker();
    waitAnime(function () { initHero(); initReveal(); initHeroIntro(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();