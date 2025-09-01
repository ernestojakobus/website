/* Río de Oro – Reveal & Gallery (vanilla, no deps)
   - Scroll-Reveal für Karten/Boxen
   - Mini-Galerie-Steuerung (Pfeile & Dots)
   Speichere diese Datei OHNE <script>-Tags. Lade sie mit "defer".
*/
(() => {
  /* ==================== Scroll Reveal ==================== */
  const sel = ['.bar-card', '.content-card', '.card.tour-card', '.gallery-card'];
  const items = Array.from(document.querySelectorAll(sel.join(',')));

  // .reveal auf alle Items + leichte Staffelung
  items.forEach((el, i) => {
    el.classList.add('reveal');
    el.setAttribute('data-reveal-delay', String(i % 4));
  });

  const makeVisible = el => el.classList.add('reveal--visible');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          makeVisible(e.target);
          io.unobserve(e.target);
        }
      });
    }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

    items.forEach(el => io.observe(el));
  } else {
    // Fallback: sofort sichtbar
    items.forEach(makeVisible);
  }

  /* ==================== Gallery ==================== */
  function initGallery(root) {
    const slides = root.querySelectorAll('.gallery-slide');
    if (!slides.length) return;

    const dots = root.querySelectorAll('.gallery-dot');
    const prev = root.querySelector('.gallery-prev');
    const next = root.querySelector('.gallery-next');
    let idx = 0;

    function show(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === idx));
      dots.forEach((d, k) => d.classList.toggle('is-active', k === idx));
    }

    prev && prev.addEventListener('click', () => show(idx - 1));
    next && next.addEventListener('click', () => show(idx + 1));
    dots.forEach(d => d.addEventListener('click', () => {
      const i = Number(d.getAttribute('data-index') || '0');
      show(i);
    }));

    show(0);
  }

  // Tour-Galerien initialisieren
  document.querySelectorAll('.tour-gallery-wrapper,[data-gallery]')
    .forEach(initGallery);
})();
