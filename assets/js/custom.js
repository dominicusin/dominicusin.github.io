/* Neo design-system JS — theme toggle, back-to-top, share copy, smooth anchors.
   No external dependencies. Loaded deferred from head.html. */
(function(){
  "use strict";
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch(e){}
  if (saved === 'light' || saved === 'dark') {
    root.setAttribute('data-theme', saved);
  } else {
    root.setAttribute('data-theme', 'dark');
  }

  function toggleTheme(){
    var cur = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', cur);
    try { localStorage.setItem('theme', cur); } catch(e){}
  }
  var btns = document.querySelectorAll('#neo-theme-toggle, .neo-theme');
  btns.forEach(function(b){ b.addEventListener('click', toggleTheme); });

  // Back to top
  var b = document.getElementById('neo-backtotop');
  if (b) {
    window.addEventListener('scroll', function(){
      b.classList.toggle('show', window.scrollY > 600);
    }, {passive:true});
    b.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });
  }
})();
