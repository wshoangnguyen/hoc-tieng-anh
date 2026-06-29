const API = "";
const PASSWORD = "***";
let loggedIn = false, upStudentId = null, d = null;

async function api(path, opts = {}) {
  let res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  if (!res.ok && res.status === 401) { loggedIn = false; renderAll(); throw new Error("Unauthorized"); }
  return res.json();
}

async function loadData() {
  d = await api("/api/data");
}
async function saveData() {
  await api("/api/save", { method: "POST", body: JSON.stringify({ data: d }) });
}

function genId() { return "s" + Date.now() + "_" + Math.random().toString(36).substr(2,5); }

// Auth
async function login() {
  let p = document.getElementById("passInput");
  let v = p ? p.value : "";
  try {
    await api("/api/auth", { method: "POST", body: JSON.stringify({ password: v }) });
    loggedIn = true;
    document.getElementById("loginBadge").textContent = "\u2705 Đã đăng nhập";
    document.getElementById("loginBadge").className = "badge badge-on";
    showToast("\u2705 Đăng nhập thành công!");
    await loadData();
    renderAll();
  } catch(e) {
    showToast("\u274C Sai mật khẩu!");
  }
}
function logout() {
  loggedIn = false;
  document.getElementById("loginBadge").textContent = "\uD83D\uDD12 Chưa đăng nhập";
  document.getElementById("loginBadge").className = "badge badge-off";
  showToast("\uD83D\uDC4B Đã đăng xuất");
  renderAll();
}
function updateLoginBar() {
  let s = document.getElementById("loginSection");
  if (loggedIn) {
    s.innerHTML = '<button class="btn btn-danger" onclick="logout()">\uD83D\uDD13 Đăng xuất</button><button class="btn btn-outline" onclick="openAddStudentModal()">\u2795 Thêm HS</button><button class="btn btn-outline" onclick="openLeaderboard()">\uD83C\uDFC6 Xếp hạng</button>';
  } else {
    s.innerHTML = '<input type="password" class="pass-input" id="passInput" placeholder="\uD83D\uDD11 Mật khẩu GV" onkeydown="if(event.key==&quot;Enter&quot;)login()"><button class="btn btn-primary" onclick="login()">Đăng nhập</button><button class="btn btn-outline" onclick="openAddStudentModal()">\u2795 Thêm HS</button><button class="btn btn-outline" onclick="openLeaderboard()">\uD83C\uDFC6 Xếp hạng</button>';
  }
}

