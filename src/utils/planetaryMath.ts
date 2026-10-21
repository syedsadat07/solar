/**
 * Pure calculation utilities for orbital mechanics, coordinates, and telemetry.
 */

export interface Vector2D {
  x: number;
  z: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Calculates current 2D coordinate on orbital plane given orbit radius, angular speed factor, and elapsed time.
 */
export function calculateOrbitalPosition(
  orbitRadius: number,
  orbitSpeed: number,
  elapsedTimeSeconds: number,
  initialAngleRad = 0,
  eccentricity = 0
): { x: number; z: number; angle: number } {
  if (orbitRadius === 0) {
    return { x: 0, z: 0, angle: 0 };
  }
  // Standard angular progression (1 base cycle per ~60s scaled by orbitSpeed)
  const baseRate = 0.05;
  const angle = (initialAngleRad + elapsedTimeSeconds * baseRate * orbitSpeed) % (Math.PI * 2);
  
  // Slight Keplerian elliptical offset if eccentricity provided
  const r = orbitRadius * (1 - eccentricity * Math.cos(angle));
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;

  return { x, z, angle };
}

/**
 * Calculates Euclidean distance between two 3D points.
 */
export function calculateDistance3D(
  p1: [number, number, number] | Vector3D,
  p2: [number, number, number] | Vector3D
): number {
  const x1 = Array.isArray(p1) ? p1[0] : p1.x;
  const y1 = Array.isArray(p1) ? p1[1] : p1.y;
  const z1 = Array.isArray(p1) ? p1[2] : p1.z;

  const x2 = Array.isArray(p2) ? p2[0] : p2.x;
  const y2 = Array.isArray(p2) ? p2[1] : p2.y;
  const z2 = Array.isArray(p2) ? p2[2] : p2.z;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Formats orbital period in human readable days or Earth years.
 */
export function formatOrbitalPeriod(days: number): string {
  if (days === 0) return 'N/A (Center of System)';
  if (days < 365) {
    return `${days.toLocaleString()} Earth days`;
  }
  const years = (days / 365.25).toFixed(2);
  return `${years} Earth years (${days.toLocaleString()} days)`;
}

/**
 * Formats rotation period in hours or days.
 */
export function formatRotationPeriod(hours: number): string {
  const absHours = Math.abs(hours);
  const retrogradeNote = hours < 0 ? ' (Retrograde / Backwards)' : '';

  if (absHours < 48) {
    return `${absHours.toFixed(1)} hours${retrogradeNote}`;
  }
  const days = (absHours / 24).toFixed(1);
  return `${days} Earth days (${absHours.toFixed(1)}h)${retrogradeNote}`;
}

/**
 * Formats temperature object to human readable string with Celsius and Fahrenheit.
 */
export function formatTemperature(temp: { min: number; max: number; mean: number }): {
  celsius: string;
  fahrenheit: string;
} {
  const toF = (c: number) => Math.round((c * 9) / 5 + 32);

  if (temp.min === temp.max) {
    return {
      celsius: `${temp.mean.toLocaleString()} °C`,
      fahrenheit: `${toF(temp.mean).toLocaleString()} °F`,
    };
  }

  return {
    celsius: `${temp.min} °C to ${temp.max} °C (Mean: ${temp.mean} °C)`,
    fahrenheit: `${toF(temp.min)} °F to ${toF(temp.max)} °F (Mean: ${toF(temp.mean)} °F)`,
  };
}

/**
 * Normalizes zoom scale and provides clamped interpolation targets.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
