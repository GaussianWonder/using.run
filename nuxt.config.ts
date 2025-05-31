export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxtjs/tailwindcss",
    "@hypernym/nuxt-anime",
    "@vueuse/nuxt",
  ],
  ssr: false,
  css: ["assets/css/tailwind.css"],
  tailwindcss: {
    exposeConfig: true,
    editorSupport: true,
    viewer: true,
  },
  fonts: {
    defaults: {
      preload: true,
    },
  },
});