// Avatar
function uploadAvatar(type, id) {
  upStudentId = id || null;
  let inp = type === "teacher" ? document.getElementById("teacherFileInput") : document.getElementById("studentFileInput");
  inp.click();
}
async function handleAvatarUpload(type, input) {
  let f = input.files[0];
  if (!f) return;
  let formData = new FormData();
  formData.append("file", f);
  try {
    let res = await fetch(API + "/api/upload/" + type, { method: "POST", body: formData });
    let j = await res.json();
    if (type === "teacher") {
      d.teacherAvatar = j.url;
      document.getElementById("teacherAvatar").src = j.url || defTeacherAvatar();
    } else if (type === "student" && upStudentId) {
      let s = d.students.find(x => x.id === upStudentId);
      if (s) s.avatar = j.url;
      upStudentId = null;
    }
    await saveData(); renderAll(); showToast("\u2705 Đã cập nhật ảnh!");
  } catch(e) { showToast("Upload lỗi!"); }
  input.value = "";
}
function defTeacherAvatar() {
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='40' r='20' fill='%23fcbe5d'/%3E%3Cellipse cx='50' cy='85' rx='35' ry='20' fill='%23f7d281'/%3E%3C/svg%3E";
}
function defStudentAvatar(av, name) {
  if (av) return av;
  let ini = name.split(" ").pop().charAt(0).toUpperCase();
  let cols = ["#fcbe5d","#6C5CE7","#e17055","#00b894","#0984e3","#fdcb6e","#d63031","#74b9ff"];
  let c = cols[name.length % cols.length];
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="' + c + '"/><text x="50" y="55" text-anchor="middle" font-size="32" font-weight="bold" fill="white" font-family="sans-serif">' + ini + '</text></svg>';
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

// Student management
function openAddStudentModal() { document.getElementById("newStudentName").value = ""; document.getElementById("addStudentModal").classList.add("open"); }
function closeAddStudentModal() { document.getElementById("addStudentModal").classList.remove("open"); }
function startEditName(sid) {
  let s = d.students.find(x => x.id === sid);
  if (!s) return;
  let el = document.querySelector('[data-sid="'+sid+'"]');
  if (!el) return;
  el.innerHTML = '<input class="name-edit" id="en_'+sid+'" value="'+esc(s.name)+'" onkeydown="if(event.key==&quot;Enter&quot;)saveEditName(&quot;'+sid+'&quot;)" onblur="saveEditName(&quot;'+sid+'&quot;)">';
  setTimeout(function() {
    let inp = document.getElementById("en_"+sid);
    if (inp) { inp.focus(); inp.select(); }
  }, 50);
}
async function saveEditName(sid) {
  let inp = document.getElementById("en_"+sid);
  if (!inp) return;
  let n = inp.value.trim();
  let s = d.students.find(x => x.id === sid);
  if (s && n) { s.name = n; await saveData(); renderAll(); showToast("\u2705 Đã đổi tên: " + n); }
  else { renderAll(); }
}
function esc(str) { let div = document.createElement("div"); div.textContent = str; return div.innerHTML; }
async function deleteStudent(sid) {
  let s = d.students.find(x => x.id === sid);
  if (!s) return;
  if (!confirm('Xóa học sinh "' + s.name + '"? Không thể hoàn tác.')) return;
  await api("/api/students/" + sid, { method: "DELETE" });
  d.students = d.students.filter(x => x.id !== sid);
  renderAll(); showToast("\uD83D\uDDD1 Đã xóa: " + s.name);
}
async function addStudent() {
  let n = document.getElementById("newStudentName").value.trim();
  if (!n) { showToast("\u26A0\uFE0F Nhập tên!"); return; }
  let sid = genId();
  try {
    await api("/api/students", { method: "POST", body: JSON.stringify({ id: sid, name: n }) });
    d.students.push({id:sid,name:n,avatar:"",totalScore:0,writing:[0,0,0,0,0],speaking:[0,0,0,0,0],lastWeekScore:0});
    closeAddStudentModal(); renderAll(); showToast("\u2705 Đã thêm: " + n);
  } catch(e) { showToast("Lỗi khi thêm!"); }
}

// Scores
async function adjustTotalScore(sid, delta) {
  if (!loggedIn) return showToast("\uD83D\uDD12 Đăng nhập trước!");
  await api("/api/score", { method: "POST", body: JSON.stringify({ studentId: sid, delta: delta }) });
  let s = d.students.find(x => x.id === sid);
  if (s) { s.totalScore = Math.max(0, s.totalScore + delta); renderAll(); }
}
async function addLevelPoint(sid, skill, level, delta) {
  if (!loggedIn) return showToast("\uD83D\uDD12 Đăng nhập trước!");
  await api("/api/level", { method: "POST", body: JSON.stringify({ studentId: sid, skill: skill, level: level, delta: delta }) });
  let s = d.students.find(x => x.id === sid);
  if (s) {
    s[skill][level] = Math.max(0, s[skill][level] + delta);
    renderAll();
    let sn = skill === "writing" ? "W" : "S";
    let si = delta > 0 ? "+" : "";
    showToast("\u2705 " + s.name + ": " + sn + " Lv." + (level+1) + " " + si + delta);
  }
}

// Leaderboard
function openLeaderboard() {
  let st = [...d.students];
  let bt = [...st].sort(function(a,b) { return b.totalScore - a.totalScore; }).slice(0,3);
  renderLB("topTotal", bt, function(s) { return s.totalScore + " \u2B50"; });
  let bs = [...st].sort(function(a,b) {
    let at = sa(a.writing) + sa(a.speaking), bt2 = sa(b.writing) + sa(b.speaking);
    return bt2 - at;
  }).slice(0,3);
  renderLB("topSkills", bs, function(s) { return (sa(s.writing) + sa(s.speaking)) + " câu"; });
  let ex = new Set([...bt.map(function(x) { return x.id; }), ...bs.map(function(x) { return x.id; })]);
  let be = [...st].filter(function(s) { return !ex.has(s.id); }).sort(function(a,b) {
    let ad = a.totalScore - (a.lastWeekScore || 0), bd = b.totalScore - (b.lastWeekScore || 0);
    return bd - ad;
  }).slice(0,3);
  if (be.length === 0) {
    document.getElementById("topEffort").innerHTML = '<div class="empty-lb">Các HS top đã được vinh danh ở trên</div>';
  } else {
    renderLB("topEffort", be, function(s) { var df = s.totalScore - (s.lastWeekScore || 0); return "+" + df + " \u2B50 tuần này"; });
  }
  document.getElementById("leaderboardModal").classList.add("open");
}
function renderLB(cid, arr, fn) {
  let c = document.getElementById(cid);
  if (arr.length === 0) { c.innerHTML = '<div class="empty-lb">Chưa có dữ liệu</div>'; return; }
  let em = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];
  c.innerHTML = arr.map(function(s, i) {
    return '<div class="lb-row"><div class="lb-rank r-'+(i+1)+'">'+em[i]+'</div><img class="lb-avatar" src="'+defStudentAvatar(s.avatar,s.name)+'" alt="'+s.name+'"><div class="lb-name">'+s.name+'</div><div class="lb-score">'+fn(s)+'</div></div>';
  }).join("");
}
function closeLeaderboard() { document.getElementById("leaderboardModal").classList.remove("open"); }
function sa(a) { var t=0; for (var i=0; i<a.length; i++) t+=a[i]; return t; }
function getSkillTotal(student, skill) { var a=student[skill], t=0; for (var i=0; i<a.length; i++) t += a[i] * (i+1); return t; }

