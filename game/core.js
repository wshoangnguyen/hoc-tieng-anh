/* GAME CORE — dùng chung cho mọi game trong /game
 * Việc của nó: biết ai đang chơi · đếm câu đúng/sai · tính điểm cộng · ghi lỗi để ôn sau · gợi ý nấc.
 * Cách dùng (3 dòng):
 *    GAME.batDau({game:"quiz", sach:"SM3", unit:5, nac:2, soCau:10});
 *    GAME.ghi({tu:"apple", ok:true});          // mỗi câu một lần
 *    GAME.ketThuc();                            // hiện kết quả + gửi máy chủ
 */
window.GAME = (function () {
  const API = "https://xtfusgawjlrcreiphwur.supabase.co";
  const KEY = "sb_publishable_3MiuAFrEEH_ZBEAg7fqTvw_CLC0OxK3"; // khoá công khai, giống web quản lý
  const LS_MA = "game_ma_hs", LS_CHO = "game_cho_gui", LS_NAC = "game_nac";

  let cfg = { game: "?", sach: null, unit: null, nac: 1, soCau: 0 };
  let phien = null, daKetThuc = false;

  /* ---------- tiện ích ---------- */
  const el = (t, c, s) => { const d = document.createElement(t); if (c) d.className = c; if (s != null) d.textContent = s; return d; };
  const doc = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const luu = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  function maHS() { return localStorage.getItem(LS_MA) || ""; }
  function datMaHS(m) { m ? localStorage.setItem(LS_MA, m.trim().toUpperCase()) : localStorage.removeItem(LS_MA); capNhatThanh(); }
  function nacNho() { return Number(localStorage.getItem(LS_NAC) || 0) || null; }

  /* ---------- thanh nhỏ góc trên ---------- */
  let thanh, nhanMa, nhanDiem;
  function dungThanh() {
    if (thanh || !document.body) return;
    thanh = el("div", "gcore-thanh");
    nhanMa = el("button", "gcore-ma");
    nhanMa.onclick = hoiMa;
    nhanDiem = el("span", "gcore-diem", "");
    thanh.appendChild(nhanMa); thanh.appendChild(nhanDiem);
    document.body.appendChild(thanh);
    capNhatThanh();
  }
  function capNhatThanh() {
    if (!nhanMa) return;
    const m = maHS();
    nhanMa.textContent = m ? "👤 " + m : "👤 Chưa có mã — bấm để nhập";
    nhanMa.classList.toggle("thieu", !m);
    const t = doc("game_diem_tong");
    nhanDiem.textContent = t != null ? "⭐ " + t + " điểm" : "";
  }

  function hopThoai(tieuDe, noiDung, nutPhu) {
    const nen = el("div", "gcore-nen");
    const hop = el("div", "gcore-hop");
    hop.appendChild(el("h3", null, tieuDe));
    if (noiDung) hop.appendChild(el("p", null, noiDung));
    const o = el("input", "gcore-o");
    o.placeholder = "Ví dụ: MINH3A"; o.maxLength = 12; o.value = maHS();
    hop.appendChild(o);
    const hang = el("div", "gcore-hang");
    const ok = el("button", "gcore-nut", "Lưu");
    const bo = el("button", "gcore-nut phu", nutPhu || "Chơi không lưu điểm");
    hang.appendChild(ok); hang.appendChild(bo); hop.appendChild(hang);
    nen.appendChild(hop); document.body.appendChild(nen);
    setTimeout(() => o.focus(), 50);
    const dong = () => nen.remove();
    ok.onclick = () => { const v = o.value.trim(); if (v.length < 3) { o.focus(); return; } datMaHS(v); dong(); };
    bo.onclick = () => { datMaHS(""); dong(); };
    o.addEventListener("keydown", (e) => { if (e.key === "Enter") ok.click(); });
  }
  function hoiMa() {
    hopThoai("Mã học sinh", "Cô giáo phát cho mỗi bạn một mã riêng (ví dụ MINH3A). Nhập mã để điểm và lỗi sai được lưu lại.", "Để sau");
  }

  /* ---------- vòng chơi ---------- */
  function batDau(c) {
    cfg = Object.assign(cfg, c || {});
    phien = { batDau: Date.now(), soCau: cfg.soCau || 0, dung: 0, sai: 0, loi: [] };
    daKetThuc = false;
    dungThanh();
    if (!maHS() && !localStorage.getItem("game_da_hoi_ma")) {
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
      if (tu && !phien.loi.some((x) => x.tu === tu)) {
        phien.loi.push({ tu, item: (cau && cau.item) || null, cau_hoi: (cau && cau.cau_hoi) || null });
      }
    }
    return { dung: phien.dung, sai: phien.sai };
  }

  function tinhDiem() {
    const { soCau, dung } = phien;
    if (soCau < 5) return 0;                     // chơi dở dang: chưa tính
    if (dung === soCau) return 2;                // hoàn hảo
    if (dung / soCau >= 0.6) return 1;           // hoàn thành
    return 0;
  }

  function goiYNac(diem, nac) {
    const tl = phien.soCau ? phien.dung / phien.soCau : 0;
    const n = Number(nac || cfg.nac || 1);
    if (tl >= 0.8 && n < 6) return n + 1;
    if (tl < 0.5 && n > 1) return n - 1;
    return n;
  }

  function ketThuc(extra) {
    if (!phien || daKetThuc) return Promise.resolve(null);
    daKetThuc = true;
    const giay = Math.round((Date.now() - phien.batDau) / 1000);
    const diem = tinhDiem();
    const nacSau = goiYNac(diem, cfg.nac);
    const kq = {
      game: cfg.game, sach: cfg.sach, unit: cfg.unit, nac: cfg.nac || 1,
      so_cau: phien.soCau, so_dung: phien.dung, giay, diem, nac_goi_y: nacSau,
      ti_le: phien.soCau ? Math.round(100 * phien.dung / phien.soCau) : 0,
      loi: phien.loi,
    };
    hienKetQua(kq);
    gui(kq, extra);
    return Promise.resolve(kq);
  }

  function hienKetQua(kq) {
    const nen = el("div", "gcore-nen");
    const hop = el("div", "gcore-hop gcore-kq");
    hop.appendChild(el("h3", null, kq.diem === 2 ? "🏆 Hoàn hảo! +2 điểm" : kq.diem === 1 ? "✅ Hoàn thành! +1 điểm" : "Cố thêm chút nữa!"));
    hop.appendChild(el("p", "gcore-so", `Đúng ${kq.so_dung}/${kq.so_cau} câu (${kq.ti_le}%) · ${kq.giay} giây · nấc ${kq.nac}`));
    if (kq.loi.length) {
      const ds = el("div", "gcore-loi");
      ds.appendChild(el("strong", null, "Từ cần ôn lại:"));
      ds.appendChild(el("span", null, " " + kq.loi.slice(0, 12).map((x) => x.tu).join(" · ")));
      hop.appendChild(ds);
    }
    if (kq.nac_goi_y && kq.nac_goi_y !== kq.nac) {
      hop.appendChild(el("p", "gcore-goiy",
        kq.nac_goi_y > kq.nac ? `Lần sau thử nấc ${kq.nac_goi_y} — con làm tốt hơn mức này rồi.`
                              : `Lần sau chơi lại nấc ${kq.nac_goi_y} cho chắc nhé.`));
    }
    if (!maHS()) hop.appendChild(el("p", "gcore-nhac", "Chưa có mã học sinh nên lần này không lưu điểm."));
    const hang = el("div", "gcore-hang");
    const dong = el("button", "gcore-nut", "Chơi tiếp");
    dong.onclick = () => nen.remove();
    hang.appendChild(dong); hop.appendChild(hang);
    nen.appendChild(hop); document.body.appendChild(nen);
  }

  /* ---------- gửi máy chủ ---------- */
  function gui(kq, extra) {
    const payload = Object.assign({}, kq, extra || {});
    const hang = doc(LS_CHO) || [];
    hang.push(payload); luu(LS_CHO, hang.slice(-50));
    dongBo();
  }

  function dongBo() {
    const hang = doc(LS_CHO) || [];
    if (!hang.length) return;
    const ma = maHS();
    if (!ma) return;
    let i = 0;
    const guiTiep = () => {
      if (i >= hang.length) { luu(LS_CHO, []); return; }
      const kq = hang[i];
      fetch(API + "/rest/v1/rpc/game_ghi", {
        method: "POST",
        headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          p_ma: ma, p_game: kq.game, p_sach: kq.sach, p_unit: kq.unit, p_nac: kq.nac,
          p_so_cau: kq.so_cau, p_so_dung: kq.so_dung, p_giay: kq.giay, p_loi: kq.loi || [],
        }),
      }).then((r) => r.ok ? r.json() : Promise.reject(r.status))
        .then((d) => {
          i++;
          if (d && d.tong_diem != null) { luu("game_diem_tong", d.tong_diem); capNhatThanh(); }
          guiTiep();
        })
        .catch(() => { /* giữ trong hàng đợi, thử lại lần sau */ });
    };
    guiTiep();
  }

  /* ---------- ảnh ---------- */
  let man = null, manDangTai = false;
  function taiManifest() {
    if (man || manDangTai) return;
    manDangTai = true;
    const p = (location.pathname.indexOf("/games/") >= 0) ? "../pic/manifest.json" : "pic/manifest.json";
    fetch(p).then((r) => r.ok ? r.json() : null).then((d) => {
      man = d;
      if (d) doiAnhCu();
    }).catch(() => {});
  }
  function anh(tu) {
    const goc = String(tu || "").toLowerCase();
    const nen = location.pathname.indexOf("/games/") >= 0 ? "../" : "";
    taiManifest();
    return nen + ((man && man[goc] && man[goc].anh) ? "pic/" + man[goc].anh : "pic/" + goc + ".jpg");
  }

  // ảnh đang hiện bằng .jpg/.png → đổi sang .webp khi manifest về (nhẹ hơn ~80%)
  function doiAnhCu() {
    document.querySelectorAll('img[src*="/pic/"]').forEach((im) => {
      if (/\.(jpg|jpeg|png)$/i.test(im.src)) {
        const ten = decodeURIComponent(im.src.split("/pic/")[1] || "").replace(/\.[a-z]+$/i, "").toLowerCase();
        if (man[ten] && man[ten].anh) {
          const nen = im.src.indexOf("/games/") >= 0 ? "../" : "";
          im.src = nen + "pic/" + man[ten].anh;
        }
      }
    });
  }

  /* ---------- tự chạy ---------- */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { dungThanh(); dongBo(); taiManifest(); });
  else { dungThanh(); dongBo(); taiManifest(); }

  return { batDau, ghi, ketThuc, maHS, datMaHS, hoiMa, anh, cfg: () => cfg, phien: () => phien };
})();
