/* Bộ phát âm dùng chung cho mọi game.
 * NOI.tu("apple")  -> Promise, phát 1 từ
 * NOI.cau("Hello, how are you?") -> Promise, phát câu
 * Thứ tự ưu tiên: mp3 tự lưu trong game/audio → mp3 từ điển Google → Google dịch TTS → giọng máy.
 * Chạy được cả trong webview Zalo/Facebook (nơi speechSynthesis thường bị chặn).
 */
window.NOI = (function () {
  var MAN = null, dangTai = null, CO_GIONG = null;

  function goc() {
    // trang trong /game/ thì audio nằm cạnh; trang trong /game/games/ thì lùi 1 cấp
    return /\/games\//.test(location.pathname) ? "../" : "";
  }

  function chuanHoa(t) {
    return String(t || "").trim().replace(/[’]/g, "'").toLowerCase();
  }

  function slug(t) {
    return chuanHoa(t).replace(/[^a-z0-9'\- ]+/g, "").replace(/\s+/g, "-").replace(/^-|-$/g, "");
  }

  function napManifest() {
    if (MAN) return Promise.resolve(MAN);
    if (dangTai) return dangTai;
    var luu = null;
    try { luu = JSON.parse(localStorage.getItem("game_audio_man3") || "null"); } catch (e) {}
    if (luu && luu.v === 3 && luu.d) { MAN = luu.d; return Promise.resolve(MAN); }
    dangTai = fetch(goc() + "audio/manifest.json")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        MAN = d || {};
        try { localStorage.setItem("game_audio_man3", JSON.stringify({ v: 3, d: MAN })); } catch (e) {}
        return MAN;
      })
      .catch(function () { MAN = {}; return MAN; });
    return dangTai;
  }
  napManifest();

  /* FNV-1a 32-bit trên UTF-8 — trùng với gen-cau.py */
  function fnv(text) {
    var bytes = new TextEncoder().encode(text);
    var h = 0x811C9DC5;
    for (var i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ("00000000" + h.toString(16)).slice(-8);
  }

  var CAU = null, dangTaiCau = null;
  function napCau() {
    if (CAU) return Promise.resolve(CAU);
    if (dangTaiCau) return dangTaiCau;
    dangTaiCau = fetch(goc() + "audio/cau.json")
      .then(function (r) { return r.json(); })
      .then(function (d) { CAU = d || {}; return CAU; })
      .catch(function () { CAU = {}; return CAU; });
    return dangTaiCau;
  }
  napCau();

  function chuanCau(t) {
    return String(t || "").replace(/[’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();
  }

  /* phát 1 url, trả về Promise<HTMLAudioElement|null> */
  function phat(url, cho) {
    return new Promise(function (resolve) {
      var a = new Audio(), xong = false;
      a.preload = "auto";
      a.src = url;
      function duoc() { if (!xong) { xong = true; resolve(a); } }
      function hong() {
        if (xong) return;
        xong = true;
        try { a.pause(); } catch (e) {}
        resolve(null);
      }
      a.addEventListener("playing", duoc, { once: true });
      a.addEventListener("error", hong, { once: true });
      setTimeout(function () { if (!xong && a.currentTime === 0) hong(); }, cho || 3000);
      try {
        var p = a.play();
        if (p && p.catch) p.catch(hong);
      } catch (e) { hong(); }
    });
  }

  function coGiong() {
    if (CO_GIONG !== null) return CO_GIONG;
    var s = window.speechSynthesis;
    if (!s) return (CO_GIONG = false);
    var ds = s.getVoices ? s.getVoices() : [];
    CO_GIONG = ds.some(function (v) { return /^en/i.test(v.lang || ""); });
    return CO_GIONG;
  }

  function giongMay(text) {
    var s = window.speechSynthesis;
    if (!s) return Promise.resolve(false);
    if (!coGiong()) return Promise.resolve(false);
    try {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.9;
      var ds = (s.getVoices ? s.getVoices() : []).filter(function (v) { return /^en/i.test(v.lang || ""); });
      if (ds.length) u.voice = ds[0];
      s.cancel();
      s.speak(u);
      return Promise.resolve(true);
    } catch (e) { return Promise.resolve(false); }
  }

  function gtx(text) {
    var url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&ttsspeed=0.9&q=" +
              encodeURIComponent(text);
    return phat(url, 3500);
  }

  function gstatic(text) {
    var k = chuanHoa(text);
    if (!/^[a-z][a-z'\- ]*$/.test(k) || k.length > 28) return Promise.resolve(null);
    return phat("https://ssl.gstatic.com/dictionary/static/sounds/20200429/" +
                encodeURIComponent(k.replace(/\s+/g, "_")) + "--_us_1.mp3", 2500);
  }

  function tu(t) {
    var text = String(t || "").trim();
    if (!text) return Promise.resolve(false);
    var sl = slug(text);

    return napManifest().then(function (man) {
      var buoc = (man && man[sl]) ? phat(goc() + "audio/" + man[sl], 2500) : Promise.resolve(null);
      return buoc
        .then(function (a) { return a || gstatic(text); })
        .then(function (a) { return a || gtx(text); })
        .then(function (a) { return a ? true : giongMay(text); });
    });
  }

  function cau(text) {
    var t = String(text || "").trim();
    if (!t) return Promise.resolve(false);
    var khoa = fnv(chuanCau(t));
    return napCau().then(function (ds) {
      if (ds && ds[khoa]) {
        return phat(goc() + "audio/" + ds[khoa], 3000).then(function (a) { return a ? true : null; });
      }
      return null;
    }).then(function (ketQua) {
      if (ketQua) return ketQua;
      if (t.length <= 180) {
        return gtx(t).then(function (a) { return a ? true : giongMay(t); });
      }
      return cauDai(t);
    });
  }

  function cauDai(t) {
    var phan = t.match(/[^.!?]+[.!?]?/g) || [t], i = 0;
    function tiep() {
      if (i >= phan.length) return Promise.resolve(true);
      var doan = phan[i++].trim();
      if (!doan) return tiep();
      return gtx(doan).then(function (a) {
        if (!a) return giongMay(doan).then(tiep);
        var cho = Math.min(9000, 900 + doan.length * 75);
        return new Promise(function (res) { setTimeout(function () { res(tiep()); }, cho); });
      });
    }
    return tiep();
  }

  function phaoHoa(soQua) {
    var n = Math.max(1, Number(soQua) || 5);
    var cv = document.getElementById("phaohoa");
    if (!cv) {
      cv = document.createElement("canvas");
      cv.id = "phaohoa";
      cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:100000";
      document.body.appendChild(cv);
    }
    var ctx = cv.getContext("2d");
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    var hat = [], mau = ["#ffd166", "#ff6b6b", "#4ecdc4", "#a78bfa", "#34d399", "#f472b6", "#60a5fa"], daNo = 0;
    function no(x, y) {
      var c = mau[(Math.random() * mau.length) | 0], k = 36 + ((Math.random() * 24) | 0);
      for (var i = 0; i < k; i++) {
        var g = (Math.PI * 2 * i) / k, v = 1.7 + Math.random() * 3.6;
        hat.push({ x: x, y: y, vx: Math.cos(g) * v, vy: Math.sin(g) * v, life: 1, c: c });
      }
    }
    var dan = setInterval(function () {
      no(cv.width * (0.18 + Math.random() * 0.64), cv.height * (0.12 + Math.random() * 0.36));
      daNo++;
      if (daNo >= n) clearInterval(dan);
    }, 340);
    function ve() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (var i = hat.length - 1; i >= 0; i--) {
        var p = hat[i];
        p.vy += 0.035; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.life -= 0.011;
        if (p.life <= 0) { hat.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (hat.length || daNo < n) requestAnimationFrame(ve);
      else { try { cv.remove(); } catch (e) {} }
    }
    requestAnimationFrame(ve);
  }

  return { tu: tu, cau: cau, phat: phat, phaoHoa: phaoHoa, napManifest: napManifest, napCau: napCau, fnv: fnv, chuanCau: chuanCau, coGiong: coGiong };
})();
