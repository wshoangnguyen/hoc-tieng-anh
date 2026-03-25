<template>
  <div class="game-container relative min-h-150 font-sans selection:bg-none">
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
        src="/games/sentence-builder.png"
        class="w-20 object-cover animate-pulse"
      />
      Sentence Builder
    </div>

    <!-- 2. SELECTION SECTION (CÀI ĐẶT) -->
    <div v-if="!isGameStarted" class="space-y-6 flex flex-col items-center">
      <div
        class="flex flex-col lg:flex-row gap-4 justify-between items-start w-full lg:w-5xl"
      >
        <GamesModeSelection
          :selected-mode="mode"
          :data-mode="dataMode"
          @update:mode="mode = $event"
        />
        <GamesDifficultyLevelSelection @update:level="level = $event" />
        <GamesSentencesSelection @update:sentences="handleSentencesLoaded" />
      </div>

      <button
        @click="startGame"
        :disabled="!sentences.length"
        class="w-full max-w-4xl py-4 bg-[#fcbe5d] text-white text-3xl font-black rounded-3xl shadow-[0_8px_0_#ff9d00] active:shadow-none active:translate-y-2 transition-all disabled:opacity-50"
      >
        🎮 BẮT ĐẦU CHƠI
      </button>
    </div>

    <!-- 3. GAME SECTION (MÀN HÌNH CHƠI) -->
    <div
      v-else
      class="relative space-y-4 animate-in fade-in zoom-in duration-300"
    >
      <!-- Scoreboard & Timer -->
      <div class="flex items-center justify-between gap-4">
        <div
          v-if="mode.value === '2teams'"
          class="flex-1 bg-red-100 p-2 rounded-2xl border-b-4 border-red-300 text-center"
        >
          <div class="text-red-500 font-black text-xl">🔴 RED</div>
          <div class="text-4xl font-black text-red-600">{{ scores.red }}</div>
        </div>
        <div
          v-else
          class="flex-1 bg-green-100 p-2 rounded-2xl border-b-4 border-green-300 text-center"
        >
          <div class="text-green-500 font-black text-xl">🎯 SCORE</div>
          <div class="text-4xl font-black text-green-600">
            {{ scores.solo }}
          </div>
        </div>

        <div
          class="relative flex items-center justify-center w-28 h-28 bg-white rounded-full border-8 transition-colors duration-300"
          :class="
            timeLeft <= 10 ? 'border-red-500 animate-pulse' : 'border-[#fcbe5d]'
          "
        >
          <span class="text-4xl font-black text-[#555]">{{ timeLeft }}</span>
        </div>

        <div
          v-if="mode.value === '2teams'"
          class="flex-1 bg-blue-100 p-2 rounded-2xl border-b-4 border-blue-300 text-center"
        >
          <div class="text-blue-500 font-black text-xl">🔵 BLUE</div>
          <div class="text-4xl font-black text-blue-600">{{ scores.blue }}</div>
        </div>
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
        <div class="mt-2 space-y-1">
          <div class="text-xl lg:text-3xl font-black text-indigo-600">
            {{ currentSentenceData?.formula }}
          </div>
          <div class="text-lg lg:text-2xl text-gray-500 font-bold italic">
            "{{ currentSentenceData?.vi }}"
          </div>
        </div>
      </div>

      <!-- Word Pool -->
      <div class="flex flex-wrap justify-center gap-3 mb-1">
        <button
          v-for="(word, index) in shuffledWords"
          :key="index"
          @click="selectWord(word, index)"
          :disabled="word.used || isCorrect"
          class="px-4 py-2 lg:px-6 lg:py-3 bg-white border-b-4 border-gray-300 active:border-b-0 rounded-xl text-lg lg:text-2xl font-black text-[#555] shadow-md transition-all enabled:hover:-translate-y-1 disabled:opacity-20"
        >
          {{ word.text }}
        </button>
      </div>

      <!-- Answer Area -->
      <div class="flex flex-wrap justify-center gap-2">
        <div
          v-for="(slot, index) in answerSlots"
          :key="index"
          @click="removeWord(index)"
          class="min-w-24 h-14 lg:h-18 px-4 border-b-4 flex items-center justify-center text-xl lg:text-3xl font-black transition-all cursor-pointer"
          :class="[
            slot.prefilled
              ? 'text-[#fcbe5d] border-[#fcbe5d]'
              : 'text-[#555] border-gray-300 hover:border-indigo-400',
            slot.val ? 'bg-indigo-50/50 rounded-t-xl' : '',
            isCorrect ? 'text-green-500 border-green-500 animate-bounce' : '',
          ]"
        >
          {{ slot.val }}
        </div>
      </div>

      <!-- Controls & Feedback -->
      <div class="space-y-4">
        <div
          class="flex flex-col lg:flex-row justify-center items-center gap-4 min-h-12"
        >
          <div
            v-if="feedback"
            class="text-center font-black text-2xl"
            :class="isCorrect ? 'text-green-500' : 'text-red-500'"
          >
            {{ feedback }}
          </div>

          <div
            v-if="isCorrect && !showNextButton"
            class="flex justify-center gap-4 animate-bounce-in"
          >
            <template v-if="mode.value === '2teams'">
              <button @click="addScore('red')" class="btn-score bg-red-500">
                + ĐỎ
              </button>
              <button @click="addScore('blue')" class="btn-score bg-blue-500">
                + XANH
              </button>
            </template>
            <button
              v-else
              @click="addScore('solo')"
              class="btn-score bg-green-500"
            >
              + ĐIỂM
            </button>
            <button @click="openGift" class="btn-score bg-purple-500">
              🎁 QUÀ
            </button>
          </div>
        </div>

        <button
          v-if="showNextButton"
          @click="nextSentence"
          class="w-full py-4 bg-green-500 text-white text-3xl font-black rounded-3xl shadow-[0_8px_0_green]"
        >
          CÂU TIẾP THEO ➡️
        </button>

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
            🔄 XÓA
          </button>
          <button
            @click="skipSentence"
            class="btn-game bg-gray-400 border-gray-600"
          >
            ⏭️ SKIP
          </button>
        </div>
      </div>
    </div>

    <!-- 4. MODAL: CONFIRM BACK (THOÁT) -->
    <div
      v-if="confirmBack"
      class="fixed inset-0 z-110 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
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
            class="py-3 bg-red-500 text-white font-bold rounded-xl shadow-[0_4px_0_#b91c1c]"
          >
            ĐỒNG Ý
          </button>
        </div>
      </div>
    </div>

    <!-- 5. MODAL: GIFT (QUÀ TẶNG) -->
    <div
      v-if="showGiftModal"
      class="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        class="bg-white rounded-[40px] p-10 max-w-sm w-full text-center border-8 border-purple-200 shadow-2xl"
      >
        <div class="text-8xl mb-4 animate-bounce">🎁</div>
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
          NHẬN 🌟
        </button>
      </div>
    </div>

    <!-- 6. MODAL: WINNER (KẾT QUẢ CUỐI CÙNG) -->
    <div
      v-if="isGameOver"
      class="fixed inset-0 z-100 flex items-center justify-center bg-[#FFFBF0] p-4 lg:p-10"
    >
      <div
        class="max-w-4xl w-full bg-white rounded-[50px] p-8 lg:p-12 shadow-2xl border-8 border-[#fcbe5d] overflow-y-auto max-h-[90vh]"
      >
        <div class="text-center mb-10">
          <h2 class="text-5xl lg:text-7xl font-black text-[#555] mb-4 italic">
            FINISHED! 🎉
          </h2>
          <div class="text-3xl font-black" :class="winnerInfo.color">
            {{ winnerInfo.text }}
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 mb-10">
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
              <div class="font-black text-lg text-[#555]">
                {{ res.sentence }}
              </div>
              <div class="text-sm font-bold text-gray-400">{{ res.vi }}</div>
            </div>
            <div class="font-black text-[#fcbe5d]">+{{ res.points }}</div>
          </div>
        </div>

        <button
          @click="resetGame"
          class="w-full py-6 bg-[#fcbe5d] text-white text-3xl font-black rounded-[30px] shadow-[0_10px_0_#e5a543]"
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
const level = ref("normal");
const sentences = ref([]);

