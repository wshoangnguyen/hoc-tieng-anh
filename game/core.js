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
  const QUY_TAC = "Mỗi level xong +1 điểm · đủ 6 level +5 điểm · cả 6 level hoàn hảo +5 điểm · tối đa 16 điểm/ngày";

  let cfg = { game: "?", sach: null, unit: null, nac: 1, soCau: 0 };
  let phien = null, daKetThuc = false;
  let sk = null; // HKG: sự kiện từng câu của phiên này
  let nacXong = [], nacHoanHao = [], diemHomNay = 0, dangTai = false;
  let TV = null, cheDoDau = false;

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
  let thanh, nutMa, chonNac, nhanDiem, chonSach, chonUnit, nutChe;
  function veChe(){
    if (!nutChe) return;
    nutChe.textContent = cheDoDau ? "👥 Thi đấu" : "👤 1 người";
    nutChe.classList.toggle("dau", !!cheDoDau);
    nutChe.title = cheDoDau ? "Đang ở chế độ thi đấu trên lớp — không cộng điểm" : "Chế độ một người — có tích điểm";
  }
  function dungThanh() {
    if (thanh || !document.body) return;
    thanh = el("div", "gcore-thanh");
    nutMa = el("button", "gcore-ma"); nutMa.onclick = hoiMa;
    chonSach = el("select", "gcore-chon"); chonSach.title = "Chọn sách";
    chonUnit = el("select", "gcore-chon"); chonUnit.title = "Chọn Unit";
    chonSach.onchange = () => { datBai(chonSach.value, null); };
    chonUnit.onchange = () => { datBai(chonSach.value, Number(chonUnit.value)); };
    chonNac = el("span", "gcore-nac"); chonNac.title = "Level của lượt chơi này (do trò chơi quy định)";
    nutChe = el("button", "gcore-che", "👤 1 người");
    nutChe.onclick = function(){
      cheDoDau = !cheDoDau;
      try { localStorage.setItem("game_thidau", cheDoDau ? "1" : "0"); } catch(e){}
      veChe();
    };
    nhanDiem = el("span", "gcore-diem", "");
    const nutSang = el("button", "gcore-sang", "🏠 Sảnh");
    nutSang.onclick = () => { location.href = location.pathname.indexOf("/games/") >= 0 ? "../sanh.html" : "sanh.html"; };
    thanh.appendChild(nutSang);
    thanh.appendChild(nutMa); thanh.appendChild(chonSach); thanh.appendChild(chonUnit);
    thanh.appendChild(nutChe); thanh.appendChild(chonNac); thanh.appendChild(nhanDiem);
    try { cheDoDau = localStorage.getItem("game_thidau") === "1"; } catch(e){}
    veChe();
    document.body.appendChild(thanh);
    capNhatThanh(); veChonBai();
  }

  function capNhatThanh() {
    if (!nutMa) return;
    const m = maHV();
    nutMa.textContent = m ? "👤 " + m : "👤 Nhập mã học viên";
    nutMa.classList.toggle("thieu", !m);
    chonNac.textContent = "Level " + (Number(cfg.nac) || 1) + "/6";
    const d = doc(LS_DIEM);
    nhanDiem.textContent = m ? "⭐ " + (diemHomNay || d || 0) + "/16 hôm nay" : "";
  }

  /* ---------- chọn Sách / Unit dùng chung cho mọi game ---------- */
  function napTV() {
    if (TV) return Promise.resolve(TV);
    const p = location.pathname.indexOf("/games/") >= 0 ? "../data/tu-vung.json" : "data/tu-vung.json";
    return fetch(p).then((r) => (r.ok ? r.json() : null)).then((d) => { TV = d; return d; }).catch(() => null);
  }
  function baiDaLuu() { try { return JSON.parse(localStorage.getItem("game_bai") || "null"); } catch (e) { return null; } }
  function baiHienTai() {
    let b = baiDaLuu();
    if (!b || !b.sach) b = { sach: cfg.sach || "SM1", unit: cfg.unit == null ? 0 : cfg.unit };
    if (!TV || !TV.sach) return b;
    const s = TV.sach[b.sach] ? b.sach : Object.keys(TV.sach)[0];
    const us = (TV.sach[s] || {}).units || [];
    const u = us.some((x) => Number(x.u) === Number(b.unit)) ? Number(b.unit) : (us[0] ? Number(us[0].u) : 0);
    return { sach: s, unit: u };
  }
  function datBai(sach, unit) {
    const b = baiHienTai();
    const s = sach || b.sach;
    let u = unit;
    if (u == null) {
      const us = (TV && TV.sach && TV.sach[s] && TV.sach[s].units) || [];
      u = us.length ? Number(us[0].u) : 0;
    }
    try { localStorage.setItem("game_bai", JSON.stringify({ sach: s, unit: Number(u) || 0 })); } catch (e) {}
    location.reload();
  }
  function bai() {
    const b = baiHienTai();
    if (!TV || !TV.sach) return null;
    const s = TV.sach[b.sach] || {};
    const u = (s.units || []).find((x) => Number(x.u) === Number(b.unit)) || null;
    return { sach: b.sach, unit: b.unit, ten: u ? u.ten : "", tu: (u && u.tu) || [], khuon: (u && u.khuon) || [] };
  }
  function veChonBai() {
    napTV().then(() => {
      if (!TV || !chonSach) return;
      const b = baiHienTai();
      chonSach.innerHTML = Object.keys(TV.sach).map((k) => `<option value="${k}">${k}</option>`).join("");
      chonSach.value = b.sach;
      const us = (TV.sach[b.sach] || {}).units || [];
      chonUnit.innerHTML = us.map((x) => `<option value="${x.u}">U${x.u}${x.ten ? " · " + String(x.ten).slice(0, 16) : ""}</option>`).join("");
      chonUnit.value = String(b.unit);
    });
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
    sk = taoSK();
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
    ghiSK(cau);
    if (window.Buddy) { if (cau && cau.ok) Buddy.dung(); else Buddy.sai(); }
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
    // Nhiệm vụ ngày: lượt này nhận level kế tiếp còn thiếu (trừ trò đã cố định level)
    if (!cfg.khoaNac && maHV() && !cheDoDau) {
      return rpc("game_level_tiep", { p_ma: maHV() })
        .then((n) => { if (n != null && !isNaN(Number(n))) cfg.nac = Number(n); return chayKetThuc(extra); })
        .catch(() => chayKetThuc(extra));
    }
    return Promise.resolve(chayKetThuc(extra));
  }

  function chayKetThuc(extra) {
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
    if (cheDoDau) { hienKetQua(kq, { thidau: true }); return Promise.resolve(kq); }
    if (!maHV()) { hienKetQua(kq, null); return Promise.resolve(kq); }
    hienCho();
    return gui(kq).then((d) => { hienKetQua(kq, d); return kq; });
  }

  function gui(kq) {
    guiSK(kq);
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

  /* ---------- HKG-BAT-DAU: hạt giống kiến thức ---------- */
  function uuid() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
      const r = (Math.random() * 16) | 0, v = ch === "x" ? r : (r & 3) | 8;
      return v.toString(16);
    });
  }
  function taoSK() {
    const t = Date.now();
    return { phien: uuid(), items: [], lan: {}, bat: t, t: t };
  }
  /* một câu = một sự kiện; lan = đây là lần thử thứ mấy của cùng một từ */
  function ghiSK(cau) {
    if (!sk) sk = taoSK();
    const item = String((cau && (cau.item || cau.tu)) || "").trim();
    if (!item) return;
    const k = item.toLowerCase();
    sk.lan[k] = (sk.lan[k] || 0) + 1;
    const t = Date.now();
    sk.items.push({
      loai: "cau", item: item, ok: !!(cau && cau.ok), lan: sk.lan[k],
      tu_noi: Math.max(0, Number((cau && cau.tu_noi) || 0)),
      giay: Math.max(0, Math.round((t - (sk.t || t)) / 1000)),
    });
    sk.t = t;
    if (sk.items.length > 300) sk.items.length = 300;
  }
  /* gửi 1 lần / phiên — mạng yếu vẫn chạy; lỗi thì im lặng, không ảnh hưởng điểm */
  function guiSK(kq) {
    const ma = maHV();
    if (!ma || !sk || !sk.items.length) return;
    const giay = Math.round((Date.now() - sk.bat) / 1000);
    const than = {
      p_ma: ma, p_phien: sk.phien,
      p_game: (kq && kq.game) || cfg.game,
      p_sach: (kq && kq.sach) || cfg.sach,
      p_unit: (kq && kq.unit) || cfg.unit,
      p_nac: (kq && kq.nac) || cfg.nac || 1,
      p_giay: giay, p_items: sk.items,
    };
    rpc("game_su_kien_ghi", than)
      .then((d) => { if (d && d.ok) luu("hkg_lan_cuoi", { re_cm: d.re_cm, khen: d.khen, luc: Date.now() }); })
      .catch(() => {});
  }
  /* tiến trình cho cửa sổ "Hạt giống kiến thức" */
  function tienDo(ma) {
    return rpc("tien_do_hoc_sinh", { p_ma: ma || maHV(), p_ngay: 30 });
  }
  /* ---------- HKG-KET-THUC ---------- */
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
      hop.appendChild(el("p", null, "Mã này chưa có trong danh sách lớp. Bạn hỏi cô giáo mã đúng nhé — vẫn chơi được nhưng chưa cộng điểm."));
    } else if (!maHV()) {
      hop.appendChild(el("h3", null, "Chơi giỏi lắm!"));
      hop.appendChild(el("p", null, "Chưa nhập mã học viên nên lần này chưa cộng điểm."));
    } else if (d && Number(d.diem_luot_tong) > 0) {
      hop.appendChild(el("h3", null, "🎉 Chúc mừng! +" + d.diem_luot_tong + " điểm"));
    } else if (kq.ht) {
      hop.appendChild(el("h3", null, "✅ Hoàn thành level " + kq.nac + "!"));
    } else {
      hop.appendChild(el("h3", null, "Cố thêm chút nữa!"));
    }

    hop.appendChild(el("p", "gcore-so", "Đúng " + kq.so_dung + "/" + kq.so_cau + " câu (" + kq.ti_le + "%) · " + kq.giay + " giây · Level " + kq.nac + "/6"));

    if (d && !loi) {
      const bang = el("div", "gcore-bang");
      const dong = (nhan, gt) => { const r = el("div"); r.appendChild(el("span", null, nhan)); r.appendChild(el("b", null, gt)); bang.appendChild(r); };
      dong("Điểm level này", "+" + (d.diem_luot || 0));
      if (d.thuong_du_nac) dong("Thưởng đủ 6 level", "+" + d.thuong_du_nac);
      if (d.thuong_hoan_hao) dong("Thưởng hoàn hảo cả 6 level", "+" + d.thuong_hoan_hao);
      dong("Tổng lượt này", "+" + (d.diem_luot_tong || 0));
      dong("Hôm nay", (d.diem_hom_nay || 0) + "/16 điểm");
      hop.appendChild(bang);
      if (d.khong_tinh_diem) {
        hop.appendChild(el("p", "gcore-nhac", "Lượt này không tính điểm vì khác bài đang học" +
          (d.bai_dang_hoc ? " (" + d.bai_dang_hoc + ")" : "") + ". Chơi đúng bài đang học mới cộng điểm nhé."));
      }
      if ((d.con_lai_hom_nay || 0) === 0) {
        hop.appendChild(el("p", "gcore-nhac", "Hôm nay bạn đã đạt 16 điểm — chơi thêm vẫn vui nhưng không cộng điểm nữa. Mai chơi tiếp nhé!"));
      } else {
        hop.appendChild(el("p", "gcore-goiy", "Còn " + d.con_lai_hom_nay + " điểm cho hôm nay."));
      }
      if ((d.nac_da_xong || 0) >= 6) hop.appendChild(el("p", "gcore-goiy", "Bạn đã xong cả 6 level của phần này 🎉"));
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

    if (d && d.thidau) hop.appendChild(el("p", "gcore-goiy", "Chế độ thi đấu trên lớp — lượt này không cộng điểm. Muốn tích điểm, bạn chơi lại ở chế độ một người nhé."));

    hop.appendChild(el("p", "gcore-luat", "🎯 " + QUY_TAC));

    const hang = el("div", "gcore-hang");
    const ve = el("button", "gcore-nut" + (d && Number(d.diem_luot_tong) > 0 ? " ve" : " ve2"), "🏠 Về sảnh game");
    ve.onclick = () => { location.href = location.pathname.indexOf("/games/") >= 0 ? "../sanh.html" : "sanh.html"; };
    hang.appendChild(ve);
    if (d && Number(d.diem_luot_tong) > 0) { try { voTay(); } catch (e) {} }
    const nut = el("button", "gcore-nut" + (d && Number(d.diem_luot_tong) > 0 ? " phu" : ""), "Chơi tiếp");
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
    if (window.NOI && NOI.tu) return NOI.tu(t);   // bộ phát âm chung (audio tự lưu + Google TTS)
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

  /* ---------- vỗ tay: tiếng ồn ngắn lặp lại, không cần file âm thanh ---------- */
  function voTay() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ac = new AC();
    const dai = 1.6, sr = ac.sampleRate, n = Math.floor(sr * dai);
    const buf = ac.createBuffer(1, n, sr), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      let v = (Math.random() * 2 - 1) * Math.exp(-((t % 0.11) * 26));
      v *= 0.55 + 0.45 * Math.sin(t * 34);
      d[i] = v * 0.5;
    }
    const src = ac.createBufferSource(); src.buffer = buf;
    const loc = ac.createBiquadFilter(); loc.type = "bandpass"; loc.frequency.value = 1800; loc.Q.value = 0.8;
    const gain = ac.createGain(); gain.gain.value = 0.35;
    src.connect(loc); loc.connect(gain); gain.connect(ac.destination);
    src.start();
    src.onended = () => { try { ac.close(); } catch (e) {} };
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

  function doiKhang(v) { cheDoDau = !!v; }
  function sanSang() { return napTV().then(() => bai()); }
  return { batDau, ghi, loiTu, ketThuc, maHV, datMaHV, hoiMa, anh, noi, phaoHoa, tienDo, bai, sanSang, datBai, doiKhang, cheDo: () => cheDoDau, suKien: () => sk, cfg: () => cfg, phien: () => phien, quyTac: QUY_TAC };
})();

/* tự nạp buddy.js (bong bóng khen/khích lệ) — mọi trang có core.js đều có Buddy */
(function () {
  try {
    var s = document.currentScript || document.querySelector('script[src$="core.js"]');
    var b = document.createElement("script");
    b.src = s && s.src ? s.src.replace(/core[.]js(\?.*)?$/, "buddy.js") : "buddy.js";
    b.async = true;
    document.head.appendChild(b);
  } catch (e) {}
})();
