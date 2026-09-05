/* Dilekçe Yazdırmak İstiyorum — arayüz betiği. Sıfır bağımlılık. */
(function () {
  'use strict';
  var d = document, kok = d.documentElement;
  var az = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, k) { return (k || d).querySelector(s); }
  function $$(s, k) { return Array.prototype.slice.call((k || d).querySelectorAll(s)); }
  function yaz(a, b) { try { localStorage.setItem(a, b); } catch (e) {} }
  function oku(a) { try { return localStorage.getItem(a); } catch (e) { return null; } }

  /* --- Yıl --- */
  var yil = $('#yil'); if (yil) yil.textContent = new Date().getFullYear();

  /* --- Mobil menü --- */
  var menuDugme = $('#menuDugme'), gez = $('#gez');
  if (menuDugme && gez) {
    var kapat = function () { gez.removeAttribute('data-acik'); menuDugme.setAttribute('aria-expanded', 'false'); };
    menuDugme.addEventListener('click', function () {
      var acik = gez.getAttribute('data-acik') === '1';
      if (acik) kapat();
      else { gez.setAttribute('data-acik', '1'); menuDugme.setAttribute('aria-expanded', 'true'); }
    });
    gez.addEventListener('click', function (e) { if (e.target.closest('a')) kapat(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') kapat(); });
  }

  /* --- Başlık camı: kaydırınca koyulaşır --- */
  var ustluk = $('.ustluk');
  if (ustluk) {
    var camDurum = function () {
      if (window.scrollY > 12) ustluk.setAttribute('data-kaydirildi', '1');
      else ustluk.removeAttribute('data-kaydirildi');
    };
    window.addEventListener('scroll', camDurum, { passive: true });
    camDurum();
  }

  /* --- Yumuşak beliriş --- */
  if (!az && 'IntersectionObserver' in window) {
    var gozcu = new IntersectionObserver(function (girisler) {
      girisler.forEach(function (g) {
        if (g.isIntersecting) { g.target.classList.add('gorundu'); gozcu.unobserve(g.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });
    $$('.belir').forEach(function (el) { gozcu.observe(el); });
  } else {
    $$('.belir').forEach(function (el) { el.classList.add('gorundu'); });
  }

  /* --- Sayfa içi arama --- */
  var araAc = $('#araAc'), araPerde = $('#araPerde'), araGirdi = $('#araGirdi'),
      araSonuc = $('#araSonuc'), araKapat = $('#araKapat');
  var dizin = null, secili = -1;

  function dizinKur() {
    if (dizin) return dizin;
    dizin = [];
    $$('main h2, main h3, main h4').forEach(function (b) {
      var bolum = b.closest('section');
      var hedef = b.id || (bolum && bolum.id);
      if (!hedef) {
        hedef = 'b-' + dizin.length;
        b.id = hedef;
      }
      var parcalar = [], n = b.nextElementSibling, sayac = 0;
      while (n && sayac < 3 && !/^H[2-4]$/.test(n.tagName)) {
        if (n.tagName === 'P' || n.tagName === 'UL' || n.tagName === 'OL' || n.tagName === 'DIV')
          parcalar.push(n.textContent);
        n = n.nextElementSibling; sayac++;
      }
      dizin.push({
        baslik: b.textContent.trim(),
        metin: parcalar.join(' ').replace(/\s+/g, ' ').trim(),
        hedef: hedef,
        dz: b.tagName
      });
    });
    return dizin;
  }

  function kacir(s) { return s.replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function trKucuk(s) {
    return s.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase()
            .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
            .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
  }

  function isaretle(metin, sorgu) {
    var dz = trKucuk(metin), i = dz.indexOf(sorgu);
    if (i < 0) return kacir(metin.slice(0, 120)) + (metin.length > 120 ? '…' : '');
    var bas = Math.max(0, i - 45), son = Math.min(metin.length, i + sorgu.length + 85);
    return (bas > 0 ? '…' : '') + kacir(metin.slice(bas, i)) +
           '<mark>' + kacir(metin.slice(i, i + sorgu.length)) + '</mark>' +
           kacir(metin.slice(i + sorgu.length, son)) + (son < metin.length ? '…' : '');
  }

  function araYap() {
    var ham = araGirdi.value.trim();
    if (ham.length < 2) {
      araSonuc.innerHTML = '<p class="ara-bos">En az iki harf yazın. Örnek: <strong>punto</strong>, <strong>ekler</strong>, <strong>kaşe</strong>, <strong>fiyat</strong>.</p>';
      secili = -1; return;
    }
    var s = trKucuk(ham), veri = dizinKur(), bulunan = [];
    veri.forEach(function (k) {
      var hb = trKucuk(k.baslik).indexOf(s), hm = trKucuk(k.metin).indexOf(s);
      if (hb > -1 || hm > -1) bulunan.push({ k: k, puan: (hb > -1 ? 0 : 1) + (k.dz === 'H2' ? 0 : 0.3) });
    });
    bulunan.sort(function (a, b) { return a.puan - b.puan; });
    if (!bulunan.length) {
      araSonuc.innerHTML = '<p class="ara-bos">"' + kacir(ham) + '" için sonuç bulunamadı.</p>';
      secili = -1; return;
    }
    araSonuc.innerHTML = bulunan.slice(0, 12).map(function (o) {
      return '<a href="#' + o.k.hedef + '" data-hedef="' + o.k.hedef + '">' +
             '<b>' + kacir(o.k.baslik) + '</b><span>' + isaretle(o.k.metin || o.k.baslik, s) + '</span></a>';
    }).join('');
    secili = -1;
  }

  function perdeAc() {
    if (!araPerde) return;
    araPerde.setAttribute('data-acik', '1');
    dizinKur(); araYap();
    setTimeout(function () { araGirdi.focus(); araGirdi.select(); }, 40);
  }
  function perdeKapat() { if (araPerde) araPerde.removeAttribute('data-acik'); }

  if (araAc) araAc.addEventListener('click', perdeAc);
  if (araKapat) araKapat.addEventListener('click', perdeKapat);
  if (araPerde) araPerde.addEventListener('click', function (e) { if (e.target === araPerde) perdeKapat(); });
  if (araGirdi) {
    araGirdi.addEventListener('input', araYap);
    araGirdi.addEventListener('keydown', function (e) {
      var ogeler = $$('a', araSonuc);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!ogeler.length) return;
        secili += (e.key === 'ArrowDown' ? 1 : -1);
        if (secili < 0) secili = ogeler.length - 1;
        if (secili >= ogeler.length) secili = 0;
        ogeler.forEach(function (a, i) { a.style.background = i === secili ? 'var(--cam-2)' : ''; });
        ogeler[secili].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var hedef = ogeler[secili < 0 ? 0 : secili];
        if (hedef) hedef.click();
      }
    });
  }
  if (araSonuc) {
    araSonuc.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return;
      e.preventDefault(); perdeKapat();
      var el = d.getElementById(a.getAttribute('data-hedef'));
      if (el) {
        el.scrollIntoView({ behavior: az ? 'auto' : 'smooth', block: 'start' });
        el.classList.remove('vurgula');
        void el.offsetWidth;
        el.classList.add('vurgula');
        setTimeout(function () { el.classList.remove('vurgula'); }, 2100);
      }
    });
  }
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') perdeKapat();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); perdeAc(); }
  });

  /* --- %30 kaydırmada bildirim --- */
  var bildirim = $('#bildirim'), bildirimKapat = $('#bildirimKapat');
  if (bildirim && oku('dyi-bildirim') !== 'kapali') {
    var gosterildi = false;
    var kontrol = function () {
      if (gosterildi) return;
      var yuk = d.body.scrollHeight - window.innerHeight;
      if (yuk <= 0) return;
      if (window.scrollY / yuk >= 0.30) {
        gosterildi = true;
        bildirim.setAttribute('data-acik', '1');
        window.removeEventListener('scroll', kontrol);
      }
    };
    window.addEventListener('scroll', kontrol, { passive: true });
    kontrol();
  }
  if (bildirimKapat) {
    bildirimKapat.addEventListener('click', function () {
      bildirim.removeAttribute('data-acik');
      yaz('dyi-bildirim', 'kapali');
    });
  }
  var bildirimCta = $('#bildirimCta');
  if (bildirimCta) bildirimCta.addEventListener('click', function () {
    bildirim.removeAttribute('data-acik'); yaz('dyi-bildirim', 'kapali');
  });
})();

/* ============================================================
   Dilekçe yazdırma formu — 8 adım
   ============================================================ */
(function () {
  'use strict';

  /* Sunucu uç noktası kurulduğunda BURAYI doldurun.
     Boş kaldığı sürece form, özeti WhatsApp'a aktararak çalışır. */
  var API = 'https://api.dilekceyazdirmakistiyorum.com/api/dilekce-talebi';
  var WA_NUMARA = '905518373004';

  var d = document;
  var form = d.getElementById('dilekceForm');
  if (!form) return;

  function $(s) { return d.querySelector(s); }
  function $$(s, k) { return Array.prototype.slice.call((k || d).querySelectorAll(s)); }
  function deger(ad) { var e = form.elements[ad]; return e ? (e.value || '').trim() : ''; }
  function secim(ad) { var e = form.querySelector('[name="' + ad + '"]:checked'); return e ? e.value : ''; }
  function isaretli(id) { var e = d.getElementById(id); return !!(e && e.checked); }

  var TOPLAM = 8, adim = 1, dosyalar = [], gonderiliyor = false;
  var ADIM_ADLARI = ['Dilekçe Konusu', 'Kurum / Makam', 'Olay Anlatımı', 'Talebiniz',
                     'Başvuru Sahibi', 'Ek Belgeler', 'İletişim', 'Son Kontrol'];

  var btnIleri = $('#btnIleri'), btnGeri = $('#btnGeri'), adimNo = $('#adimNo'),
      adimCubuk = $('#adimCubuk'), adimAdi = $('#adimAdi'), ozet = $('#ozet'),
      formGez = $('#formGez'), formNotu = $('#formNotu'), formSonuc = $('#formSonuc');

  /* ---- koşullu alanlar ---- */
  $$('[name="aciliyet"]').forEach(function (r) {
    r.addEventListener('change', function () {
      $('#sonTarihAlan').hidden = (secim('aciliyet') !== 'Belirli tarihe kadar');
    });
  });
  var tcIstek = $('#tcIstek');
  if (tcIstek) tcIstek.addEventListener('change', function () { $('#tcAlan').hidden = !tcIstek.checked; });
  $$('[name="belge_var"]').forEach(function (r) {
    r.addEventListener('change', function () { $('#belgeAlan').hidden = (secim('belge_var') !== 'Evet'); });
  });
  var konuBil = $('#konuBilmiyorum');
  if (konuBil) konuBil.addEventListener('change', function () {
    var k = d.getElementById('konu');
    k.placeholder = konuBil.checked
      ? 'Kısaca yazın, gerisini biz soracağız. Örn: belediyeyle ilgili bir sorunum var.'
      : 'Örn: Belediyeye gürültü şikayetinde bulunmak istiyorum.';
  });

  /* ---- dosyalar ---- */
  var dosyaGirdi = $('#dosyaGirdi'), dosyaListe = $('#dosyaListe'), yukleKutu = $('#yukleKutu');
  var MAKS_BOY = 10 * 1024 * 1024, MAKS_ADET = 8;

  function boyYaz(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(0) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }
  function dosyaCiz() {
    if (!dosyaListe) return;
    dosyaListe.innerHTML = dosyalar.map(function (f, i) {
      return '<li><span class="dosya-no">Ek-' + (i + 1) + '</span>' +
             '<span class="dosya-ad">' + f.name.replace(/[<>&"]/g, '') + '</span>' +
             '<span class="dosya-boy">' + boyYaz(f.size) + '</span>' +
             '<button type="button" class="dosya-sil" data-i="' + i + '" aria-label="Bu belgeyi kaldır">' +
             '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></li>';
    }).join('');
  }
  function dosyaEkle(liste) {
    Array.prototype.forEach.call(liste, function (f) {
      if (dosyalar.length >= MAKS_ADET) return;
      if (f.size > MAKS_BOY) { alert('"' + f.name + '" 10 MB sınırını aşıyor, eklenmedi.'); return; }
      if (dosyalar.some(function (x) { return x.name === f.name && x.size === f.size; })) return;
      dosyalar.push(f);
    });
    dosyaCiz();
  }
  if (dosyaGirdi) dosyaGirdi.addEventListener('change', function () { dosyaEkle(dosyaGirdi.files); dosyaGirdi.value = ''; });
  if (dosyaListe) dosyaListe.addEventListener('click', function (e) {
    var b = e.target.closest('.dosya-sil'); if (!b) return;
    dosyalar.splice(+b.getAttribute('data-i'), 1); dosyaCiz();
  });
  if (yukleKutu) {
    ['dragenter', 'dragover'].forEach(function (t) {
      yukleKutu.addEventListener(t, function (e) { e.preventDefault(); yukleKutu.setAttribute('data-uzerinde', '1'); });
    });
    ['dragleave', 'drop'].forEach(function (t) {
      yukleKutu.addEventListener(t, function (e) { e.preventDefault(); yukleKutu.removeAttribute('data-uzerinde'); });
    });
    yukleKutu.addEventListener('drop', function (e) { if (e.dataTransfer) dosyaEkle(e.dataTransfer.files); });
  }

  /* ---- doğrulama ---- */
  function hataAc(ad, ac) {
    var kutu = form.querySelector('[data-alan="' + ad + '"]');
    if (kutu) kutu.classList.toggle('alan-hata', ac);
    var y = form.querySelector('.hata-yazi[data-hata="' + ad + '"]');
    if (y && !kutu) y.style.display = ac ? 'block' : 'none';
  }
  function telGecerli(t) { return (t.replace(/\D/g, '').length >= 10); }
  function epostaGecerli(e) { return !e || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }

  function dogrula(n) {
    var ok = true, ilk = null;
    function bozuk(ad, el) { hataAc(ad, true); ok = false; if (!ilk) ilk = el || form.querySelector('[data-alan="' + ad + '"]'); }

    if (n === 1) {
      hataAc('tur', false); hataAc('konu', false);
      if (!secim('tur')) { var y = form.querySelector('.hata-yazi[data-hata="tur"]'); y.style.display = 'block'; ok = false; ilk = ilk || $('#turPullari'); }
      if (deger('konu').length < 5) bozuk('konu', d.getElementById('konu'));
    } else if (n === 2) {
      var yk = form.querySelector('.hata-yazi[data-hata="kurum_turu"]');
      yk.style.display = 'none';
      if (!secim('kurum_turu') && !isaretli('kurumBilmiyorum')) { yk.style.display = 'block'; ok = false; ilk = ilk || yk; }
    } else if (n === 3) {
      hataAc('olay', false);
      if (deger('olay').length < 20) bozuk('olay', d.getElementById('olay'));
    } else if (n === 4) {
      hataAc('talep', false);
      if (deger('talep').length < 10) bozuk('talep', d.getElementById('talep'));
    } else if (n === 5) {
      hataAc('ad_soyad', false); hataAc('telefon', false); hataAc('eposta', false); hataAc('tc', false);
      if (deger('ad_soyad').length < 3) bozuk('ad_soyad', d.getElementById('ad_soyad'));
      if (!telGecerli(deger('telefon'))) bozuk('telefon', d.getElementById('telefon'));
      if (!epostaGecerli(deger('eposta'))) bozuk('eposta', d.getElementById('eposta'));
      if (isaretli('tcIstek') && deger('tc').replace(/\D/g, '').length !== 11) bozuk('tc', d.getElementById('tc'));
    } else if (n === 7) {
      var yr = form.querySelector('.hata-yazi[data-hata="riza"]');
      yr.style.display = 'none';
      if (!isaretli('riza')) { yr.style.display = 'block'; ok = false; ilk = ilk || yr; }
    }
    if (!ok && ilk && ilk.scrollIntoView) {
      ilk.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (ilk.focus) try { ilk.focus({ preventScroll: true }); } catch (e) {}
    }
    return ok;
  }

  /* ---- özet ---- */
  function veriTopla() {
    return {
      tur: secim('tur'), konu: deger('konu'), konu_bilmiyorum: isaretli('konuBilmiyorum'),
      kurum_turu: secim('kurum_turu'), kurum_adi: deger('kurum_adi'), il: deger('il'),
      ilce: deger('ilce'), birim: deger('birim'), kurum_bilmiyorum: isaretli('kurumBilmiyorum'),
      olay: deger('olay'), olay_tarih: deger('olay_tarih'), olay_yer: deger('olay_yer'),
      ilgili: deger('ilgili'), dosya_no: deger('dosya_no'),
      talep: deger('talep'), aciliyet: secim('aciliyet'), son_tarih: deger('son_tarih'),
      ad_soyad: deger('ad_soyad'), telefon: deger('telefon'), eposta: deger('eposta'),
      adres: deger('adres'), tc: isaretli('tcIstek') ? deger('tc') : '',
      belge_var: secim('belge_var'), belge_aciklama: deger('belge_aciklama'),
      belge_adedi: dosyalar.length, iletisim: secim('iletisim'), not: deger('not')
    };
  }
  function ozetCiz() {
    var v = veriTopla(), sat = [];
    function ek(b, d2) { if (d2) sat.push('<div class="ozet-satir"><dt>' + b + '</dt><dd>' + String(d2).replace(/[<>&]/g, '') + '</dd></div>'); }
    ek('Dilekçe türü', v.tur);
    ek('Konu', v.konu + (v.konu_bilmiyorum ? '  (ne yazacağını bilmiyor)' : ''));
    ek('Kurum', v.kurum_bilmiyorum ? 'Birimi bilmiyor — değerlendirilecek' : [v.kurum_turu, v.kurum_adi].filter(Boolean).join(' — '));
    ek('İl / İlçe', [v.il, v.ilce].filter(Boolean).join(' / '));
    ek('Birim', v.birim);
    ek('Olay', v.olay);
    ek('Olay tarihi', v.olay_tarih); ek('Olay yeri', v.olay_yer);
    ek('İlgili kişi/kurum', v.ilgili); ek('Dosya / evrak no', v.dosya_no);
    ek('Talep', v.talep);
    ek('Aciliyet', v.aciliyet + (v.son_tarih ? ' — son tarih: ' + v.son_tarih : ''));
    ek('Ad Soyad', v.ad_soyad); ek('Telefon', v.telefon); ek('E-posta', v.eposta);
    ek('Adres', v.adres); ek('T.C. Kimlik No', v.tc);
    ek('Ek belge', v.belge_var === 'Evet' ? (v.belge_adedi + ' adet') : v.belge_var);
    ek('Belge açıklaması', v.belge_aciklama);
    ek('İletişim tercihi', v.iletisim); ek('Not', v.not);
    ozet.innerHTML = sat.join('');
  }

  /* ---- adım gezinme ---- */
  function goster(n) {
    adim = n;
    $$('.form-adim', form).forEach(function (a) {
      a.setAttribute('data-etkin', a.getAttribute('data-adim') === String(n) ? '1' : '0');
      if (a.getAttribute('data-adim') !== String(n)) a.removeAttribute('data-etkin');
    });
    adimNo.textContent = n;
    adimAdi.textContent = ADIM_ADLARI[n - 1];
    adimCubuk.style.width = (n / TOPLAM * 100) + '%';
    adimCubuk.parentNode.setAttribute('aria-valuenow', n);
    btnGeri.hidden = (n === 1);
    btnIleri.textContent = (n === TOPLAM) ? 'DİLEKÇE TALEBİMİ GÖNDER' : 'Devam Et →';
    if (n === TOPLAM) ozetCiz();
    var kart = d.querySelector('.form-kart');
    var ust = kart.getBoundingClientRect().top + window.scrollY - 96;
    if (window.scrollY > ust) window.scrollTo({ top: ust, behavior: 'smooth' });
  }
  btnIleri.addEventListener('click', function () {
    if (adim === TOPLAM) { gonder(); return; }
    if (!dogrula(adim)) return;
    goster(adim + 1);
  });
  btnGeri.addEventListener('click', function () { if (adim > 1) goster(adim - 1); });
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); btnIleri.click(); }
  });

  /* ---- gönderim ---- */
  function talepNoUret() {
    var t = new Date();
    return String(t.getFullYear()).slice(2) + String(t.getMonth() + 1).padStart(2, '0') +
           String(t.getDate()).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 9000) + 1000);
  }
  function waMetin(v, no) {
    var s = ['*Yeni Dilekçe Talebi #' + no + '*', ''];
    function ek(b, d2) { if (d2) s.push('*' + b + ':* ' + d2); }
    ek('Tür', v.tur);
    ek('Konu', v.konu + (v.konu_bilmiyorum ? ' (ne yazacağını bilmiyor)' : ''));
    ek('Kurum', v.kurum_bilmiyorum ? 'Birimi bilmiyor' : [v.kurum_turu, v.kurum_adi].filter(Boolean).join(' — '));
    ek('İl/İlçe', [v.il, v.ilce].filter(Boolean).join(' / '));
    ek('Birim', v.birim);
    if (v.olay) { s.push('', '*Olay:*', v.olay); }
    ek('Olay tarihi', v.olay_tarih); ek('Olay yeri', v.olay_yer);
    ek('İlgili', v.ilgili); ek('Dosya no', v.dosya_no);
    if (v.talep) { s.push('', '*Talep:*', v.talep); }
    ek('Aciliyet', v.aciliyet + (v.son_tarih ? ' (son tarih: ' + v.son_tarih + ')' : ''));
    s.push('', '*Başvuru sahibi*');
    ek('Ad Soyad', v.ad_soyad); ek('Telefon', v.telefon); ek('E-posta', v.eposta);
    ek('Adres', v.adres); ek('T.C.', v.tc);
    ek('Ek belge', v.belge_var === 'Evet' ? v.belge_adedi + ' adet (bu sohbete ekleyeceğim)' : v.belge_var);
    ek('Belge açıklaması', v.belge_aciklama);
    ek('İletişim tercihi', v.iletisim); ek('Not', v.not);
    return s.join('\n');
  }
  function bitir(no, metin) {
    formGez.hidden = true; formNotu.hidden = true;
    $$('.form-adim', form).forEach(function (a) { a.removeAttribute('data-etkin'); });
    d.querySelector('.form-ilerleme').hidden = true;
    form.hidden = true;
    $('#talepNo').textContent = '#' + no;
    if (metin) $('#sonucMetin').textContent = metin;
    formSonuc.setAttribute('data-etkin', '1');
    formSonuc.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function gonder() {
    if (gonderiliyor) return;
    if (!dogrula(7)) { goster(7); return; }
    gonderiliyor = true;
    btnIleri.textContent = 'Gönderiliyor…';
    btnIleri.disabled = true;

    var v = veriTopla(), no = talepNoUret();

    if (!API) {
      /* Sunucu yokken: özet WhatsApp'a aktarılır. */
      var url = 'https://wa.me/' + WA_NUMARA + '?text=' + encodeURIComponent(waMetin(v, no));
      window.open(url, '_blank', 'noopener');
      bitir(no, dosyalar.length
        ? 'Talebiniz WhatsApp üzerinden arzuhalcimize iletildi. Belgelerinizi açılan sohbete ekleyerek gönderin.'
        : 'Talebiniz WhatsApp üzerinden arzuhalcimize iletildi. En kısa sürede sizinle iletişime geçeceğiz.');
      return;
    }

    var fd = new FormData();
    Object.keys(v).forEach(function (k) { fd.append(k, v[k] === true ? '1' : (v[k] === false ? '' : v[k])); });
    dosyalar.forEach(function (f, i) { fd.append('belgeler[' + i + ']', f, f.name); });

    fetch(API, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); })
      .then(function (j) { bitir(j.talep_no || no, j.mesaj); })
      .catch(function () {
        var url2 = 'https://wa.me/' + WA_NUMARA + '?text=' + encodeURIComponent(waMetin(v, no));
        window.open(url2, '_blank', 'noopener');
        bitir(no, 'Bağlantıda bir sorun oldu, talebiniz WhatsApp üzerinden iletildi.');
      });
  }

  goster(1);
})();
