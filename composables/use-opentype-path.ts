import * as opentype from "opentype.js";

const asyncOpentypeLoad = (url: string, signal: AbortSignal) =>
  new Promise<opentype.Font>((resolve, reject) => {
    let ok = false;
    let aborted = false;

    const timeoutId = setTimeout(() => {
      if (!ok) reject(new Error("Timeout"));
    }, 5000);

    opentype.load(url, (error, font) => {
      if (aborted) return;

      if (error) {
        clearTimeout(timeoutId);
        reject(error);
        return;
      }
      if (!error && font) {
        ok = true;
        clearTimeout(timeoutId);
        resolve(font);
        return;
      }
      clearTimeout(timeoutId);
      reject(new Error("Invalid state"));
    });

    signal.addEventListener("abort", () => {
      aborted = true;
      ok = false;
      reject(new Error("Abort"));
    });
  });

export const useOpentypeFont = (fontSrc: MaybeRef<string>) => {
  const font = ref<opentype.Font>();
  const abort = ref(new AbortController());

  watchEffect(async () => {
    const fontUrl = unref(fontSrc);
    abort.value.abort();
    abort.value = new AbortController();
    asyncOpentypeLoad(fontUrl, abort.value.signal)
      .then(fontData => {
        font.value = fontData;
      })
      .catch(() => {});
  });

  return font;
};

export const useOpentypePath = (
  fontSrc: MaybeRef<string>,
  text: MaybeRef<string>,
  fontSize: MaybeRef<number>,
  position: MaybeRef<{ x: number; y: number }>,
  renderOpts?: MaybeRef<opentype.RenderOptions | undefined>,
) => {
  const font = useOpentypeFont(fontSrc);
  return computed(() => {
    const fontData = font.value;
    const pos = unref(position);
    if (fontData)
      return fontData.getPath(unref(text), pos.x, pos.y, unref(fontSize), unref(renderOpts));
  });
};

type UsePathToPointsOpts = {
  /**
   * The amount of decimal places for floating-point values.
   * @default 4
   */
  decimalPlaces?: number;
  /**
   * How many points should 1 unit contain.
   * @default 0.1
   */
  samplingFactor?: number;
};

export const usePathToPoints = (
  opentypePath: MaybeRef<opentype.Path | undefined>,
  { decimalPlaces = 4, samplingFactor = 0.1 }: UsePathToPointsOpts = {},
) => {
  return computed(() => {
    const path = unref(opentypePath);
    if (!path) return [];
    const svg = path.toDOMElement(decimalPlaces);
    const len = svg.getTotalLength();
    if (len === 0) return [];

    const samples = len * samplingFactor;
    const step = Math.ceil(len / samples);

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < samples; i++) {
      const point = svg.getPointAtLength(i * step);
      points.push({ x: point.x, y: point.y });
    }

    return points;
  });
};
