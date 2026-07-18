// Archive / NM — case study interactivity
// Shared across all six /projects/*.html pages. Wrapped in an IIFE
// so its bindings never collide with each page's existing inline
// reveal-on-scroll script (classic <script> tags on the same page
// share one top-level lexical scope, so a bare `const` here would
// clash with the inline script's own `const reduce`).
(function () {
  'use strict';

  // Pair this page's hero image with the homepage's matching
  // .project-frame element (named in script.js) so the View
  // Transitions API morphs the image across navigation instead of
  // hard-cutting. Harmless no-op in browsers without support.
  const slug = location.pathname.split('/').pop().replace('.html', '');
  const heroImage = document.querySelector('.hero-image');
  if (heroImage) heroImage.style.viewTransitionName = `case-${slug}`;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const isDesktop = window.matchMedia('(min-width: 900px)').matches;
  if (!isDesktop) return;

  // Tilt — same rotation values as the homepage's .project-frame
  // tilt, so a case study reads as the same physical material as
  // the archive, not a separate flat document.
  const tiltTargets = document.querySelectorAll('.hero-image, .shot');
  tiltTargets.forEach(el => {
    el.addEventListener('pointermove', event => {
      const box = el.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - .5;
      const y = (event.clientY - box.top) / box.height - .5;
      el.style.transform = `rotateX(${-y * 4}deg) rotateY(${x * 5}deg) translateZ(8px) scale(1.01)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  // Scroll parallax on the hero image — identical formula to the
  // homepage's project-frame parallax, so scrolling into a case
  // study feels continuous with scrolling through the archive.
  if (heroImage) {
    window.addEventListener('scroll', () => {
      const rect = heroImage.getBoundingClientRect();
      const offset = ((rect.top + rect.height / 2 - innerHeight / 2) / innerHeight) * 18;
      heroImage.style.backgroundPositionY = `calc(50% + ${offset}px)`;
    }, { passive: true });
  }
})();
