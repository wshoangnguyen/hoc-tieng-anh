<template>
  <div class="w-full">
    <div class="flex flex-col justify-center items-center font-bold">
      📚 Select Sentences
      <div class="mt-1 w-20 h-1 bg-[#fcbe5d] rounded"></div>
    </div>

    <div class="flex flex-col justify-center items-center gap-4 mt-2">
      <CommonCSelect
        v-model="bookSelected"
        :options="dataBooks"
        placeholder="Select Book"
      />
      <CommonCSelect
        v-model="unitSelected"
        :options="dataUnits"
        :disabled="dataUnits.length === 0 || !bookSelected"
        placeholder="Select Unit"
      />
    </div>
  </div>
</template>

<script setup>
const { sentences } = useSentences();

const emit = defineEmits(["update:sentences"]);

const isMobile = ref(false);

const bookSelected = ref(null);
const unitSelected = ref(null);

const dataBooks = computed(() => {
  // 1. Lấy ra mảng các tên sách: ["Super Minds 0", "Super Minds 0", "Super Minds 1", ...]
  // 2. Dùng new Set() để lọc trùng: {"Super Minds 0", "Super Minds 1", ...}
  // 3. Chuyển ngược lại thành mảng bằng [... ]
  const uniqueBooks = [...new Set(sentences.map((item) => item.book))];

  // 4. Map sang định dạng object cho dropdown
  return uniqueBooks.map((book) => ({
    label: book,
    value: book,
  }));
});

const dataUnits = computed(() => {
  if (!bookSelected.value) return [];

  // Lọc dữ liệu an toàn hơn
  const filtered = sentences.filter((item) => {
    return String(item.book).trim() === String(bookSelected.value).trim();
  });

  const uniqueUnits = [...new Set(filtered.map((item) => item.unit))];

  return uniqueUnits.map((unit) => ({
    label: unit,
    value: unit,
  }));
});

watch([bookSelected], () => {
  unitSelected.value = null;
});

watch([unitSelected], () => {
  onClickBtn();
});

const onClickBtn = () => {
  let sentencesSelected = sentences.find((item) => {
    return item.book === bookSelected.value && item.unit === unitSelected.value;
  });
  emit("update:sentences", sentencesSelected.sentences);
};

onMounted(() => {
  isMobile.value = /Mobi|Android/i.test(navigator.userAgent);
});

onUnmounted(() => {});
</script>
