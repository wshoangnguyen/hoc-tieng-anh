<template>
  <UMain class="screen-full p-3 w-screen lg:max-w-300 m-auto">
    <!-- Nút Loa ở góc màn hình -->
    <button
      @click="toggleMute"
      class="fixed top-5 right-5 z-50 p-3 bg-white/80 rounded-full shadow-lg hover:scale-110 transition-all"
    >
      <span v-if="!isMuted">🔊</span>
      <span v-else>🔇)</span>
    </button>

    <!-- banner -->
    <div class="flex justify-center w-full rounded-3xl overflow-hidden">
      <img src="/banner.jpg" alt="" />
    </div>

    <div class="mt-10 bg-[#FFFBF0] rounded-3xl py-17.5 px-5 text-center">
      <h2 class="title-section text-2xl lg:text-4xl">
        Hàng Nghìn Phụ Huynh Đã Tin Tưởng
      </h2>

      <div class="flex flex-wrap justify-between w-full gap-10 text-center">
        <div class="stat-item">
          <div class="text-[40px] text-[#fcbe5d] font-bold">1000+</div>
          <div class="text-lg font-bold">Học Viên Đã Được Hỗ Trợ</div>
        </div>

        <div class="stat-item">
          <div class="text-[40px] text-[#fcbe5d] font-bold">100+</div>
          <div class="text-lg font-bold">Giờ Dạy Hàng Tuần</div>
        </div>

        <div class="stat-item">
          <div class="text-[40px] text-[#fcbe5d] font-bold">95%</div>
          <div class="text-lg font-bold">Hài Lòng & Tiến Bộ</div>
        </div>
      </div>
    </div>

    <!-- about -->
    <div
      :id="dataHeader[0].to"
      class="mt-10 bg-[#FFFBF0] rounded-3xl py-17.5 px-5 text-center"
    >
      <h2 class="title-section text-2xl lg:text-4xl">Giới Thiệu Về Lớp Học</h2>

      <div class="text-lg font-bold">
        Chúng tôi mang đến phương pháp học tiếng Anh online hiệu quả, giúp bé
        phát triển toàn diện kỹ năng ngôn ngữ và tự tin giao tiếp.
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        <div
          v-for="(item, index) in dataVideo"
          :key="index"
          class="rounded-3xl overflow-hidden h-80 bg-black cursor-pointer border-2 border-transparent hover:border-[#fcbe5d] hover:scale-105 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
        >
          <video :src="item" class="size-full" controls playsinline></video>
        </div>
      </div>
    </div>

    <!-- feedback -->
    <div
      :id="dataHeader[1].to"
      class="mt-10 bg-[#FFFBF0] rounded-3xl py-17.5 px-5 text-center"
    >
      <h2 class="title-section text-2xl lg:text-4xl">
        Phụ Huynh Nói Gì Về Chúng Tôi?
      </h2>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        <div
          v-for="(item, index) in dataImgMsg"
          :key="index"
          class="rounded-3xl overflow-hidden h-62.5 bg-white cursor-pointer border-2 border-transparent hover:border-[#fcbe5d] hover:scale-105 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
          @click="onClickImg(item)"
        >
          <img :src="item" class="size-full object-cover" />
        </div>
      </div>
    </div>

    <!-- advantages -->
    <div
      :id="dataHeader[2].to"
      class="mt-10 bg-[#FFFBF0] rounded-3xl py-17.5 px-5 text-center"
    >
      <h2 class="title-section text-2xl lg:text-4xl">
        "Học Tiếng Anh Dễ Lắm" bởi vì
        <div class="benefits-decoration"></div>
      </h2>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-25 lg:gap-8 mt-15">
        <div
          v-for="(item, index) in dataAdvantages"
          :key="index"
          class="group relative rounded-3xl h-62.5 bg-white p-1 cursor-pointer border-2 border-transparent hover:scale-105 hover:border-[#fcbe5d] hover: shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)] flex flex-col justify-end items-center py-10 px-5"
        >
          <div
            class="flex w-36 lg:w-1/2 h-30 lg:h-36.25 absolute top-0 left-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)] p-2 border-2 border-transparent group-hover:border-[#fcbe5d]"
          >
            <img :src="item.img" class="w-full m-auto object-cover" />
          </div>
          <div class="text-[#fcbe5d] text-xl font-bold mb-4">
            {{ item.title }}
          </div>
          <div class="font-bold">{{ item.content }}</div>
        </div>
      </div>
    </div>

    <!-- lectures -->
    <div
      :id="dataHeader[3].to"
      class="mt-10 bg-[#FFFBF0] rounded-3xl py-17.5 px-5 text-center"
    >
      <h2 class="title-section text-2xl lg:text-4xl">Chương Trình Học</h2>

      <div class="lectures-text flex flex-col gap-10 lg:mt-10">
        <div
          v-for="(item, index) in dataLectures"
          :key="index"
          class="flex gap-4 lg:gap-10 flex-col-reverse"
          :class="index % 2 == 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'"
        >
          <div class="flex flex-col gap-4 w-full lg:w-1/2">
            <div
              v-for="(img, index1) in item.imgs"
              :key="index1"
              class="w-full rounded-3xl overflow-hidden bg-white cursor-pointer border-2 border-transparent hover:border-[#fcbe5d] hover:scale-105 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)]"
              @click="onClickImg(img)"
            >
              <img :src="img" class="size-full object-cover" />
            </div>
          </div>
          <div
            class="w-full lg:w-1/2 p-2 lg:p-10 text-left text-lg leading-[1.8] font-medium"
          >
            <div
              v-for="(value, index2) in item.content"
              :key="index2"
              class="mb-4"
              v-html="value"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- register -->
    <div
      id="registration"
      class="mt-10 registration rounded-3xl py-17.5 px-5 text-center"
    >
      <h2 class="title-section text-2xl lg:text-4xl text-white">
        Đăng Ký Học Thử Miễn Phí
      </h2>

      <form
        id="registration-form"
        action="https://docs.google.com/forms/d/e/1FAIpQLSfd3-jq0yB1sOVzUo-ynxH-vgN36yc--lh3g0QviiJG_dJBrQ/formResponse"
        method="POST"
        @submit="handleSubmitForm"
      >
        <div class="flex flex-col gap-2 mt-4 w-full lg:w-1/2 m-auto">
          <input
            type="text"
            name="entry.1904311514"
            placeholder="Tên phụ huynh"
            required
            aria-label="Tên phụ huynh"
          />
          <input
            type="tel"
            name="entry.1055270928"
            placeholder="Số điện thoại"
            required
            aria-label="Số điện thoại"
          />
          <input
            type="email"
            name="entry.738983665"
            placeholder="Email (không bắt buộc)"
            aria-label="Email"
          />
        </div>
        <button class="btn-gradient w-full lg:w-1/2 mt-4">Đăng ký ngay!</button>
      </form>
    </div>

    <!-- loading -->
    <Transition name="scale">
      <div
        v-if="loadingSpinner"
        class="fixed top-0 left-0 h-screen w-screen z-50"
        @click="loadingSpinner"
      >
        <div class="absolute top-0 left-0 size-full bg-black opacity-80" />
        <div class="loading-spinner" id="loading-spinner">
          <div class="spinner"></div>
          <p>Đang xử lý đăng ký...</p>
        </div>
      </div>
    </Transition>

    <!-- show img -->
    <Transition name="scale">
      <div
        v-if="showImg"
        class="fixed top-0 left-0 h-screen w-screen z-50"
        @click="showImg = null"
      >
        <div class="absolute top-0 left-0 size-full bg-black opacity-80" />
        <div
          class="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 h-full"
        >
          <img :src="showImg" class="size-full object-contain" />
        </div>
      </div>
    </Transition>

    <!-- floating button -->
    <div v-if="!isMobile" class="floating-container">
      <img
        src="/logo.png"
        alt="Logo Học Tiếng Anh Dễ Lắm"
        class="floating-logo"
        loading="lazy"
      />
      <button class="btn-gradient" @click="onClickItem({ to: 'registration' })">
        Đăng ký học thử ngay!
      </button>
    </div>

    <!-- toast -->
    <div
      class="fixed bottom-5 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50"
    >
      <transition-group name="toast" tag="div">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="[
            'px-4 py-2 rounded-lg shadow-md text-white',
            t.type === 'success'
              ? 'bg-green-500'
              : t.type === 'error'
                ? 'bg-red-500'
                : 'bg-blue-500',
          ]"
        >
          {{ t.message }}
        </div>
      </transition-group>
    </div>
  </UMain>

  <CommonFooter />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const isMobile = ref(false);

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
    to: "games",
    isActive: false,
    tag: "hot",
    data: [
      {
        title: "Tìm từ tiếng Anh",
        to: "/word-find",
        tag: "hot",
      },
      {
        title: "Xếp chữ tiếng Anh",
        to: "/scrambled-word",
        tag: "hot",
      },
      {
        title: "Xếp từ tiếng Anh",
        to: "/sentence-builder",
        tag: "new",
      },
      {
        title: "Dịch truyện tiếng Anh",
        to: "/words-fall",
        tag: "new",
      },
      {
        title: "Lựa chọn ngẫu nhiên",
        to: "/random",
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

const dataVideo = ref([
  "/video/video-lop-hoc-1.mp4",
  "/video/video-lop-hoc-2.mp4",
  "/video/video-lop-hoc-3.mp4",
  "/video/video-lop-hoc-4.mp4",
]);

const dataImgMsg = ref([
  "/msg/1.jpg",
  "/msg/2.jpg",
  "/msg/3.jpg",
  "/msg/4.jpg",
  "/msg/5.jpg",
  "/msg/6.png",
  "/msg/7.png",
  "/msg/8.png",
  "/msg/9.png",
]);

const dataAdvantages = ref([
  {
    img: "/advantages/1.png",
    title: "Số Lượng Giới Hạn",
    content:
      "5 học viên/lớp là số lượng tuyệt vời để giáo viên theo sát từng bé, bé cũng có bạn để thực hành giao tiếp tự nhiên.",
  },
  {
    img: "/advantages/2.png",
    title: "Mỗi Bạn Nhỏ Là Một Thiên Tài",
    content:
      "Mỗi bé có trí thông minh khác nhau, chúng tôi dựa vào đó để hỗ trợ các bé học tập theo cách phù hợp nhất.",
  },
  {
    img: "/advantages/3.png",
    title: "Lớp học không biên giới",
    content:
      "Giáo viên từ khắp nơi trên thế giới kết hợp với giáo viên Việt Nam, giúp trẻ vững vàng bước ra thế giới.",
  },
]);

const dataLectures = ref([
  {
    imgs: ["/lectures/1.png"],
    content: [
      `Các bé được học với sách của đại học Cambridge.`,
      `<strong>Super Minds 1-6</strong> dành cho lứa tuổi tiểu học. Với nội dung gần gũi nhưng cũng hấp dẫn nhờ những câu chuyện hóm hỉnh, kết hợp các kĩ năng khác nhau như ca hát, khoa học, toán học, làm thủ công… giúp bé phát triển toàn diện, không chỉ tiếng Anh mà còn có thể ứng dụng tiếng Anh vào cuộc sống.`,
    ],
  },
  {
    imgs: ["/lectures/2.png"],
    content: [
      `Ngoài ra, để hỗ trợ các bé thi lấy chứng chỉ Cambridge và làm quen với các kì thi quốc tế, sau khi học xong <strong>Super Minds 2</strong> các bé sẽ học sách <strong>Fun for Starters</strong>, và sau sách <strong>Super Minds 4</strong> là sách <strong>Fun for Flyers</strong>.`,
    ],
  },
  {
    imgs: ["/lectures/3.jpg"],
    content: [
      `Sau khi học xong các sách bổ trợ này, các bé có thể tự tin tham gia thi các kì thi của Cambridge, qua đó các bậc cha mẹ cũng sẽ nắm rõ hơn về năng lực của các bé dựa trên thang đo năng lực của Cambridge.`,
    ],
  },
  {
    imgs: ["/lectures/4.png", "/lectures/5.png"],
    content: [
      `Đối với các bạn tuổi teen, chúng tôi sử dụng hai bộ sách của Cambridge: <strong>Prepare</strong> và <strong>Open World</strong>.`,
      `<strong>Prepare</strong> tập trung vào kiến thức trường lớp, gần gũi với các bạn học sinh. Với nội dung phong phú và thiết thực, các bạn sẽ cảm thấy thoải mái và tự tin hơn khi học tiếng Anh, đồng thời áp dụng được ngay vào các môn học khác.`,
      `<strong>Open World</strong> mang đến những kiến thức về thế giới rộng lớn, với các chủ đề thực tế và tự nhiên. Bộ sách này không chỉ giúp các bạn nâng cao khả năng tiếng Anh mà còn kích thích tính tò mò, khám phá và mở rộng hiểu biết về thế giới xung quanh.`,
      `Cả hai bộ sách đều được thiết kế để phát triển toàn diện các kỹ năng nghe, nói, đọc, viết, giúp các bạn tự tin sử dụng tiếng Anh trong mọi tình huống.`,
    ],
  },
]);

const loadingSpinner = ref(false);
const showImg = ref(null);

const onClickImg = (img) => {
  showImg.value = img;
};

const handleSubmitForm = async (event) => {
  event.preventDefault();

  loadingSpinner.value = true; // show loading

  const form = event.target;
  const formData = new FormData(form);

  try {
    await fetch(form.action, {
      method: "POST",
      body: formData,
      mode: "no-cors",
    });

    loadingSpinner.value = false;

    // hiển thị toast
    showToast(
      "🎉 Cảm ơn bạn đã đăng ký! Chúng tôi sẽ liên hệ trong vòng 24h.",
      "success",
    );

    // lưu trạng thái submit
    localStorage.setItem("formSubmitted", "true");

    // reset form
    form.reset();

    // **track conversion**
    trackConversion();
  } catch (error) {
    loadingSpinner.value = false;

    // // hiển thị error toast
    showToast(
      "❌ Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại hoặc liên hệ trực tiếp!",
      "error",
    );
  }
};

// Track conversion (placeholder cho analytics)
const trackConversion = () => {
  console.log("🎯 Conversion tracked: Form submission");

  // Ví dụ với GA4 / Google Ads
  if (typeof gtag !== "undefined") {
    gtag("event", "conversion", {
      send_to: "AW-123456789/AbC-D_efGhIjKlMnOpQrS",
      value: 1.0,
      currency: "VND",
    });
  }
};

// Vue 3 reactive toast (có thể đặt ở cùng script setup)
const toasts = ref([]);

const showToast = (message, type = "info", duration = 3000) => {
  const id = Date.now();
  toasts.value.push({ id, message, type });

  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, duration);
};

/* ================= AUDIO HELPER ================= */
const bgMusic = ref(null);
const isMuted = ref(false); // Thêm biến để người dùng có thể tắt/mở

const initBgMusic = () => {
  // Tạo đối tượng Audio
  bgMusic.value = new Audio("/mp3/background-music.mp3");
  bgMusic.value.loop = true;
  bgMusic.value.volume = 0.4; // Âm lượng vừa phải cho trang chủ

  // Hàm kích hoạt nhạc
  const startMusic = () => {
    if (bgMusic.value) {
      bgMusic.value
        .play()
        .then(() => {
          console.log("Nhạc nền đã bắt đầu!");
          // Sau khi phát thành công, gỡ bỏ các sự kiện lắng nghe để tránh lặp lại
          window.removeEventListener("click", startMusic);
          window.removeEventListener("touchstart", startMusic);
          window.removeEventListener("scroll", startMusic);
        })
        .catch((err) => {
          // Vẫn bị chặn nếu chưa có tương tác
          console.log("Đang chờ tương tác người dùng để phát nhạc...");
        });
    }
  };

  // Lắng nghe các tương tác phổ biến nhất
  window.addEventListener("click", startMusic);
  window.addEventListener("touchstart", startMusic);
  window.addEventListener("scroll", startMusic);
};

// Hàm bật/tắt nhạc (Dùng cho nút bấm trên giao diện)
const toggleMute = () => {
  if (!bgMusic.value) return;
  isMuted.value = !isMuted.value;
  bgMusic.value.muted = isMuted.value;
};

const stopBgMusic = () => {
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
};

onMounted(() => {
  isMobile.value = /Mobi|Android/i.test(navigator.userAgent);
  initBgMusic();
});

onUnmounted(() => {
  if (bgMusic.value) {
    bgMusic.value.pause();
    bgMusic.value = null;
  }
});
</script>
