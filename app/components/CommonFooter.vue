<template>
  <div class="footer w-full text-white text-xl lg:text-lg py-10 mt-4 lg:mt-10">
    <div
      class="flex gap-10 justify-between flex-col lg:flex-row w-300 m-auto px-2"
    >
      <div class="w-full lg:w-1/4 font-bold">
        <h4 class="title-footer text-2xl">Học Tiếng Anh Dễ Lắm</h4>
        <div class="mb-4">
          Giúp bé yêu thích và giỏi tiếng Anh một cách tự nhiên với phương pháp
          học hiện đại, giáo viên chất lượng.
        </div>
        <div class="mb-2">
          Email:
          <span
            class="bg-[#fcbe5d]/30 px-1 rounded shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
            >HocTiengAnhDeLam001@gmail.com</span
          >
        </div>
        <div class="mb-2">
          Điện thoại:
          <span
            class="bg-[#fcbe5d]/30 px-1 rounded shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
            >0346 28 12 92</span
          >
        </div>
      </div>

      <div class="w-full lg:w-1/4 font-bold flex flex-col">
        <h4 class="title-footer text-xl">Liên kết nhanh</h4>
        <div>
          <div
            v-for="(item, index) in dataFooter"
            :key="index"
            class="mb-2 hover:text-[#fcbe5d] hover:translate-x-2 cursor-pointer"
            @click="onClickItem(item)"
          >
            {{ item.title }}
          </div>
        </div>
      </div>

      <div class="w-full lg:w-1/4 font-bold">
        <h4 class="title-footer text-xl">Trò chơi giáo dục</h4>
        <div>
          <div
            v-for="(item, index) in dataGames"
            :key="index"
            class="mb-2 flex items-center gap-2 hover:text-[#fcbe5d] hover:translate-x-2 cursor-pointer"
            @click="onClickItem(item)"
          >
            <img :src="item.img" class="w-10 object-cover" />
            <span>{{ item.title }}</span>
            <span v-if="item.tag" class="text-xs text-[#fcbe5d] font-bold">
              {{ item.tag }}
            </span>
          </div>
        </div>
      </div>

      <div class="w-full lg:w-1/4 font-bold">
        <h4 class="title-footer text-xl">Giờ làm việc</h4>
        <div>
          <p class="mb-2">
            Thứ 2 - CN:
            <span
              class="bg-[#fcbe5d]/30 px-1 rounded shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
              >8:00 - 20:00</span
            >
          </p>
          <p class="mb-2">
            Học thử:
            <span
              class="bg-[#fcbe5d]/30 px-1 rounded shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
              >Miễn phí 2 buổi</span
            >
          </p>
          <p class="mb-2">
            Lớp học:
            <span
              class="bg-[#fcbe5d]/30 px-1 rounded shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
              >5 học viên/lớp</span
            >
          </p>
          <p class="mb-2">
            Độ tuổi:
            <span
              class="bg-[#fcbe5d]/30 px-1 rounded shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
              >6 tuổi trở lên</span
            >
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const isMobile = ref(false);

const dataFooter = ref([
  {
    title: "Giải thiệu",
    to: "about",
    isActive: false,
  },
  {
    title: "Phản hồi",
    to: "feedback",
    isActive: false,
  },
  {
    title: "Lợi ích",
    to: "advantages",
    isActive: false,
  },
  {
    title: "Giáo trình",
    to: "lectures",
    isActive: false,
  },
]);

const dataGames = ref([
  {
    title: "Tìm từ tiếng Anh",
    to: "/games/word-find",
    tag: "hot",
    img: "/games/word-find.png",
  },
  {
    title: "Xếp chữ tiếng Anh",
    to: "/games/scrambled-word",
    tag: "hot",
    img: "/games/scrambled-word.png",
  },
  {
    title: "Xếp từ tiếng Anh",
    to: "/games/sentence-builder",
    tag: "new",
    img: "/games/sentence-builder.png",
  },
  {
    title: "Dịch truyện tiếng Anh",
    to: "/games/words-fall",
    tag: "new",
    img: "/games/words-fall.png",
  },
  {
    title: "Lựa chọn ngẫu nhiên",
    to: "/games/random",
    img: "/games/random.png",
  },
]);

const onClickItem = (value) => {
  const el = document.querySelector(`#${value.to}`);
  if (!el) return;

  document.getElementById("nuxt-page").scrollTo({
    top: el.offsetTop - 100,
    behavior: "smooth",
  });
};
</script>
