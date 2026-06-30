// Scoreboard Frontend v2 - Render Backend
const API_URL = "https://scoreboard-api-vts9.onrender.com";
const PASSWORD = "***";

let loggedIn = false;
let data = { students: [] };

function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

async function api(path, opts) {
  opts = opts || {};
  opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
  var resp = await fetch(API_URL + path, opts);
  if (resp.status === 401) { loggedIn = false; updateNav(); throw new Error("Sai mật khẩu"); }
  if (!resp.ok) { var j = await resp.json().catch(function() { return { detail: resp.statusText }; }); throw new Error(j.detail || resp.statusText); }
  return resp.json();
}

async function loadData() {
  try { data = await api("/api/data"); } catch(e) { console.warn("Load:", e.message); }
}

async function login() {
  var pw = document.getElementById("pw").value;
  if (!pw) { toast("⚠️ Nhập mật khẩu!"); return; }
  try {
    await api("/api/auth", { method: "POST", body: JSON.stringify({ password: pw }) });
    loggedIn = true;
    document.getElementById("pw").value = "";
    updateNav();
    toast("✅ Đăng nhập thành công!");
  } catch(e) { toast("❌ Sai mật khẩu!"); }
}

function logout() { loggedIn = false; updateNav(); toast("👋 Đã đăng xuất"); }

function updateNav() {
  var el = document.getElementById("navBtns");
  var b = document.getElementById("statusBadge");
  if (loggedIn) {
    el.innerHTML = '<button class="btn btn-d" onclick="logout()">🔓 Đăng xuất</button><button class="btn btn-o" onclick="openAdd()">➕ Thêm HS</button><button class="btn btn-o" onclick="openLB()">🏆 Xếp hạng</button><button class="btn btn-o" onclick="saveToSheet()" title="Lưu data lên Google Sheets">💾 Save</button><button class="btn btn-o" onclick="loadFromSheet()" title="Tải data từ Google Sheets">📂 Load</button>';
    b.textContent = "✅ Đã đăng nhập"; b.className = "badge badge-on";
  } else {
    el.innerHTML = '<input type="password" class="inp" id="pw" placeholder="🔑 MK giáo viên" onkeydown="if(event.key===\'Enter\')login()"><button class="btn btn-p" onclick="login()">Đăng nhập</button><button class="btn btn-o" onclick="openAdd()">➕ Thêm HS</button><button class="btn btn-o" onclick="openLB()">🏆 Xếp hạng</button><button class="btn btn-o" onclick="saveToSheet()" title="Lưu data lên Google Sheets">💾 Save</button><button class="btn btn-o" onclick="loadFromSheet()" title="Tải data từ Google Sheets">📂 Load</button>';
    b.textContent = "🔒 Chưa đăng nhập"; b.className = "badge badge-off";
  }
  render();
}

