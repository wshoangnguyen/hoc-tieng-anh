<template>
  <div class="w-full">
    <div class="flex flex-col justify-center items-center font-bold">
      ⭐ Select Difficulty Level
      <div class="mt-1 w-20 h-1 bg-[#fcbe5d] rounded"></div>
    </div>

    <div class="flex flex-col justify-center items-center gap-4 mt-2">
      <button
        :class="[
          'btn-game border-emerald-500 text-[#555]',
          level === 'easy' && 'bg-emerald-400 text-white',
        ]"
        @click="onClickBtn('easy')"
      >
        🌱 EASY
      </button>
      <button
        :class="[
          'btn-game border-orange-500 text-[#555]',
          level === 'medium' && 'bg-orange-400 text-white',
        ]"
        @click="onClickBtn('medium')"
      >
        🌿 MEDIUM
      </button>
      <button
        :class="[
          'btn-game border-red-500 text-[#555]',
          level === 'hard' && 'bg-red-400 text-white',
        ]"
        @click="onClickBtn('hard')"
      >
        🌳 HARD
      </button>
    </div>

    <div class="flex justify-center text-lg mt-2">
      <div v-if="level === 'easy'">
        <span class="font-bold mr-2">EASY:</span>
        <span>First and last letters are revealed! 🌱</span>
      </div>
      <div v-else-if="level === 'medium'">
        <span class="font-bold mr-2">MEDIUM:</span>
        <span>Standard game mode 🌿</span>
      </div>
      <div v-else>
        <span class="font-bold mr-2">HARD:</span>
        <span>3 extra random letters added! 🌳</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(["update:level"]);

const isMobile = ref(false);
const level = ref("medium"); // easy, medium, hard

const onClickBtn = (value) => {
  level.value = value;
  emit("update:level", level.value);
};

onMounted(() => {
  isMobile.value = /Mobi|Android/i.test(navigator.userAgent);
});

onUnmounted(() => {});
</script>
