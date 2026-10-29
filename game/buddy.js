/* BUDDY — bong bóng khen / khích lệ trong game.
   Luật: tối đa 1 câu mỗi 25 giây · không đùa vào câu trả lời của trẻ · không khen rỗng.
   Chỉ khen khi có lý do thật (3 câu đúng liền, hoặc câu khó đúng), khích lệ khi sai 2 lần liền. */
window.Buddy = (function () {
  const LS_TAT = "buddy_tat";
  const VI = /^SM\s*-?\s*[123]/i;
  const KHEN_VI = [
    "Đúng rồi! Mình vừa mọc thêm một sợi rễ.",
    "Ba câu liền đúng — rễ đang dài ra đấy.",
    "Câu này khó mà bạn làm được. Mình thì chịu.",
    "Chuẩn. Mình ghi vào nhật ký hạt giống nhé.",
    "Đúng, và lần này nhanh hơn lần trước.",
    "Bạn nói đúng, mình nghe rõ. Tai hạt giống cũng thính.",
  ];
  const KHEN_EN = [
    "Correct! One more root for you.",
    "Three in a row. Your roots are growing.",
    "Right again — I would have got that wrong.",
    "Nice. Faster than last time.",
    "Got it. I'm writing that in my seed diary.",
  ];
  const KHICH_VI = [
    "Chưa đúng. Thử chậm hơn một chút — mình chờ được.",
    "Sai một chữ thôi. Nghe lại nhé.",
    "Không sao. Hạt giống cũng có lúc mọc sai hướng.",
    "Thử lại đi. Mình đứng đây, không đi đâu.",
  ];
  const KHICH_EN = [
    "Not yet. Try again — I'm not going anywhere.",
    "Close. Listen once more.",
    "That's okay. Seeds grow the wrong way sometimes too.",
  ];

  let the = null, chu = null, henAn = null, henCho = null, cho = null;
  let dungLien = 0, saiLien = 0, lanCuoi = 0, lichSu = [];

  function tiengAnh() {
    try { const s = (window.GAME && GAME.cfg && GAME.cfg().sach) || ""; return !VI.test(s) && !!s; }
    catch (e) { return false; }
  }
  function tat() { try { return localStorage.getItem(LS_TAT) === "1"; } catch (e) { return false; } }
  function chon(ds) {
    const con = ds.filter((x) => lichSu.indexOf(x) < 0);
    const c = (con.length ? con : ds)[Math.floor(Math.random() * (con.length ? con.length : ds.length))];
    lichSu.push(c); if (lichSu.length > 8) lichSu.shift();
    return c;
  }

  function dungThe() {
    if (the) return the;
    the = document.createElement("div");
    the.id = "buddyNoi";
    the.setAttribute("role", "status");
    the.setAttribute("aria-live", "polite");
    the.innerHTML =
      '<img src="/game/assets/buddy-logo-128.png" alt="" aria-hidden="true" ' +
      'onerror="this.style.display=\'none\'">' +
      '<span class="bn-chu"></span>';
    document.body.appendChild(the);
    chu = the.querySelector(".bn-chu");
    const st = document.createElement("style");
    st.textContent =
      "#buddyNoi{position:fixed;left:14px;bottom:14px;z-index:80;display:flex;align-items:center;gap:9px;" +
      "max-width:min(320px,calc(100vw - 28px));background:#fffdf3;border:1px solid #f0dfae;border-radius:14px;" +
      "padding:8px 12px 8px 9px;box-shadow:0 8px 24px rgba(90,70,20,.14);font-family:'Quicksand',system-ui,sans-serif;" +
      "font-size:13.5px;line-height:1.4;color:#3c3728;opacity:0;transform:translateY(6px);" +
      "transition:opacity .22s,transform .22s;pointer-events:none}" +
      "#buddyNoi.hien{opacity:1;transform:none}" +
      "#buddyNoi img{width:32px;height:32px;flex:none;border-radius:50%}" +
      "@media (prefers-reduced-motion: reduce){#buddyNoi{transition:none}}";
    document.head.appendChild(st);
    return the;
  }

  function noi(cau, toiThieu, ngay) {
    if (tat()) return;
    const t = Date.now(), can = toiThieu || 25000;
    if (!ngay && t - lanCuoi < can) {
      cho = { cau: cau, can: can };
      clearTimeout(henCho);
      henCho = setTimeout(() => { const c = cho; cho = null; if (c) noi(c.cau, c.can, true); }, can - (t - lanCuoi) + 60);
      return;
    }
    lanCuoi = t;
    dungThe();
    chu.textContent = cau;
    the.classList.add("hien");
    clearTimeout(henAn);
    henAn = setTimeout(() => the.classList.remove("hien"), 4200);
  }

  /* gọi sau mỗi câu đúng */
  function dung() {
    dungLien++; saiLien = 0;
    if (dungLien >= 3) {
      dungLien = 0;
      noi(chon(tiengAnh() ? KHEN_EN : KHEN_VI));
    } else if (Math.random() < 0.18) {
      noi(chon(tiengAnh() ? KHEN_EN : KHEN_VI));
    }
  }
  /* gọi sau mỗi câu sai */
  function sai() {
    saiLien++; dungLien = 0;
    if (saiLien >= 2) {
      saiLien = 0;
      noi(chon(tiengAnh() ? KHICH_EN : KHICH_VI), 8000);
    }
  }
  function batTat(tatDi) {
    try { tatDi ? localStorage.setItem(LS_TAT, "1") : localStorage.removeItem(LS_TAT); } catch (e) {}
  }
  return { dung, sai, noi, batTat, dangTat: tat };
})();
