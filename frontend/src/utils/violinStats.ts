/**
 * Utilidad estadística pura para cálculo de cuantiles y estimación de densidad por kernel (KDE Gaussiano)
 * utilizada en el Gráfico de Violín.
 */

export interface ViolinSummaryStats {
  n: number;
  min: number;
  p5: number;
  q1: number;
  median: number;
  q3: number;
  p95: number;
  max: number;
  mean: number;
  /** Puntos muestreados [valorEnEje, densidadNormalizada 0..1] */
  kde: Array<[number, number]>;
}

/** Calcula un cuantil p (0..1) por interpolación lineal sobre un arreglo ya ordenado ascendentemente. */
export function quantileSorted(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  if (n === 1) return sorted[0];
  const idx = p * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const frac = idx - lo;
  return sorted[lo] + frac * (sorted[hi] - sorted[lo]);
}

/**
 * Calcula estadísticas de resumen y perfil KDE Gaussiano con ancho de banda de Silverman.
 * Soporta escala lineal o log10 (para distribuciones muy sesgadas de días).
 */
export function computeViolinStats(
  rawValues: number[],
  useLogScale: boolean,
  steps = 44
): ViolinSummaryStats | null {
  if (!rawValues.length) return null;

  const sorted = [...rawValues].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  const min = sorted[0];
  const max = sorted[n - 1];
  const p5 = quantileSorted(sorted, 0.05);
  const q1 = quantileSorted(sorted, 0.25);
  const median = quantileSorted(sorted, 0.5);
  const q3 = quantileSorted(sorted, 0.75);
  const p95 = quantileSorted(sorted, 0.95);

  // Transformación al dominio del eje (días reales o log10(días + 1))
  const toAxis = (v: number) => (useLogScale ? Math.log10(Math.max(1, v + 1)) : v);
  const fromAxis = (x: number) => (useLogScale ? Math.max(0, Math.pow(10, x) - 1) : x);

  const axisVals = sorted.map(toAxis);
  const axisMean = axisVals.reduce((a, b) => a + b, 0) / n;
  const variance = axisVals.reduce((a, b) => a + (b - axisMean) ** 2, 0) / Math.max(1, n - 1);
  const std = Math.sqrt(variance);
  const iqrAxis = toAxis(q3) - toAxis(q1);
  const spread = std > 0 && iqrAxis > 0 ? Math.min(std, iqrAxis / 1.34) : std || iqrAxis || (useLogScale ? 0.25 : 30);

  // Ancho de banda de Silverman con piso mínimo para evitar picos artificiales en N pequeño
  const minBandwidth = useLogScale ? 0.14 : 25;
  const bandwidth = Math.max(minBandwidth, 0.9 * spread * Math.pow(n, -0.2));

  const loAxis = Math.max(useLogScale ? 0 : 0, toAxis(min) - bandwidth * 0.6);
  const hiAxis = toAxis(max) + bandwidth * 0.6;
  const span = Math.max(hiAxis - loAxis, useLogScale ? 0.5 : 10);

  const rawDensities: Array<[number, number]> = [];
  let maxDensity = 0;
  const invNorm = 1 / (n * bandwidth * Math.sqrt(2 * Math.PI));

  for (let i = 0; i <= steps; i++) {
    const x = loAxis + (span * i) / steps;
    let density = 0;
    for (let j = 0; j < n; j++) {
      const u = (x - axisVals[j]) / bandwidth;
      density += Math.exp(-0.5 * u * u);
    }
    density *= invNorm;
    if (density > maxDensity) maxDensity = density;
    rawDensities.push([fromAxis(x), density]);
  }

  const kde: Array<[number, number]> = rawDensities.map(([val, d]) => [
    val,
    maxDensity > 0 ? d / maxDensity : 0,
  ]);

  return {
    n,
    min,
    p5,
    q1,
    median,
    q3,
    p95,
    max,
    mean,
    kde,
  };
}