// ---- Add Student (no auth needed, saved instantly) ----
async function addStudent() {
  var name = document.getElementById("newName").value.trim();
  if (!name) { toast("⚠️ Nhập tên!"); return; }
  var id = "s" + Date.now() + "_" + Math.random().toString(36).substr(2,5);
  try {
    var resp = await fetch(API_URL + "/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id, name: name }) });
    if (!resp.ok) throw new Error(await resp.text());
  } catch(e) { toast("Lưu thất bại: " + e.message); return; }
  data.students.push({ id: id, name: name, avatar: "", totalScore: 0, writing: [0,0,0,0,0], speaking: [0,0,0,0,0], lastActive: "", streak: 0 });
  closeAdd(); render();
  toast("✅ Đã thêm: " + name);
}

// ---- Delete (no auth, but with confirm) ----
function deleteStudent(sid) {
  if (!loggedIn) { toast("🔒 Đăng nhập trước!"); return; }
  var s = data.students.find(function(x) { return x.id === sid; });
  if (!s) return;
  if (!confirm('Xóa "' + s.name + '"? Không thể hoàn tác.')) return;
  api("/api/students/" + sid, { method: "DELETE" });
  data.students = data.students.filter(function(x) { return x.id !== sid; });
  render();
  toast("🗑 Đã xóa: " + s.name);
}

// ---- Score +/- (auth only) ----
async function adjScore(sid, delta) {
  if (!loggedIn) { toast("🔒 Đăng nhập trước!"); return; }
  var s = data.students.find(function(x) { return x.id === sid; });
  if (!s) return;
  s.totalScore = Math.max(0, s.totalScore + delta);
  try {
    var resp = await api("/api/score", { method: "POST", body: JSON.stringify({ studentId: sid, delta: delta }) });
    if (resp.streak !== undefined) s.streak = resp.streak;
    s.lastActive = new Date().toISOString().split("T")[0];
    render();
  } catch(e) { toast("Lỗi khi cập nhật điểm!"); }
}

// ---- Level +/- (auth only) ----
async function adjLevel(sid, skill, level, delta) {
  if (!loggedIn) { toast("🔒 Đăng nhập trước!"); return; }
  var s = data.students.find(function(x) { return x.id === sid; });
  if (!s) return;
  s[skill][level] = Math.max(0, s[skill][level] + delta);
  try {
    var resp = await api("/api/level", { method: "POST", body: JSON.stringify({ studentId: sid, skill: skill, level: level, delta: delta }) });
    if (resp.streak !== undefined) s.streak = resp.streak;
    s.lastActive = new Date().toISOString().split("T")[0];
    render();
    var sn = skill === "writing" ? "W" : "S";
    toast("✅ " + s.name + ": " + sn + " Lv." + (level+1) + " " + (delta > 0 ? "+" : "") + delta);
  } catch(e) { toast("Lỗi khi cập nhật level!"); }
}

// ---- Rename (click name, always saved) ----
function startEdit(sid) {
  var s = data.students.find(function(x) { return x.id === sid; });
  if (!s) return;
  var el = document.querySelector('[data-sid="' + sid + '"]');
  if (!el) return;
  el.innerHTML = '<input style="border:2px solid var(--accent);border-radius:8px;padding:2px 8px;font-size:15px;font-weight:700;width:140px;font-family:Quicksand,sans-serif" id="en_' + sid + '" value="' + esc(s.name) + '" onkeydown="if(event.key===\'Enter\')saveEdit(\'' + sid + '\')" onblur="saveEdit(\'' + sid + '\')">';
  setTimeout(function() { var inp = document.getElementById("en_" + sid); if (inp) { inp.focus(); inp.select(); } }, 50);
}

async function saveEdit(sid) {
  var inp = document.getElementById("en_" + sid);
  if (!inp) { render(); return; }
  var name = inp.value.trim();
  if (!name) { render(); return; }
  var s = data.students.find(function(x) { return x.id === sid; });
  if (!s) { render(); return; }
  s.name = name;
  try {
    await fetch(API_URL + "/api/rename", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: sid, name: name }) });
  } catch(e) {}
  render();
  toast("✅ Đổi tên: " + name);
}

// ---- Save/Load to Google Sheets (no auth needed) ----
async function saveToSheet() {
  try {
    var resp = await fetch(API_URL + "/api/save-to-sheet", { method: "POST" });
    if (!resp.ok) throw new Error(await resp.text());
    var j = await resp.json();
    toast("💾 Đã lưu " + j.count + " học sinh vào Google Sheets!");
  } catch(e) { toast("❌ Lưu thất bại: " + e.message); }
}

async function loadFromSheet() {
  try {
    var resp = await fetch(API_URL + "/api/load-from-sheet", { method: "POST" });
    if (!resp.ok) throw new Error(await resp.text());
    var j = await resp.json();
    data = j.data;
    render();
    toast("📂 Đã tải " + (data.students ? data.students.length : 0) + " học sinh từ Google Sheets!");
  } catch(e) { toast("❌ Tải thất bại: " + e.message); }
}

// ---- Avatar (no auth needed) ----
var AVATAR_PRESETS = [
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=cat",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=dog",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=rabbit",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=panda",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=lion",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=tiger",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=monkey",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=frog",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=giraffe",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=koala",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=fox",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=bear",
  "https://api.dicebear.com/9.x/bottts/svg?seed=dice",
  "https://api.dicebear.com/9.x/bottts/svg?seed=happy",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=girl",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=boy",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=star",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=rainbow",
  "https://api.dicebear.com/9.x/pixel-art/svg?seed=hero",
  "https://api.dicebear.com/9.x/pixel-art/svg?seed=ninja"
];

