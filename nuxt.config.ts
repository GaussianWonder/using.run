export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: process.env.NODE_ENV !== "production" },
  modules: [
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxtjs/tailwindcss",
    "@vueuse/nuxt",
    "@nuxtjs/device",
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
  runtimeConfig: {
    public: {
      particleFont:
        "https://cdn.fontshare.com/wf/SVYQ5C47KQ7Q4A6527WD7JA6PUG6HK55/I2UFEJWWBDNRZ5HKD3V4ASSUY3YYEMOJ/JEWCW7XRBNTGIANRIQOD4DIZJG4HEHFJ.ttf",
    },
  },
});
