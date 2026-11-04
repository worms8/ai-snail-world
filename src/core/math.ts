/** Tiny math helpers shared by every layer. Pure, allocation-free. */

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const clamp01 = (value: number): number => clamp(value, 0, 1);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const distanceSq = (ax: number, ay: number, bx: number, by: number): number => {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
};

/** Moves `value` toward `target` by at most `maxDelta`. */
export const moveToward = (value: number, target: number, maxDelta: number): number => {
  if (Math.abs(target - value) <= maxDelta) return target;
  return value + Math.sign(target - value) * maxDelta;
};
