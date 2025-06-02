<template></template>

<script setup lang="ts">
import {
  Graphics,
  Particle,
  ParticleContainer,
  type Texture,
  type Ticker,
  type TickerCallback,
  UPDATE_PRIORITY,
} from "pixi.js";

type Props = {
  points: {
    x: number;
    y: number;
  }[];
};

const { points } = defineProps<Props>();
const { app } = useInjectPixi()!;

const createParticleTexture = (color = 0xffffff, radius = 2): Texture => {
  const gfx = new Graphics();
  gfx.circle(radius, radius, radius);
  gfx.fill(color);
  return app.value.renderer.generateTexture(gfx);
};

const getRandomness = <P extends { x: number; y: number }>(particles: P[]) =>
  particles.map(() => [Math.random(), Math.random(), Math.random(), Math.random()] as const);

const createSeekContainer = <P extends { x: number; y: number }>(particles: P[]) =>
  particles.map(particle => ({ ...particle }));

const createAttrContainer = <P extends { x: number; y: number }>(particles: P[]) =>
  particles.map(_ => ({ amt: 1.0, frq: 0.1, angle: 0.0 }));

const state = shallowRef({
  containerId: "particle-container",
  particleTexture: createParticleTexture(0x282828, 2.5),
  particleContainer: new ParticleContainer(),
  particleRandomness: getRandomness([]),
  seekContainer: createSeekContainer(points),
  attrContainer: createAttrContainer(points),
});

const get = {
  get particleCount() {
    return this.particles.length;
  },
  get particles() {
    return state.value.particleContainer.particleChildren;
  },
  origPt(i: number) {
    return points[i];
  },
  currPt(i: number) {
    return this.particles[i];
  },
  seekPt(i: number) {
    return state.value.seekContainer[i];
  },
  attrRnd(i: number) {
    return state.value.particleRandomness[i];
  },
  attr(i: number) {
    return state.value.attrContainer[i];
  },
  get monotonicDelta() {
    return performance.now();
  },
};

const lerp = (start: number, stop: number, amt: number) => amt * (stop - start) + start;
const exp = (start: number, stop: number, amt: number, curve = 2) =>
  start + (stop - start) * amt ** curve;

function jitterSystem(ticker: Ticker) {
  for (let i = 0; i < get.particleCount; ++i) {
    const attr = get.attr(i);
    const p = get.currPt(i);
    const seek = get.seekPt(i);
    const rnd = get.attrRnd(i);

    p.x = seek.x + Math.sin(attr.angle * rnd[0]) * rnd[1] * attr.amt;
    p.y = seek.y + Math.sin(attr.angle * rnd[2]) * rnd[3] * attr.amt;

    attr.angle += attr.frq * ticker.deltaTime;
  }
}

const mArea = 500;
const mPos = { x: 0, y: 0 };
const mMov = { x: 0, y: 0 };
function onMouseMove(this: HTMLCanvasElement, ev: MouseEvent) {
  const bbox = this.getBoundingClientRect();
  mPos.x = ev.clientX - bbox.left;
  mPos.y = ev.clientY - bbox.top;
  mMov.x = ev.movementX;
  mMov.x = ev.movementY;
}

const onUpdate: TickerCallback<any> = ticker => {
  for (let i = 0; i < get.particleCount; ++i) {
    const p = get.currPt(i);
    const dx = p.x - mPos.x;
    const dy = p.y - mPos.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 400) {
      const attr = get.attr(i);
      const factor = 1 - d / mArea;
      attr.amt = exp(1.0, 5, factor, 3);
      attr.frq = exp(0.1, 0.3, factor, 3.2);
    }
  }
};

onMounted(() => {
  const container = new ParticleContainer({
    label: state.value.containerId,
    dynamicProperties: { position: true },
    roundPixels: true,
  });

  for (const pt of points)
    container.addParticle(
      new Particle({
        x: pt.x,
        y: pt.y,
        texture: state.value.particleTexture,
      }),
    );

  app.value.stage.addChild(container);
  state.value.particleContainer = container;
  state.value.particleRandomness = getRandomness(container.particleChildren);

  app.value.ticker.add(onUpdate, undefined, UPDATE_PRIORITY.UTILITY);
  app.value.ticker.add(jitterSystem);

  app.value.canvas.addEventListener("mousemove", onMouseMove);
});

onBeforeUnmount(() => {
  app.value.canvas.removeEventListener("mousemove", onMouseMove);

  app.value.ticker.remove(jitterSystem);
  app.value.ticker.remove(onUpdate, undefined);

  const idx = app.value.stage.children.findIndex(
    container => container.label === state.value.containerId,
  );

  if (idx >= 0) {
    state.value.particleContainer.removeParticles();
    app.value.stage.removeChildAt(idx);
  }
});
</script>