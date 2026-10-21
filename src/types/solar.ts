export interface PlanetSpec {
  id: string;
  name: string;
  tagline: string;
  color: string;
  accentColor: string;
  sizeRadius: number; // visual scale in simulation
  realRadiusKm: number;
  distanceFromSunAU: number;
  realDistanceKm: string;
  orbitRadius: number; // visual distance in simulation
  orbitSpeed: number; // orbital angular velocity factor
  initialOrbitalAngleRad?: number; // staggered starting angle
  rotationPeriodHours: number; // axial rotation period in hours
  axialTiltDeg: number; // tilt in degrees
  orbitalPeriodDays: number; // days to orbit Sun
  temperatureC: {
    min: number;
    max: number;
    mean: number;
  };
  gravityMs2: number;
  moonsCount: number;
  moons: string[];
  atmosphere: string;
  surfaceComposition: string;
  type: 'Star' | 'Terrestrial Planet' | 'Gas Giant' | 'Ice Giant' | 'Dwarf Planet';
  rings?: {
    innerRadius: number;
    outerRadius: number;
    color: string;
  };
  hasClouds?: boolean;
  description: string;
  funFacts: string[];
  discoveredBy?: string;
  discoveryYear?: string;
}

export interface CameraPreset {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  target: [number, number, number];
}

export interface SimulationSettings {
  timeSpeed: number; // 0.1 to 100
  isPaused: boolean;
  showOrbits: boolean;
  showLabels: boolean;
  showTrails: boolean;
  showGrid: boolean;
  realisticLighting: boolean;
  showStars: boolean;
  darkSpaceMode: boolean;
  performanceMode: boolean;
  autoRotateCamera: boolean;
  selectedPlanetId: string | null;
  focusedPlanetId: string | null;
}
