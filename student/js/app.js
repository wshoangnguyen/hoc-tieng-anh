// ============================================
// LOGIC CHÍNH CỦA ỨNG DỤNG
// ============================================

// State toàn cục
let currentClass = "";
let studentsData = [];
let originalStudents = [];
let classListData = [];

// DOM Elements
let classScreen, studentScreen, classNameTitle, studentsGrid;
let backBtn, saveBtn, gameBtn, gameBtn2;

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
    // Gán DOM elements
    classScreen = document.getElementById("classScreen");
    studentScreen = document.getElementById("studentScreen");
    classNameTitle = document.getElementById("classNameTitle");
    studentsGrid = document.getElementById("studentsGrid");
    backBtn = document.getElementById("backBtnModern");
    saveBtn = document.getElementById("saveBtnModern");
    gameBtn = document.getElementById("gameBtn");
    gameBtn2 = document.getElementById("gameBtn2");
    
    // Gán sự kiện
    backBtn.onclick = goBackToClassList;
    saveBtn.onclick = saveAllChanges;
    gameBtn.onclick = luckyStickerGame;
    gameBtn2.onclick = luckyStudentGame;
    
    // Tải danh sách lớp
    loadClasses();
});

// ==================== LỚP HỌC ====================

async function loadClasses() {
    showLoading();
    try {
        const allStudents = await fetchAllStudents();
        const uniqueClasses = [...new Set(allStudents.map(s => s.class))];
        
        classListData = uniqueClasses.map(cls => ({
            fullName: cls,
            name: parseClassName(cls).name,
            schedule: parseClassName(cls).schedule,
            isToday: isClassToday(cls)
        }));
        
        renderClassList('today');
    } catch (error) {
        console.error("Lỗi tải lớp:", error);
        const container = document.getElementById("classList");
        if (container) {
            container.innerHTML = "<p style='grid-column:1/-1; text-align:center; color:red;'>Lỗi kết nối</p>";
        }
    } finally {
        hideLoading();
    }
}

function renderClassList(filter = 'today') {
    const container = document.getElementById("classList");
    if (!container) return;
    container.innerHTML = "";
    
    // Tạo tab
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';
    tabContainer.innerHTML = `
        <button class="tab-btn ${filter === 'today' ? 'active' : ''}" data-filter="today">📅 Hôm nay</button>
        <button class="tab-btn ${filter === 'all' ? 'active' : ''}" data-filter="all">📚 Tất cả lớp</button>
    `;
    container.appendChild(tabContainer);
    
    // Lọc danh sách
    let filteredClasses = classListData;
    if (filter === 'today') {
        filteredClasses = classListData.filter(cls => cls.isToday);
    }
    
    if (filteredClasses.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.gridColumn = '1/-1';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = '#666';
        emptyMsg.style.padding = '40px';
        emptyMsg.innerHTML = filter === 'today' ? '🎉 Hôm nay không có lớp học! Nghỉ ngơi thôi nào!' : 'Không có dữ liệu lớp học';
        container.appendChild(emptyMsg);
    } else {
        filteredClasses.forEach(cls => {
            const div = document.createElement("div");
            div.className = "class-card";
            div.innerHTML = `
                <div style="font-size: 1.2rem;">${cls.name}</div>
                <div style="font-size: 0.8rem; color: #ff9800; margin-top: 5px;">⏰ ${cls.schedule}</div>
                ${cls.isToday && filter === 'all' ? '<span class="today-badge">Hôm nay</span>' : ''}
            `;
            div.onclick = () => showClassStudents(cls.fullName);
            container.appendChild(div);
        });
    }
    
    // Gắn sự kiện cho tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            renderClassList(btn.dataset.filter);
        };
    });
}

// ==================== HỌC SINH ====================

