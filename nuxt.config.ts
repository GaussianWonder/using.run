export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: process.env.NODE_ENV !== "production" },
  modules: [
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxtjs/tailwindcss",
    "@hypernym/nuxt-anime",
    "@vueuse/nuxt",
  ],
  nitro: {
    preset: "bun",
  },
  css: ["assets/css/tailwind.css"],
  tailwindcss: {
    exposeConfig: true,
    editorSupport: true,
    viewer: true,
  },
  fonts: {
    assets: { strategy: "public" },
    devtools: process.env.NODE_ENV !== "production",
    defaults: {
      preload: true,
    },
  },
});
