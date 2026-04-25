// ============================================
// HÀM TIỆN ÍCH
// ============================================

// Hiển thị/ẩn loading
function showLoading() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.style.display = "flex";
}

function hideLoading() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.style.display = "none";
}

// Tạo hiệu ứng sao bay
function createStars(element) {
    const rect = element.getBoundingClientRect();
    const starEmojis = ['⭐', '✨', '🌟', '💫'];
    
    for (let i = 0; i < 15; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.textContent = starEmojis[Math.floor(Math.random() * starEmojis.length)];
        star.style.left = rect.left + Math.random() * rect.width + 'px';
        star.style.top = rect.top + Math.random() * rect.height + 'px';
        star.style.position = 'fixed';
        document.body.appendChild(star);
        
        setTimeout(() => star.remove(), 1000);
    }
}

// Phát âm thanh
function playSound(type = 'bell') {
    const url = SOUND_URLS[type] || SOUND_URLS.bell;
    const audio = new Audio(url);
    audio.play().catch(e => console.log("Audio error:", e));
}

// Phát âm thanh đúng
function playCorrectSound() {
    const audio = new Audio(SOUND_URLS.correct);
    audio.play().catch(e => console.log("Correct sound error"));
}

// Phát âm thanh tiếng Anh
function speakEnglish(text) {
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    }, 100);
}

// Lấy ngày hiện tại (dạng số: 2=Thứ2, 7=Thứ7, CN=8)
function getCurrentDayNumber() {
    const today = new Date().getDay(); // 0 = Chủ nhật
    if (today === 0) return 'CN';
    return today + 1;
}

// Parse tên lớp để lấy lịch học
function parseClassName(fullName) {
    const parts = fullName.split(' ');
    return {
        name: parts[0],
        schedule: parts.slice(1).join(' ')
    };
}

// Lấy danh sách ngày học từ mã lịch (ví dụ: "LopA C2 C4" => [2,4])
function getDaysFromCode(code) {
    const days = [];
    const parts = code.split(' ');
    if (parts.length < 2) return days;
    
    const schedule = parts[1];
    for (let i = 0; i < schedule.length; i++) {
        const char = schedule[i];
        if (char === 'C') {
            if (schedule[i + 1] === 'N') {
                days.push('CN');
                i++;
            }
        } else if (!isNaN(parseInt(char))) {
            days.push(parseInt(char));
        }
    }
    return days;
}

// Kiểm tra lớp có học hôm nay không
function isClassToday(className) {
    const dayCode = getCurrentDayNumber();
    const days = getDaysFromCode(className);
    return days.includes(dayCode);
}