// Scroll-to-top button — appears after scrolling 400px, smooth scrolls to top.
(function () {
  var btn = document.getElementById('scroll-to-top');
  if (!btn) return;

  var show = function () { btn.classList.toggle('visible', window.scrollY > 400); };
  window.addEventListener('scroll', show, { passive: true });
  show();

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
