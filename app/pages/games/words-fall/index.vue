<template>
  <div class="game-container relative min-h-150">
    <!-- NÚT QUAY LẠI -->
    <button
      v-if="isGameStarted && !isGameOver"
      @click="confirmExit"
      class="absolute top-4 left-4 p-2 rounded-full hover:bg-white/50 transition-all group z-50"
      title="Quay lại cài đặt"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-8 w-8 text-gray-400 group-hover:text-[#fcbe5d] group-hover:scale-110 transition-all"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="3"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
    </button>

    <!-- HEADER -->
    <div
      class="flex items-center justify-center gap-2 text-4xl font-bold text-[#555] mb-6"
    >
      <img src="/games/word-find.png" class="w-20 object-cover animate-pulse" />
      Words Fall
    </div>

    <!-- SELECTION SECTION -->
    <div v-if="!isGameStarted" class="space-y-6 flex flex-col items-center">
      <div
        class="flex flex-col lg:flex-row gap-4 justify-center items-start w-full lg:w-5xl"
      >
        <div class="w-full max-w-md mx-auto">
          <GamesStoriesSelection @update:story="handleStoryLoaded" />
        </div>
      </div>

      <!-- Easy Mode Switch -->
      <div class="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm">
        <span class="font-bold text-gray-600">🌟 Chế độ dễ:</span>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="easyMode" class="sr-only peer" />
          <div
            class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"
          ></div>
        </label>
        <span
          :class="
            easyMode ? 'text-green-600 font-bold' : 'text-red-500 font-bold'
          "
        >
          {{ easyMode ? "BẬT" : "TẮT" }}
        </span>
      </div>

      <button
        @click="startGame"
        :disabled="!story"
        class="w-full max-w-4xl py-4 bg-[#fcbe5d] text-white text-3xl font-black rounded-3xl shadow-[0_8px_0_#ff9d00] active:shadow-none active:translate-y-2 transition-all disabled:opacity-50"
      >
        🎮 BẮT ĐẦU CHƠI
      </button>
    </div>

    <!-- GAME SECTION -->
    <div v-else class="game-section w-full max-w-6xl mx-auto">
      <!-- Info Bar -->
      <div
        class="flex flex-wrap justify-between items-center mb-4 bg-white/80 p-4 rounded-2xl shadow-sm gap-4"
      >
        <div class="flex gap-6">
          <div class="text-center">
            <p class="text-xs text-gray-500 uppercase">Điểm</p>
            <p class="text-2xl font-black text-blue-600">{{ score }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500 uppercase">Combo</p>
            <p class="text-2xl font-black text-orange-500">x{{ combo }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500 uppercase">Thời gian</p>
            <p class="text-2xl font-black text-purple-600">
              {{ timeElapsed }}s
            </p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <span
            class="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold"
          >
            {{ matchedCount }}/{{ totalWords }} từ
          </span>
          <button
            @click="useHint"
            :disabled="hintCount <= 0"
            class="bg-purple-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-600 disabled:opacity-50"
          >
            🔍 Hint ({{ hintCount }})
          </button>
        </div>
      </div>

      <!-- Main Play Area -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-137.5">
        <!-- Source Area (English Fixed) -->
        <div
          class="bg-white rounded-2xl border-4 border-blue-400 p-4 overflow-y-auto"
        >
          <div class="mb-2 text-sm font-bold text-blue-500 uppercase">
            🇬🇧 English (Fixed)
          </div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(word, index) in sourceTiles"
              :key="index"
              class="target-tile"
              :class="{
                matched: word.matched,
                highlight: word.highlight,
              }"
              @click="handleFixedTileClick(index)"
            >
              {{ word.matched ? word.target : word.display }}
            </div>
          </div>
        </div>

        <!-- Pool Area (Vietnamese Falling) -->
        <div
          class="relative bg-slate-100 rounded-2xl border-4 border-red-400 overflow-hidden"
        >
          <div
            class="absolute top-2 left-2 text-sm font-bold text-red-500 uppercase z-20"
          >
            🇻🇳 Vietnamese (Falling)
          </div>
          <div
            id="fallingContainer"
            class="falling-words h-full w-full relative"
          >
            <div
              v-for="word in activeFallingWords"
              :key="word.id"
              class="falling-tile"
              :class="{
                selected: selectedFallingId === word.id,
                highlight: word.highlight,
              }"
              :style="{ top: word.top + 'px', left: word.left + '%' }"
              @click="handleFallingWordClick(word)"
            >
              {{ word.text }}
            </div>
          </div>
          <div
            v-if="isStackFull"
            class="absolute bottom-4 left-0 right-0 text-center text-red-600 font-bold animate-bounce z-20 bg-white/80 py-1"
          >
            ⚠️ SẮP ĐẦY!
          </div>
        </div>
      </div>

      <div class="flex justify-center mt-6 gap-4">
        <button
          @click="isPaused = true"
          class="bg-orange-400 text-white px-8 py-3 rounded-2xl font-bold disabled:opacity-50"
          :disabled="isPaused"
        >
          ⏸️ TẠM DỪNG
        </button>
        <button
          @click="resumeGame"
          class="bg-green-400 text-white px-8 py-3 rounded-2xl font-bold disabled:opacity-50"
          :disabled="!isPaused"
        >
          ▶️ TIẾP TỤC
        </button>
      </div>
    </div>

    <!-- Result Modal (Giữ nguyên như code cũ) -->
    <div
      v-if="isGameOver"
      class="fixed inset-0 bg-black/80 z-200 flex items-center justify-center p-4"
    >
      <div
        class="bg-white w-full max-w-md rounded-3xl p-8 text-center animate-bounce-in"
      >
        <h2
          class="text-4xl font-black mb-4"
          :class="gameResult === 'win' ? 'text-green-500' : 'text-red-500'"
        >
          {{ gameResult === "win" ? "CHIẾN THẮNG!" : "GAME OVER" }}
        </h2>
        <div class="bg-gray-100 rounded-2xl p-6 mb-6 text-left space-y-2">
          <p><strong>Điểm số:</strong> {{ score }}</p>
          <p><strong>Thời gian:</strong> {{ timeElapsed }}s</p>
          <p>
            <strong>Độ chính xác:</strong> {{ matchedCount }}/{{ totalWords }}
          </p>
        </div>
        <div class="flex gap-4">
          <button
            @click="startGame"
            class="flex-1 bg-blue-500 text-white py-4 rounded-2xl font-bold"
          >
            CHƠI LẠI
          </button>
          <button
            @click="
              isGameStarted = false;
              isGameOver = false;
            "
            class="flex-1 bg-gray-500 text-white py-4 rounded-2xl font-bold"
          >
            MENU
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from "vue";

/* ================= STATE & CONFIG ================= */
const story = ref(null);
const isGameStarted = ref(false);
const isPaused = ref(false);
const isGameOver = ref(false);
const gameResult = ref("win");
const easyMode = ref(false);

const score = ref(0);
const combo = ref(0);
const timeElapsed = ref(0);
const hintCount = ref(3);
const matchedCount = ref(0);
const totalWords = ref(0);

const sourceTiles = ref([]); // Cố định (Tiếng Anh)
const activeFallingWords = ref([]); // Đang rơi (Tiếng Việt)
const selectedFallingId = ref(null);

let timerInterval = null;
let spawnInterval = null;
let animationId = null;
let wordIdCounter = 0;

const COLUMNS = 3;
const TILE_HEIGHT = 38;
const CONTAINER_HEIGHT = 550;
const columnStacks = ref([[], [], []]);

const handleStoryLoaded = (data) => {
  story.value = data;
};

/* ================= GAME LOGIC ================= */

const startGame = () => {
  if (!story.value) return;
  playSound("start");

  isGameStarted.value = true;
  isGameOver.value = false;
  isPaused.value = false;
  score.value = 0;
  combo.value = 0;
  timeElapsed.value = 0;
  hintCount.value = 3;
  matchedCount.value = 0;
  activeFallingWords.value = [];
  columnStacks.value = [[], [], []];
  wordIdCounter = 0;
  selectedFallingId.value = null;

  // Tách mảng
  const viArray = story.value.vi
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s);
  const enArray = story.value.en
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s);

  totalWords.value = viArray.length;

  // THIẾT LẬP: Tiếng Anh hiển thị cố định, Tiếng Việt là mục tiêu cần tìm
  sourceTiles.value = enArray.map((word, idx) => ({
    display: word, // Hiện Tiếng Anh
    target: viArray[idx], // Đáp án là Tiếng Việt tương ứng
    matched: false,
    highlight: false,
  }));

  // Pool rơi là Tiếng Việt
  const wordPool = [...viArray];

  startTimer();
  startSpawning(wordPool);
  animate();
};

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!isPaused.value && !isGameOver.value) timeElapsed.value++;
  }, 1000);
};

