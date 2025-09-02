document.documentElement.setAttribute('data-path', window.location.pathname);

/* custom-reveal.js — robust, idempotent, auto-marking */
(function () {
  // Schutz vor doppelter Ausführung (z. B. wenn Script 2x eingebunden ist)
  if (window.__revealInit) return;
  window.__revealInit = true;

  const SELECTOR_BASE = ".bar-card, .content-card, .bar, .gallery-card";
  const VISIBLE_CLASS = "is-visible";
  const PREFERS_REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function collectTargets(root = document) {
    // vorhandene .reveal + typische Karten erkennen
    const list = new Set([
      ...root.querySelectorAll(".reveal"),
      ...root.querySelectorAll(SELECTOR_BASE),
    ]);
    // allen Ziel-Elementen .reveal geben (falls noch nicht vorhanden)
    list.forEach((el, i) => {
      if (!el.classList.contains("reveal")) el.classList.add("reveal", "fade-up");
      // leichter Auto-Stagger pro Container
      if (!el.style.getPropertyValue("--rv-delay") && el.parentElement?.classList.contains("reveal-group")) {
        el.style.setProperty("--rv-delay", `${(i % 6) * 60}ms`);
      }
    });
    return Array.from(list);
  }

  function makeVisible(el) {
    el.classList.add(VISIBLE_CLASS);
  }

  function run(root = document) {
    const els = collectTargets(root);
    console.log("[reveal] targets:", els.length);

    if (!els.length) return;

    if (PREFERS_REDUCED || !("IntersectionObserver" in window)) {
      els.forEach(makeVisible);
      console.log("[reveal] reduced-motion / no-IO → show all");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            makeVisible(en.target);
            io.unobserve(en.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -1px 0px", threshold: 0.08 }
    );

    els.forEach((el) => io.observe(el));
  }

  // Initial starten
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => run(document), { once: true });
  } else {
    run(document);
  }

  // Reagieren auf DOM-Austausch (Hugo livereload, Ajax, etc.)
  const mo = new MutationObserver((muts) => {
    // Wenn große Knoten ersetzt werden, nochmal Initialisierung
    let added = false;
    for (const m of muts) {
      if (m.addedNodes && m.addedNodes.length) { added = true; break; }
    }
    if (added) run(document);
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // Debug-Ausgabe für dich
  console.log("[reveal] init, reduced-motion:", PREFERS_REDUCED);
})();
/* ==== Page Transitions (enter/exit) – smooth & safe ==== */
(function () {
  if (window.__pageTransInit) return;
  window.__pageTransInit = true;

  var EXIT_MS = 300; // muss mit CSS (300ms) übereinstimmen

  // ENTER: beim ersten Laden und beim Zurück-Navigieren aus dem bfcache
  function onPageShow() {
    document.documentElement.classList.add('page-loaded');
    document.documentElement.classList.remove('is-exiting');
  }
  window.addEventListener('pageshow', onPageShow, { once: false });

  // Helper: Ist Link intern?
  function isInternal(href) {
    try {
      var u = new URL(href, window.location.href);
      return u.origin === window.location.origin;
    } catch (e) { return false; }
  }
  // Helper: Nur „echte“ Navigationslinks (kein #, kein _blank, keine Modifier)
  function shouldIntercept(e, a) {
    if (!a) return false;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (a.target && a.target.toLowerCase() === '_blank') return false;
    if (a.hasAttribute('download')) return false;
    var href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    if (!isInternal(href)) return false;
    if (a.hasAttribute('data-no-transition')) return false;

    // gleiches Dokument + Hash → nicht abfangen (native Scroll)
    var dest = new URL(href, window.location.href);
    var here = new URL(window.location.href);
    if (dest.pathname === here.pathname && dest.search === here.search && dest.hash) return false;

    return true;
  }

  // EXIT: fade out vor Navigation
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!shouldIntercept(e, a)) return;

    e.preventDefault();
    // set exiting class → CSS blendet aus
    document.documentElement.classList.add('is-exiting');

    // Warte die CSS-Dauer ab, dann navigiere
    window.setTimeout(function () {
      window.location.href = a.href;
    }, EXIT_MS - 20); // leicht früher, damit es „snappy“ wirkt
  }, false);
})();
/* ==== Simple Gallery Controller (prev/next/dots/keys/swipe) ==== */
(function () {
  if (window.__rioGalleryInit) return; window.__rioGalleryInit = true;

  function ready(fn){ 
    if (document.readyState !== 'loading') fn(); 
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function initOne(wrapper){
    if (!wrapper) return;
    var slidesWrap = wrapper.querySelector('.gallery-slides');
    var slides = slidesWrap ? Array.from(slidesWrap.querySelectorAll('.gallery-slide')) : [];

    // Falls keine .gallery-slide vorhanden: nicht anfassen (zeigt statisch)
    if (!slidesWrap || slides.length === 0) return;

    // Controls finden oder erzeugen
    function mkBtn(cls, label, html){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.setAttribute('aria-label', label);
      if (html) b.innerHTML = html;
      return b;
    }

    var prev = wrapper.querySelector('.gallery-prev') || mkBtn('gallery-prev','Bild zurück','&#10094;');
    var next = wrapper.querySelector('.gallery-next') || mkBtn('gallery-next','Bild weiter','&#10095;');
    if (!prev.parentNode) wrapper.appendChild(prev);
    if (!next.parentNode) wrapper.appendChild(next);

    var dotsWrap = wrapper.querySelector('.gallery-dots');
    if (!dotsWrap){ dotsWrap = document.createElement('div'); dotsWrap.className = 'gallery-dots'; wrapper.appendChild(dotsWrap); }
    dotsWrap.innerHTML = '';
    var dots = slides.map(function(_,i){
      var d = mkBtn('gallery-dot','Gehe zu Bild '+(i+1));
      dotsWrap.appendChild(d);
      return d;
    });

    var index = 0;
    function show(i){
      if (i < 0) i = slides.length - 1;
      if (i >= slides.length) i = 0;
      slides.forEach((s,k)=> s.classList.toggle('is-active', k===i));
      dots.forEach((d,k)=> d.classList.toggle('is-active', k===i));
      index = i;
    }
    show(0);

    // Klick-Handler (gegen Page-Exit-Interception absichern)
    function eat(e){ e.preventDefault(); e.stopPropagation(); }
    prev.addEventListener('click', function(e){ eat(e); show(index-1); }, {capture:true});
    next.addEventListener('click', function(e){ eat(e); show(index+1); }, {capture:true});
    dots.forEach((d,k)=> d.addEventListener('click', function(e){ eat(e); show(k); }, {capture:true}));

    // Keyboard-Navigation, wenn fokussiert
    wrapper.tabIndex = 0;
    wrapper.addEventListener('keydown', function(e){
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(index-1); }
      if (e.key === 'ArrowRight'){ e.preventDefault(); show(index+1); }
    });

    // Touch/Swipe
    var startX = null;
    slidesWrap.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, {passive:true});
    slidesWrap.addEventListener('touchend', e => {
      if (startX == null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 30) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    }, {passive:true});

    // Safety: Bedienelemente müssen „oberhalb“ und klickbar sein
    [prev, next, dotsWrap].forEach(el => {
  el.style.pointerEvents = 'auto';
  el.style.zIndex = '30';       // Position NICHT setzen – macht das CSS
});

    // Slides selbst sollten Klicks nicht fressen
    slidesWrap.style.pointerEvents = 'none';
    slides.forEach(s=> s.style.pointerEvents = 'none');
  }

  ready(function(){
    document.querySelectorAll('.tour-gallery-wrapper').forEach(initOne);
  });
})();
