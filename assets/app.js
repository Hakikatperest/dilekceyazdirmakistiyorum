/* Dilekçe Yazdırmak İstiyorum — küçük etkileşimler. Kütüphane yok. */
(function () {
  'use strict';

  /* Mobil menü */
  var dug = document.querySelector('.menu-dug');
  var menu = document.getElementById('menu');
  if (dug && menu) {
    dug.addEventListener('click', function () {
      var acik = menu.classList.toggle('acik');
      dug.setAttribute('aria-expanded', acik ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('acik');
        dug.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* Üst bar gölgesi */
  var ust = document.querySelector('.ust');
  if (ust) {
    var kaydir = function () { ust.classList.toggle('kaydi', window.scrollY > 8); };
    kaydir();
    window.addEventListener('scroll', kaydir, { passive: true });
  }

  /* Kaydırınca beliren öğeler */
  var hedefler = document.querySelectorAll('.reveal');
  if (hedefler.length && 'IntersectionObserver' in window) {
    var göz = new IntersectionObserver(function (girdiler) {
      girdiler.forEach(function (g) {
        if (g.isIntersecting) { g.target.classList.add('gorundu'); göz.unobserve(g.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    hedefler.forEach(function (h) { göz.observe(h); });
  } else {
    hedefler.forEach(function (h) { h.classList.add('gorundu'); });
  }

  /* Video: tıklayana kadar tek bayt inmez (preload="none" + poster). */
  var oynat = document.querySelector('.vid-oynat');
  if (oynat) {
    oynat.addEventListener('click', function () {
      var kap = oynat.closest('.vid');
      var poster = kap.querySelector('picture, img');
      var v = kap.querySelector('video');
      if (poster) poster.remove();
      oynat.remove();
      v.setAttribute('controls', '');
      v.play();
    });
  }

  /* Alt bilgideki yıl */
  var yil = document.getElementById('yil');
  if (yil) yil.textContent = new Date().getFullYear();
})();
