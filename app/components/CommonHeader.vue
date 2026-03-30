<template>
  <UHeader
    class="flex items-center justify-between bg-[#fffbf0fa] backdrop-blur-md lg:px-3 border-b border-[#e8e4da]"
    v-model:open="isOpenMenu"
    :toggle="isMobile"
  >
    <template #left>
      <div class="flex items-center gap-2 cursor-pointer" @click="onClickLogo">
        <img src="/logo.png" class="w-auto h-11.25" />
        <div class="text-sm text-[#fcbe5d] font-semibold">
          TIẾNG ANH CHO TRẺ EM
        </div>
      </div>
    </template>

    <template #right v-if="!isMobile">
      <div class="flex gap-6 items-center h-15">
        <div
          v-for="(item, index) in dataHeader"
          :key="index"
          class="relative h-full"
          @mouseenter="onHover(item)"
          @mouseleave="onLeave"
        >
          <!-- main item -->
          <div
            :class="[
              'btn-header flex whitespace-nowrap items-center gap-1 text-[#555] font-semibold hover:text-[#fcbe5d] cursor-pointer h-full',
              item.isActive && 'active',
              item.to ? 'cursor-pointer' : 'cursor-default',
            ]"
            @click="onClickItem(item)"
          >
            <div>{{ item.title }}</div>
            <span v-if="item.tag" class="text-xs text-[#fcbe5d] font-bold">
              {{ item.tag }}
            </span>
          </div>

          <!-- dropdown -->
          <Transition name="scale">
            <div
              v-if="item.data && activeDropdown === item.title"
              class="absolute top-full left-0 w-75 bg-white rounded-2xl shadow-lg border border-[#eee] p-2 z-50"
            >
              <div
                v-for="(sub, i) in item.data"
                :key="i"
                class="px-4 py-2 rounded-xl hover:bg-[#fff6e5] flex gap-2 items-center cursor-pointer"
                @click="onClickItem(sub)"
              >
                <img :src="sub.img" class="w-10 object-cover" />
                <span>{{ sub.title }}</span>
                <span v-if="sub.tag" class="text-xs text-[#fcbe5d] font-bold">
                  {{ sub.tag }}
                </span>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </template>

    <template #body>
      <div
        class="flex flex-col gap-2 items-center h-[calc(100vh-100px)] text-lg text-white"
      >
        <div
          v-for="(item, index) in dataHeader"
          :key="index"
          class="relative w-full h-10"
          @mouseenter="onHover(item)"
          @mouseleave="onLeave"
        >
          <!-- main item -->
          <div
            :class="[
              'btn-header flex whitespace-nowrap justify-center items-center gap-1 font-semibold hover:text-[#fcbe5d] cursor-pointer size-full',
              item.isActive && 'active',
            ]"
            @click="onClickItem(item)"
          >
            <div>{{ item.title }}</div>
            <span v-if="item.tag" class="text-xs text-[#fcbe5d] font-bold">
              {{ item.tag }}
            </span>
          </div>

          <!-- dropdown -->
          <Transition name="fade">
            <div
              v-if="item.data && activeDropdown === item.title"
              class="absolute top-full left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 w-75 bg-gray rounded-2xl shadow-lg border border-[#555] p-2 z-50 backdrop-blur-3xl"
            >
              <div
                v-for="(sub, i) in item.data"
                :key="i"
                class="px-4 py-2 rounded-xl hover:bg-[#fff6e5] flex justify-between items-center cursor-pointer"
                @click="onClickItem(sub)"
              >
                <span>{{ sub.title }}</span>
                <span v-if="sub.tag" class="text-xs text-[#fcbe5d] font-bold">
                  {{ sub.tag }}
                </span>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </template>

    <template #toggle v-if="isMobile">
      <button
        :class="[isOpenMenu ? 'text-white' : 'text-black']"
        @click="isOpenMenu = !isOpenMenu"
      >
        <UIcon v-if="isOpenMenu" name="lucide:x" class="w-6 h-6" />
        <UIcon v-else name="lucide:menu" class="w-6 h-6" />
      </button>
    </template>
  </UHeader>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const isMobile = ref(false);
const isOpenMenu = ref(false);

