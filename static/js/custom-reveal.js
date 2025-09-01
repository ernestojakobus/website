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
