<template>
  <ClientOnly>
    <canvas id="canvas" ref="canvas" v-bind="$attrs" />
    <slot v-if="isReady"  />
  </ClientOnly>
</template>

<script setup lang="ts">
defineOptions({
  inheritAttrs: true,
});

const canvas = ref<HTMLCanvasElement>();
const { init = {} } = defineProps<{ init?: UsePixiOpts }>();

const pixi = usePixi(canvas, init);
const { isReady } = pixi;

watch(isReady, isReady => {
  if (isReady) {
    pixi.app.value.start();
  }
});

useProvidePixi(pixi);
defineExpose(pixi);
</script>
