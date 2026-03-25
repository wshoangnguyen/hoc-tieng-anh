// game-utils.js - Tiện ích dùng chung cho các game

// Lấy dữ liệu từ vựng từ localStorage
function getVocabularyData() {
    const stored = localStorage.getItem('flashcard_vocabulary');
    if (stored) {
        return JSON.parse(stored);
    }
    return null;
}

// sound effect right/wrong
function playBeep(type) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const now = audioCtx.currentTime;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        if (type === 'correct') {
            // Âm thanh vui: lên cao dần
            oscillator.frequency.setValueAtTime(523.25, now);
            oscillator.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
        } else if (type === 'wrong') {
            // Âm thanh buồn: đi xuống
            oscillator.frequency.setValueAtTime(440, now);
            oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.3);
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
            oscillator.start(now);
            oscillator.stop(now + 0.4);
        } else if (type === 'win') {
            // Âm thanh chiến thắng: 3 nốt
            const notes = [523.25, 659.25, 783.99];
            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.2, now + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.15 + 0.4);
                osc.start(now + i * 0.15);
                osc.stop(now + i * 0.15 + 0.4);
            });
        }
    } catch(e) {
        console.log('Audio not supported:', e);
    }
}
// Lấy đường dẫn hình ảnh
function getImageBasePath() {
    return '../pic/';  // Luôn trả về đường dẫn tương đối từ thư mục games
}

// Phát âm từ
function speakWord(word, lang = 'en-US') {
    if (!window.speechSynthesis) {
        console.warn("Trình duyệt không hỗ trợ phát âm");
        return;
    }
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = lang;
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    
    // THÊM ĐOẠN NÀY: Chọn giọng Samantha
    const voices = window.speechSynthesis.getVoices();
    const samanthaVoice = voices.find(voice => 
        voice.name === 'Samantha' || 
        voice.name.includes('Samantha') ||
        (voice.lang === 'en-US' && voice.name.includes('Google') === false && voice.name.includes('Microsoft') === false)
    );
    
    // Nếu tìm thấy giọng Samantha thì dùng, không thì dùng giọng mặc định
    if (samanthaVoice) {
        utterance.voice = samanthaVoice;
    } else {
        // Fallback: tìm giọng nữ Mỹ khác
        const femaleVoice = voices.find(voice => 
            voice.lang === 'en-US' && 
            (voice.name.includes('Female') || voice.name.includes('Google US English'))
        );
        if (femaleVoice) utterance.voice = femaleVoice;
    }
    
    window.speechSynthesis.speak(utterance);
}


// Lấy từ vựng theo danh mục
function getVocabularyByCategory(category) {
    const vocab = getVocabularyData();
    if (!vocab) return [];
    if (category === 'all') return vocab;
    return vocab.filter(item => item.category === category);
}

// Lấy từ vựng ngẫu nhiên
function getRandomWords(count, category = 'all') {
    let words = getVocabularyByCategory(category);
    if (words.length === 0) return [];
    
    // Trộn mảng
    for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
    }
    
    return words.slice(0, count);
}

// Hiển thị thông báo
function showMessage(message, isSuccess = true) {
    // Tạo element thông báo nếu chưa có
    let msgDiv = document.getElementById('game-message');
    if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.id = 'game-message';
        msgDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: bold;
            z-index: 1000;
            transition: all 0.3s;
            opacity: 0;
            pointer-events: none;
        `;
        document.body.appendChild(msgDiv);
    }
    
    msgDiv.textContent = message;
    msgDiv.style.backgroundColor = isSuccess ? '#2e7d64' : '#a1422f';
    msgDiv.style.color = 'white';
    msgDiv.style.opacity = '1';
    
    setTimeout(() => {
        msgDiv.style.opacity = '0';
    }, 2000);
}

// Kiểm tra dữ liệu đã tải chưa
function checkDataAndRedirect() {
    const vocab = getVocabularyData();
    if (!vocab || vocab.length === 0) {
        showMessage('⚠️ Chưa có dữ liệu từ vựng! Vui lòng mở file flashcard.html trước.', false);
        setTimeout(() => {
            window.location.href = '../flashcard.html';
        }, 2000);
        return false;
    }
    return true;
}

// Tạo điểm số
class ScoreManager {
    constructor() {
        this.score = 0;
        this.total = 0;
    }
    
    addScore(points = 1) {
        this.score += points;
        this.updateDisplay();
    }
    
    addTotal() {
        this.total++;
        this.updateDisplay();
    }
    
    reset() {
        this.score = 0;
        this.total = 0;
        this.updateDisplay();
    }
    
    updateDisplay() {
        const scoreEl = document.getElementById('score-display');
        if (scoreEl) {
            scoreEl.textContent = `⭐ Điểm: ${this.score}/${this.total}`;
        }
    }
    
    getPercentage() {
        if (this.total === 0) return 0;
        return Math.round((this.score / this.total) * 100);
    }
}
