<template>
  <PixiApp ref="pixi" :init="pixiInit">
    <ParticleSystem v-if="centeredPoints.length" :points="centeredPoints" />
  </PixiApp>
</template>

<script setup lang="ts">
import type { ApplicationOptions } from "pixi.js";
import { useOpentypePath } from "~/composables/use-opentype-path";

const config = useRuntimeConfig();

const pixiInit = (): Partial<ApplicationOptions> => ({
  background: 0xe6d9cc,
  antialias: true,
  resizeTo: document.getElementsByTagName("main")[0],
  height: 500,
  autoDensity: true,
  preference: "webgpu",
});
const pixi = usePixiRef();

const device = useDevice();
const { width } = useScreenBbox();
const maxFontSize = width * 0.1953125;
const desiredFontSize = (() => {
  if (device.isMobile) return 80;
  if (device.isTablet) return 150;
  return 200;
})();
const fontSize = Math.min(maxFontSize, desiredFontSize);

const text = ref("using.run");
const path = useOpentypePath(config.public.particleFont, text, fontSize, {
  x: 0,
  y: fontSize,
});
const bbox = computed(() => {
  if (path.value) return path.value.getBoundingBox();
});
const points = usePathToPoints(computed(() => path.value));
const centeredPoints = computed(() => {
  if (!(bbox.value && points.value)) return [];
  const { x1, x2 } = bbox.value;
  const offsetX = (width - (x2 - x1)) / 2;
  return points.value.map(pt => ({ x: pt.x + offsetX, y: pt.y }));
});

watchEffect(() => {
  if (pixi?.value?.isReady?.value) pixi.value.app.value.ticker.maxFPS = 60;
});
</script>