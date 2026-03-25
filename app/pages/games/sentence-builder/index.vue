<template>
  <div class="flex flex-col w-300 bg-[#FFFBF0] m-auto rounded-3xl p-2 mt-4">
    <div class="flex items-center justify-center gap-2 text-4xl font-bold">
      <img src="/games/sentence-builder.png" class="w-20 object-cover" />
      Sentence Builder
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

/* ================= STATE ================= */
const { vocabulary } = useVocabulary();
</script>

<style lang="scss">
@use "tailwindcss";
</style>
