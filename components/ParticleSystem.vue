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

const pointsCumSum =  points.reduce(
  (sum, pt) => {
    sum.x += pt.x;
    sum.y += pt.y;
    return sum;
  },
  ({ x: 0, y: 0 }),
);
const meanPt = { x: pointsCumSum.x / points.length, y: pointsCumSum.y / points.length };

const { app } = useInjectPixi()!;

const createParticleTexture = (color = 0xffffff, radius = 2): Texture => {
  const gfx = new Graphics();
  gfx.circle(radius, radius, radius);
  gfx.fill(color);
  return app.value.renderer.generateTexture(gfx);
};

const { width: screenW, height: screenH } = useScreenBbox();

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const remap = (n: number, start1: number, stop1: number, start2: number, stop2: number) => (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
const randClamped = (min: number, max: number) => Math.random() * (max - min) + min;
const randScreenPos = () => ({ x: randClamped(0, screenW), y: randClamped(0, screenH) });

const getRandomness = <P extends { x: number; y: number }>(particles: P[]) =>
  particles.map(() => [Math.random(), Math.random(), Math.random(), Math.random()] as const);

const createSeekContainer = <P extends { x: number; y: number }>(particles: P[]) =>
  particles.map(particle => ({ ...particle }));

const createAttrContainer = <P extends { x: number; y: number }>(particles: P[]) =>
  particles.map(_ => ({ amt: 0.2, frq: 0.05, angle: 0.0, vel: { x: 0, y: 0 }, acc: { x: 0, y: 0 } }));

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
const expDecay = (a: number, b: number, decay: number, dt: number) =>
  b + (a - b) * Math.exp(-decay * dt);

function seekSystem(ticker: Ticker) {
  for (let i = 0; i < get.particleCount; ++i) {
    const p = get.currPt(i);
    const seek = get.seekPt(i);

    p.x = expDecay(p.x, seek.x, 0.08, ticker.deltaTime);
    p.y = expDecay(p.y, seek.y, 0.06, ticker.deltaTime);
  }
}

function chargeSystem(ticker: Ticker) {
  for (let i = 0; i < get.particleCount; ++i) {
    const p = get.currPt(i);
    const attr = get.attr(i);
    const rnd = get.attrRnd(i);
    const seek = get.seekPt(i);
    const dist = vecDist(meanPt, seek);
    const distFact = dist / screenW;
    const heldPow = clamp(timeHeld / 1000, 0.1, 1.0);

    p.x = expDecay(p.x, meanPt.x, distFact * heldPow, ticker.deltaTime) + Math.sin(attr.angle * rnd[0]) * rnd[1] * attr.amt;
    p.y = expDecay(p.y, meanPt.y, distFact * heldPow, ticker.deltaTime) + Math.sin(attr.angle * rnd[2]) * rnd[3] * attr.amt;
  }
}

function mingleSystem(ticker: Ticker) {
  for (let i = 0; i < get.particleCount; ++i) {
    const attr = get.attr(i);
    const p = get.currPt(i);
    const rnd = get.attrRnd(i);

    p.x += Math.sin(attr.angle * rnd[0]) * rnd[1] * attr.amt * ticker.deltaTime;
    p.y += Math.sin(attr.angle * rnd[2]) * rnd[3] * attr.amt * ticker.deltaTime;

    attr.angle += attr.frq * ticker.deltaTime;
  }
}

const mArea = 200;
const mPos = { x: 0, y: 0 };
const mMov = { x: 0, y: 0 };
function onMouseMove(this: HTMLCanvasElement, ev: MouseEvent) {
  const bbox = this.getBoundingClientRect();
  mPos.x = ev.clientX - bbox.left;
  mPos.y = ev.clientY - bbox.top;
  mMov.x = ev.movementX;
  mMov.x = ev.movementY;
}

const mPow = 10;
let timeStart = 0;
let timeHeld = 0;
function onMouseDown(this: HTMLCanvasElement, ev: MouseEvent) {
  timeStart = Date.now();
  timeHeld = 0;
  app.value.ticker.add(chargeSystem);
}
function onMouseUp(this: HTMLCanvasElement, ev: MouseEvent) {
  app.value.ticker.remove(chargeSystem);
  timeStart = 0;
  timeHeld = 0;
}

const vecDist = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

const onUpdate: TickerCallback<any> = ticker => {
  if (timeStart > 0)
    timeHeld = Date.now() - timeStart;

  for (let i = 0; i < get.particleCount; ++i) {
    const p = get.currPt(i);
    const attr = get.attr(i);
    
    if (timeStart === 0) {
      const d = vecDist(p, mPos);
      if (d < mArea) {
        const factor = 1 - d / mArea;
        attr.amt = exp(1.0, 5, factor, 3);
        attr.frq = exp(0.1, 0.3, factor, 3.2);
      } else {
        attr.amt = 0.2;
        attr.frq = 0.05;
      }
    } else {
      const time = clamp(timeHeld / 1000, 0.0, 1.5);
      const amt = remap(time, 0.0, 1.5, 5, 15);
      const frq = remap(time, 0.0, 1.5, 0.3, 0.9);
      attr.amt = expDecay(attr.amt, amt, 0.75, ticker.deltaTime);
      attr.frq = expDecay(attr.frq, frq, 0.75, ticker.deltaTime);
    }
  }
};

onMounted(() => {
  const container = new ParticleContainer({
    label: state.value.containerId,
    dynamicProperties: { position: true },
    roundPixels: true,
  });

  for (const _ of points) {
    const pos = randScreenPos();
    container.addParticle(
      new Particle({
        x: pos.x,
        y: pos.y,
        texture: state.value.particleTexture,
      }),
    );
  }

  app.value.stage.addChild(container);
  state.value.particleContainer = container;
  state.value.particleRandomness = getRandomness(container.particleChildren);

  app.value.ticker.add(onUpdate, undefined, UPDATE_PRIORITY.UTILITY);
  app.value.ticker.add(seekSystem);
  app.value.ticker.add(mingleSystem);

  app.value.canvas.addEventListener("mousemove", onMouseMove);
  app.value.canvas.addEventListener("mousedown", onMouseDown);
  app.value.canvas.addEventListener("mouseup", onMouseUp);
});

onBeforeUnmount(() => {
  app.value.canvas.removeEventListener("mouseup", onMouseUp);
  app.value.canvas.removeEventListener("mousedown", onMouseDown);
  app.value.canvas.removeEventListener("mousemove", onMouseMove);

  app.value.ticker.remove(mingleSystem);
  app.value.ticker.remove(seekSystem);
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