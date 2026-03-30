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
      <img
        src="/games/scrambled-word.png"
        class="w-20 object-cover animate-pulse"
      />
      Scrambled Word
    </div>

    <!-- SELECTION SECTION -->
    <div v-if="!isGameStarted" class="space-y-6 flex flex-col items-center">
      <div
        class="flex flex-col lg:flex-row gap-4 startGame items-start w-full lg:w-5xl"
      >
        <div class="w-full lg:min-w-1/3 lg:w-1/3">
          <GamesModeSelection
            :selected-mode="mode"
            :data-mode="dataMode"
            @update:mode="mode = $event"
          />
        </div>
        <div class="w-full lg:min-w-1/3 lg:w-1/3">
          <GamesDifficultyLevelSelection @update:level="level = $event" />
        </div>
        <div class="w-full lg:min-w-1/3 lg:w-1/3">
          <GamesVocabularySelection @update:vocabulary="handleVocabLoaded" />
        </div>
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

    <!-- GAME SECTION (Compact & Modern) -->
    <div
      v-else
      class="relative space-y-4 animate-in fade-in zoom-in duration-300"
    >
      <!-- Bảng điểm & Timer -->
      <div class="flex items-center justify-between gap-4">
        <!-- Team Red -->
        <div
          v-if="mode.value === '2teams'"
          class="flex-1 bg-red-100 p-2 rounded-2xl border-b-4 border-red-300 text-center"
        >
          <div class="text-red-500 font-black text-xl">🔴 RED</div>
          <div class="text-4xl font-black text-red-600">{{ scores.red }}</div>
        </div>

        <!-- Solo -->
        <div
          v-else
          class="flex-1 bg-green-100 p-2 rounded-2xl border-b-4 border-green-300 text-center"
        >
          <div class="text-green-500 font-black text-xl">🎯 SCORE</div>
          <div class="text-4xl font-black text-green-600">
            {{ scores.solo }}
          </div>
        </div>

        <!-- Timer tròn -->
        <div
          class="relative flex items-center justify-center w-28 h-28 bg-white rounded-full border-8 transition-colors duration-300"
          :class="
            timeLeft <= 10 ? 'border-red-500 animate-pulse' : 'border-[#fcbe5d]'
          "
        >
          <span class="text-4xl font-black text-[#555]">{{ timeLeft }}</span>
        </div>

        <!-- Team Blue -->
        <div
          v-if="mode.value === '2teams'"
          class="flex-1 bg-blue-100 p-2 rounded-2xl border-b-4 border-blue-300 text-center"
        >
          <div class="text-blue-500 font-black text-xl">🔵 BLUE</div>
          <div class="text-4xl font-black text-blue-600">{{ scores.blue }}</div>
        </div>
      </div>

      <!-- Tiến độ & Level -->
      <div
        class="flex justify-between items-center px-4 font-bold text-gray-500 uppercase tracking-widest text-sm"
      >
        <span>TỪ: {{ currentIndex + 1 }} / {{ words.length }}</span>
        <span class="px-3 py-1 bg-gray-200 rounded-lg">{{ level }}</span>
      </div>

      <!-- Hint Box -->
      <div
        class="bg-white p-2 rounded-[40px] border-4 border-[#e8e4da] shadow-inner text-center relative overflow-hidden"
      >
        <div
          class="absolute top-0 left-0 bg-[#fcbe5d] text-white px-4 py-1 text-xs font-black rounded-br-2xl uppercase"
        >
          💡 Hint
        </div>
        <div class="text-xl lg:text-3xl font-black text-[#555] italic">
          {{ currentWordData?.hint }} {{ currentWordData?.icon }}
        </div>
      </div>

      <!-- Scrambled Letters -->
      <div class="flex flex-wrap justify-center gap-3">
        <button
          v-for="(letter, index) in scrambledLetters"
          :key="index"
          @click="selectLetter(letter, index)"
          :disabled="letter.used || isCorrect"
          class="w-14 h-14 lg:w-20 lg:h-20 bg-white border-b-8 border-gray-300 active:border-b-0 rounded-2xl text-3xl lg:text-4xl font-black text-[#555] shadow-lg transition-all enabled:hover:-translate-y-1 disabled:opacity-20"
        >
          {{ letter.char }}
        </button>
      </div>

      <!-- Answer Slots -->
      <div class="flex justify-center gap-2 min-h-22.5">
        <div
          v-for="(slot, index) in answerSlots"
          :key="index"
          class="w-12 h-16 lg:w-16 lg:h-20 border-b-8 flex items-center justify-center text-4xl lg:text-5xl font-black transition-all"
          :class="[
            slot.prefilled
              ? 'text-[#fcbe5d] border-[#fcbe5d]'
              : 'text-[#555] border-gray-400',
            isCorrect ? 'text-green-500 border-green-500 animate-bounce' : '',
          ]"
        >
          {{ slot.val }}
        </div>
      </div>

      <!-- Feedback & Controls -->
      <div class="space-y-4">
        <div
          class="flex flex-col lg:flex-row justify-center items-center gap-4"
        >
          <div
            v-if="feedback"
            class="text-center font-black text-2xl"
            :class="isCorrect ? 'text-green-500' : 'text-red-500'"
          >
            {{ feedback }}
          </div>

          <!-- Scoring Options (Correct only) -->
          <div
            v-if="isCorrect && !showNextButton"
            class="flex justify-center gap-4 animate-bounce-in"
          >
            <template v-if="mode.value === '2teams'">
              <button @click="addScore('red')" class="btn-score bg-red-500">
                + RED
              </button>
              <button @click="addScore('blue')" class="btn-score bg-blue-500">
                + BLUE
              </button>
            </template>
            <button
              v-else
              @click="addScore('solo')"
              class="btn-score bg-green-500"
            >
              + SCORE
            </button>
            <button @click="openGift()" class="btn-score bg-purple-500 italic">
              🎁 GIFT
            </button>
          </div>
        </div>

        <!-- Big Next Button -->
        <button
          v-if="showNextButton"
          @click="nextWord"
          class="w-full py-2 bg-green-500 text-white text-3xl font-black rounded-3xl shadow-[0_8px_0_green] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          TIẾP THEO ➡️
        </button>

        <!-- Standard Actions -->
        <div v-else class="grid grid-cols-3 gap-4">
          <button
            @click="checkAnswer"
            class="btn-game bg-green-500 border-green-700"
          >
            ✓ CHECK
          </button>
          <button
            @click="clearAnswer"
            class="btn-game bg-orange-400 border-orange-600"
          >
            🔄 CLEAR
          </button>
          <button
            @click="skipWord"
            class="btn-game bg-gray-400 border-gray-600"
          >
            ⏭️ SKIP
          </button>
        </div>
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

    <!-- GIFT MODAL -->
    <div
      v-if="showGiftModal"
      class="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        class="bg-white rounded-[40px] p-10 max-w-sm w-full text-center border-8 border-purple-200 shadow-2xl relative"
      >
        <div class="text-8xl mb-4 animate-tada">🎁</div>
        <h2 class="text-3xl font-black text-purple-600 mb-2">
          {{ giftContent.title }}
        </h2>
        <p class="text-gray-500 font-bold mb-8">{{ giftContent.desc }}</p>

        <div v-if="mode.value === '2teams'" class="grid grid-cols-2 gap-4">
          <button
            @click="applyGift('red')"
            class="py-4 bg-red-500 text-white font-black rounded-2xl hover:scale-105 transition-transform"
          >
            🔴 RED
          </button>
          <button
            @click="applyGift('blue')"
            class="py-4 bg-blue-500 text-white font-black rounded-2xl hover:scale-105 transition-transform"
          >
            🔵 BLUE
          </button>
        </div>
        <button
          v-else
          @click="applyGift('solo')"
          class="w-full py-4 bg-purple-500 text-white font-black rounded-2xl hover:scale-105 transition-transform"
        >
          NHẬN QUÀ 🌟
        </button>
      </div>
    </div>

    <!-- WINNER MODAL -->
    <div
      v-if="isGameOver"
      class="fixed inset-0 z-100 flex items-center justify-center bg-[#FFFBF0] p-4 lg:p-10"
    >
      <div
        class="max-w-4xl w-full bg-white rounded-[50px] p-8 lg:p-12 shadow-2xl border-8 border-[#fcbe5d] overflow-y-auto max-h-[90vh] custom-scrollbar"
      >
        <div class="text-center mb-10">
          <h2 class="text-5xl lg:text-7xl font-black text-[#555] mb-4 italic">
            CONGRATS! 🎉
          </h2>
          <div class="text-3xl font-black" :class="winnerInfo.color">
            {{ winnerInfo.text }}
          </div>
        </div>

        <!-- Word Review List -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div
            v-for="(res, idx) in gameResults"
            :key="idx"
            class="flex items-center gap-4 p-4 rounded-2xl border-2"
            :class="
              res.correct
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            "
          >
            <div class="text-2xl">{{ res.correct ? "✅" : "❌" }}</div>
            <div class="flex-1">
              <div class="font-black text-lg uppercase">{{ res.word }}</div>
              <div class="text-sm font-bold text-gray-500">{{ res.hint }}</div>
            </div>
            <div class="font-black text-[#fcbe5d]">+{{ res.points }}</div>
          </div>
        </div>

        <button
          @click="resetGame"
          class="w-full py-6 bg-[#fcbe5d] text-white text-3xl font-black rounded-[30px] shadow-[0_10px_0_#e5a543] hover:shadow-none hover:translate-y-2 transition-all"
        >
          🔄 CHƠI LẠI
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from "vue";

