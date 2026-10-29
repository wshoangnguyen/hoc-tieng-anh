/* HO-SO.JS — chọn sách / unit + biết học sinh đang học tới đâu.
 * Dùng chung cho các game nấc 5–6 (và sau này các game khác).
 *
 *   await HS.nap();
 *   HS.thanh(document.getElementById("hsBar"), { onChange: (sach, unit) => ... });
 *   const b = HS.bank();            // {tu:[...], cau:[...], khuon:[...], ten:"..."}
 *   HS.trangThaiHTML()              // dòng nhắc: đúng bài đang học / không cộng điểm
 */
window.HS = (function () {
  const API = "https://xtfusgawjlrcreiphwur.supabase.co";
  const KEY = "sb_publishable_3MiuAFrEEH_ZBEAg7fqTvw_CLC0OxK3";
  const TEN_SACH = { SM1: "Super Minds 1", SM2: "Super Minds 2", SM3: "Super Minds 3", SM4: "Super Minds 4",
                     SM5: "Super Minds 5", SM6: "Super Minds 6", A2: "Open World A2", B1: "Open World B1" };
  let data = null, hoSo = null, dangHoi = false;
  const $ = (s, r) => (r || document).querySelector(s);

  function rpc(ten, body) {
    return fetch(API + "/rest/v1/rpc/" + ten, {
      method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
  }

  async function nap() {
    if (data) return data;
    const r = await fetch("data/units.json", { cache: "force-cache" });
    data = (await r.json()).sach || {};
    return data;
  }

  function sachCo() {
    return Object.keys(data || {}).filter((s) => Object.keys(data[s]).length);
  }

  function units(sach) {
    const ds = Object.values((data || {})[sach] || {});
    return ds.map((u) => u.unit).sort((a, b) => a - b);
  }

  function bank(sach, unit) {
    return ((data || {})[sach] || {})[String(unit)] || null;
  }

  function maHV() {
    return (localStorage.getItem("game_ma_hv") || "").trim().toUpperCase();
  }

  async function layHoSo(ma) {
    if (!ma || ma.length < 3) return null;
    if (dangHoi && hoSo && hoSo.ma === ma) return hoSo;
    dangHoi = true;
    try {
      const d = await rpc("game_ho_so", { p_ma: ma });
      hoSo = d && d.ok ? { ma: ma, sach: d.sach, unit: d.unit, ten: d.ten || "" } : null;
    } catch (e) {
      hoSo = null;
    }
    dangHoi = false;
    return hoSo;
  }

  function luuChon(sach, unit) {
    localStorage.setItem("game_sach", sach || "");
    localStorage.setItem("game_unit", unit == null ? "" : String(unit));
  }

  function chonTruoc() {
    const s = localStorage.getItem("game_sach") || "";
    const u = localStorage.getItem("game_unit") || "";
    return { sach: s, unit: u === "" ? null : Number(u) };
  }

  /* thanh chọn: sách · unit · mã học viên · dòng trạng thái */
  function thanh(hop, opt) {
    opt = opt || {};
    const sachDS = sachCo();
    if (!sachDS.length) { hop.innerHTML = '<span style="color:#b91c1c">Chưa nạp được dữ liệu sách.</span>'; return; }
    const chon = chonTruoc();
    let sach = sachDS.indexOf(chon.sach) >= 0 ? chon.sach : (sachDS.indexOf("SM3") >= 0 ? "SM3" : sachDS[0]);
    let unit = chon.unit != null && units(sach).indexOf(chon.unit) >= 0 ? chon.unit : units(sach)[0];

    hop.innerHTML = `
      <div class="hs-hang">
        <label>Sách
          <select id="hsSach">${sachDS.map((s) => `<option value="${s}" ${s === sach ? "selected" : ""}>${TEN_SACH[s] || s}</option>`).join("")}</select>
        </label>
        <label>Unit
          <select id="hsUnit">${units(sach).map((u) => `<option value="${u}" ${u === unit ? "selected" : ""}>Unit ${u}${bank(sach, u) && bank(sach, u).ten ? " — " + bank(sach, u).ten : ""}</option>`).join("")}</select>
        </label>
        <label>Mã học viên
          <input id="hsMa" value="${maHV()}" placeholder="VD: HV11" autocomplete="off" spellcheck="false">
        </label>
      </div>
      <div class="hs-nhac" id="hsNhac"></div>`;

    const selS = $("#hsSach", hop), selU = $("#hsUnit", hop), oMa = $("#hsMa", hop), nhac = $("#hsNhac", hop);

    function veNhac() {
      const hs = hoSo;
      if (!hs) {
        nhac.className = "hs-nhac";
        nhac.innerHTML = "Chọn <b>đúng Unit con vừa học</b> để được cộng điểm.";
        return;
      }
      const dung = hs.sach === sach && Number(hs.unit) === Number(unit);
      nhac.className = "hs-nhac " + (dung ? "dung" : "sai");
      nhac.innerHTML = dung
        ? `✅ Đúng bài đang học: <b>${TEN_SACH[hs.sach] || hs.sach} · Unit ${hs.unit}</b> — hoàn thành là có điểm.`
        : `⚠️ Bạn đang học <b>${TEN_SACH[hs.sach] || hs.sach} · Unit ${hs.unit}</b>. Chơi unit khác vẫn vui nhưng <b>không cộng điểm</b>.`;
    }

    function doiSach() {
      sach = selS.value;
      const us = units(sach);
      unit = us[0];
      selU.innerHTML = us.map((u) => `<option value="${u}" ${u === unit ? "selected" : ""}>Unit ${u}${bank(sach, u) && bank(sach, u).ten ? " — " + bank(sach, u).ten : ""}</option>`).join("");
      luuChon(sach, unit); veNhac();
      if (opt.onChange) opt.onChange(sach, unit);
    }
    function doiUnit() { unit = Number(selU.value); luuChon(sach, unit); veNhac(); if (opt.onChange) opt.onChange(sach, unit); }

    selS.onchange = doiSach;
    selU.onchange = doiUnit;
    oMa.oninput = async () => {
      const v = oMa.value.trim().toUpperCase();
      localStorage.setItem("game_ma_hv", v);
      localStorage.removeItem("game_da_hoi_ma");
      const hs = await layHoSo(v);
      if (hs) {
        if (hs.sach && units(hs.sach).length) {
          selS.value = hs.sach; sach = hs.sach;
          selU.innerHTML = units(sach).map((u) => `<option value="${u}">Unit ${u}${bank(sach, u) && bank(sach, u).ten ? " — " + bank(sach, u).ten : ""}</option>`).join("");
          const u = units(sach).indexOf(Number(hs.unit)) >= 0 ? Number(hs.unit) : units(sach)[0];
          selU.value = String(u); unit = u;
          luuChon(sach, unit);
          if (opt.onChange) opt.onChange(sach, unit);
        }
      }
      veNhac();
    };

    luuChon(sach, unit);
    if (maHV()) layHoSo(maHV()).then(veNhac);
    veNhac();
    return { sach: () => sach, unit: () => unit, hoSo: () => hoSo, veLai: () => { veNhac(); } };
  }

  function khopBai() {
    if (!hoSo) return null;
    const { sach, unit } = chonTruoc();
    return hoSo.sach === sach && Number(hoSo.unit) === Number(unit);
  }

  return { nap, sachCo, units, bank, thanh, layHoSo, khopBai, chonTruoc, maHV, TEN_SACH,
           datMaHV: (m) => { localStorage.setItem("game_ma_hv", (m || "").trim().toUpperCase()); } };
})();