const startSpawning = (pool) => {
  let remainingPool = [...pool];
  if (spawnInterval) clearInterval(spawnInterval);

  spawnInterval = setInterval(() => {
    if (isPaused.value || isGameOver.value || remainingPool.length === 0)
      return;

    const randomIndex = Math.floor(Math.random() * remainingPool.length);
    const wordText = remainingPool.splice(randomIndex, 1)[0];
    const column = Math.floor(Math.random() * COLUMNS);

    activeFallingWords.value.push({
      id: wordIdCounter++,
      text: wordText,
      top: -40,
      left: [5, 38, 70][column],
      speed: 0.8 + Math.random() * 0.8,
      column: column,
      isStacked: false,
      highlight: false,
    });
  }, 2000);
};

const animate = () => {
  // Nếu Game Over HOẶC đang Tạm dừng thì dừng vòng lặp animation
  if (isGameOver.value || isPaused.value) return;

  // Logic cập nhật vị trí các từ (giữ nguyên)
  activeFallingWords.value.forEach((word) => {
    if (word.isStacked) return;

    const stackInCol = columnStacks.value[word.column];
    const bottomLimit =
      CONTAINER_HEIGHT - (stackInCol.length + 1) * TILE_HEIGHT;

    if (word.top < bottomLimit) {
      word.top += word.speed;
    } else {
      word.top = bottomLimit;
      word.isStacked = true;
      columnStacks.value[word.column].push(word);

      if (!easyMode.value && word.top < 50) {
        endGame("lose");
      }
    }
  });

  animationId = requestAnimationFrame(animate);
};