const dataHeader = ref([
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
  {
    title: "Games",
    isActive: false,
    tag: "hot",
    data: [
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
    ],
  },
  {
    title: "Blog",
    to: "blog",
    isActive: false,
    target: "_blank",
  },
  {
    title: "Sổ điểm",
    to: "points",
    isActive: false,
  },
  {
    title: "Vào lớp",
    to: "https://zoom.us/j/2096639147?pwd=BrT4hq8qp2HAiJN8XyUqdSQFgjuagh.1",
    isExternal: true,
    isActive: false,
    target: "_blank",
  },
]);

let observer = null;

const onClickLogo = () => {
  // Chỉ chạy scroll nếu đang ở trang chủ
  if (route.path !== "/") {
    router.push("/");
    return;
  }
  document.getElementById("nuxt-page").scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

// Hàm xóa trạng thái active cũ
const clearActive = () => {
  dataHeader.value.forEach((item) => (item.isActive = false));
};

const initScrollSpy = () => {
  // Ngắt kết nối observer cũ nếu có
  if (observer) observer.disconnect();

  // Chỉ chạy ScrollSpy nếu đang ở trang chủ
  if (route.path !== "/") {
    // Nếu không ở trang chủ, kiểm tra active theo route path (cho Games, Blog...)
    dataHeader.value.forEach((item) => {
      if (
        item.to &&
        item.to.startsWith("/") &&
        route.path.startsWith(item.to)
      ) {
        item.isActive = true;
      } else if (item.data) {
        // Kiểm tra trong submenu
        const hasChildActive = item.data.some((sub) => route.path === sub.to);
        if (hasChildActive) item.isActive = true;
      }
    });
    return;
  }

  const sections = dataHeader.value
    .filter((item) => {
      if (!item.to || item.isExternal || item.to.startsWith("/")) return false;
      return document.querySelector(`#${item.to}`);
    })
    .map((item) => document.querySelector(`#${item.to}`));

  observer = new IntersectionObserver(
    (entries) => {
      const visibleSections = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (!visibleSections.length) return;

      const currentId = visibleSections[0].target.id;
      dataHeader.value.forEach((item) => {
        item.isActive = item.to === currentId;
      });
    },
    {
      root: null,
      rootMargin: "-120px 0px -40% 0px",
    },
  );

  sections.forEach((section) => {
    if (section) observer.observe(section);
  });
};

// QUAN TRỌNG: Theo dõi thay đổi route
watch(
  () => route.path,
  async (newPath) => {
    clearActive();
    // Đợi DOM cập nhật xong sau khi chuyển route
    await nextTick();
    // Chờ thêm một chút để đảm bảo các component đã render hoàn toàn (đặc biệt khi chuyển từ trang khác về Home)
    setTimeout(() => {
      initScrollSpy();
    }, 100);
  },
);

const onClickItem = (value) => {
  // CHẶN: Nếu không có đường dẫn (to), không thực hiện bất kỳ hành động nào
  if (!value.to) {
    return;
  }

  // Đóng menu mobile nếu đang mở
  isOpenMenu.value = false;

  // 1. Nếu là link bên ngoài (External)
  if (value.isExternal) {
    window.open(value.to, value.target || "_blank");
    return;
  }

  // 2. Nếu là route trang con (bắt đầu bằng /)
  if (value.to.startsWith("/")) {
    router.push(value.to);
    return;
  }

  // 3. Nếu là section scroll trên trang chủ
  if (route.path !== "/") {
    router.push("/").then(() => {
      setTimeout(() => {
        const el = document.querySelector(`#${value.to}`);
        if (el) {
          document.getElementById("nuxt-page").scrollTo({
            top: el.offsetTop - 100,
            behavior: "smooth",
          });
        }
      }, 300);
    });
  } else {
    const el = document.querySelector(`#${value.to}`);
    if (el) {
      document.getElementById("nuxt-page").scrollTo({
        top: el.offsetTop - 100,
        behavior: "smooth",
      });
    }
  }
};

onMounted(() => {
  isMobile.value = /Mobi|Android/i.test(navigator.userAgent);
  initScrollSpy();
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});

const activeDropdown = ref(null);

const onHover = (item) => {
  if (item.data) {
    activeDropdown.value = item.title;
  }
};

const onLeave = () => {
  activeDropdown.value = null;
};
</script>
