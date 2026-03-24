<script setup>
useHead({
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
  link: [{ rel: "icon", href: "/favicon.ico" }],
  htmlAttrs: {
    lang: "en",
  },
});

const title = "Học Tiếng Anh Dễ Lắm";

useSeoMeta({
  title,
  ogTitle: title,
});
</script>

<template>
  <CommonHeader />
  <div id="nuxt-page" class="overflow-y-auto h-[calc(100vh-64px)]">
    <NuxtPage />
  </div>
</template>
