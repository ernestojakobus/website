/* static/js/custom-reveal.js – robustes Scroll-Reveal für PaperMod */
(function () {
  // Elemente, die animiert werden sollen (passt zu deinem HTML: .bar-card)
  const SELECTOR = ".bar-card, .content-card, .bar, .fade-up, .fade-left, .fade-right";
  const THRESHOLD = 0.12;

  function markVisible(el){
    el.classList.add("reveal--visible");
    el.classList.remove("reveal");
  }

  function prepare(el, i){
    if (!el.classList.contains("reveal")) el.classList.add("reveal");
    if (!el.style.getPropertyValue("--rv-delay") && el.parentElement?.classList.contains("reveal-group")){
      el.style.setProperty("--rv-delay", `${(i % 6) * 60}ms`);
    }
  }

  function init(container){
    const targets = Array.from(container.querySelectorAll(SELECTOR));
    if (!targets.length) return;

    targets.forEach(prepare);

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      targets.forEach(markVisible);
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          markVisible(en.target);
          io.unobserve(en.target);
        }
      });
    }, { root: null, rootMargin: "0px 0px -1px 0px", threshold: THRESHOLD });

    targets.forEach((el) => io.observe(el));
  }

  // Start sobald DOM bereit
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init(document), { once: true });
  } else {
    init(document);
  }
})();
