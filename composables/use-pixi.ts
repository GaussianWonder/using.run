import { Application, type ApplicationOptions, type Renderer } from "pixi.js";
import { useIsMounted } from "~/composables/use-is-mounted";

type Opts = Partial<ApplicationOptions>;
export type UsePixiOpts = Opts | (() => Opts);

export const usePixi = (canvas: Ref<HTMLCanvasElement | undefined>, opts?: UsePixiOpts) => {
  const app = shallowRef(new Application<Renderer<HTMLCanvasElement>>());
  const isLoading = ref(true);
  const ok = ref(false);
  const error = ref();

  const setup = async () => {
    try {
      const appInitOpts = typeof opts === "function" ? opts() : opts;
      await app.value.init({ ...appInitOpts, canvas: canvas.value });
      ok.value = true;
    } catch (e) {
      console.error(e);
      error.value = e;
      ok.value = false;
    }
    isLoading.value = false;
  };

  const isCanvasMounted = computed(() => !!canvas.value);
  const isMounted = useIsMounted();
  const canSetup = computed(() => isCanvasMounted.value && isMounted.value);
  watch(canSetup, canSetup => {
    if (canSetup) setup();
  });

  const isReady = ref(false);
  const start = Date.now();
  const checkReady = () => {
    if (app.value.stage && app.value.screen && app.value.renderer) isReady.value = true;
    if (Date.now() - start > 1000 * 30) {
      readyCheck.pause();
      console.warn("Pixi did not init");
    }
  };
  const readyCheck = useIntervalFn(checkReady, 10, { immediate: false, immediateCallback: true });

  watch([isLoading, ok, error], ([isLoading, ok, error]) => {
    if (!isLoading && ok && !error) readyCheck.resume();
  });

  watch(isReady, isReady => {
    if (isReady) {
      readyCheck.pause();
    }
  });

  return {
    app,
    isReady,
    isLoading,
    status: computed(() => {
      if (isLoading.value) return "wait-init";
      if (!ok.value && error.value) return "init-error";
      if (isReady.value) return "wait-renderer";
      if (!readyCheck.isActive.value) return "timeout";
      return "ok";
    }),
    error,
    get screen() {
      return app.value.screen;
    },
    get renderer() {
      return app.value.renderer;
    },
    get stage() {
      return app.value.stage;
    },
  };
};

export type PixiApp = ReturnType<typeof usePixi>;

export const useProvidePixi = (pixi: PixiApp) => provide("pixi", pixi);
export const useInjectPixi = () => inject<PixiApp>("pixi");
export const usePixiRef = () => ref<PixiApp>();