/* ================= STATE ================= */
const dataMode = ref([
  {
    value: "solo",
    icon: "🧍",
    label: "SOLO PLAYER",
    color: {
      border: "border-emerald-500",
      bg: "bg-emerald-400",
    },
    description: "Play alone and beat your own high score!",
  },
  {
    value: "2teams",
    icon: "🧑‍🤝‍🧑",
    label: "2 TEAMS",
    color: {
      border: "border-blue-500",
      bg: "bg-blue-400",
    },
    description: "Compete with friends - Red team vs Blue team!",
  },
]);
const mode = ref(dataMode.value[1]);
const level = ref("medium");
const vocabList = ref([]);
const words = ref([]);

const isGameStarted = ref(false);
const currentIndex = ref(0);
const timeLeft = ref(50);
const timerInterval = ref(null);
const feedback = ref("");
const isCorrect = ref(false);
const showNextButton = ref(false);
const showGiftModal = ref(false);
const isGameOver = ref(false);
const confirmBack = ref(false); // Popup xác nhận quay lại

const scores = ref({ red: 0, blue: 0, solo: 0 });
const currentAnswer = ref([]);
const scrambledLetters = ref([]);
const gameResults = ref([]);
const giftType = ref("");

/* ================= COMPUTED ================= */
const currentWordData = computed(() => words.value[currentIndex.value] || null);

