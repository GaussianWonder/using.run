<template>
  <NuxtLayout>
    <ClientOnly>
      <ParticleText />
    </ClientOnly>
  
    <template #footer>
      <span class="hero-text justify-center md:justify-start text-[#fff2e2]">
        using.run
      </span>
    </template>
  </NuxtLayout>
</template>

<style lang="css" scoped>
@reference "tailwindcss";

.hero-text {
  @apply font-[Chillax] flex items-center m-5 p-2 text-6xl md:text-9xl select-none;
}
</style>