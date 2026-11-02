// Ritmo del muro: cada cuántos segundos entra una foto nueva y cuánto permanece
export function wallTiming(slideSeconds: number) {
  const step = Math.max(4, slideSeconds);
  const dwell = Math.max(45, step * 7);
  return { step, dwell };
}
