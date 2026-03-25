<template>
  <button
    :class="[
      'btn-game w-full h-full relative',
      disabled && 'bg-gray-300 pointer-events-none',
      isOpen ? 'z-1000' : 'z-10',
    ]"
    ref="target"
    :disabled="disabled"
  >
    <!-- Label -->
    <label
      v-if="label"
      class="block text-sm font-bold text-gray-600 mb-1.5 ml-1"
    >
      {{ label }}
    </label>

    <!-- Khung hiển thị (Trigger) -->
    <div
      @click="toggleDropdown"
      class="size-full flex items-center justify-between px-4 bg-transparent transition-all duration-200 text-left max-w-full truncate"
    >
      <span
        class="truncate"
        :class="modelValue ? 'text-gray-800 font-medium' : 'text-gray-400'"
      >
        {{ selectedLabel || placeholder }}
      </span>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 text-[#fcbe5d] transition-transform duration-300"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>

    <!-- Danh sách Options (Dropdown) -->
    <Transition
      :enter-active-class="'transition duration-100 ease-out'"
      :enter-from-class="
        'transform opacity-0 ' +
        (isAbove ? 'translate-y-2 scale-95' : '-translate-y-2 scale-95')
      "
      :enter-to-class="'transform opacity-100 translate-y-0 scale-100'"
      :leave-active-class="'transition duration-75 ease-in'"
      :leave-from-class="'transform opacity-100 translate-y-0 scale-100'"
      :leave-to-class="
        'transform opacity-0 ' +
        (isAbove ? 'translate-y-2 scale-95' : '-translate-y-2 scale-95')
      "
    >
      <div
        v-if="isOpen"
        class="absolute z-999 w-full bg-white border-2 border-[#e8e4da] rounded-2xl shadow-xl overflow-hidden p-1"
        :class="[isAbove ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]']"
      >
        <ul class="max-h-60 overflow-y-auto py-1 custom-scrollbar">
          <li
            v-for="option in options"
            :key="option.value"
            @click="handleSelect(option)"
            class="px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors text-base lg:text-lg rounded-xl"
            :class="[
              modelValue === option.value
                ? 'bg-[#fff6e5] text-[#fcbe5d] font-bold'
                : 'text-gray-600 hover:bg-[#fff6e5]',
            ]"
          >
            <span class="truncate">{{ option.label }}</span>
            <svg
              v-if="modelValue === option.value"
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </li>
        </ul>
      </div>
    </Transition>
  </button>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";

const props = defineProps({
  modelValue: [String, Number],
  options: {
    type: Array,
    default: () => [],
  },
  label: String,
  placeholder: {
    type: String,
    default: "Chọn một mục...",
  },
  disabled: Boolean,
});

const emit = defineEmits(["update:modelValue"]);

const isOpen = ref(false);
const isAbove = ref(false); // Trạng thái mở lên trên
const target = ref(null);

const selectedLabel = computed(() => {
  return props.options.find((opt) => opt.value === props.modelValue)?.label;
});

// Hàm tính toán vị trí
const toggleDropdown = async () => {
  if (props.disabled) return;

  if (!isOpen.value) {
    const rect = target.value.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const dropdownHeight = 260; // Chiều cao tối đa ước tính (max-h-60 ≈ 240px + margin/border)

    // Nếu khoảng cách bên dưới nút < chiều cao dropdown VÀ khoảng cách bên trên đủ chỗ
    if (
      windowHeight - rect.bottom < dropdownHeight &&
      rect.top > dropdownHeight
    ) {
      isAbove.value = true;
    } else {
      isAbove.value = false;
    }
  }

  isOpen.value = !isOpen.value;
};

const handleSelect = (option) => {
  emit("update:modelValue", option.value);
  isOpen.value = false;
};

const close = (e) => {
  if (target.value && !target.value.contains(e.target)) {
    isOpen.value = false;
  }
};

onMounted(() => window.addEventListener("click", close));
onUnmounted(() => window.removeEventListener("click", close));
</script>

<style lang="scss">
@use "tailwindcss";

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e8e4da;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #fcbe5d;
}
</style>
