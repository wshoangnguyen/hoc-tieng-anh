// lop-sync.js — cầu nối "chế độ lớp" cho game trong sảnh.
// Chỉ hoạt động khi URL có ?lop=1&phong=...&sid=...
// Học sinh vẫn dùng đúng giao diện game; script chỉ đồng bộ câu hỏi và gửi kết quả.
(function () {
  var q = new URLSearchParams(location.search);
  if (q.get("lop") !== "1") return;
  var PHONG = q.get("phong"), SID = q.get("sid");
  var API = (q.get("api") || "https://vm-4-13-ubuntu.tailcfa324.ts.net/lop").replace(/\/$/, "");
  if (!PHONG || !SID) return;

  var LOP = window.__LOP;
  if (!LOP || !LOP.s) { console.warn("lop-sync: game chưa mở hook __LOP"); return; }

  var state = LOP.s, t0 = 0, daGui = false, chiSo = -1;

  function api(path, body) {
    return fetch(API + path, body ? {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    } : undefined).then(function (r) { return r.json(); });
  }

  function nap(d) {
    if (!d || !d.cau || !d.cau.length) return;
    // dựng "bộ" đúng định dạng game đang dùng
    state.bo = {
      sach: d.sach, unit: d.unit,
      cau: d.cau.map(function (c) { return c.lua_chon && c.lua_chon.cot ? c.lua_chon : c; })
    };
    state.i = Math.max(0, d.cau_hien | 0);
    chiSo = state.i;
    state.cau = state.bo.cau[state.i];
    t0 = Date.now(); daGui = !!d.da_gui;
    try { LOP.ve(); } catch (e) {}
    var mc = document.getElementById("manChon"); if (mc) mc.classList.add("an");
    // đóng hộp thoại "Mã học viên" nếu có (nút Để sau)
    var nut = Array.prototype.slice.call(document.querySelectorAll("button")).filter(function (b) {
      return (b.textContent || "").trim() === "Để sau";
    })[0];
    if (nut) nut.click();
  }

  function dongBo() {
    api("/api/game?ma=" + encodeURIComponent(PHONG) + "&sid=" + encodeURIComponent(SID))
      .then(function (d) {
        if (!d || !d.cau) return;
        if (state.bo && d.cau_hien === chiSo) return;
        nap(d);
      }).catch(function () {});
  }

  function guiKetQua() {
    if (daGui) return;
    var c = state.cau; if (!c) return;
    var chon = (state.chon || []).filter(function (x) { return x !== null; });
    if (chon.length !== (c.cot || []).length) return;
    var cau = chon.map(function (o) { return o.t; }).join(" ");
    if (c.chu) cau = c.chu + " " + cau;
    daGui = true;
    api("/api/tra-loi", {
      ma: PHONG, sid: SID, chon: cau,
      giay: t0 ? Math.round((Date.now() - t0) / 100) / 10 : null
    });
  }

  // bắt lúc học sinh bấm "Kiểm tra"
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#btnKiem");
    if (b) setTimeout(guiKetQua, 80);
  }, true);

  function donDep() {
    var nut = Array.prototype.slice.call(document.querySelectorAll("button")).filter(function (b) {
      return (b.textContent || "").trim() === "Để sau" && b.offsetParent !== null;
    })[0];
    if (nut) nut.click();
    if (state.bo) { var mc = document.getElementById("manChon"); if (mc) mc.classList.add("an"); }
  }

  // đồng bộ khi giáo viên chuyển câu / mở hoạt động khác
  setInterval(donDep, 700);
  setInterval(dongBo, 1200);
  dongBo();
})();
