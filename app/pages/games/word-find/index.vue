<template>
  <div class="game-container relative min-h-150">
    <!-- NÚT QUAY LẠI -->
    <button
      v-if="isGameStarted && !isGameOver"
      @click="confirmBack = true"
      class="absolute top-4 left-4 p-2 rounded-full hover:bg-white/50 transition-all group z-40"
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
      Word Find
    </div>

    <!-- SELECTION SECTION -->
    <div v-if="!isGameStarted" class="space-y-6 flex flex-col items-center">
      <div
        class="flex flex-col lg:flex-row gap-4 justify-between items-start w-full lg:w-5xl"
      >
        <GamesModeSelection
          :selected-mode="mode"
          :data-mode="dataMode"
          @update:mode="mode = $event"
        />
        <GamesVocabularySelection @update:vocabulary="handleVocabLoaded" />
      </div>

      <!-- Nút Start to rõ -->
      <button
        @click="startGame"
        :disabled="!words.length"
        class="w-full max-w-4xl py-4 bg-[#fcbe5d] text-white text-3xl font-black rounded-3xl shadow-[0_8px_0_#ff9d00] active:shadow-none active:translate-y-2 transition-all disabled:opacity-50"
      >
        🎮 BẮT ĐẦU CHƠI
      </button>
    </div>

    <!-- GAME SECTION -->
    <div v-else class="space-y-4 animate-in zoom-in duration-300">
      <!-- Stats Bar -->
      <div class="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div
          class="bg-white p-3 rounded-2xl border-2 border-[#e8e4da] text-center shadow-sm"
        >
          <div class="text-xs font-bold text-gray-400 uppercase">Điểm số</div>
          <div class="text-2xl font-black text-[#fcbe5d]">{{ score }}</div>
        </div>
        <div
          class="bg-white p-3 rounded-2xl border-2 border-[#e8e4da] text-center shadow-sm relative overflow-hidden"
        >
          <div class="text-xs font-bold text-gray-400 uppercase">Combo</div>
          <div class="text-2xl font-black text-red-500">{{ combo }}x</div>
          <div
            v-if="combo > 1"
            class="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none"
          ></div>
        </div>
        <div
          class="bg-white p-3 rounded-2xl border-2 border-[#e8e4da] text-center shadow-sm"
        >
          <div class="text-xs font-bold text-gray-400 uppercase">Tiến độ</div>
          <div class="text-xl font-black text-emerald-500">
            {{ completedWords.length }}/{{ words.length }}
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div
        class="w-full max-w-2xl mx-auto h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-inner"
      >
        <div
          class="h-full bg-emerald-400 transition-all duration-500"
          :style="{ width: (completedWords.length / words.length) * 100 + '%' }"
        ></div>
      </div>

      <div class="flex flex-col lg:flex-row gap-6 items-center justify-center">
        <!-- Grid Board -->
        <div
          class="grid grid-cols-10 grid-rows-10 gap-1 lg:gap-1.5 p-2 lg:p-3 bg-[#34495e] rounded-2xl lg:rounded-3xl shadow-2xl border-4 lg:border-8 border-[#2c3e50] w-full max-w-[450px] aspect-square"
        >
          <div
            v-for="(cell, index) in grid"
            :key="index"
            @click="selectCell(index)"
            class="relative flex items-center justify-center font-black rounded-md lg:rounded-xl cursor-pointer transition-all duration-200 select-none overflow-hidden aspect-square w-full h-full min-w-0 min-h-0 text-base sm:text-lg lg:text-2xl"
            :class="[
              cell.hasLetter
                ? 'bg-white text-[#555] shadow-[0_2px_0_#cbd5e0] lg:shadow-[0_4px_0_#cbd5e0] active:translate-y-0.5 active:shadow-none'
                : 'bg-[#2c3e50]/50 text-transparent pointer-events-none',
              cell.selected
                ? 'bg-[#fcbe5d]! text-white shadow-[0_2px_0_#e5a543]! lg:shadow-[0_4px_0_#e5a543]! -translate-y-0.5'
                : '',
              cell.isCorrect
                ? 'bg-emerald-400! text-white shadow-none! animate-bounce'
                : '',
              cell.isHint
                ? 'ring-2 lg:ring-4 ring-yellow-400 z-10 scale-105 shadow-xl'
                : '',
            ]"
          >
            <!-- Hiệu ứng lóe sáng khi là Hint -->
            <div
              v-if="cell.isHint"
              class="absolute inset-0 bg-yellow-400/20 animate-pulse"
            ></div>

            <!-- Chữ cái -->
            <span class="leading-none uppercase">{{ cell.letter }}</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex-1 w-full max-w-md space-y-4">
          <div
            class="text-center font-black h-6 transition-all"
            :class="isCorrectFeedback ? 'text-emerald-500' : 'text-red-500'"
          >
            {{ feedback }}
          </div>
          <div
            class="bg-white p-4 lg:p-6 rounded-3xl border-4 border-[#e8e4da] shadow-inner text-center min-h-25 flex flex-col justify-center"
          >
            <div class="text-xs font-bold text-gray-400 uppercase mb-1">
              Từ đang ghép
            </div>
            <div
              class="text-3xl lg:text-4xl font-black text-[#555] tracking-widest uppercase"
            >
              {{ currentInput || "---" }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button
              @click="checkWord"
              class="btn-action bg-emerald-500 border-emerald-700 shadow-[0_5px_0_#059669]"
            >
              KIỂM TRA
            </button>
            <button
              @click="clearSelection"
              class="btn-action bg-orange-400 border-orange-600 shadow-[0_5px_0_#ea580c]"
            >
              XÓA CHỌN
            </button>
            <button
              @click="useHint"
              :disabled="hints <= 0"
              class="btn-action bg-amber-400 border-amber-600 shadow-[0_5px_0_#d97706] disabled:opacity-50"
            >
              GỢI Ý ({{ hints }})
            </button>
            <button
              @click="useReset"
              :disabled="resets <= 0"
              class="btn-action bg-blue-400 border-blue-600 shadow-[0_5px_0_#2563eb] disabled:opacity-50"
            >
              LÀM MỚI ({{ resets }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: START INFO (Nhiệm vụ) -->
    <div
      v-if="showStartMission"
      class="fixed inset-0 z-100 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-[40px] p-8 max-w-lg w-full shadow-2xl border-8 border-[#fcbe5d] animate-in zoom-in duration-300"
      >
        <div class="text-5xl mb-4 text-center">📖</div>
        <h2 class="text-3xl font-black text-[#555] text-center mb-4 italic">
          NHIỆM VỤ CỦA BẠN
        </h2>
        <p class="text-gray-500 text-center mb-6">
          Hãy tìm tất cả các từ vựng sau đây trên lưới chữ:
        </p>

        <div
          class="flex flex-wrap gap-2 justify-center mb-8 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"
        >
          <span
            v-for="word in words"
            :key="word"
            class="px-3 py-1 bg-white border-2 border-gray-200 rounded-full font-bold text-[#555] uppercase text-sm"
          >
            {{ word }}
          </span>
        </div>

        <button
          @click="closeStartMission"
          class="w-full py-4 bg-[#fcbe5d] text-white text-2xl font-black rounded-2xl shadow-[0_6px_0_#ff9d00] active:shadow-none active:translate-y-1 transition-all uppercase"
        >
          Sẵn sàng!
        </button>
      </div>
    </div>

    <!-- MODAL: CONFIRM BACK -->
    <div
      v-if="confirmBack"
      class="fixed inset-0 z-110 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in duration-200"
      >
        <div class="text-4xl mb-4">🏠</div>
        <h3 class="text-2xl font-black text-[#555] mb-2 uppercase italic">
          Thoát Game?
        </h3>
        <p class="text-gray-500 mb-8">
          Tiến độ hiện tại của bạn sẽ không được lưu lại.
        </p>
        <div class="grid grid-cols-2 gap-4">
          <button
            @click="confirmBack = false"
            class="py-3 bg-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-300 transition-all"
          >
            HỦY
          </button>
          <button
            @click="resetGame"
            class="py-3 bg-red-500 text-white font-bold rounded-xl shadow-[0_4px_0_#b91c1c] active:translate-y-1 active:shadow-none transition-all"
          >
            ĐỒNG Ý
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: GAME OVER (Tổng kết) -->
    <div
      v-if="isGameOver"
      class="fixed inset-0 z-120 bg-[#FFFBF0]/95 flex items-center justify-center p-4 backdrop-blur-md"
    >
      <div
        class="max-w-2xl w-full bg-white rounded-[40px] p-8 lg:p-12 shadow-2xl border-8 border-[#fcbe5d] text-center overflow-y-auto max-h-[90vh]"
      >
        <div class="text-7xl mb-4">{{ isFullWin ? "🎉" : "💀" }}</div>
        <h2
          class="text-4xl lg:text-5xl font-black text-[#555] mb-2 italic uppercase"
        >
          {{ isFullWin ? "HOÀN THÀNH!" : "KẾT THÚC!" }}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
          <div
            class="bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200 space-y-2"
          >
            <p class="text-xl font-bold text-gray-600">
              Tổng điểm: <span class="text-[#fcbe5d]">{{ score }}</span>
            </p>
            <p class="text-gray-500">Chế độ: {{ mode.label }}</p>
            <p class="text-gray-500">
              Tiến độ: {{ completedWords.length }}/{{ words.length }} từ
            </p>
          </div>

          <div
            class="bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200"
          >
            <h3 class="font-black text-[#555] mb-2 text-sm uppercase">
              Danh sách từ:
            </h3>
            <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-2">
              <span
                v-for="word in words"
                :key="word"
                class="text-[10px] font-bold px-2 py-0.5 rounded border uppercase"
                :class="
                  completedWords.includes(word)
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-red-50 border-red-200 text-red-600'
                "
              >
                {{ completedWords.includes(word) ? "✓" : "✗" }} {{ word }}
              </span>
            </div>
          </div>
        </div>

        <button
          @click="resetGame"
          class="w-full py-6 bg-[#fcbe5d] text-white text-3xl font-black rounded-3xl shadow-[0_10px_0_#ff9d00] hover:translate-y-1 active:shadow-none transition-all"
        >
          🔄 CHƠI LẠI
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from "vue";

/* ================= STATE ================= */
const dataMode = ref([
  {
    value: "tra-bai",
    icon: "📖",
    label: "TRẢ BÀI",
    color: { border: "border-emerald-500", bg: "bg-emerald-400" },
    description: "Hoàn thành tất cả từ vựng trong bài học đã chọn",
  },
  {
    value: "thi-dua-diem-cao",
    icon: "🏆",
    label: "THI ĐUA",
    color: { border: "border-blue-500", bg: "bg-blue-400" },
    description: "Tốc độ nhanh hơn, thử thách điểm số cao hơn",
  },
]);

const mode = ref(dataMode.value[0]);
const words = ref([]);
const grid = ref([]);
const isGameStarted = ref(false);
const isGameOver = ref(false);
const showStartMission = ref(false); // Popup nhiệm vụ
const confirmBack = ref(false); // Popup xác nhận quay lại

const score = ref(0);
const combo = ref(0);
const hints = ref(5);
const resets = ref(3);
const completedWords = ref([]);
const selectedIndices = ref([]);
const feedback = ref("");
const isCorrectFeedback = ref(false);
const spawnTimer = ref(null);
let hintTimer = null;

/* ================= COMPUTED ================= */
const currentInput = computed(() => {
  return selectedIndices.value.map((idx) => grid.value[idx].letter).join("");
});

const isFullWin = computed(() => {
  return (
    words.value.length > 0 && completedWords.value.length === words.value.length
  );
});

/* ================= METHODS ================= */

const handleVocabLoaded = (list) => {
  words.value = list.map((item) => item.en.toLowerCase());
};

const startGame = () => {
  if (words.value.length === 0) return;

  isGameStarted.value = true;
  isGameOver.value = false;
  score.value = 0;
  combo.value = 0;
  hints.value = 5;
  resets.value = 3;
  completedWords.value = [];
  selectedIndices.value = [];

  initGrid();
  for (let i = 0; i < 3; i++) spawnRandomWord();

  // Nếu là chế độ trả bài, hiện popup nhiệm vụ trước
  if (mode.value.value === "tra-bai") {
    showStartMission.value = true;
  } else {
    startSpawning();
  }
};

const closeStartMission = () => {
  showStartMission.value = false;
  startSpawning();
};

const initGrid = () => {
  grid.value = Array.from({ length: 100 }, () => ({
    letter: "",
    hasLetter: false,
    selected: false,
    isCorrect: false,
    isHint: false,
  }));
};

const startSpawning = () => {
  stopSpawning();
  const speed = mode.value.value === "thi-dua-diem-cao" ? 2500 : 4500;
  spawnTimer.value = setInterval(() => {
    if (!isGameOver.value && !showStartMission.value && !confirmBack.value) {
      spawnSingleLetter();
    }
  }, speed);
};

const stopSpawning = () => {
  if (spawnTimer.value) clearInterval(spawnTimer.value);
};

const spawnSingleLetter = () => {
  const emptyCells = grid.value
    .map((cell, idx) => (!cell.hasLetter ? idx : null))
    .filter((val) => val !== null);

  if (emptyCells.length === 0) {
    gameOver();
    return;
  }

  const remaining = words.value.filter(
    (w) => !completedWords.value.includes(w),
  );
  if (remaining.length === 0) return;

  const targetWord = remaining[Math.floor(Math.random() * remaining.length)];
  const char = targetWord[Math.floor(Math.random() * targetWord.length)];

  const targetIdx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  grid.value[targetIdx].letter = char.toUpperCase();
  grid.value[targetIdx].hasLetter = true;
};

const spawnRandomWord = () => {
  const remaining = words.value.filter(
    (w) => !completedWords.value.includes(w),
  );
  if (remaining.length === 0) return;
  const word = remaining[Math.floor(Math.random() * remaining.length)];

  word.split("").forEach((char) => {
    const emptyCells = grid.value
      .map((cell, idx) => (!cell.hasLetter ? idx : null))
      .filter((val) => val !== null);

    if (emptyCells.length > 0) {
      const idx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      grid.value[idx].letter = char.toUpperCase();
      grid.value[idx].hasLetter = true;
    }
  });
};

const selectCell = (index) => {
  if (
    !grid.value[index].hasLetter ||
    grid.value[index].isCorrect ||
    showStartMission.value ||
    confirmBack.value
  )
    return;

  const foundAt = selectedIndices.value.indexOf(index);
  if (foundAt > -1) {
    selectedIndices.value.splice(foundAt, 1);
    grid.value[index].selected = false;
  } else {
    selectedIndices.value.push(index);
    grid.value[index].selected = true;
  }
};

const checkWord = () => {
  const input = currentInput.value.toLowerCase();

  if (words.value.includes(input) && !completedWords.value.includes(input)) {
    isCorrectFeedback.value = true;
    feedback.value = "🎉 CHÍNH XÁC!";
    completedWords.value.push(input);

    combo.value++;
    const bonus = combo.value > 1 ? combo.value * 15 : 0;
    score.value += input.length * 20 + bonus;

    selectedIndices.value.forEach((idx) => {
      grid.value[idx].isCorrect = true;
      grid.value[idx].selected = false;
    });

    setTimeout(() => {
      selectedIndices.value.forEach((idx) => {
        grid.value[idx] = {
          letter: "",
          hasLetter: false,
          selected: false,
          isCorrect: false,
          isHint: false,
        };
      });
      selectedIndices.value = [];
      if (completedWords.value.length === words.value.length) gameOver();
      else spawnSingleLetter();
    }, 600);
  } else {
    isCorrectFeedback.value = false;
    feedback.value = "❌ SAI RỒI!";
    combo.value = 0;
    setTimeout(() => (feedback.value = ""), 2000);
  }
};

const clearSelection = () => {
  selectedIndices.value.forEach((idx) => (grid.value[idx].selected = false));
  selectedIndices.value = [];
};

const useHint = () => {
  if (hints.value <= 0 || isGameOver.value) return;

  const remainingWords = words.value.filter(
    (w) => !completedWords.value.includes(w),
  );
  let targetWord = null;
  let targetIndices = [];

  for (const word of remainingWords) {
    const wordChars = word.toUpperCase().split("");
    const foundIndices = [];
    let tempGrid = grid.value.map((cell, index) => ({ ...cell, index }));

    let canForm = true;
    for (const char of wordChars) {
      const cellIdx = tempGrid.findIndex(
        (c) => c.hasLetter && c.letter === char && !c.isCorrect,
      );
      if (cellIdx !== -1) {
        foundIndices.push(tempGrid[cellIdx].index);
        tempGrid[cellIdx].hasLetter = false;
      } else {
        canForm = false;
        break;
      }
    }

    if (canForm) {
      targetWord = word;
      targetIndices = foundIndices;
      break;
    }
  }

  if (targetWord) {
    if (hintTimer) clearTimeout(hintTimer);
    grid.value.forEach((cell) => (cell.isHint = false));

    targetIndices.forEach((idx) => {
      grid.value[idx].isHint = true;
    });
    hints.value--;
    isCorrectFeedback.value = true;
    feedback.value = `💡 GỢI Ý: ${targetWord.toUpperCase()}`;

    hintTimer = setTimeout(() => {
      grid.value.forEach((cell) => (cell.isHint = false));
      if (feedback.value.includes("GỢI Ý")) feedback.value = "";
    }, 8000);
  } else {
    isCorrectFeedback.value = false;
    feedback.value = "⏳ CHỜ CHỮ TIẾP THEO!";
    setTimeout(() => (feedback.value = ""), 2000);
  }
};

const useReset = () => {
  if (resets.value <= 0) return;
  resets.value--;
  initGrid();
  for (let i = 0; i < 4; i++) spawnRandomWord();
};

const gameOver = () => {
  stopSpawning();
  isGameOver.value = true;
};

const resetGame = () => {
  stopSpawning();
  isGameStarted.value = false;
  isGameOver.value = false;
  confirmBack.value = false;
};

onUnmounted(stopSpawning);
</script>

<style scoped>
.grid-cols-10 {
  grid-template-columns: repeat(10, minmax(0, 1fr));
}
.grid-rows-10 {
  grid-template-rows: repeat(10, minmax(0, 1fr));
}
</style>
