// growth/types/lms.ts

import type { Classification, Indicator, LmsTriple } from "./types";

import { LmsDomainError } from "./types";

function assertLms(lms: LmsTriple): void {
  const { l, m, s } = lms;
  if (!Number.isFinite(l) || !Number.isFinite(m) || !Number.isFinite(s)) {
    throw new LmsDomainError("LMS parameters must be finite", { ...lms });
  }
  if (m <= 0) throw new LmsDomainError("LMS M must be > 0", { ...lms });
  if (s <= 0) throw new LmsDomainError("LMS S must be > 0", { ...lms });
}

export function valueAtZScore(lms: LmsTriple, z: number): number {
  assertLms(lms);
  if (!Number.isFinite(z)) throw new LmsDomainError("zScore must be finite", { z, ...lms });
  const { l, m, s } = lms;
  if (l === 0) return m * Math.exp(s * z);
  const base = 1 + l * s * z;
  if (base <= 0) {
    throw new LmsDomainError(`1 + L·S·Z must be > 0 (got L=${l}, S=${s}, Z=${z} → ${base})`, {
      ...lms,
      z,
      base,
    });
  }
  return m * base ** (1 / l);
}

export function zScoreForValue(lms: LmsTriple, value: number): number {
  assertLms(lms);
  if (!Number.isFinite(value) || value <= 0) {
    throw new LmsDomainError("measured value must be > 0 and finite", {
      value,
      ...lms,
    });
  }
  const { l, m, s } = lms;
  if (l === 0) return Math.log(value / m) / s;
  return ((value / m) ** l - 1) / (l * s);
}

export function percentileFromZ(z: number): number {
  if (!Number.isFinite(z)) return z > 0 ? 100 : 0;
  if (z > 8) return 100;
  if (z < -8) return 0;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const pct = z >= 0 ? (1 - p) * 100 : p * 100;
  return Math.min(100, Math.max(0, pct));
}

export function interpolateLms(
  targetX: number,
  lower: { x: number; l: number; m: number; s: number },
  upper: { x: number; l: number; m: number; s: number },
): LmsTriple {
  if (!(lower.x < upper.x)) {
    throw new LmsDomainError("interpolateLms requires lower.x < upper.x", {
      lowerX: lower.x,
      upperX: upper.x,
    });
  }
  if (targetX < lower.x || targetX > upper.x) {
    throw new LmsDomainError("interpolateLms targetX is outside [lower.x, upper.x]", {
      targetX,
      lowerX: lower.x,
      upperX: upper.x,
    });
  }
  if (targetX === lower.x) return { l: lower.l, m: lower.m, s: lower.s };
  if (targetX === upper.x) return { l: upper.l, m: upper.m, s: upper.s };
  const f = (targetX - lower.x) / (upper.x - lower.x);
  return {
    l: lower.l + f * (upper.l - lower.l),
    m: lower.m + f * (upper.m - lower.m),
    s: lower.s + f * (upper.s - lower.s),
  };
}

export function classify(indicator: Indicator, z: number): Classification {
  if (!Number.isFinite(z)) {
    throw new LmsDomainError("z must be finite for classification", {
      indicator,
      z,
    });
  }
  switch (indicator) {
    case "weight-for-age":
      if (z < -3)
        return {
          category: "underweight",
          severity: "severe",
          label: "severely underweight",
        };
      if (z < -2)
        return {
          category: "underweight",
          severity: "moderate",
          label: "underweight",
        };
      if (z > 3)
        return {
          category: "obese",
          severity: "severe",
          label: "severely obese",
        };
      if (z > 2)
        return {
          category: "overweight",
          severity: "moderate",
          label: "overweight",
        };
      if (z > 1)
        return {
          category: "overweight",
          severity: "mild",
          label: "at risk of overweight",
        };
      return { category: "normal", severity: null, label: "normal" };

    case "length-for-age":
      if (z < -3)
        return {
          category: "stunted",
          severity: "severe",
          label: "severely stunted",
        };
      if (z < -2) return { category: "stunted", severity: "moderate", label: "stunted" };
      if (z > 3) return { category: "normal", severity: "mild", label: "tall stature" };
      return { category: "normal", severity: null, label: "normal" };

    case "weight-for-length":
      if (z < -3)
        return {
          category: "wasted",
          severity: "severe",
          label: "severely wasted",
        };
      if (z < -2) return { category: "wasted", severity: "moderate", label: "wasted" };
      if (z > 3)
        return {
          category: "obese",
          severity: "severe",
          label: "severely obese",
        };
      if (z > 2) return { category: "obese", severity: "moderate", label: "obese" };
      if (z > 1)
        return {
          category: "overweight",
          severity: "mild",
          label: "at risk of overweight",
        };
      return { category: "normal", severity: null, label: "normal" };

    case "bmi-for-age":
      if (z < -3) return { category: "thin", severity: "severe", label: "severely thin" };
      if (z < -2) return { category: "thin", severity: "moderate", label: "thin" };
      if (z > 3)
        return {
          category: "obese",
          severity: "severe",
          label: "severely obese",
        };
      if (z > 2) return { category: "obese", severity: "moderate", label: "obese" };
      if (z > 1)
        return {
          category: "overweight",
          severity: "mild",
          label: "at risk of overweight",
        };
      return { category: "normal", severity: null, label: "normal" };

    case "head-circumference-for-age":
      if (z < -3)
        return {
          category: "microcephaly",
          severity: "severe",
          label: "severe microcephaly",
        };
      if (z < -2)
        return {
          category: "microcephaly",
          severity: "moderate",
          label: "microcephaly",
        };
      if (z > 3)
        return {
          category: "macrocephaly",
          severity: "severe",
          label: "severe macrocephaly",
        };
      if (z > 2)
        return {
          category: "macrocephaly",
          severity: "moderate",
          label: "macrocephaly",
        };
      return { category: "normal", severity: null, label: "normal" };

    default: {
      const _exhaustive: never = indicator;
      throw new LmsDomainError("unsupported indicator", {
        indicator: _exhaustive,
        z,
      });
    }
  }
}
