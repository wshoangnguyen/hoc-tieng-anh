// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui'],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css', '~/assets/scss/main.scss', '~/assets/scss/game.scss'],

  postcss: {
    plugins: {
      "@tailwindcss/postcss": {},
    },
  },

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

  // ========== CẤU HÌNH GITHUB PAGES ==========
  app: {
    // THAY 'your-repo-name' bằng tên repository GitHub của bạn
    // Ví dụ: https://github.com/username/my-app -> '/my-app/'
    baseURL: '/hoc-tieng-anh/',
    buildAssetsDir: 'assets',
  },
  
  nitro: {
    preset: 'static'
  },
  
  experimental: {
    payloadExtraction: false
  }
})