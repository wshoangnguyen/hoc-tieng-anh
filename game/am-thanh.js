/* Bộ phát âm + pháo hoa dùng chung cho các trang không nạp core.js
 * Dùng: NOI.tu("apple") → Promise; NOI.phaoHoa(6)
 * Ưu tiên mp3 người thật (ssl.gstatic.com), hỏng thì dùng giọng máy của trình duyệt.
 */
window.NOI = (function () {
  var cache = null;
  function nap() { try { cache = JSON.parse(localStorage.getItem("game_am") || "{}"); } catch (e) { cache = {}; } }
  function luu(k, v) { if (!cache) nap(); cache[k] = v; try { localStorage.setItem("game_am", JSON.stringify(cache)); } catch (e) {} }

  function may(tu) {
    var s = window.speechSynthesis;
    if (!s) return false;
    try {
      var u = new SpeechSynthesisUtterance(tu);
      u.lang = "en-US"; u.rate = 0.85;
      var ds = (s.getVoices ? s.getVoices() : []).filter(function (v) { return /^en/i.test(v.lang); });
      if (ds.length) u.voice = ds.filter(function (v) { return /google|natural|samantha|zira|aria/i.test(v.name); })[0] || ds[0];
      s.cancel();
      setTimeout(function () { try { s.resume && s.resume(); } catch (e) {} try { s.speak(u); } catch (e) {} }, 90);
      return true;
    } catch (e) { return false; }
  }

  function tu(t) {
    t = String(t || "").trim();
    if (!t) return Promise.resolve(false);
    if (!cache) nap();
    var k = t.toLowerCase();
    return new Promise(function (resolve) {
      var dungMay = function () { resolve(may(t)); };
      if (cache[k] === "no") return dungMay();
      if (!/^[a-z][a-z'\- ]*$/i.test(t) || t.length > 32) return dungMay();
      var url = "https://ssl.gstatic.com/dictionary/static/sounds/20200429/" + encodeURIComponent(k) + "--_us_1.mp3";
      var xong = false, a;
      try { a = new Audio(url); a.preload = "auto"; } catch (e) { return dungMay(); }
      var hong = function () { if (xong) return; xong = true; luu(k, "no"); dungMay(); };
      a.addEventListener("error", hong);
      a.addEventListener("playing", function () { if (xong) return; xong = true; luu(k, "ok"); resolve(true); });
      setTimeout(function () { if (!xong) { try { a.pause(); } catch (e) {} hong(); } }, 2200);
      try { var pr = a.play(); if (pr && pr.catch) pr.catch(hong); } catch (e) { hong(); }
    });
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

  return { tu: tu, phaoHoa: phaoHoa };
})();
