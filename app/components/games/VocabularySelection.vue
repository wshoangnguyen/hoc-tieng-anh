<template>
  <div class="w-full">
    <div class="flex flex-col justify-center items-center font-bold">
      📚 Select Vocabulary
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
const { vocabulary } = useVocabulary();

const emit = defineEmits(["update:vocabulary"]);

const isMobile = ref(false);

const wordsSelected = ref(null);
const bookSelected = ref(null);
const unitSelected = ref(null);

const dataBooks = computed(() => {
  // 1. Lấy ra mảng các tên sách: ["Super Minds 0", "Super Minds 0", "Super Minds 1", ...]
  // 2. Dùng new Set() để lọc trùng: {"Super Minds 0", "Super Minds 1", ...}
  // 3. Chuyển ngược lại thành mảng bằng [... ]
  const uniqueBooks = [...new Set(vocabulary.map((item) => item.book))];

  // 4. Map sang định dạng object cho dropdown
  return uniqueBooks.map((book) => ({
    label: book,
    value: book,
  }));
});

const dataUnits = computed(() => {
  if (!bookSelected.value) return [];

  // Lọc dữ liệu an toàn hơn
  const filtered = vocabulary.filter((item) => {
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
  let vocabularySelected = vocabulary.find((item) => {
    return item.book === bookSelected.value && item.unit === unitSelected.value;
  });
  wordsSelected.value = vocabularySelected.words;
  emit("update:vocabulary", wordsSelected.value);
};

onMounted(() => {
  isMobile.value = /Mobi|Android/i.test(navigator.userAgent);
});

onUnmounted(() => {});
</script>
