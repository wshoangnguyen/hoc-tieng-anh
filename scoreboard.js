// Scoreboard Frontend v2 - Google Sheets Backend via Apps Script
// THAY URL NÀY BẰNG URL DEPLOY APPS SCRIPT CỦA BẠN:
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxKO1eqMArGq1IIpd1N2mn1p49YMs1OyvtmCpSxARhOm7ZmP2HPz15Dzgyfth9gnlR2/exec";
const PASSWORD = "***";

let loggedIn = false;
let data = { students: [], config: {} };

function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

async function apiPost(body) {
  var resp = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body)
  });
  var json = await resp.json();
  if (json.error) throw new Error(json.error);
  return json;
}

async function loadData() {
  try {
    var j = await (await fetch(SCRIPT_URL + "?action=data")).json();
    if (!j.error) {
      data = j;
      if (data.config) {
        document.getElementById("teacherNameLabel").textContent = data.config.teacherName || "Giáo viên";
      }
    }
  } catch(e) { console.warn("Load data:", e.message); }
}

async function login() {
  var pw = document.getElementById("pw").value;
  if (!pw) { toast("⚠️ Nhập mật khẩu!"); return; }
  try {
    var resp = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "saveData", password: pw, data: data })
    });
    var j = await resp.json();
    if (j.error) throw new Error(j.error);
    loggedIn = true;
    document.getElementById("pw").value = "";
    updateNav();
    toast("✅ Đăng nhập thành công!");
  } catch(e) {
    toast("❌ Sai mật khẩu!");
  }
}

function logout() {
  loggedIn = false;
  updateNav();
  toast("👋 Đã đăng xuất");
}

function updateNav() {
  var el = document.getElementById("navBtns");
  var b = document.getElementById("statusBadge");
  if (loggedIn) {
    el.innerHTML = '<button class="btn btn-d" onclick="logout()">🔓 Đăng xuất</button><button class="btn btn-o" onclick="openAdd()">➕ Thêm HS</button><button class="btn btn-o" onclick="openLB()">🏆 Xếp hạng</button>';
    b.textContent = "✅ Đã đăng nhập";
    b.className = "badge badge-on";
  } else {
    el.innerHTML = '<input type="password" class="inp" id="pw" placeholder="🔑 MK giáo viên" onkeydown="if(event.key===\'Enter\')login()"><button class="btn btn-p" onclick="login()">Đăng nhập</button><button class="btn btn-o" onclick="openAdd()">➕ Thêm HS</button><button class="btn btn-o" onclick="openLB()">🏆 Xếp hạng</button>';
    b.textContent = "🔒 Chưa đăng nhập";
    b.className = "badge badge-off";
  }
  render();
}

async function addStudent() {
  if (!loggedIn) { toast("🔒 Đăng nhập trước!"); return; }
  var name = document.getElementById("newName").value.trim();
  if (!name) { toast("⚠️ Nhập tên!"); return; }
  var id = "s" + Date.now() + "_" + Math.random().toString(36).substr(2,5);
  try {
    await apiPost({ action: "addStudent", password: PASSWORD, id: id, name: name });
    data.students.push({ id: id, name: name, avatar: "", totalScore: 0, writing: [0,0,0,0,0], speaking: [0,0,0,0,0], lastActive: "", streak: 0 });
    closeAdd();
    render();
    toast("✅ Đã thêm: " + name);
  } catch(e) { toast("Lỗi khi thêm!"); }
}

async function deleteStudent(sid) {
  if (!loggedIn) return;
  var s = data.students.find(function(x) { return x.id === sid; });
  if (!s) return;
  if (!confirm('Xóa "' + s.name + '"? Không thể hoàn tác.')) return;
  try {
    await apiPost({ action: "deleteStudent", password: PASSWORD, id: sid });
    data.students = data.students.filter(function(x) { return x.id !== sid; });
    render();
    toast("🗑 Đã xóa: " + s.name);
  } catch(e) { toast("Lỗi!"); }
}