const isGameStarted = ref(false);
const currentIndex = ref(0);
const timeLeft = ref(60);
const timerInterval = ref(null);
const feedback = ref("");
const isCorrect = ref(false);
const showNextButton = ref(false);
const showGiftModal = ref(false);
const isGameOver = ref(false);
const confirmBack = ref(false);

const scores = ref({ red: 0, blue: 0, solo: 0 });
const currentAnswer = ref([]);
const shuffledWords = ref([]);
const gameResults = ref([]);
const giftType = ref("");

/* ================= COMPUTED ================= */
const currentSentenceData = computed(
  () => sentences.value[currentIndex.value] || null,
);

const answerSlots = computed(() => {
  if (!currentSentenceData.value) return [];
  const correctArr = currentSentenceData.value.en2.split(" ");
  const slots = Array(correctArr.length)
    .fill(null)
    .map(() => ({ val: "", prefilled: false }));

  if (level.value === "easy" && correctArr.length > 2) {
    slots[0] = { val: correctArr[0], prefilled: true };
    slots[1] = { val: correctArr[1], prefilled: true };
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
    half: { title: "OOPS!", desc: "Số điểm câu này bị chia đôi!", emoji: "😢" },
    double: {
      title: "JACKPOT!",
      desc: "Điểm câu này được NHÂN ĐÔI!",
      emoji: "🎊",
    },
    bonus: { title: "BONUS!", desc: "Nhận thêm 5 điểm thưởng!", emoji: "🌟" },
  };
  return gifts[giftType.value] || { title: "QUÀ", desc: "Đang mở..." };
});