// Render
function renderAll() {
  updateLoginBar();
  var ta = document.getElementById("teacherAvatar");
  if (ta && d) ta.src = d.teacherAvatar || defTeacherAvatar();
  if (!d || !d.students) return;
  var g = document.getElementById("studentGrid");
  g.innerHTML = d.students.map(function(s) {
    var delBtn = loggedIn ? '<button class="delete-btn" onclick="event.stopPropagation();deleteStudent(&quot;'+s.id+'&quot;)" title="Xóa">\uD83D\uDDD1</button>' : "";
    return '<div class="student-card">'+delBtn+'<div class="student-top"><div class="student-avatar-wrap"><img class="student-avatar" src="'+defStudentAvatar(s.avatar,s.name)+'" alt="'+s.name+'"><button class="upload-btn" onclick="uploadAvatar(&quot;student&quot;,&quot;'+s.id+'&quot;)" title="Đổi ảnh">\uD83D\uDCF7</button></div><div class="student-info"><div class="student-name" data-sid="'+s.id+'" onclick="event.stopPropagation();startEditName(&quot;'+s.id+'&quot;)" title="Sửa tên">'+s.name+'<span class="edit-icon">\u270F\uFE0F</span></div><div class="student-total">\u2B50 '+s.totalScore+'</div><div class="score-controls'+(loggedIn?' active':'')+'"><button class="score-btn score-plus" onclick="adjustTotalScore(&quot;'+s.id+'&quot;,1)">+</button><button class="score-btn score-minus" onclick="adjustTotalScore(&quot;'+s.id+'&quot;,-1)">\u2212</button></div></div></div><div class="skills-section">'+renderSkillRow(s,"writing","W")+renderSkillRow(s,"speaking","S")+'</div></div>';
  }).join("");
}
function renderSkillRow(student, skill, label) {
  var a = student[skill], t = getSkillTotal(student, skill);
  var cells = a.map(function(v, i) {
    var pc = v > 0 ? " has" : "";
    var clickAdd = loggedIn ? ' onclick="event.stopPropagation();addLevelPoint(&quot;'+student.id+'&quot;,&quot;'+skill+'&quot;,'+i+',1)" style="cursor:pointer"' : '';
    var bh = loggedIn ? '<div class="cell-btns active"><button class="cell-btn m" onclick="event.stopPropagation();addLevelPoint(&quot;'+student.id+'&quot;,&quot;'+skill+'&quot;,'+i+',-1)" title="-1">\u2212</button></div>' : '';
    return '<div class="level-cell l-'+(i+1)+pc+'"'+clickAdd+' title="Lv.'+(i+1)+': '+v+' câu">'+v+bh+'</div>';
  }).join("");
  return '<div class="skill-row"><div class="skill-label">'+label+'</div><div class="level-cells">'+cells+'</div><div class="skill-total">'+t+'</div></div>';
}

function showToast(msg) {
  var ex = document.querySelector(".toast");
  if (ex) ex.remove();
  var t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { t.remove(); }, 2500);
}

async function checkWeeklyReset() {
  var now = new Date();
  var day = now.getDay();
  if (!d) return;
  var lr = localStorage.getItem("cs_weekly_reset");
  var today = now.toISOString().split("T")[0];
  if (day === 1 && lr !== today) {
    d.students.forEach(function(s) { s.lastWeekScore = s.totalScore; });
    localStorage.setItem("cs_weekly_reset", today);
    await saveData();
  }
}

async function init() {
  await loadData();
  await checkWeeklyReset();
  renderAll();
}
document.getElementById("leaderboardModal").addEventListener("click", function(e) { if (e.target === this) closeLeaderboard(); });
document.getElementById("addStudentModal").addEventListener("click", function(e) { if (e.target === this) closeAddStudentModal(); });
init();
