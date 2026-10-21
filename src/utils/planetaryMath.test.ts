import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrbitalPosition,
  calculateDistance3D,
  formatOrbitalPeriod,
  formatRotationPeriod,
  formatTemperature,
  clamp,
} from './planetaryMath';

test('calculateOrbitalPosition returns 0,0 for center (radius 0)', () => {
  const pos = calculateOrbitalPosition(0, 0, 100);
  assert.equal(pos.x, 0);
  assert.equal(pos.z, 0);
  assert.equal(pos.angle, 0);
});

test('calculateOrbitalPosition calculates circular position correctly', () => {
  const radius = 50;
  const speed = 1.0;
  // at time 0
  const pos0 = calculateOrbitalPosition(radius, speed, 0, 0);
  assert.ok(Math.abs(pos0.x - 50) < 1e-4);
  assert.ok(Math.abs(pos0.z - 0) < 1e-4);

  // at time resulting in quarter orbit
  const posQuarter = calculateOrbitalPosition(radius, speed, 0, Math.PI / 2);
  assert.ok(Math.abs(posQuarter.x) < 1e-4);
  assert.ok(Math.abs(posQuarter.z - 50) < 1e-4);
});

test('calculateDistance3D correctly computes 3D Euclidean distances', () => {
  const d1 = calculateDistance3D([0, 0, 0], [3, 4, 0]);
  assert.equal(d1, 5);

  const d2 = calculateDistance3D({ x: 1, y: 2, z: 2 }, { x: 1, y: 2, z: 2 });
  assert.equal(d2, 0);

  const d3 = calculateDistance3D([0, 0, 0], [1, 2, 2]);
  assert.equal(d3, 3);
});

test('formatOrbitalPeriod handles days and year conversions', () => {
  assert.equal(formatOrbitalPeriod(0), 'N/A (Center of System)');
  assert.equal(formatOrbitalPeriod(88), '88 Earth days');
  assert.ok(formatOrbitalPeriod(365.25).includes('1.00 Earth years'));
});

test('formatRotationPeriod formats normal and retrograde periods', () => {
  const earth = formatRotationPeriod(24);
  assert.equal(earth, '24.0 hours');

  const venus = formatRotationPeriod(-5832.5);
  assert.ok(venus.includes('Retrograde'));
  assert.ok(venus.includes('Earth days'));
});

test('formatTemperature handles min/max range and single values', () => {
  const sun = formatTemperature({ min: 5500, max: 5500, mean: 5500 });
  assert.equal(sun.celsius, '5,500 °C');

  const mercury = formatTemperature({ min: -180, max: 430, mean: 167 });
  assert.ok(mercury.celsius.includes('-180 °C to 430 °C'));
  assert.ok(mercury.fahrenheit.includes('°F'));
});

test('clamp restricts numbers within bounds', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-2, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
});