async function showClassStudents(className) {
    showLoading();
    try {
        currentClass = className;
        classNameTitle.innerHTML = `🏫 Lớp ${className}`;
        
        const students = await fetchStudentsByClass(className);
        studentsData = students.map(s => ({ ...s, stickers: [] }));
        originalStudents = JSON.parse(JSON.stringify(studentsData));
        
        renderStudentCards();
        classScreen.classList.add("hidden");
        studentScreen.classList.remove("hidden");
    } catch (error) {
        console.error("Lỗi tải học sinh:", error);
        alert("Không thể tải dữ liệu học sinh");
    } finally {
        hideLoading();
    }
}

function renderStudentCards() {
    if (!studentsGrid) return;
    studentsGrid.innerHTML = "";
    
    if (studentsData.length === 0) {
        studentsGrid.innerHTML = "<p style='text-align:center; color:#666; padding:40px;'>Không có học sinh</p>";
        return;
    }
    
    studentsData.forEach((student) => {
        const card = createStudentCard(student);
        studentsGrid.appendChild(card);
    });
}

function createStudentCard(student) {
    const card = document.createElement("div");
    card.className = "student-card";
    card.setAttribute('data-id', student.id);
    card.onclick = () => showStickerModal(student.id);
    
    // Avatar container
    const avatarContainer = document.createElement("div");
    avatarContainer.className = "avatar-container";
    
    const avatarImg = document.createElement("img");
    avatarImg.src = student.avatar && student.avatar.trim() !== "" ? student.avatar : "https://via.placeholder.com/100?text=👩‍🎓";
    avatarImg.onerror = () => { avatarImg.src = "https://via.placeholder.com/100?text=👩‍🎓"; };
    avatarContainer.appendChild(avatarImg);
    
    // Hiển thị stickers
    if (student.stickers && student.stickers.length > 0) {
        const stickerContainer = document.createElement('div');
        stickerContainer.style.position = 'absolute';
        stickerContainer.style.bottom = '5px';
        stickerContainer.style.right = '5px';
        stickerContainer.style.display = 'flex';
        stickerContainer.style.flexWrap = 'wrap';
        stickerContainer.style.gap = '2px';
        stickerContainer.style.maxWidth = '230px';
        stickerContainer.style.justifyContent = 'flex-end';
        
        student.stickers.slice(-6).forEach(sticker => {
            const badge = document.createElement('div');
            badge.style.width = '28px';
            badge.style.height = '28px';
            badge.style.fontSize = '1.1rem';
            badge.style.background = 'rgba(255,255,255,0.95)';
            badge.style.borderRadius = '50%';
            badge.style.display = 'flex';
            badge.style.alignItems = 'center';
            badge.style.justifyContent = 'center';
            badge.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
            badge.textContent = sticker.emoji;
            stickerContainer.appendChild(badge);
        });
        avatarContainer.appendChild(stickerContainer);
    }
    
    // Info section
    const infoDiv = document.createElement("div");
    infoDiv.className = "info";
    
    // Name & Point
    const nameDiv = document.createElement("div");
    nameDiv.className = "name";
    const stickerCount = student.stickers ? student.stickers.length : 0;
    nameDiv.innerHTML = `
        <span>${student.name} ${stickerCount > 0 ? `<span class="sticker-count">🎨${stickerCount}</span>` : ''}</span>
        <span class="point">${student.point} points</span>
    `;
    
    // Skills
    const skillsDiv = document.createElement("div");
    skillsDiv.className = "skills";
    
    SKILLS.forEach(skill => {
        const level = student[skill.key] || 0;
        const skillSpan = document.createElement("div");
        skillSpan.className = "skill";
        skillSpan.innerHTML = `<span>${skill.label}</span> ${level}/${skill.max}`;
        skillSpan.onclick = (e) => {
            e.stopPropagation();
            let newLv = prompt(`Nhập cấp độ ${skill.label} (0-${skill.max})`, level);
            if (newLv !== null && !isNaN(newLv) && newLv >= 0 && newLv <= skill.max) {
                student[skill.key] = Number(newLv);
                renderStudentCards();
            } else if (newLv !== null) {
                alert(`Cấp độ từ 0 đến ${skill.max}`);
            }
        };
        skillsDiv.appendChild(skillSpan);
    });
    
    // Button group
    const btnGroup = document.createElement("div");
    btnGroup.className = "btn-group";
    
    const pointBtn = document.createElement("button");
    pointBtn.innerText = "⭐ Tích điểm (+/-)";
    pointBtn.onclick = (e) => {
        e.stopPropagation();
        const newPoint = prompt("Nhập số điểm cộng thêm (vd: +5) hoặc trừ (vd: -3):", "0");
        if (newPoint !== null && !isNaN(parseFloat(newPoint))) {
            let delta = parseFloat(newPoint);
            let updated = student.point + delta;
            if (updated < 0) updated = 0;
            student.point = updated;
            playSound();
            renderStudentCards();
        } else if (newPoint !== null) {
            alert("Vui lòng nhập số");
        }
    };
    
    const editNameBtn = document.createElement("button");
    editNameBtn.innerText = "✏️ Sửa tên";
    editNameBtn.style.background = "#4a627a";
    editNameBtn.onclick = (e) => {
        e.stopPropagation();
        const newName = prompt("Nhập tên mới cho học sinh:", student.name);
        if (newName && newName.trim() !== "") {
            student.name = newName.trim();
            renderStudentCards();
            if (!student.nameChanged) student.nameChanged = true;
        } else if (newName !== null) {
            alert("Tên không được để trống!");
        }
    };
    
    btnGroup.appendChild(pointBtn);
    btnGroup.appendChild(editNameBtn);
    
    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(skillsDiv);
    infoDiv.appendChild(btnGroup);
    
    card.appendChild(avatarContainer);
    card.appendChild(infoDiv);
    
    return card;
}

