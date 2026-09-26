/* Edu Zone — motion demo (Bilim Plus template). GSAP + ScrollTrigger + Lenis, vanilla everything else. */
(function () {
  'use strict';
  var html = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ---------------- text splitting ---------------- */
  function splitChars(el) {
    var txt = el.textContent; el.textContent = '';
    for (var i = 0; i < txt.length; i++) {
      var s = document.createElement('span'); s.className = 'ch';
      s.textContent = txt[i] === ' ' ? '\u00a0' : txt[i];
      el.appendChild(s);
    }
  }
  function wrapWord(content, isNode) {
    var w = document.createElement('span'); w.className = 'w';
    var i = document.createElement('span');
    if (isNode) i.appendChild(content); else i.textContent = content;
    w.appendChild(i); return w;
  }
  function splitWords(el) {
    var nodes = Array.prototype.slice.call(el.childNodes); el.innerHTML = '';
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) el.appendChild(document.createTextNode(' '));
          else el.appendChild(wrapWord(part));
        });
      } else if (n.nodeName === 'BR') el.appendChild(n);
      else el.appendChild(wrapWord(n, true));
    });
  }
  function splitOpacityWords(el) {
    var nodes = Array.prototype.slice.call(el.childNodes); el.innerHTML = '';
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
          var s = document.createElement('span'); s.className = 'word'; s.textContent = part; el.appendChild(s);
        });
      } else { n.classList.add('word'); el.appendChild(n); }
    });
  }
  $$('.split-chars').forEach(splitChars);
  $$('[data-split]').forEach(splitWords);
  $$('[data-words]').forEach(splitOpacityWords);

  /* ---------------- loop duplication ---------------- */
  $$('.marquee__track').forEach(function (t) {
    var kids = Array.prototype.slice.call(t.children);
    for (var k = 0; k < 3; k++) kids.forEach(function (c) { var cl = c.cloneNode(true); cl.setAttribute('aria-hidden', 'true'); t.appendChild(cl); });
  });
  $$('.voices__track').forEach(function (t) {
    Array.prototype.slice.call(t.children).forEach(function (c) { var cl = c.cloneNode(true); cl.setAttribute('aria-hidden', 'true'); t.appendChild(cl); });
  });

  /* ---------------- WebGL hero ---------------- */
  var hero = $('.hero');
  var glApi = null;
  try { glApi = window.HeroGL ? window.HeroGL($('.hero__gl'), { scale: fine ? 0.62 : 0.5, static: reduced, intro: hasGsap && !reduced ? 0 : 1 }) : null; } catch (e) { glApi = null; }
  if (!glApi) html.classList.add('no-gl');
  var lastMove = -1e9;
  if (glApi && !reduced) {
    window.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      if (e.clientY > r.bottom) { glApi.leave(); return; }
      lastMove = performance.now();
      glApi.pointer(e.clientX / r.width, 1 - (e.clientY - r.top) / r.height);
    }, { passive: true });
    document.addEventListener('mouseleave', function () { glApi.leave(); });
    // idle drift so the field always feels alive (touch devices / idle mouse)
    (function drift() {
      requestAnimationFrame(drift);
      if (performance.now() - lastMove < 2500) return;
      var t = performance.now() / 1000;
      glApi.state.tx = .6 + Math.sin(t * .35) * .22;
      glApi.state.ty = .55 + Math.cos(t * .27) * .2;
      glApi.state.th = .55;
    })();
  }

  /* ---------------- nav theme (light/dark sections) ---------------- */
  var lastY = 0, footerEl = $('.footer'), nav = $('.nav'), lightSecs = $$('[data-nav="light"]'), navTick = false;
  function navTheme() {
    navTick = false;
    var y = 40, light = false;
    for (var i = 0; i < lightSecs.length; i++) { var r = lightSecs[i].getBoundingClientRect(); if (r.top <= y && r.bottom > y) { light = true; break; } }
    nav.classList.toggle('is-light', light);
    var sy = window.scrollY;
    nav.classList.toggle('is-scrolled', sy > 60);
    if (!reduced) nav.classList.toggle('is-hidden', sy > lastY + 2 && sy > innerHeight * .6);
    if (sy < lastY - 2 || sy < innerHeight * .6) nav.classList.remove('is-hidden');
    var ft = footerEl.getBoundingClientRect().top;
    if (ft < 90) nav.classList.add('is-hidden');
    lastY = sy;
  }
  window.addEventListener('scroll', function () { if (!navTick) { navTick = true; requestAnimationFrame(navTheme); } }, { passive: true });
  window.addEventListener('resize', navTheme);

  /* ---------------- footer wordmark fit ---------------- */
  var word = $('.footer__word');
  function fitWord() {
    if (!word) return;
    word.style.fontSize = '20vw';
    var avail = word.clientWidth, w = 0;
    Array.prototype.forEach.call(word.children, function (c) { w += c.getBoundingClientRect().width; });
    if (w > 0) word.style.fontSize = (20 * avail / w * 0.995) + 'vw';
  }
  fitWord(); navTheme(); window.addEventListener('resize', fitWord);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWord);

  /* ---------------- no-GSAP / reduced-motion path ---------------- */
  function setupForm() {
    var form = $('.form'); if (!form) return;
    var name = form.elements.name, phone = form.elements.phone, course = form.elements.course;
    function fmt(v) {
      var d = v.replace(/\D/g, '');
      if (d.indexOf('998') === 0) d = d.slice(3);
      d = d.slice(0, 9);
      var out = '+998';
      if (d.length) out += ' ' + d.slice(0, 2);
      if (d.length > 2) out += ' ' + d.slice(2, 5);
      if (d.length > 5) out += ' ' + d.slice(5, 7);
      if (d.length > 7) out += ' ' + d.slice(7, 9);
      return { text: out, digits: d };
    }
    phone.addEventListener('focus', function () { if (!phone.value) phone.value = '+998 '; });
    phone.addEventListener('blur', function () { if (phone.value.trim() === '+998') phone.value = ''; });
    phone.addEventListener('input', function () { phone.value = fmt(phone.value).text; });
    function mark(input, bad) { input.closest('.field').classList.toggle('is-err', bad); }
    [name, phone, course].forEach(function (i) { i.addEventListener('input', function () { i.closest('.field').classList.remove('is-err'); }); i.addEventListener('change', function () { i.closest('.field').classList.remove('is-err'); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var okName = name.value.trim().length >= 2;
      var okPhone = fmt(phone.value).digits.length === 9;
      var okCourse = !!course.value;
      mark(name, !okName); mark(phone, !okPhone); mark(course, !okCourse);
      if (!(okName && okPhone && okCourse)) return;
      $('.form__name', form).textContent = name.value.trim().split(' ')[0];
      form.classList.add('is-done');
      if (hasGsap && !reduced) {
        gsap.fromTo('.form__done > *', { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: .08, duration: .8, ease: 'power3.out' });
        gsap.fromTo('.form__check', { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: .9, ease: 'back.out(2)' });
      }
    });
    $('.form__again', form).addEventListener('click', function () { form.reset(); form.classList.remove('is-done'); });
    $$('[data-course]').forEach(function (a) {
      a.addEventListener('click', function () { course.value = a.getAttribute('data-course'); course.closest('.field').classList.remove('is-err'); });
    });
  }
  setupForm();

  var lenis = null;
  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else if (typeof target === 'number') window.scrollTo(0, target);
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#') { e.preventDefault(); return; }
      var t = id === '#top' ? 0 : $(id);
      if (t === null) return;
      e.preventDefault(); scrollToTarget(t);
    });
  });

  if (!hasGsap || reduced) {
    var pl = $('.preloader'); if (pl) pl.style.display = 'none';
    // static counters
    $$('[data-count]').forEach(function (el) { el.textContent = formatNum(parseFloat(el.dataset.count), +el.dataset.decimals || 0) + (el.dataset.suffix || ''); });
    window.__introDone = true;
    return;
  }

  function formatNum(v, dec) {
    var s = v.toFixed(dec);
    if (!dec) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    return s;
  }

  /* ================= MOTION ================= */
  gsap.registerPlugin(ScrollTrigger);

  /* Lenis */
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    window.__lenis = lenis;
  }
  window.scrollTo(0, 0);

  /* initial states */
  gsap.set('.hero .ch', { yPercent: 115, rotate: 7 });
  gsap.set('.hero__meta, .hero__bottom > *', { y: 30, opacity: 0 });
  gsap.set('.hero__bottom', { borderTopColor: 'rgba(239,232,218,0)' });
  gsap.set('.badge', { scale: 0, rotate: -120 });
  gsap.set('.hero__aside', { opacity: 0, x: -20 });
  gsap.set('.nav', { y: -30, opacity: 0 });

  /* preloader */
  var counter = { v: 0 };
  var num = $('.preloader__num');
  var words = $$('.preloader__words span');
  var pre = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
  pre.to(counter, { v: 100, duration: 2.1, ease: 'power2.inOut', onUpdate: function () { num.textContent = String(Math.round(counter.v)).padStart(3, '0'); } }, 0)
    .to('.preloader__bar i', { scaleX: 1, duration: 2.1, ease: 'power2.inOut' }, 0)
    .fromTo('.preloader__mark', { scale: 0, rotate: -180 }, { scale: 1, rotate: 0, duration: 2.1, ease: 'expo.inOut' }, 0);
  words.forEach(function (w, i) { if (i) pre.to(words, { yPercent: -100 * i, duration: .5 }, i * .55); });
  pre.to('.preloader__num', { yPercent: -105, duration: .7, ease: 'power3.in' }, 2.2)
    .to('.preloader__top, .preloader__words, .preloader__note', { opacity: 0, y: -20, duration: .5 }, 2.2)
    .to('.preloader__mark .logo-mark', { rotate: 90, scale: .4, opacity: 0, duration: .5, ease: 'power3.in' }, 2.2)
    .to('.preloader__mark', { scale: 14, duration: .9, ease: 'expo.in' }, 2.3)
    .to('.preloader', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, 3.05)
    .add(heroIntro, 3.25)
    .set('.preloader', { display: 'none' });

  function heroIntro() {
    var tl = gsap.timeline({ onComplete: function () { window.__introDone = true; } });
    if (glApi) tl.to(glApi.state, { intro: 1, duration: 1.8, ease: 'power2.out' }, 0);
    tl.to('.hero .ch', { yPercent: 0, rotate: 0, duration: 1.25, ease: 'expo.out', stagger: .035 }, .05)
      .to('.nav', { y: 0, opacity: 1, duration: 1, ease: 'power3.out', clearProps: 'transform,opacity' }, .3)
      .to('.hero__meta', { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, .4)
      .to('.hero__aside', { opacity: .85, x: 0, duration: 1, ease: 'power3.out' }, .8)
      .to('.hero__bottom', { borderTopColor: 'rgba(239,232,218,.2)', duration: 1 }, .6)
      .to('.hero__bottom > *', { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: .08 }, .7)
      .to('.badge', { scale: 1, rotate: 0, duration: 1.4, ease: 'expo.out' }, .7);
    if (lenis) lenis.start();
  }

  /* hero scroll-out parallax */
  gsap.to('.hero__inner', { yPercent: 22, opacity: .15, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  if (glApi) ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', scrub: true, onUpdate: function (s) { glApi.state.scroll = s.progress; } });

  /* marquee — loops react to scroll velocity & direction */
  var loops = $$('.marquee__track').map(function (t) {
    var dir = +t.dataset.dir;
    return gsap.fromTo(t, { xPercent: dir > 0 ? -25 : 0 }, { xPercent: dir > 0 ? 0 : -25, duration: dir > 0 ? 30 : 22, ease: 'none', repeat: -1 });
  });
  var skewTo = gsap.quickTo('.marquee__band--a .marquee__track', 'skewX', { duration: .5, ease: 'power3' });
  var cardSkew = $$('.card').map(function (c) { return gsap.quickTo(c, 'skewX', { duration: .6, ease: 'power3' }); });
  if (lenis) lenis.on('scroll', function (e) {
    var v = e.velocity || 0;
    var sign = v < 0 ? -1 : 1;
    loops.forEach(function (l) { gsap.to(l, { timeScale: sign * (1 + Math.min(Math.abs(v) * .25, 5)), duration: .3, overwrite: true }); });
    skewTo(gsap.utils.clamp(-8, 8, -v * .5));
    var s = gsap.utils.clamp(-5, 5, -v * .25);
    cardSkew.forEach(function (fn) { fn(s); });
  });
  gsap.ticker.add(function () {
    if (!lenis || Math.abs(lenis.velocity) < .05) { loops.forEach(function (l) { if (Math.abs(l.timeScale()) > 1.02) l.timeScale(l.timeScale() * .96); }); }
  });
  gsap.fromTo('.marquee__band--a', { rotate: -6 }, { rotate: -1.5, ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.marquee__band--b', { rotate: 6 }, { rotate: 1.5, ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* sheets: rounded "card" sections expand as they enter */
  $$('.sheet').forEach(function (el) {
    gsap.fromTo(el, { clipPath: 'inset(0% 4% 0% 4% round 44px 44px 0px 0px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 44px 44px 0px 0px)', ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 25%', scrub: true }
    });
  });

  /* word-mask title reveals */
  $$('[data-split]').forEach(function (el) {
    gsap.from($$('.w > span', el), {
      yPercent: 110, rotate: 4, duration: 1.1, ease: 'expo.out', stagger: .06,
      scrollTrigger: { trigger: el, start: 'top 82%' }
    });
  });

  /* manifesto scrub word-by-word */
  $$('[data-words]').forEach(function (el) {
    gsap.fromTo($$('.word', el), { opacity: .13 }, {
      opacity: 1, ease: 'none', stagger: .1,
      scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 45%', scrub: true }
    });
  });

  /* generic reveals */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    onEnter: function (b) { gsap.fromTo(b, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: .1, overwrite: true }); }
  });
  gsap.set('[data-reveal]', { opacity: 0 });

  /* stats counters */
  $$('[data-count]').forEach(function (el) {
    var target = parseFloat(el.dataset.count), dec = +el.dataset.decimals || 0, suf = el.dataset.suffix || '';
    var o = { v: 0 };
    el.textContent = formatNum(0, dec) + suf;
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: function () { gsap.to(o, { v: target, duration: 2.2, ease: 'expo.out', onUpdate: function () { el.textContent = formatNum(o.v, dec) + suf; } }); }
    });
  });

  /* courses — horizontal pinned scroll (desktop) */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', function () {
    var section = $('.courses'), track = $('.courses__track');
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var tween = gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: {
        trigger: section, start: 'top top', end: function () { return '+=' + dist(); },
        pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (s) { gsap.set('.courses__progress i', { scaleX: s.progress }); }
      }
    });
    $$('.card').forEach(function (card) {
      gsap.fromTo(card.querySelector('.card__in'), { rotate: 4, y: 60 }, {
        rotate: 0, y: 0, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'left 45%', scrub: true }
      });
      gsap.fromTo(card.querySelector('.card__art > div'), { xPercent: 18 }, {
        xPercent: -10, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
      });
    });
    gsap.fromTo('.courses__q', { xPercent: 30 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.courses__outro', containerAnimation: tween, start: 'left right', end: 'center center', scrub: true } });
  });
  mm.add('(max-width: 900px)', function () {
    $$('.card').forEach(function (card) {
      gsap.from(card, { y: 80, rotate: 2, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 90%' } });
    });
  });

  /* method stacking cards */
  var steps = $$('.step');
  steps.forEach(function (st, i) {
    if (i === steps.length - 1) return;
    gsap.to(st, {
      scale: .9 + i * .02, ease: 'none',
      scrollTrigger: { trigger: steps[i + 1], start: 'top bottom', end: 'top 20%', scrub: true }
    });
    gsap.to(st.querySelector('.step__c'), {
      opacity: .25, ease: 'none',
      scrollTrigger: { trigger: steps[i + 1], start: 'top 60%', end: 'top 20%', scrub: true }
    });
  });
  steps.forEach(function (st) {
    gsap.from(st.querySelector('.step__g'), { yPercent: 40, rotate: -12, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: st, start: 'top 75%' } });
  });

  /* signup title parallax + tg */
  gsap.from('.tg-cta', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.tg-cta', start: 'top 92%' } });
  gsap.from('.form', { y: 120, rotate: 3, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.signup', start: 'top 70%' } });

  /* footer wordmark */
  gsap.from('.footer__word span', {
    yPercent: 105, duration: 1.2, ease: 'expo.out', stagger: .045,
    scrollTrigger: { trigger: '.footer__word', start: 'top 95%' }
  });
  gsap.from('.footer__ask', { y: 50, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.footer', start: 'top 80%' } });

  /* ---------------- cursor + magnetic + tilt ---------------- */
  if (fine) {
    html.classList.add('has-cursor');
    var cur = $('.cursor');
    var dx = gsap.quickTo('.cursor__dot', 'x', { duration: .12, ease: 'power3' }), dy = gsap.quickTo('.cursor__dot', 'y', { duration: .12, ease: 'power3' });
    var rx = gsap.quickTo('.cursor__ring', 'x', { duration: .5, ease: 'power3' }), ry = gsap.quickTo('.cursor__ring', 'y', { duration: .5, ease: 'power3' });
    gsap.set('.cursor__dot, .cursor__ring', { x: innerWidth / 2, y: innerHeight / 2 });
    window.addEventListener('pointermove', function (e) { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var t = e.target;
      var inter = t.closest && t.closest('a, button, select, input, [data-magnetic]');
      var view = t.closest && t.closest('[data-cursor="view"]');
      cur.classList.toggle('is-hover', !!inter);
      cur.classList.toggle('is-view', !!view && !inter);
    });
    document.addEventListener('pointerdown', function () { gsap.to('.cursor__ring', { scale: .8, duration: .15, yoyo: true, repeat: 1 }); });

    $$('[data-magnetic]').forEach(function (el) {
      var inner = el.querySelector('.btn__txt, span, b');
      var strength = el.classList.contains('round-cta') || el.classList.contains('tg-cta') ? .25 : .35;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2), my = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: mx * strength, y: my * strength, duration: .6, ease: 'power3.out' });
        if (inner) gsap.to(inner, { x: mx * .12, y: my * .12, duration: .6, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .35)' });
        if (inner) gsap.to(inner, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .35)' });
      });
    });

    $$('[data-tilt]').forEach(function (card) {
      var inn = card.querySelector('.card__in');
      var layers = $$('[data-depth]', card);
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        gsap.to(inn, { rotateY: (x - .5) * 16, rotateX: -(y - .5) * 12, duration: .7, ease: 'power3.out', transformPerspective: 1100 });
        layers.forEach(function (l) { var d = +l.dataset.depth; gsap.to(l, { x: (x - .5) * d, y: (y - .5) * d, duration: .9, ease: 'power3.out' }); });
        inn.style.setProperty('--mx', (x * 100) + '%'); inn.style.setProperty('--my', (y * 100) + '%');
      });
      card.addEventListener('pointerleave', function () {
        gsap.to(inn, { rotateY: 0, rotateX: 0, duration: 1.1, ease: 'elastic.out(1, .5)' });
        layers.forEach(function (l) { gsap.to(l, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, .5)' }); });
      });
    });
  }

  /* refresh after fonts */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