const winnerInfo = computed(() => {
  if (mode.value.value === "solo")
    return { text: `SCORE: ${scores.value.solo}`, color: "text-green-500" };
  if (scores.value.red > scores.value.blue)
    return { text: "🔴 RED TEAM WINS!", color: "text-red-500" };
  if (scores.value.blue > scores.value.red)
    return { text: "🔵 BLUE TEAM WINS!", color: "text-blue-500" };
  return { text: "🤝 DRAW!", color: "text-orange-500" };
});

/* ================= METHODS ================= */
const handleSentencesLoaded = (list) => {
  sentences.value = list;
};

const startGame = () => {
  if (!sentences.value.length) return;
  isGameStarted.value = true;
  currentIndex.value = 0;
  scores.value = { red: 0, blue: 0, solo: 0 };
  gameResults.value = [];
  loadSentence();
};

const loadSentence = () => {
  isCorrect.value = false;
  showNextButton.value = false;
  feedback.value = "";
  currentAnswer.value = [];
  timeLeft.value = 60;
  prepareWordPool();
  startTimer();
};

const prepareWordPool = () => {
  const data = currentSentenceData.value;
  let words = data.en1.split(" ");
  if (level.value === "hard") {
    words.push(...["is", "the", "it"].filter((w) => !words.includes(w)));
  }
  shuffledWords.value = words
    .sort(() => Math.random() - 0.5)
    .map((w) => ({ text: w, used: false }));
  if (level.value === "easy") {
    const pre = data.en2.split(" ").slice(0, 2);
    pre.forEach((w) => {
      const found = shuffledWords.value.find((i) => i.text === w && !i.used);
      if (found) found.used = true;
    });
  }
};

const selectWord = (wordObj) => {
  const targetLen = currentSentenceData.value.en2.split(" ").length;
  const currentTotal = answerSlots.value.filter((s) => s.val !== "").length;
  if (currentTotal < targetLen) {
    currentAnswer.value.push(wordObj.text);
    wordObj.used = true;
  }
};

const removeWord = (idx) => {
  const slot = answerSlots.value[idx];
  if (!slot || slot.prefilled || !slot.val) return;
  const word = slot.val;
  const ansIdx = currentAnswer.value.lastIndexOf(word);
  if (ansIdx > -1) {
    currentAnswer.value.splice(ansIdx, 1);
    const poolW = shuffledWords.value.find((w) => w.text === word && w.used);
    if (poolW) poolW.used = false;
  }
};

const checkAnswer = () => {
  const user = answerSlots.value
    .map((s) => s.val)
    .join(" ")
    .trim();
  const target = currentSentenceData.value.en2.trim();
  if (user.toLowerCase() === target.toLowerCase()) {
    isCorrect.value = true;
    feedback.value = "🎉 CHÍNH XÁC!";
    stopTimer();
  } else {
    feedback.value = "❌ SAI RỒI!";
    setTimeout(() => (feedback.value = ""), 2000);
  }
};

const addScore = (target) => {
  const pts =
    currentSentenceData.value.en2.split(" ").length +
    Math.floor(timeLeft.value / 10);
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
  let pts =
    currentSentenceData.value.en2.split(" ").length +
    Math.floor(timeLeft.value / 10);
  if (giftType.value === "half") pts = Math.floor(pts / 2);
  else if (giftType.value === "double") pts *= 2;
  else if (giftType.value === "bonus") pts += 5;
  scores.value[target] += pts;
  saveResult(true, pts);
  showGiftModal.value = false;
  showNextButton.value = true;
};

const saveResult = (correct, pts) => {
  gameResults.value.push({
    sentence: currentSentenceData.value.en2,
    vi: currentSentenceData.value.vi,
    correct,
    points: pts,
  });
};

const nextSentence = () => {
  if (currentIndex.value < sentences.value.length - 1) {
    currentIndex.value++;
    loadSentence();
  } else isGameOver.value = true;
};

const startTimer = () => {
  clearInterval(timerInterval.value);
  timerInterval.value = setInterval(() => {
    if (timeLeft.value > 0) timeLeft.value--;
    else {
      stopTimer();
      skipSentence();
    }
  }, 1000);
};

const stopTimer = () => clearInterval(timerInterval.value);
const clearAnswer = () => {
  currentAnswer.value = [];
  shuffledWords.value.forEach((w) => {
    if (level.value === "easy") {
      const pre = currentSentenceData.value.en2.split(" ").slice(0, 2);
      if (!pre.includes(w.text)) w.used = false;
    } else w.used = false;
  });
};

const skipSentence = () => {
  stopTimer();
  saveResult(false, 0);
  showNextButton.value = true;
};
const resetGame = () => {
  location.reload();
};

onUnmounted(stopTimer);
</script>

<style lang="scss" scoped>
@use "tailwindcss";

.btn-game {
  @apply py-3 px-4 rounded-2xl text-white font-black shadow-lg border-b-4 active:translate-y-1 active:shadow-none transition-all;
}

.btn-score {
  @apply py-2 px-6 rounded-xl text-white font-black shadow-lg hover:scale-105 transition-transform;
}

.animate-bounce-in {
  animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