var currentAvSid = "";

function openAvatar(sid) {
  currentAvSid = sid;
  var s = data.students.find(function(x) { return x.id === sid; });
  if (!s) return;
  document.getElementById("avStudentName").textContent = s.name;
  var html = '<div class="av-opt' + (!s.avatar ? ' sel' : '') + '" onclick="setAvatar(\'' + sid + '\',\'\')" title="Mặc định">' + getAvatarSvg(s) + '</div>';
  for (var i = 0; i < AVATAR_PRESETS.length; i++) {
    var u = AVATAR_PRESETS[i];
    var sel = s.avatar === u ? ' sel' : '';
    html += '<img class="av-opt' + sel + '" src="' + u + '" onclick="setAvatar(\'' + sid + '\',\'' + u + '\')" title="Avatar ' + (i+1) + '">';
  }
  document.getElementById("avPicker").innerHTML = html;
  document.getElementById("avModal").classList.add("open");
}

function closeAv() { document.getElementById("avModal").classList.remove("open"); }

async function setAvatar(sid, url) {
  var s = data.students.find(function(x) { return x.id === sid; });
  if (!s) return;
  s.avatar = url;
  await fetch(API_URL + "/api/avatar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: sid, avatar: url }) }).catch(function(){});
  render();
  // update picker selection
  var sel = document.querySelector(".av-opt.sel"); if (sel) sel.classList.remove("sel");
  if (!url) document.querySelector(".av-opt").classList.add("sel");
  else { var imgs = document.querySelectorAll(".av-opt"); for (var i = 0; i < imgs.length; i++) { if (imgs[i].src === url) { imgs[i].classList.add("sel"); break; } } }
}

function getAvatarSvg(s) {
  var parts = s.name.trim().split(" ");
  var ini = parts[parts.length - 1].charAt(0).toUpperCase();
  var cols = ["#fcbe5d","#6C5CE7","#e17055","#00b894","#0984e3","#fdcb6e","#d63031","#74b9ff","#a29bfe","#fd79a8"];
  var c = cols[(s.name.length || 0) % cols.length];
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="' + c + '"/><text x="50" y="54" text-anchor="middle" font-size="34" font-weight="bold" fill="white" font-family="sans-serif">' + ini + '</text></svg>';
}

function getAvatar(s) {
  if (s.avatar) return s.avatar;
  return "data:image/svg+xml," + encodeURIComponent(getAvatarSvg(s));
}

function skillTotal(s, sk) { var a = s[sk], t = 0; for (var i = 0; i < a.length; i++) t += a[i] * (i + 1); return t; }
function getStreakClass(streak) { return (!streak || streak < 1) ? " dim" : ""; }

function renderSkill(s, skill, label) {
  var a = s[skill], t = skillTotal(s, skill), cells = "";
  for (var i = 0; i < a.length; i++) {
    var fc = a[i] > 0 ? " fill" : "";
    var onPlus = loggedIn ? ' onclick="adjLevel(\'' + s.id + '\',\'' + skill + '\',' + i + ',1)"' : '';
    cells += '<div class="lv l' + (i+1) + fc + '"' + onPlus + ' style="' + (loggedIn ? 'cursor:pointer' : '') + '">' + a[i] +
      (loggedIn ? '<button class="lv-minus" onclick="event.stopPropagation();adjLevel(\'' + s.id + '\',\'' + skill + '\',' + i + ',-1)">−</button>' : '') +
      '</div>';
  }
  return '<div class="sr"><div class="sl">' + label + '</div><div class="lc">' + cells + '</div><div class="st">' + t + '</div></div>';
}

function render() {
  if (!data || !data.students) return;
  var g = document.getElementById("grid");
  g.innerHTML = data.students.map(function(s) {
    var delBtn = '<button class="del" onclick="event.stopPropagation();deleteStudent(\'' + s.id + '\')">✕</button>';
    var streakBadge = (s.streak && s.streak > 0) ? '<span class="streak-badge' + getStreakClass(s.streak) + '">🔥 ' + s.streak + ' ngày</span>' : '';
    return '<div class="card">' + delBtn +
      '<div class="top-row">' +
        '<div class="av-wrap" onclick="openAvatar(\'' + s.id + '\')"><img class="av" src="' + getAvatar(s) + '" alt="' + s.name + '"><div class="av-edit">✎</div></div>' +
        '<div class="info">' +
          '<div class="name" data-sid="' + s.id + '" onclick="event.stopPropagation();startEdit(\'' + s.id + '\')">' + s.name + '<span class="ei">✏️</span>' + streakBadge + '</div>' +
          '<div class="total">⭐ ' + s.totalScore + '</div>' +
          '<div class="ctrl' + (loggedIn ? ' on' : '') + '">' +
            '<button class="sb sb-p" onclick="adjScore(\'' + s.id + '\',1)">+</button>' +
            '<button class="sb sb-m" onclick="adjScore(\'' + s.id + '\',-1)">−</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="skills">' + renderSkill(s, "writing", "W") + renderSkill(s, "speaking", "S") + '</div>' +
    '</div>';
  }).join("");
}

function openAdd() { document.getElementById("newName").value = ""; document.getElementById("addModal").classList.add("open"); }
function closeAdd() { document.getElementById("addModal").classList.remove("open"); }

function openLB() {
  var st = data.students ? [...data.students] : [];
  if (st.length === 0) {
    ["topTotal","topSkills","topStreak","allStreaks"].forEach(function(id) { document.getElementById(id).innerHTML = '<div style="text-align:center;color:var(--text-dim);padding:16px;font-style:italic">Chưa có dữ liệu</div>'; });
    document.getElementById("lbModal").classList.add("open"); return;
  }
  renderLB("topTotal", [...st].sort(function(a,b){return b.totalScore-a.totalScore}).slice(0,3), function(s){return s.totalScore+" ⭐";});
  renderLB("topSkills", [...st].sort(function(a,b){return (skillTotal(b,"writing")+skillTotal(b,"speaking"))-(skillTotal(a,"writing")+skillTotal(a,"speaking"))}).slice(0,3), function(s){return (skillTotal(s,"writing")+skillTotal(s,"speaking"))+" câu";});
  var bst = [...st].filter(function(s){return s.streak>0}).sort(function(a,b){return b.streak-a.streak}).slice(0,3);
  renderLB("topStreak", bst, function(s){return s.streak+" ngày 🔥";});
  var allSt = [...st].filter(function(s){return s.streak>0}).sort(function(a,b){return b.streak-a.streak});
  document.getElementById("allStreaks").innerHTML = allSt.length===0 ? '<div style="text-align:center;color:var(--text-dim);padding:12px;font-style:italic">Chưa ai có streak</div>' : allSt.map(function(s,i){return '<div class="lr"><div class="lrk" style="font-size:14px;color:var(--text-dim)">#'+(i+1)+'</div><img class="la" src="'+getAvatar(s)+'"><div class="ln">'+s.name+'</div><div class="ls" style="color:var(--streak)">🔥 '+s.streak+' ngày</div></div>';}).join("");
  document.getElementById("lbModal").classList.add("open");
}
function closeLB() { document.getElementById("lbModal").classList.remove("open"); }

function renderLB(cid, arr, fn) {
  var c = document.getElementById(cid);
  if (arr.length===0) { c.innerHTML='<div style="text-align:center;color:var(--text-dim);padding:16px;font-style:italic">Chưa có dữ liệu</div>'; return; }
  var em=["🥇","🥈","🥉"];
  c.innerHTML=arr.map(function(s,i){return '<div class="lr"><div class="lrk r'+(i+1)+'">'+em[i]+'</div><img class="la" src="'+getAvatar(s)+'"><div class="ln">'+s.name+'</div><div class="ls">'+fn(s)+'</div></div>';}).join("");
}

function toast(msg) {
  var ex=document.querySelector(".toast");if(ex)ex.remove();
  var t=document.createElement("div");t.className="toast";t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(function(){t.remove();},2500);
}

document.getElementById("lbModal").addEventListener("click",function(e){if(e.target===this)closeLB();});
document.getElementById("addModal").addEventListener("click",function(e){if(e.target===this)closeAdd();});
document.getElementById("avModal").addEventListener("click",function(e){if(e.target===this)closeAv();});

async function init() { await loadData(); updateNav(); }
init();
