<template>
  <div class="w-full">
    <div class="flex flex-col justify-center items-center font-bold">
      📚 Select Story
      <div class="mt-1 w-20 h-1 bg-[#fcbe5d] rounded"></div>
    </div>

    <div class="flex flex-col justify-center items-center gap-4 mt-2">
      <CommonCSelect
        v-model="categorySelected"
        :options="dataCategories"
        placeholder="Select Category"
      />
      <CommonCSelect
        v-model="storySelected"
        :options="dataStories"
        :disabled="dataStories.length === 0 || !categorySelected"
        placeholder="Select Story"
      />
    </div>
  </div>
</template>

<script setup>
const { getStoryById, getCategories, getStoriesByCategory } = useStories();

const emit = defineEmits(["update:vocabulary"]);

const isMobile = ref(false);

const categorySelected = ref(null);
const storySelected = ref(null);

const dataCategories = computed(() => {
  return getCategories().map((book) => ({
    label: book.label,
    value: book.code,
  }));
});

const dataStories = computed(() => {
  if (!categorySelected.value) return [];

  const storiesByCategory = getStoriesByCategory(categorySelected.value);
  const mappedStories = storiesByCategory.map((story) => ({
    label: `Story ${story.id}`,
    value: story.id,
    ...story,
  }));
  console.log(mappedStories);
  return mappedStories;
});

watch([categorySelected], () => {
  storySelected.value = null;
});

watch([storySelected], () => {
  onClickBtn();
});

const onClickBtn = () => {
  console.log(storySelected.value);

  emit(
    "update:story",
    getStoryById(categorySelected.value, storySelected.value),
  );
};

onMounted(() => {
  isMobile.value = /Mobi|Android/i.test(navigator.userAgent);
});

onUnmounted(() => {});
</script>