const answerSlots = computed(() => {
  if (!currentWordData.value) return [];
  const word = currentWordData.value.word;
  const slots = Array(word.length)
    .fill(null)
    .map(() => ({ val: "", prefilled: false }));

  // Easy mode prefill
  if (level.value === "easy") {
    slots[0] = { val: word[0], prefilled: true };
    slots[word.length - 1] = { val: word[word.length - 1], prefilled: true };
  }

  let userIdx = 0;
  for (let i = 0; i < slots.length; i++) {
    if (!slots[i].prefilled && userIdx < currentAnswer.value.length) {
      slots[i].val = currentAnswer.value[userIdx];
      userIdx++;
    }
  }
  return slots;
});

const giftContent = computed(() => {
  const gifts = {
    half: {
      title: "OOPS!",
      desc: "Bạn bị chia đôi số điểm từ câu này!",
      emoji: "😢",
    },
    double: {
      title: "JACKPOT!",
      desc: "Điểm câu này được NHÂN ĐÔI!",
      emoji: "🎊",
    },
    bonus: { title: "BONUS!", desc: "Nhận thêm 5 điểm thưởng!", emoji: "🌟" },
  };
  return gifts[giftType.value] || { title: "QUÀ TẶNG", desc: "Đang mở quà..." };
});

const winnerInfo = computed(() => {
  if (mode.value.value === "solo")
    return {
      text: `BẠN ĐẠT ${scores.value.solo} ĐIỂM!`,
      color: "text-green-500",
    };
  if (scores.value.red > scores.value.blue)
    return { text: "🔴 ĐỘI ĐỎ CHIẾN THẮNG!", color: "text-red-500" };
  if (scores.value.blue > scores.value.red)
    return { text: "🔵 ĐỘI XANH CHIẾN THẮNG!", color: "text-blue-500" };
  return { text: "🤝 KẾT QUẢ HÒA!", color: "text-orange-500" };
});

