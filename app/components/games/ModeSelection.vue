<template>
  <div class="w-full">
    <div class="flex flex-col justify-center items-center font-bold">
      🕹️ Select Game Mode
      <div class="mt-1 w-20 h-1 bg-[#fcbe5d] rounded"></div>
    </div>

    <div class="flex flex-col justify-center items-center gap-4 mt-2">
      <button
        v-for="item in dataMode"
        :key="item.value"
        :class="[
          'btn-game text-[#555]',
          item.color.border,
          selectedMode.value === item.value && `${item.color.bg} text-white`,
        ]"
        @click="onClickBtn(item)"
      >
        {{ `${item.icon} ${item.label}` }}
      </button>
    </div>

    <div class="flex justify-center text-lg mt-2">
      <div>
        <span class="font-bold mr-2">
          {{ `${pros.selectedMode.label}:` }}
        </span>
        <span>
          {{ `${pros.selectedMode.description} ${pros.selectedMode.icon}` }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
const pros = defineProps(["selectedMode", "dataMode"]);
const emit = defineEmits(["update:mode"]);

const isMobile = ref(false);

const onClickBtn = (value) => {
  emit("update:mode", value);
};

onMounted(() => {
  isMobile.value = /Mobi|Android/i.test(navigator.userAgent);
});

onUnmounted(() => {});
</script>