const resumeGame = () => {
  isPaused.value = false;
  animate(); // Chạy lại vòng lặp animation
};

const handleFallingWordClick = (word) => {
  if (isPaused.value) return;
  selectedFallingId.value = word.id;
};

const handleFixedTileClick = (idx) => {
  if (isPaused.value || selectedFallingId.value === null) return;

  const fallingWordObj = activeFallingWords.value.find(
    (w) => w.id === selectedFallingId.value,
  );
  const targetTile = sourceTiles.value[idx];

  if (!fallingWordObj || targetTile.matched) return;

  // So sánh text Tiếng Việt rơi với đáp án Tiếng Việt lưu trong Tile Tiếng Anh
  if (fallingWordObj.text === targetTile.target) {
    playSound("right");
    targetTile.matched = true;
    matchedCount.value++;
    combo.value++;
    score.value += 10 + combo.value * 2;

    removeWordFromGame(fallingWordObj);
    selectedFallingId.value = null;

    if (matchedCount.value === totalWords.value) {
      endGame("win");
    }
  } else {
    playSound("wrong");
    combo.value = 0;
    selectedFallingId.value = null;
  }
};

const removeWordFromGame = (wordObj) => {
  activeFallingWords.value = activeFallingWords.value.filter(
    (w) => w.id !== wordObj.id,
  );
  if (wordObj.isStacked) {
    const col = wordObj.column;
    columnStacks.value[col] = columnStacks.value[col].filter(
      (w) => w.id !== wordObj.id,
    );
    columnStacks.value[col].forEach((w, index) => {
      w.top = CONTAINER_HEIGHT - (index + 1) * TILE_HEIGHT;
    });
  }
};

const useHint = () => {
  playSound("hint");
  if (hintCount.value <= 0) return;

  const available = activeFallingWords.value;
  if (available.length === 0) return;

  const randomWord = available[Math.floor(Math.random() * available.length)];
  randomWord.highlight = true;

  sourceTiles.value.forEach((tile) => {
    if (tile.target === randomWord.text && !tile.matched) {
      tile.highlight = true;
    }
  });

  setTimeout(() => {
    randomWord.highlight = false;
    sourceTiles.value.forEach((t) => (t.highlight = false));
  }, 3000);

  hintCount.value--;
};

const isStackFull = computed(() => {
  return columnStacks.value.some((stack) => stack.length > 8);
});

const endGame = (result) => {
  isGameOver.value = true;
  gameResult.value = result;
  playSound(result === "win" ? "win" : "wrong");
  clearAllIntervals();
};

const confirmExit = () => {
  if (confirm("Bạn có muốn thoát và quay lại màn hình chọn story?")) {
    isGameStarted.value = false;
    clearAllIntervals();
  }
};

const clearAllIntervals = () => {
  if (timerInterval) clearInterval(timerInterval);
  if (spawnInterval) clearInterval(spawnInterval);
  if (animationId) cancelAnimationFrame(animationId);
};

const playSound = (type) => {
  const audio = new Audio(`/mp3/${type}.mp3`);
  audio.play().catch(() => {});
};

onUnmounted(() => {
  clearAllIntervals();
});
</script>

<style lang="scss" scoped>
@use "tailwindcss";

.game-container {
  font-family: "Comic Sans MS", "Arial", sans-serif;
}

.target-tile {
  @apply px-4 py-2 bg-blue-50 border-2 border-blue-500 rounded-xl font-bold text-blue-800 cursor-pointer transition-all hover:scale-105 select-none;
}

.target-tile.matched {
  @apply bg-green-100 border-green-500 text-green-700 cursor-default opacity-80;
}

.target-tile.highlight {
  @apply ring-4 ring-purple-400 animate-pulse;
}

.falling-tile {
  @apply absolute px-3 py-2 bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-xl font-bold shadow-lg cursor-pointer transition-transform whitespace-nowrap z-10 text-sm md:text-base;
}

.falling-tile.selected {
  @apply ring-4 ring-yellow-400 scale-110 z-20;
}

.falling-tile.highlight {
  @apply from-pink-500 to-purple-500 animate-bounce;
}

@keyframes bounce-in {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}

.animate-bounce-in {
  animation: bounce-in 0.5s ease-out;
}
</style>
