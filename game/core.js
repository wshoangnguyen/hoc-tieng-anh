/* GAME CORE — dùng chung cho mọi game trong /game
 * Việc của nó: biết ai đang chơi (mã học viên như web quản lý) · chọn nấc 1–6 · đếm đúng/sai
 * · tính điểm theo luật (1 điểm/nấc, +5 khi đủ 6 nấc, +5 nếu cả 6 nấc hoàn hảo, trần 15/ngày)
 * · ghi từ sai để ôn sau.
 *
 * Cách dùng:
 *   GAME.batDau({game:"quiz", sach:"SM3", unit:5, soCau:10});
 *   GAME.ghi({tu:"apple", ok:true});
 *   GAME.ketThuc();
 */
window.GAME = (function () {
  const API = "https://xtfusgawjlrcreiphwur.supabase.co";
  const KEY = "sb_publishable_3MiuAFrEEH_ZBEAg7fqTvw_CLC0OxK3"; // khoá công khai, như web quản lý
  const LS_MA = "game_ma_hv", LS_CHO = "game_cho_gui", LS_DIEM = "game_diem_hom_nay";
  const QUY_TAC = "Mỗi nấc xong +1 điểm · đủ 6 nấc +5 điểm · cả 6 nấc hoàn hảo +5 điểm · tối đa 16 điểm/ngày";

  let cfg = { game: "?", sach: null, unit: null, nac: 1, soCau: 0 };
  let phien = null, daKetThuc = false;
  let nacXong = [], nacHoanHao = [], diemHomNay = 0, dangTai = false;

  const el = (t, c, s) => { const d = document.createElement(t); if (c) d.className = c; if (s != null) d.textContent = s; return d; };
  const doc = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const luu = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const maHV = () => (localStorage.getItem(LS_MA) || "").trim().toUpperCase();
  function datMaHV(m) {
    if (m) localStorage.setItem(LS_MA, m.trim().toUpperCase()); else localStorage.removeItem(LS_MA);
    capNhatThanh(); taiTrangThai();
  }

  /* ---------- gọi máy chủ ---------- */
  function rpc(ten, body) {
    return fetch(API + "/rest/v1/rpc/" + ten, {
      method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
  }

  function taiTrangThai() {
    const ma = maHV();
    if (!ma || dangTai) return;
    dangTai = true;
    rpc("game_trang_thai", { p_ma: ma, p_game: cfg.game, p_sach: cfg.sach, p_unit: cfg.unit })
      .then((d) => {
        if (d && d.ok) {
          nacXong = d.nac_da_xong || [];
          nacHoanHao = d.nac_hoan_hao || [];
          diemHomNay = d.diem_hom_nay || 0;
          if (!cfg.khoaNac) {
            const thieu = [1, 2, 3, 4, 5, 6].find((n) => nacXong.indexOf(n) < 0);
            cfg.nac = thieu || 6;
          }
          luu(LS_DIEM, diemHomNay);
        }
      })
      .catch(() => {})
      .then(() => { dangTai = false; capNhatThanh(); });
  }

  /* ---------- thanh nhỏ ---------- */
  let thanh, nutMa, chonNac, nhanDiem;
  function dungThanh() {
    if (thanh || !document.body) return;
    thanh = el("div", "gcore-thanh");
    nutMa = el("button", "gcore-ma"); nutMa.onclick = hoiMa;
    chonNac = el("select", "gcore-nac");
    for (let n = 1; n <= 6; n++) { const o = el("option", null, "Nấc " + n); o.value = n; chonNac.appendChild(o); }
    chonNac.onchange = () => { cfg.nac = Number(chonNac.value); };
    nhanDiem = el("span", "gcore-diem", "");
    thanh.appendChild(nutMa); thanh.appendChild(chonNac); thanh.appendChild(nhanDiem);
    document.body.appendChild(thanh);
    capNhatThanh();
  }

  function capNhatThanh() {
    if (!nutMa) return;
    const m = maHV();
    nutMa.textContent = m ? "👤 " + m : "👤 Nhập mã học viên";
    nutMa.classList.toggle("thieu", !m);
    chonNac.value = cfg.nac || 1;
    [...chonNac.options].forEach((o) => {
      const n = Number(o.value);
      o.textContent = "Nấc " + n + (nacXong.indexOf(n) >= 0 ? " ✓" : "");
    });
    const d = doc(LS_DIEM);
    nhanDiem.textContent = m ? "⭐ " + (diemHomNay || d || 0) + "/16 hôm nay" : "";
  }

  /* ---------- hộp nhập mã ---------- */
  function hopThoai(tieuDe, noiDung, nutPhu) {
    const nen = el("div", "gcore-nen");
    const hop = el("div", "gcore-hop");
    hop.appendChild(el("h3", null, tieuDe));
    if (noiDung) hop.appendChild(el("p", null, noiDung));
    const o = el("input", "gcore-o");
    o.placeholder = "Ví dụ HV11"; o.maxLength = 12; o.value = maHV();
    hop.appendChild(o);
    const hang = el("div", "gcore-hang");
    const ok = el("button", "gcore-nut", "Lưu");
    const bo = el("button", "gcore-nut phu", nutPhu || "Để sau");
    hang.appendChild(ok); hang.appendChild(bo); hop.appendChild(hang);
    nen.appendChild(hop); document.body.appendChild(nen);
    setTimeout(() => o.focus(), 50);
    const dong = () => nen.remove();
    ok.onclick = () => { const v = o.value.trim(); if (v.length < 3) { o.focus(); return; } datMaHV(v); dong(); };
    bo.onclick = dong;
    o.addEventListener("keydown", (e) => { if (e.key === "Enter") ok.click(); });
  }
  function hoiMa() {
    hopThoai("Mã học viên", "Dùng đúng mã trong web quản lý lớp (ví dụ HV11). Nhập một lần, máy sẽ nhớ.");
  }

  /* ---------- vòng chơi ---------- */
  function batDau(c) {
    cfg = Object.assign(cfg, c || {});
    if (c && c.nac) cfg.nac = Number(c.nac);
    if (c && c.khoaNac) cfg.khoaNac = true;
    phien = { batDau: Date.now(), soCau: cfg.soCau || 0, dung: 0, sai: 0, loi: [] };
    daKetThuc = false;
    dungThanh();
    taiTrangThai();
    if (!maHV() && !localStorage.getItem("game_da_hoi_ma")) {
      localStorage.setItem("game_da_hoi_ma", "1");
      setTimeout(hoiMa, 1200);
    }
    return cfg;
  }

  function ghi(cau) {
    if (!phien) batDau({});
    phien.soCau = Math.max(phien.soCau, phien.dung + phien.sai + 1);
    if (cau && cau.ok) phien.dung++;
    else {
      phien.sai++;
      const tu = (cau && (cau.tu || "")).trim();
      if (tu && !phien.loi.some((x) => x.tu === tu)) phien.loi.push({ tu, item: (cau && cau.item) || null });
    }
    return { dung: phien.dung, sai: phien.sai };
  }

  // ghi nhận một từ sai mà không tăng bộ đếm (dùng cho game ghép cặp / bắt thẻ)
  function loiTu(tu) {
    if (!phien) batDau({});
    const t = String(tu || "").trim();
    if (t && !phien.loi.some((x) => x.tu === t)) phien.loi.push({ tu: t, item: null });
  }

  function ketThuc(extra) {
    if (!phien || daKetThuc) return Promise.resolve(null);
    daKetThuc = true;
    const giay = Math.round((Date.now() - phien.batDau) / 1000);
    const soCau = extra && extra.soCau != null ? Number(extra.soCau) : phien.soCau;
    const soDung = extra && extra.soDung != null ? Number(extra.soDung) : phien.dung;
    const ht = soCau >= 5 && soDung / soCau >= 0.6;
    const hh = soCau >= 5 && soDung === soCau;
    const kq = {
      game: cfg.game, sach: cfg.sach, unit: cfg.unit, nac: Number(cfg.nac) || 1,
      so_cau: soCau, so_dung: soDung, giay,
      ti_le: soCau ? Math.round(100 * soDung / soCau) : 0,
      ht, hh, loi: phien.loi,
    };
    if (!maHV()) { hienKetQua(kq, null); return Promise.resolve(kq); }
    hienCho();
    return gui(kq).then((d) => { hienKetQua(kq, d); return kq; });
  }

  function gui(kq) {
    return rpc("game_ghi", {
      p_ma: maHV(), p_game: kq.game, p_sach: kq.sach, p_unit: kq.unit, p_nac: kq.nac,
      p_so_cau: kq.so_cau, p_so_dung: kq.so_dung, p_giay: kq.giay, p_loi: kq.loi || [],
    }).then((d) => {
      if (d && !d.loi) {
        diemHomNay = d.diem_hom_nay || 0;
        luu(LS_DIEM, diemHomNay);
        if (kq.ht && nacXong.indexOf(kq.nac) < 0) nacXong.push(kq.nac);
        if (kq.hh && nacHoanHao.indexOf(kq.nac) < 0) nacHoanHao.push(kq.nac);
        capNhatThanh();
      }
      return d;
    }).catch(() => null);
  }

  /* ---------- hộp kết quả ---------- */
  let hopCho;
  function hienCho() {
    const nen = el("div", "gcore-nen"); nen.id = "gcoreCho";
    const hop = el("div", "gcore-hop");
    hop.appendChild(el("h3", null, "Đang tính điểm…"));
    nen.appendChild(hop); document.body.appendChild(nen); hopCho = nen;
  }

  function hienKetQua(kq, d) {
    if (hopCho) { hopCho.remove(); hopCho = null; }
    const nen = el("div", "gcore-nen");
    const hop = el("div", "gcore-hop gcore-kq");
    const loi = d && d.loi;

    if (loi) {
      hop.appendChild(el("h3", null, "Chưa lưu được điểm"));
      hop.appendChild(el("p", null, "Mã này chưa có trong danh sách lớp. Con hỏi cô giáo mã đúng nhé — vẫn chơi được nhưng chưa cộng điểm."));
    } else if (!maHV()) {
      hop.appendChild(el("h3", null, "Chơi giỏi lắm!"));
      hop.appendChild(el("p", null, "Chưa nhập mã học viên nên lần này chưa cộng điểm."));
    } else if (kq.ht) {
      hop.appendChild(el("h3", null, "✅ Hoàn thành nấc " + kq.nac + "!"));
    } else {
      hop.appendChild(el("h3", null, "Cố thêm chút nữa!"));
    }

    hop.appendChild(el("p", "gcore-so", "Đúng " + kq.so_dung + "/" + kq.so_cau + " câu (" + kq.ti_le + "%) · " + kq.giay + " giây · nấc " + kq.nac + "/6"));

    if (d && !loi) {
      const bang = el("div", "gcore-bang");
      const dong = (nhan, gt) => { const r = el("div"); r.appendChild(el("span", null, nhan)); r.appendChild(el("b", null, gt)); bang.appendChild(r); };
      dong("Điểm nấc này", "+" + (d.diem_luot || 0));
      if (d.thuong_du_nac) dong("Thưởng đủ 6 nấc", "+" + d.thuong_du_nac);
      if (d.thuong_hoan_hao) dong("Thưởng hoàn hảo cả 6 nấc", "+" + d.thuong_hoan_hao);
      dong("Tổng lượt này", "+" + (d.diem_luot_tong || 0));
      dong("Hôm nay", (d.diem_hom_nay || 0) + "/16 điểm");
      hop.appendChild(bang);
      if ((d.con_lai_hom_nay || 0) === 0) {
        hop.appendChild(el("p", "gcore-nhac", "Hôm nay con đã đạt 16 điểm — chơi thêm vẫn vui nhưng không cộng điểm nữa. Mai chơi tiếp nhé!"));
      } else {
        hop.appendChild(el("p", "gcore-goiy", "Còn " + d.con_lai_hom_nay + " điểm cho hôm nay."));
      }
      if ((d.nac_da_xong || 0) >= 6) hop.appendChild(el("p", "gcore-goiy", "Con đã xong cả 6 nấc của phần này 🎉"));
    } else if (maHV()) {
      hop.appendChild(el("p", "gcore-goiy", "Ước tính +" + (kq.ht ? 1 : 0) + " điểm — sẽ cộng khi có mạng."));
    }

    if (kq.ht) { try { phaoHoa(kq.hh ? 7 : 3); } catch (e) {} }

    if (kq.loi.length) {
      const ds = el("div", "gcore-loi");
      ds.appendChild(el("strong", null, "Từ cần ôn lại: "));
      ds.appendChild(el("span", null, kq.loi.slice(0, 12).map((x) => x.tu).join(" · ")));
      hop.appendChild(ds);
    }

    hop.appendChild(el("p", "gcore-luat", "🎯 " + QUY_TAC));

    const hang = el("div", "gcore-hang");
    const nut = el("button", "gcore-nut", "Chơi tiếp");
    nut.onclick = () => nen.remove();
    hang.appendChild(nut); hop.appendChild(hang);
    nen.appendChild(hop); document.body.appendChild(nen);
  }

  /* ---------- ảnh ---------- */
  let man = null, manDangTai = false;
  function taiManifest() {
    if (man || manDangTai) return;
    manDangTai = true;
    const p = location.pathname.indexOf("/games/") >= 0 ? "../pic/manifest.json" : "pic/manifest.json";
    fetch(p).then((r) => (r.ok ? r.json() : null)).then((d) => { man = d; if (d) doiAnhCu(); }).catch(() => {});
  }
  function anh(tu) {
    const goc = String(tu || "").toLowerCase();
    const nen = location.pathname.indexOf("/games/") >= 0 ? "../" : "";
    taiManifest();
    return nen + ((man && man[goc] && man[goc].anh) ? "pic/" + man[goc].anh : "pic/" + goc + ".jpg");
  }
  function doiAnhCu() {
    document.querySelectorAll('img[src*="/pic/"]').forEach((im) => {
      if (/\.(jpg|jpeg|png)$/i.test(im.src)) {
        const ten = decodeURIComponent(im.src.split("/pic/")[1] || "").replace(/\.[a-z]+$/i, "").toLowerCase();
        if (man[ten] && man[ten].anh) im.src = (location.pathname.indexOf("/games/") >= 0 ? "../" : "") + "pic/" + man[ten].anh;
      }
    });
  }


  /* ---------- phát âm: audio thật trước, giọng máy sau ---------- */
  const AM = { cache: null };
  function napAm() { try { AM.cache = JSON.parse(localStorage.getItem("game_am") || "{}"); } catch (e) { AM.cache = {}; } }
  function luuAm(k, v) { if (!AM.cache) napAm(); AM.cache[k] = v;
    try { localStorage.setItem("game_am", JSON.stringify(AM.cache)); } catch (e) {} }

  function noiMay(tu) {
    const s = window.speechSynthesis; if (!s) return false;
    try {
      const u = new SpeechSynthesisUtterance(tu);
      u.lang = "en-US"; u.rate = 0.85;
      const ds = (s.getVoices ? s.getVoices() : []).filter((v) => /^en/i.test(v.lang));
      if (ds.length) u.voice = ds.find((v) => /google|natural|samantha|zira|aria/i.test(v.name)) || ds[0];
      s.cancel();
      setTimeout(() => { try { s.resume && s.resume(); } catch (e) {} try { s.speak(u); } catch (e) {} }, 90);
      return true;
    } catch (e) { return false; }
  }

  /* Trả về Promise<boolean>. Ưu tiên mp3 có sẵn (nghe như người thật), hỏng thì dùng giọng máy. */
  function noi(tu) {
    const t = String(tu || "").trim();
    if (!t) return Promise.resolve(false);
    if (!AM.cache) napAm();
    const k = t.toLowerCase();
    return new Promise((resolve) => {
      const dungMay = () => resolve(noiMay(t));
      if (AM.cache[k] === "no") return dungMay();
      if (!/^[a-z][a-z'\- ]*$/i.test(t) || t.length > 32) return dungMay();
      const url = "https://ssl.gstatic.com/dictionary/static/sounds/20200429/" + encodeURIComponent(k) + "--_us_1.mp3";
      let xongRoi = false, a;
      try { a = new Audio(url); a.preload = "auto"; } catch (e) { return dungMay(); }
      const hong = () => { if (xongRoi) return; xongRoi = true; luuAm(k, "no"); dungMay(); };
      a.addEventListener("error", hong);
      a.addEventListener("playing", () => { if (xongRoi) return; xongRoi = true; luuAm(k, "ok"); resolve(true); });
      setTimeout(() => { if (!xongRoi) { try { a.pause(); } catch (e) {} hong(); } }, 2200);
      try { const pr = a.play(); if (pr && pr.catch) pr.catch(hong); } catch (e) { hong(); }
    });
  }

  /* ---------- pháo hoa (tự vẽ, không phụ thuộc mạng) ---------- */
  function phaoHoa(soQua) {
    const n = Math.max(1, Number(soQua) || 5);
    let cv = document.getElementById("phaohoa");
    if (!cv) {
      cv = document.createElement("canvas");
      cv.id = "phaohoa";
      cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:100000";
      document.body.appendChild(cv);
    }
    const ctx = cv.getContext("2d");
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    const hat = [], mau = ["#ffd166", "#ff6b6b", "#4ecdc4", "#a78bfa", "#34d399", "#f472b6", "#60a5fa"];
    let daNo = 0;
    const no = (x, y) => {
      const c = mau[(Math.random() * mau.length) | 0], k = 36 + ((Math.random() * 24) | 0);
      for (let i = 0; i < k; i++) {
        const g = (Math.PI * 2 * i) / k, v = 1.7 + Math.random() * 3.6;
        hat.push({ x, y, vx: Math.cos(g) * v, vy: Math.sin(g) * v, life: 1, c });
      }
    };
    const dan = setInterval(() => {
      no(cv.width * (0.18 + Math.random() * 0.64), cv.height * (0.12 + Math.random() * 0.36));
      daNo++;
      if (daNo >= n) clearInterval(dan);
    }, 340);
    const ve = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (let i = hat.length - 1; i >= 0; i--) {
        const p = hat[i];
        p.vy += 0.035; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.life -= 0.011;
        if (p.life <= 0) { hat.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (hat.length || daNo < n) requestAnimationFrame(ve);
      else { try { cv.remove(); } catch (e) {} }
    };
    requestAnimationFrame(ve);
  }

  /* ---------- tự chạy ---------- */
  const khoi = () => { dungThanh(); taiManifest(); taiTrangThai(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", khoi);
  else khoi();

  return { batDau, ghi, loiTu, ketThuc, maHV, datMaHV, hoiMa, anh, noi, phaoHoa, cfg: () => cfg, phien: () => phien, quyTac: QUY_TAC };
})();
