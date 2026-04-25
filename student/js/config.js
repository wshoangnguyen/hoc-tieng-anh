// ============================================
// CẤU HÌNH HỆ THỐNG
// ============================================

// API Google Sheets
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyPPfXdvYAQO4a7lZG3eBSs0f4uA9hhPePqMyDODquELjWyYrET2gY9mqm4Kqb29HXy/exec";

// Danh sách sticker
const STICKERS = [
    { emoji: "🐕", name: "Dog", english: "dɒɡ" },
    { emoji: "🐈", name: "Cat", english: "kæt" },
    { emoji: "🐎", name: "Horse", english: "hɔːrs" },
    { emoji: "🐖", name: "Pig", english: "pɪɡ" },
    { emoji: "🐄", name: "Cow", english: "kaʊ" },
    { emoji: "🐒", name: "Monkey", english: "ˈmʌŋ.ki" },
    { emoji: "🐔", name: "Chicken", english: "ˈtʃɪk.ɪn" },
    { emoji: "🐧", name: "Penguin", english: "ˈpeŋ.ɡwɪn" },
    { emoji: "🐬", name: "Dolphin", english: "ˈdɑːl.fɪn" },
    { emoji: "🦁", name: "Lion", english: "ˈlaɪ.ən" },
    { emoji: "🐘", name: "Elephant", english: "ˈel.ə.fənt" },
    { emoji: "🦒", name: "Giraffe", english: "dʒɪˈræf" },
    { emoji: "🚗", name: "Car", english: "kɑːr" },
    { emoji: "💎", name: "Diamond", english: "ˈdaɪ.ə.mənd" },
    { emoji: "👞", name: "Shoe", english: "ʃuː" },
    { emoji: "✈️", name: "Plane", english: "pleɪn" },
    { emoji: "🚀", name: "Rocket", english: "ˈrɑː.kɪt" },
    { emoji: "🚲", name: "Bike", english: "baɪk" },
    { emoji: "⭐", name: "Star", english: "stɑːr" },
    { emoji: "❤️", name: "Heart", english: "hɑːrt" },
    { emoji: "🌈", name: "Rainbow", english: "ˈreɪn.bəʊ" },
{ emoji: "🍎", name: "Apple", english: "ˈæp.əl" },
    { emoji: "🍌", name: "Banana", english: "bəˈnæn.ə" },
    { emoji: "🍕", name: "Pizza", english: "ˈpiːt.sə" },
    { emoji: "🍦", name: "Ice Cream", english: "ˌaɪs ˈkriːm" },
    { emoji: "🍪", name: "Cookie", english: "ˈkʊk.i" },
    { emoji: "🐝", name: "Bee", english: "biː" },
    { emoji: "🐦", name: "Bird", english: "bɜːrd" },
    { emoji: "🦋", name: "Butterfly", english: "ˈbʌt.ə.flaɪ" },
    { emoji: "☀️", name: "Sun", english: "sʌn" },
    { emoji: "🌙", name: "Moon", english: "muːn" },
    { emoji: "🌳", name: "Tree", english: "triː" },
    { emoji: "⚽", name: "Ball", english: "bɔːl" },
    { emoji: "🎈", name: "Balloon", english: "bəˈluːn" },
    { emoji: "📖", name: "Book", english: "bʊk" },
    { emoji: "✏️", name: "Pencil", english: "ˈpen.səl" },
    { emoji: "🎩", name: "Hat", english: "hæt" },
    { emoji: "🌸", name: "Flower", english: "ˈflaʊ.ɚ" }
];

// Danh sách kỹ năng
const SKILLS = [
    { label: "👂 Nghe", key: "listen", max: 5 },
    { label: "🗣 Nói", key: "speak", max: 5 },
    { label: "📖 Đọc", key: "read", max: 5 },
    { label: "✍️ Viết", key: "write", max: 5 }
];

// Âm thanh (có thể thay bằng file local sau)
const SOUND_URLS = {
    bell: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
    correct: "correct.mp3" // Bạn có thể thay bằng URL thật
};