async function adjScore(sid, delta) {
  if (!loggedIn) { toast("🔒 Đăng nhập trước!"); return; }
  var s = data.students.find(function(x) { return x.id === sid; });
  if (!s) return;
  s.totalScore = Math.max(0, s.totalScore + delta);
  try {
    var resp = await apiPost({ action: "updateScore", password: PASSWORD, studentId: sid, delta: delta });
    // Update streak from server response
    if (resp.lastActive) s.lastActive = resp.lastActive;
    if (resp.streak !== undefined) s.streak = resp.streak;
    render();
  } catch(e) { toast("Lỗi!"); }
}

async function adjLevel(sid, skill, level, delta) {
  if (!loggedIn) { toast("🔒 Đăng nhập trước!"); return; }
  var s = data.students.find(function(x) { return x.id === sid; });
  if (!s) return;
  s[skill][level] = Math.max(0, s[skill][level] + delta);
  try {
    var resp = await apiPost({ action: "updateLevel", password: PASSWORD, studentId: sid, skill: skill, level: level, delta: delta });
    if (resp.lastActive) s.lastActive = resp.lastActive;
    if (resp.streak !== undefined) s.streak = resp.streak;
    render();
    var sn = skill === "writing" ? "W" : "S";
    toast("✅ " + s.name + ": " + sn + " Lv." + (level+1) + " " + (delta > 0 ? "+" : "") + delta);
  } catch(e) { toast("Lỗi!"); }
}

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
    await apiPost({ action: "renameStudent", password: PASSWORD, id: sid, name: name });
    render();
    toast("✅ Đổi tên: " + name);
  } catch(e) { render(); toast("Lỗi!"); }
}