/* ================= METHODS ================= */
const handleVocabLoaded = (list) => {
  vocabList.value = list;
  words.value = list.map((v) => ({ word: v.en, hint: v.vi, icon: v.emoji }));
};

const startGame = () => {
  if (!words.value.length) return;
  playSound("start");
  isGameStarted.value = true;
  currentIndex.value = 0;
  scores.value = { red: 0, blue: 0, solo: 0 };
  gameResults.value = [];
  loadWord();
};

const loadWord = () => {
  isCorrect.value = false;
  showNextButton.value = false;
  feedback.value = "";
  currentAnswer.value = [];
  timeLeft.value = 50;
  generateScrambledLetters();
  startTimer();
};

const generateScrambledLetters = () => {
  const word = currentWordData.value.word;
  let chars = word.split("");

  if (level.value === "easy") chars = chars.slice(1, -1);

  if (level.value === "hard") {
    const extra = "abcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < 3; i++)
      chars.push(extra[Math.floor(Math.random() * 26)]);
  }

  scrambledLetters.value = chars
    .sort(() => Math.random() - 0.5)
    .map((c) => ({ char: c, used: false }));
};

const selectLetter = (letterObj) => {
  if (isCorrect.value) return;
  playSound("click");
  currentAnswer.value.push(letterObj.char);
  letterObj.used = true;
};

const checkAnswer = () => {
  const ans = answerSlots.value
    .map((s) => s.val)
    .join("")
    .toLowerCase();
  const target = currentWordData.value.word.toLowerCase();

  if (ans === target) {
    isCorrect.value = true;
    feedback.value = "🎉 CHÍNH XÁC! TUYỆT VỜI!";
    playSound("right");
    stopTimer();
  } else {
    feedback.value = "❌ SAI RỒI, THỬ LẠI NHÉ!";
    playSound("wrong");
    setTimeout(() => {
      feedback.value = "";
      clearAnswer();
    }, 2000);
  }
};

const clearAnswer = () => {
  currentAnswer.value = [];
  scrambledLetters.value.forEach((l) => (l.used = false));
};

const skipWord = () => {
  stopTimer();
  saveResult(false, 0);
  feedback.value = "⏭️ ĐÃ BỎ QUA TỪ NÀY";
  playSound("reset");
  showNextButton.value = true;
};

const addScore = (target) => {
  const pts =
    currentWordData.value.word.length + Math.floor(timeLeft.value / 10);
  scores.value[target] += pts;
  saveResult(true, pts);
  showNextButton.value = true;
};

const openGift = () => {
  const types = ["half", "double", "bonus"];
  giftType.value = types[Math.floor(Math.random() * types.length)];
  showGiftModal.value = true;
};

const applyGift = (target) => {
  let pts = currentWordData.value.word.length + Math.floor(timeLeft.value / 10);
  if (giftType.value === "half") pts = Math.floor(pts / 2);
  if (giftType.value === "double") pts *= 2;
  if (giftType.value === "bonus") pts += 5;

  scores.value[target] += pts;
  saveResult(true, pts);
  showGiftModal.value = false;
  showNextButton.value = true;
};

const saveResult = (correct, pts) => {
  gameResults.value.push({
    word: currentWordData.value.word,
    hint: currentWordData.value.hint,
    correct,
    points: pts,
  });
};

const nextWord = () => {
  if (currentIndex.value < words.value.length - 1) {
    currentIndex.value++;
    loadWord();
  } else {
    playSound("win");
    isGameOver.value = true;
    stopTimer();
  }
};

const resetGame = () => {
  stopTimer();
  isGameStarted.value = false;
  isGameOver.value = false;
  confirmBack.value = false;
  // Tùy chọn: reset các trạng thái khác nếu muốn
  currentIndex.value = 0;
  scores.value = { red: 0, blue: 0, solo: 0 };
  gameResults.value = [];
  playSound("reset");
};

const startTimer = () => {
  stopTimer();
  timerInterval.value = setInterval(() => {
    if (timeLeft.value > 0) timeLeft.value--;
    else {
      stopTimer();
      feedback.value = "⏰ HẾT GIỜ RỒI!";
      saveResult(false, 0);
      showNextButton.value = true;
    }
  }, 1000);
};

const stopTimer = () => clearInterval(timerInterval.value);

const playSound = (type) => {
  const audio = new Audio(`/mp3/${type}.mp3`);
  audio.play().catch(() => {});
};

onUnmounted(stopTimer);
</script>
