<template>
  <div class="w-screen h-screen flex flex-col bg-[#e6d9cc]">
    <header><slot name="header" /></header>
    <main class="grow"><slot /></main>
    <footer><slot name="footer" /></footer>
  </div>
</template>

<style lang="css">
body {
  @apply w-screen h-screen overflow-clip;
}
</style>