function getAvatar(s) {
  if (s.avatar) return s.avatar;
  var parts = s.name.trim().split(" ");
  var ini = parts[parts.length - 1].charAt(0).toUpperCase();
  var cols = ["#fcbe5d","#6C5CE7","#e17055","#00b894","#0984e3","#fdcb6e","#d63031","#74b9ff","#a29bfe","#fd79a8"];
  var c = cols[(s.name.length || 0) % cols.length];
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="' + c + '"/><text x="50" y="54" text-anchor="middle" font-size="34" font-weight="bold" fill="white" font-family="sans-serif">' + ini + '</text></svg>';
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

function skillTotal(s, sk) {
  var a = s[sk], t = 0;
  for (var i = 0; i < a.length; i++) t += a[i] * (i + 1);
  return t;
}

function getStreakClass(streak) {
  if (!streak || streak < 1) return " dim";
  return "";
}

function renderSkill(s, skill, label) {
  var a = s[skill], t = skillTotal(s, skill);
  var cells = "";
  for (var i = 0; i < a.length; i++) {
    var fc = a[i] > 0 ? " fill" : "";
    cells += '<div class="lv l' + (i+1) + fc + '" onclick="' + (loggedIn ? 'adjLevel(\'' + s.id + '\',\'' + skill + '\',' + i + ',1)' : '') + '" style="' + (loggedIn ? 'cursor:pointer' : '') + '">' + a[i] + '</div>';
  }
  return '<div class="sr"><div class="sl">' + label + '</div><div class="lc">' + cells + '</div><div class="st">' + t + '</div></div>';
}

function render() {
  if (!data || !data.students) return;
  var g = document.getElementById("grid");
  g.innerHTML = data.students.map(function(s) {
    var delBtn = loggedIn ? '<button class="del" onclick="event.stopPropagation();deleteStudent(\'' + s.id + '\')">✕</button>' : "";
    var ctrlOn = loggedIn ? ' on' : '';
    var streakBadge = (s.streak && s.streak > 0) ? '<span class="streak-badge' + getStreakClass(s.streak) + '">🔥 ' + s.streak + ' ngày</span>' : '';
    return '<div class="card">' + delBtn +
      '<div class="top-row">' +
        '<div class="av-wrap"><img class="av" src="' + getAvatar(s) + '" alt="' + s.name + '"></div>' +
        '<div class="info">' +
          '<div class="name" data-sid="' + s.id + '" onclick="event.stopPropagation();startEdit(\'' + s.id + '\')">' + s.name + '<span class="ei">✏️</span>' + streakBadge + '</div>' +
          '<div class="total">⭐ ' + s.totalScore + '</div>' +
          '<div class="ctrl' + ctrlOn + '">' +
            '<button class="sb sb-p" onclick="adjScore(\'' + s.id + '\',1)">+</button>' +
            '<button class="sb sb-m" onclick="adjScore(\'' + s.id + '\',-1)">−</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="skills">' +
        renderSkill(s, "writing", "W") +
        renderSkill(s, "speaking", "S") +
      '</div>' +
    '</div>';
  }).join("");
}

// Modals
function openAdd() { document.getElementById("newName").value = ""; document.getElementById("addModal").classList.add("open"); }
function closeAdd() { document.getElementById("addModal").classList.remove("open"); }

function openLB() {
  var st = data.students ? [...data.students] : [];
  if (st.length === 0) {
    ["topTotal","topSkills","topStreak","allStreaks"].forEach(function(id) {
      document.getElementById(id).innerHTML = '<div style="text-align:center;color:var(--text-dim);padding:16px;font-style:italic">Chưa có dữ liệu</div>';
    });
    document.getElementById("lbModal").classList.add("open");
    return;
  }

  // Top điểm tổng
  var bt = [...st].sort(function(a,b) { return b.totalScore - a.totalScore; }).slice(0,3);
  renderLB("topTotal", bt, function(s) { return s.totalScore + " ⭐"; });

  // Top kỹ năng
  var bs = [...st].sort(function(a,b) {
    return (skillTotal(b,"writing") + skillTotal(b,"speaking")) - (skillTotal(a,"writing") + skillTotal(a,"speaking"));
  }).slice(0,3);
  renderLB("topSkills", bs, function(s) { return (skillTotal(s,"writing") + skillTotal(s,"speaking")) + " câu"; });

  // Top 3 streak
  var bst = [...st].filter(function(s) { return s.streak > 0; }).sort(function(a,b) { return b.streak - a.streak; }).slice(0,3);
  renderLB("topStreak", bst, function(s) { return s.streak + " ngày 🔥"; });

  // Full streak list
  var allSt = [...st].filter(function(s) { return s.streak > 0; }).sort(function(a,b) { return b.streak - a.streak; });
  var el = document.getElementById("allStreaks");
  if (allSt.length === 0) {
    el.innerHTML = '<div style="text-align:center;color:var(--text-dim);padding:12px;font-style:italic">Chưa ai có streak</div>';
  } else {
    el.innerHTML = allSt.map(function(s, i) {
      return '<div class="lr"><div class="lrk" style="font-size:14px;color:var(--text-dim)">#' + (i+1) + '</div><img class="la" src="' + getAvatar(s) + '"><div class="ln">' + s.name + '</div><div class="ls" style="color:var(--streak)">🔥 ' + s.streak + ' ngày</div></div>';
    }).join("");
  }

  document.getElementById("lbModal").classList.add("open");
}
function closeLB() { document.getElementById("lbModal").classList.remove("open"); }

function renderLB(cid, arr, fn) {
  var c = document.getElementById(cid);
  if (arr.length === 0) { c.innerHTML = '<div style="text-align:center;color:var(--text-dim);padding:16px;font-style:italic">Chưa có dữ liệu</div>'; return; }
  var em = ["🥇","🥈","🥉"];
  c.innerHTML = arr.map(function(s, i) {
    return '<div class="lr"><div class="lrk r' + (i+1) + '">' + em[i] + '</div><img class="la" src="' + getAvatar(s) + '"><div class="ln">' + s.name + '</div><div class="ls">' + fn(s) + '</div></div>';
  }).join("");
}

function toast(msg) {
  var ex = document.querySelector(".toast");
  if (ex) ex.remove();
  var t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { t.remove(); }, 2500);
}

// Init
document.getElementById("lbModal").addEventListener("click", function(e) { if (e.target === this) closeLB(); });
document.getElementById("addModal").addEventListener("click", function(e) { if (e.target === this) closeAdd(); });

async function init() {
  await loadData();
  updateNav();
}
init();
