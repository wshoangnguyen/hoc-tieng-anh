// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // 1. SSR: false giúp chạy ổn định nhất trên GitHub Pages (Static Hosting)
  ssr: false,

  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/color-mode'],
  colorMode: {
    preference: 'light', // Set the default preference to 'dark'
  },
  postcss: {
    plugins: {
      "@tailwindcss/postcss": {},
    },
  },

  devtools: {
    enabled: true
  },

  css: [
    '~/assets/css/main.css',
    '~/assets/scss/main.scss',
    '~/assets/scss/game.scss'
  ],

  // 2. XÓA BỎ PHẦN POSTCSS: 
  // Tailwind 4 được @nuxt/ui tự động xử lý, khai báo ở đây sẽ gây lỗi IPC trên Windows.

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  // 3. CẤU HÌNH CHO DEV SERVER ĐỂ TRÁNH LỖI KẾT NỐI TRÊN WINDOWS
  devServer: {
    host: '127.0.0.1',
    port: 3000
  },

  // 4. CẤU HÌNH GITHUB PAGES / CUSTOM DOMAIN
  app: {
    // Nếu bạn dùng Custom Domain, để '/' là đúng. 
    // Nếu chưa dùng Custom Domain (dùng link github.io/hoc-tieng-anh) thì phải để '/hoc-tieng-anh/'
    baseURL: '/',
    buildAssetsDir: 'assets',
  },

  nitro: {
    // Dùng preset 'github-pages' thay vì 'static' để Nuxt 4 tối ưu tốt hơn
    preset: 'github-pages'
  },

  experimental: {
    payloadExtraction: false
  }
})