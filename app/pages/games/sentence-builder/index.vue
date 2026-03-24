<template>sentence-builder</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const isMobile = ref(false);

onMounted(() => {
  isMobile.value = navigator.userAgentData.mobile;
});

onUnmounted(() => {});
</script>