// ==================== STICKER ====================

function showStickerModal(studentId) {
    const modal = document.createElement('div');
    modal.className = 'sticker-modal';
    modal.innerHTML = `
        <div class="sticker-modal-content">
            <span class="close-modal">&times;</span>
            <div class="modal-title">🎁 Chọn sticker thưởng!</div>
            <div class="sub" style="text-align:center">Học sinh hãy nói: "I want a ..."</div>
            <div class="sticker-grid" id="stickerGrid"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const stickerGrid = modal.querySelector('#stickerGrid');
    STICKERS.forEach(sticker => {
        const stickerDiv = document.createElement('div');
        stickerDiv.className = 'sticker-option';
        stickerDiv.innerHTML = `
            <div style="font-size: 2.5rem;">${sticker.emoji}</div>
            <div class="sticker-name">${sticker.name}</div>
            <div style="font-size: 0.65rem; color: #666;">/${sticker.english}/</div>
        `;
        stickerDiv.onclick = () => {
            addStickerToStudent(studentId, sticker.emoji, sticker.english);
            modal.remove();
        };
        stickerGrid.appendChild(stickerDiv);
    });
    
    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

function addStickerToStudent(studentId, stickerEmoji, stickerName) {
    const student = studentsData.find(s => s.id === studentId);
    if (!student) return;
    
    if (!student.stickers) student.stickers = [];
    student.stickers.push({ emoji: stickerEmoji, name: stickerName, time: new Date() });
    
    // Hiệu ứng
    const card = document.querySelector(`.student-card[data-id="${studentId}"]`);
    if (card) {
        createStars(card);
        playCorrectSound();
        
        // Cập nhật badge tạm thời
        const avatarContainer = card.querySelector('.avatar-container');
        const existingBadge = avatarContainer.querySelector('.sticker-badge');
        if (existingBadge) existingBadge.remove();
        
        const badge = document.createElement('div');
        badge.className = 'sticker-badge';
        badge.textContent = stickerEmoji;
        avatarContainer.appendChild(badge);
        setTimeout(() => badge.remove(), 2000);
    }
    
    speakEnglish(`You got a ${stickerName}!`);
    renderStudentCards();
}

// ==================== GAME ====================

function luckyStickerGame() {
    if (studentsData.length === 0) {
        alert("Không có học sinh trong lớp!");
        return;
    }
    
    const luckySticker = STICKERS[Math.floor(Math.random() * STICKERS.length)];
    alert(`🎉 Sticker may mắn: ${luckySticker.emoji} ${luckySticker.name}! 🎉`);
    speakEnglish(`Lucky sticker! ${luckySticker.name}!`);
}

function luckyStudentGame() {
    if (studentsData.length === 0) {
        alert("Không có học sinh trong lớp!");
        return;
    }
    
    const luckyStudent = studentsData[Math.floor(Math.random() * studentsData.length)];
    const bonusPoints = 1;
    const message = `🎉 Bạn ${luckyStudent.name} là học sinh may mắn được cộng ${bonusPoints} điểm! 🎉`;
    
    if (confirm(message + "\n\nBạn có muốn cộng điểm cho học sinh này không?")) {
        luckyStudent.point += bonusPoints;
        playSound();
        renderStudentCards();
        alert(`✅ Đã cộng ${bonusPoints} điểm cho ${luckyStudent.name}!`);
        speakEnglish(`Congratulations! ${luckyStudent.name} got ${bonusPoints} bonus point!`);
    }
}

// ==================== LƯU DỮ LIỆU ====================

async function saveAllChanges() {
    const changedStudents = [];
    
    for (let i = 0; i < studentsData.length; i++) {
        const curr = studentsData[i];
        const orig = originalStudents[i];
        
        if (curr.point !== orig.point ||
            curr.listen !== orig.listen ||
            curr.speak !== orig.speak ||
            curr.read !== orig.read ||
            curr.write !== orig.write ||
            curr.name !== orig.name) {
            changedStudents.push({
                id: curr.id,
                name: curr.name,
                point: curr.point,
                listen: curr.listen,
                speak: curr.speak,
                read: curr.read,
                write: curr.write
            });
        }
    }
    
    if (changedStudents.length === 0) {
        alert("Không có thay đổi nào cần lưu.");
        return;
    }
    
    showLoading();
    try {
        await saveMultipleStudents(changedStudents);
        originalStudents = JSON.parse(JSON.stringify(studentsData));
        alert("✅ Đã lưu điểm và tên học sinh thành công!");
        playSound();
    } catch (error) {
        console.error("Lỗi lưu:", error);
        alert("❌ Lưu thất bại. Vui lòng kiểm tra kết nối.");
    } finally {
        hideLoading();
    }
}

function goBackToClassList() {
    classScreen.classList.remove("hidden");
    studentScreen.classList.add("hidden");
    currentClass = "";
    studentsData = [];
    originalStudents = [];
}

// ==================== KHÔI PHỤC DỮ LIỆU STICKER TỪ LOCALSTORAGE ====================
// (Tạm thời lưu sticker ở localStorage, sau này có thể lên server)

function saveStickersToLocal() {
    const stickersData = {};
    studentsData.forEach(s => {
        if (s.stickers && s.stickers.length > 0) {
            stickersData[s.id] = s.stickers;
        }
    });
    localStorage.setItem(`stickers_${currentClass}`, JSON.stringify(stickersData));
}

function loadStickersFromLocal() {
    const saved = localStorage.getItem(`stickers_${currentClass}`);
    if (saved) {
        const stickersData = JSON.parse(saved);
        studentsData.forEach(s => {
            if (stickersData[s.id]) {
                s.stickers = stickersData[s.id];
            }
        });
        renderStudentCards();
    }
}

// Gọi loadStickersFromLocal sau khi tải học sinh
// (Đã được tích hợp trong showClassStudents, bạn có thể thêm dòng đó)