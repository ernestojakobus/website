/* static/js/custom-reveal.js
   Robust Scroll-Reveal für PaperMod (works with DOMContentLoaded + PJAX)
*/
(function () {
  // ---- Config
  const SELECTOR = ".bar-card, .content-card, .bar, .fade-up, .fade-left, .fade-right";
  const THRESHOLD = 0.12;

  // ---- Helpers
  function log(...args){ if (window.localStorage.getItem("revealDebug")==="1") console.log("[reveal]", ...args); }

  function markVisible(el){
    el.classList.add("reveal--visible");
    el.classList.remove("reveal");       // sauber halten
  }

  function applyStartState(els){
    els.forEach(el => el.classList.add("reveal"));
  }

  // Einmal-Observer
  let io = null;
  function ensureObserver(){
    if (io) return io;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      io = { observe: markVisible }; // no-op “Observer”
      return io;
    }
    io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        markVisible(entry.target);
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: THRESHOLD });
    return io;
  }

  // Init einmal pro „Seiteninhalt“
  function initOnce(context){
    const root = context || document;
    const els = Array.from(root.querySelectorAll(SELECTOR))
      .filter(el => !el.classList.contains("reveal--visible"));

    if (els.length === 0){ log("no targets"); return; }

    applyStartState(els);
    const obs = ensureObserver();
    els.forEach(el => obs.observe(el));
    log("observed:", els.length);
  }

  // Öffentliche Debug-Funktion
  window.RioRevealInit = function(ctx){
    log("manual init");
    initOnce(ctx || document);
  };

  // DOMContentLoaded + Load
  document.addEventListener("DOMContentLoaded", () => initOnce(document));
  window.addEventListener("load", () => initOnce(document));

  // PaperMod/PJAX-ähnliche Events (falls vorhanden)
  window.addEventListener("pjax:complete", () => { log("pjax:complete"); initOnce(document); });
  window.addEventListener("popstate",        () => { log("popstate");      setTimeout(()=>initOnce(document), 0); });

  // Fallback: beobachte inhaltliche Änderungen in <main>
  const main = document.querySelector("main") || document.body;
  if (window.MutationObserver && main){
    const mo = new MutationObserver(muts => {
      for (const m of muts){
        if (m.addedNodes && m.addedNodes.length){
          initOnce(main);
          break;
        }
      }
    });
    mo.observe(main, { childList:true, subtree:true });
  }
})();
