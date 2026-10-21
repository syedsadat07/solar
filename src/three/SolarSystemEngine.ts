import * as THREE from 'three';
import { SUN_DATA, PLANETS_DATA, CAMERA_PRESETS } from '../data/planets';
import { PlanetSpec, SimulationSettings, CameraPreset } from '../types/solar';
import { calculateOrbitalPosition, clamp } from '../utils/planetaryMath';
import {
  getSunTexture,
  getSunGlowSpriteTexture,
  getMercuryTexture,
  getVenusTexture,
  getEarthTexture,
  getEarthCloudsTexture,
  getMoonTexture,
  getMarsTexture,
  getJupiterTexture,
  getSaturnTexture,
  getSaturnRingsTexture,
  getUranusTexture,
  getNeptuneTexture,
  getPlutoTexture,
} from './proceduralTextures';

export interface PlanetMeshEntry {
  spec: PlanetSpec;
  meshGroup: THREE.Group;
  planetSphere: THREE.Mesh;
  cloudsSphere?: THREE.Mesh;
  moonGroup?: THREE.Group;
  orbitLine?: THREE.Line;
  trailLine?: THREE.Line;
  trailPositions: number[];
  currentPosition: THREE.Vector3;
}

export interface ScreenLabelPos {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  visible: boolean;
  distanceAu: number;
}

export class SolarSystemEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  private isSoftwareGl = false;
  private animationFrameId: number | null = null;
  private isDestroyed = false;

  // Lighting
  private sunPointLight!: THREE.PointLight;
  private ambientLight!: THREE.AmbientLight;
  private hemisphereLight!: THREE.HemisphereLight;

  // Starfield and Nebulae
  private starsGroup!: THREE.Group;
  private gridHelper!: THREE.Group;

  // Planet meshes
  private sunGroup!: THREE.Group;
  private sunMesh!: THREE.Mesh;
  private sunCoronaSprite!: THREE.Sprite;
  private planetsMap = new Map<string, PlanetMeshEntry>();

  // Selection reticle
  private selectionReticle!: THREE.Mesh;

  // Camera control state
  private isMouseDown = false;
  private mouseButton = 0; // 0: left, 1: middle, 2: right
  private lastMouseX = 0;
  private lastMouseY = 0;

  // Orbit angles (spherical coordinates relative to target)
  private cameraRadius = 280;
  private cameraTargetRadius = 280;
  private cameraTheta = Math.PI / 4; // azimuth
  private cameraTargetTheta = Math.PI / 4;
  private cameraPhi = Math.PI / 3.2; // polar elevation
  private cameraTargetPhi = Math.PI / 3.2;

  // Target point the camera orbits around
  private lookAtTarget = new THREE.Vector3(0, 0, 0);
  private desiredLookAtTarget = new THREE.Vector3(0, 0, 0);

  // Keyboard navigation
  private keysPressed = new Set<string>();

  // Touch navigation
  private initialTouchDistance = 0;
  private isTouching = false;
  private lastTouchX = 0;
  private lastTouchY = 0;

  // Simulation time
  private simTime = 0;
  private lastClockTime = performance.now();

  // Settings
  private settings: SimulationSettings;

  // Callbacks
  private onSelectPlanetCallback?: (planet: PlanetSpec | null) => void;
  private onLabelsUpdateCallback?: (labels: ScreenLabelPos[]) => void;

  // Temp vectors for zero-GC loop
  private readonly _v3A = new THREE.Vector3();
  private readonly _v3B = new THREE.Vector3();
  private readonly _raycaster = new THREE.Raycaster();
  private readonly _mouseCoords = new THREE.Vector2();

  constructor(
    container: HTMLElement,
    settings: SimulationSettings,
    callbacks?: {
      onSelectPlanet?: (planet: PlanetSpec | null) => void;
      onLabelsUpdate?: (labels: ScreenLabelPos[]) => void;
    }
  ) {
    this.container = container;
    this.settings = { ...settings };
    this.onSelectPlanetCallback = callbacks?.onSelectPlanet;
    this.onLabelsUpdateCallback = callbacks?.onLabelsUpdate;

    // Detect software GL
    this.detectSoftwareGl();

    // Init Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020308);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 3000);
    this.camera.position.set(0, 240, 280);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // required for clean screenshot capture
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Setup elements
    this.initLighting();
    this.initBackgroundStars();
    this.initGridAndAxes();
    this.initSun();
    this.initPlanets();
    this.initSelectionReticle();

    // Event listeners
    this.bindEvents();

    // Start loop
    this.lastClockTime = performance.now();
    this.animate();
  }

  private detectSoftwareGl() {
    try {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) {
        this.isSoftwareGl = true;
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      this.isSoftwareGl = false;
    }
  }

  private initLighting() {
    // Warm Sun PointLight at center with realistic intensity
    this.sunPointLight = new THREE.PointLight(0xfff4d6, 3.5, 600, 0.45);
    this.sunPointLight.position.set(0, 0, 0);
    this.sunPointLight.castShadow = !this.isSoftwareGl;
    if (!this.isSoftwareGl) {
      this.sunPointLight.shadow.mapSize.width = 1024;
      this.sunPointLight.shadow.mapSize.height = 1024;
      this.sunPointLight.shadow.bias = -0.001;
    }
    this.scene.add(this.sunPointLight);

    // Ambient light (toggled high when realistic lighting is disabled so shadow sides are visible)
    this.ambientLight = new THREE.AmbientLight(0x354060, this.settings.realisticLighting ? 0.12 : 0.45);
    this.scene.add(this.ambientLight);

    // Hemisphere light for subtle cosmic rim contrast
    this.hemisphereLight = new THREE.HemisphereLight(0x1a264a, 0x050a14, 0.3);
    this.scene.add(this.hemisphereLight);
  }

  private initBackgroundStars() {
    this.starsGroup = new THREE.Group();

    const starCount = this.settings.performanceMode ? 1500 : 3500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const starPalette = [
      new THREE.Color('#ffffff'), // White
      new THREE.Color('#b5d2ff'), // Blue giant
      new THREE.Color('#ffe194'), // Yellow
      new THREE.Color('#ffb094'), // Red dwarf
      new THREE.Color('#d4e8ff'), // Cyan
    ];

    for (let i = 0; i < starCount; i++) {
      // Distribute stars on a wide outer celestial sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 900 + Math.random() * 500;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const color = starPalette[Math.floor(Math.random() * starPalette.length)];
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = color.r * brightness;
      colors[i * 3 + 1] = color.g * brightness;
      colors[i * 3 + 2] = color.b * brightness;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    const starPoints = new THREE.Points(geometry, material);
    this.starsGroup.add(starPoints);

    this.starsGroup.visible = this.settings.showStars;
    this.scene.add(this.starsGroup);
  }

  private initGridAndAxes() {
    this.gridHelper = new THREE.Group();

    // Ecliptic coordinate plane grid
    const grid = new THREE.GridHelper(480, 48, 0x334466, 0x18243b);
    grid.position.y = -0.1;
    this.gridHelper.add(grid);

    // Subtle concentric orbital distance rings
    const distances = [24, 36, 50, 66, 92, 124, 156, 188, 220];
    for (const d of distances) {
      const ringGeo = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * d, -0.05, Math.sin(theta) * d));
      }
      ringGeo.setFromPoints(points);
      const ringMat = new THREE.LineBasicMaterial({
        color: 0x223554,
        transparent: true,
        opacity: 0.35,
      });
      const ringLine = new THREE.Line(ringGeo, ringMat);
      this.gridHelper.add(ringLine);
    }

    this.gridHelper.visible = this.settings.showGrid;
    this.scene.add(this.gridHelper);
  }

  private initSun() {
    this.sunGroup = new THREE.Group();

    // Sun sphere with emissive procedural plasma texture
    const sunTexture = getSunTexture();
    const sunGeo = new THREE.SphereGeometry(SUN_DATA.sizeRadius, 48, 48);
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTexture,
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.userData = { id: 'sun', spec: SUN_DATA };
    this.sunGroup.add(this.sunMesh);

    // Multi-layer glowing corona sprite
    const coronaTexture = getSunGlowSpriteTexture();
    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTexture,
      color: 0xffe28a,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.sunCoronaSprite = new THREE.Sprite(coronaMat);
    this.sunCoronaSprite.scale.set(45, 45, 1);
    this.sunGroup.add(this.sunCoronaSprite);

    this.scene.add(this.sunGroup);
  }

  private initPlanets() {
    for (const spec of PLANETS_DATA) {
      const meshGroup = new THREE.Group();
      const initialPos = calculateOrbitalPosition(spec.orbitRadius, spec.orbitSpeed, 0, spec.initialOrbitalAngleRad || 0);
      meshGroup.position.set(initialPos.x, 0, initialPos.z);

      // Choose procedural texture
      let texture: THREE.CanvasTexture;
      switch (spec.id) {
        case 'mercury':
          texture = getMercuryTexture();
          break;
        case 'venus':
          texture = getVenusTexture();
          break;
        case 'earth':
          texture = getEarthTexture();
          break;
        case 'mars':
          texture = getMarsTexture();
          break;
        case 'jupiter':
          texture = getJupiterTexture();
          break;
        case 'saturn':
          texture = getSaturnTexture();
          break;
        case 'uranus':
          texture = getUranusTexture();
          break;
        case 'neptune':
          texture = getNeptuneTexture();
          break;
        case 'pluto':
          texture = getPlutoTexture();
          break;
        default:
          texture = getMercuryTexture();
      }

      // Planet Sphere
      const sphereGeo = new THREE.SphereGeometry(spec.sizeRadius, 36, 36);
      const sphereMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: spec.type === 'Gas Giant' || spec.type === 'Ice Giant' ? 0.7 : 0.85,
        metalness: 0.1,
      });

      const planetSphere = new THREE.Mesh(sphereGeo, sphereMat);
      planetSphere.castShadow = !this.isSoftwareGl;
      planetSphere.receiveShadow = !this.isSoftwareGl;
      planetSphere.userData = { id: spec.id, spec };

      // Apply axial tilt
      planetSphere.rotation.z = THREE.MathUtils.degToRad(spec.axialTiltDeg);
      meshGroup.add(planetSphere);

      let cloudsSphere: THREE.Mesh | undefined;
      // Earth Cloud Layer
      if (spec.id === 'earth') {
        const cloudsTexture = getEarthCloudsTexture();
        const cloudsGeo = new THREE.SphereGeometry(spec.sizeRadius * 1.025, 36, 36);
        const cloudsMat = new THREE.MeshStandardMaterial({
          map: cloudsTexture,
          transparent: true,
          opacity: 0.85,
          blending: THREE.NormalBlending,
          depthWrite: false,
        });
        cloudsSphere = new THREE.Mesh(cloudsGeo, cloudsMat);
        cloudsSphere.rotation.z = THREE.MathUtils.degToRad(spec.axialTiltDeg);
        meshGroup.add(cloudsSphere);
      }

      // Saturn & Uranus Rings
      if (spec.rings) {
        const ringsTexture = spec.id === 'saturn' ? getSaturnRingsTexture() : undefined;
        const ringGeo = new THREE.RingGeometry(spec.rings.innerRadius, spec.rings.outerRadius, 64);
        // Align ring to equator
        ringGeo.rotateX(-Math.PI / 2);

        const ringMat = new THREE.MeshStandardMaterial({
          map: ringsTexture,
          color: ringsTexture ? undefined : new THREE.Color(spec.rings.color),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
          roughness: 0.6,
        });

        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.z = THREE.MathUtils.degToRad(spec.axialTiltDeg);
        ringMesh.castShadow = !this.isSoftwareGl;
        ringMesh.receiveShadow = !this.isSoftwareGl;
        meshGroup.add(ringMesh);
      }

      // Moon for Earth
      let moonGroup: THREE.Group | undefined;
      if (spec.id === 'earth') {
        moonGroup = new THREE.Group();
        const moonTexture = getMoonTexture();
        const moonGeo = new THREE.SphereGeometry(0.65, 24, 24);
        const moonMat = new THREE.MeshStandardMaterial({
          map: moonTexture,
          roughness: 0.9,
        });
        const moonSphere = new THREE.Mesh(moonGeo, moonMat);
        moonSphere.position.set(4.5, 0, 0);
        moonSphere.castShadow = !this.isSoftwareGl;
        moonSphere.receiveShadow = !this.isSoftwareGl;
        moonGroup.add(moonSphere);
        meshGroup.add(moonGroup);
      }

      // Jupiter Galilean Moons (Io, Europa, Ganymede, Callisto mini spheres)
      if (spec.id === 'jupiter') {
        moonGroup = new THREE.Group();
        const moonColors = [0xe8c547, 0xcfd8dc, 0x8d6e63, 0x616161];
        const distances = [8.5, 11, 14, 18];
        for (let i = 0; i < 4; i++) {
          const mGeo = new THREE.SphereGeometry(0.35 + i * 0.08, 16, 16);
          const mMat = new THREE.MeshStandardMaterial({ color: moonColors[i], roughness: 0.8 });
          const mMesh = new THREE.Mesh(mGeo, mMat);
          mMesh.position.set(distances[i], 0, 0);
          moonGroup.add(mMesh);
        }
        meshGroup.add(moonGroup);
      }

      // Orbit Line
      const orbitGeo = new THREE.BufferGeometry();
      const orbitPoints: THREE.Vector3[] = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(Math.cos(theta) * spec.orbitRadius, 0, Math.sin(theta) * spec.orbitRadius));
      }
      orbitGeo.setFromPoints(orbitPoints);
      const orbitMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(spec.accentColor),
        transparent: true,
        opacity: 0.35,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.visible = this.settings.showOrbits;
      this.scene.add(orbitLine);

      // Planet Trail
      const maxTrailPoints = 80;
      const trailPositions: number[] = [];
      const trailGeo = new THREE.BufferGeometry();
      const trailBuffer = new Float32Array(maxTrailPoints * 3);
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailBuffer, 3));
      const trailMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(spec.accentColor),
        transparent: true,
        opacity: 0.6,
      });
      const trailLine = new THREE.Line(trailGeo, trailMat);
      trailLine.visible = this.settings.showTrails;
      this.scene.add(trailLine);

      this.scene.add(meshGroup);

      this.planetsMap.set(spec.id, {
        spec,
        meshGroup,
        planetSphere,
        cloudsSphere,
        moonGroup,
        orbitLine,
        trailLine,
        trailPositions,
        currentPosition: new THREE.Vector3(spec.orbitRadius, 0, 0),
      });
    }
  }

  private initSelectionReticle() {
    // Glowing ring indicator around selected body
    const ringGeo = new THREE.RingGeometry(3.5, 4.0, 48);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.selectionReticle = new THREE.Mesh(ringGeo, ringMat);
    this.selectionReticle.visible = false;
    this.scene.add(this.selectionReticle);
  }

  private bindEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    el.addEventListener('wheel', this.onWheel, { passive: false });
    el.addEventListener('dblclick', this.onDoubleClick);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Touch events for mobile
    el.addEventListener('touchstart', this.onTouchStart, { passive: false });
    el.addEventListener('touchmove', this.onTouchMove, { passive: false });
    el.addEventListener('touchend', this.onTouchEnd);

    window.addEventListener('resize', this.onWindowResize);
  }

  private onMouseDown = (e: MouseEvent) => {
    // Only capture if clicking canvas directly
    this.isMouseDown = true;
    this.mouseButton = e.button;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    // Left click can also select a planet
    if (e.button === 0) {
      this.checkPlanetClick(e.clientX, e.clientY);
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isMouseDown) return;

    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    if (this.mouseButton === 0 || this.mouseButton === 2) {
      // Rotate / Orbit
      const rotateSpeed = 0.006;
      this.cameraTargetTheta -= dx * rotateSpeed;
      this.cameraTargetPhi = clamp(this.cameraTargetPhi - dy * rotateSpeed, 0.05, Math.PI - 0.05);
    } else if (this.mouseButton === 1) {
      // Middle click: Pan
      const panSpeed = this.cameraRadius * 0.0018;
      const forward = this._v3A.subVectors(this.lookAtTarget, this.camera.position).normalize();
      const right = this._v3B.crossVectors(forward, this.camera.up).normalize();

      this.desiredLookAtTarget.addScaledVector(right, -dx * panSpeed);
      this.desiredLookAtTarget.y += dy * panSpeed;
    }
  };

  private onMouseUp = () => {
    this.isMouseDown = false;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.12 : 0.89;
    this.cameraTargetRadius = clamp(this.cameraTargetRadius * zoomFactor, 12, 1200);
  };

  private onDoubleClick = (e: MouseEvent) => {
    this.checkPlanetClick(e.clientX, e.clientY, true);
  };

  private checkPlanetClick(clientX: number, clientY: number, isDoubleClick = false) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this._mouseCoords.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this._mouseCoords.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this._raycaster.setFromCamera(this._mouseCoords, this.camera);

    const checkObjects: THREE.Object3D[] = [this.sunMesh];
    for (const entry of this.planetsMap.values()) {
      checkObjects.push(entry.planetSphere);
    }

    const intersects = this._raycaster.intersectObjects(checkObjects, false);
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const spec = hit.userData.spec as PlanetSpec;
      if (spec) {
        this.selectPlanet(spec.id);
        if (isDoubleClick) {
          this.focusPlanet(spec.id);
        }
      }
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keysPressed.add(e.code);

    if (e.code === 'KeyR') {
      this.resetCamera();
    }
    if (e.code === 'Space') {
      // Toggle pause
      this.setPaused(!this.settings.isPaused);
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysPressed.delete(e.code);
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      this.isTouching = true;
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // Pinch zoom start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.initialTouchDistance = Math.hypot(dx, dy);
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && this.isTouching) {
      const dx = e.touches[0].clientX - this.lastTouchX;
      const dy = e.touches[0].clientY - this.lastTouchY;
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;

      const rotateSpeed = 0.007;
      this.cameraTargetTheta -= dx * rotateSpeed;
      this.cameraTargetPhi = clamp(this.cameraTargetPhi - dy * rotateSpeed, 0.05, Math.PI - 0.05);
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (this.initialTouchDistance > 0) {
        const factor = this.initialTouchDistance / dist;
        this.cameraTargetRadius = clamp(this.cameraTargetRadius * (factor > 1 ? 1.05 : 0.95), 12, 1200);
        this.initialTouchDistance = dist;
      }
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    if (e.touches.length === 0) {
      this.isTouching = false;
    }
  };

  private onWindowResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private processKeyboardMovement(deltaSeconds: number) {
    if (this.keysPressed.size === 0) return;

    const moveSpeed = this.cameraRadius * 0.9 * deltaSeconds;
    const forward = this._v3A.subVectors(this.lookAtTarget, this.camera.position).normalize();
    const right = this._v3B.crossVectors(forward, this.camera.up).normalize();

    if (this.keysPressed.has('KeyW')) {
      this.desiredLookAtTarget.addScaledVector(forward, moveSpeed);
    }
    if (this.keysPressed.has('KeyS')) {
      this.desiredLookAtTarget.addScaledVector(forward, -moveSpeed);
    }
    if (this.keysPressed.has('KeyA')) {
      this.desiredLookAtTarget.addScaledVector(right, -moveSpeed);
    }
    if (this.keysPressed.has('KeyD')) {
      this.desiredLookAtTarget.addScaledVector(right, moveSpeed);
    }
    if (this.keysPressed.has('KeyQ')) {
      this.desiredLookAtTarget.y -= moveSpeed;
    }
    if (this.keysPressed.has('KeyE')) {
      this.desiredLookAtTarget.y += moveSpeed;
    }
  }

  // Main animation loop
  private animate = () => {
    if (this.isDestroyed) return;

    const now = performance.now();
    const deltaSeconds = Math.min((now - this.lastClockTime) / 1000, 0.1);
    this.lastClockTime = now;

    // Advance simulation time
    if (!this.settings.isPaused) {
      this.simTime += deltaSeconds * this.settings.timeSpeed;
    }

    // Process keyboard inputs
    this.processKeyboardMovement(deltaSeconds);

    // Auto rotate camera
    if (this.settings.autoRotateCamera && !this.isMouseDown && !this.isTouching) {
      this.cameraTargetTheta += 0.08 * deltaSeconds;
    }

    // Smooth camera inertia & exponential damping
    const dampFactor = 10;
    this.cameraRadius = THREE.MathUtils.damp(this.cameraRadius, this.cameraTargetRadius, dampFactor, deltaSeconds);
    this.cameraTheta = THREE.MathUtils.damp(this.cameraTheta, this.cameraTargetTheta, dampFactor, deltaSeconds);
    this.cameraPhi = THREE.MathUtils.damp(this.cameraPhi, this.cameraTargetPhi, dampFactor, deltaSeconds);

    // Update focused target position (if following a moving planet)
    if (this.settings.focusedPlanetId) {
      if (this.settings.focusedPlanetId === 'sun') {
        this.desiredLookAtTarget.set(0, 0, 0);
      } else {
        const entry = this.planetsMap.get(this.settings.focusedPlanetId);
        if (entry) {
          this.desiredLookAtTarget.copy(entry.currentPosition);
        }
      }
    }

    this.lookAtTarget.x = THREE.MathUtils.damp(this.lookAtTarget.x, this.desiredLookAtTarget.x, dampFactor, deltaSeconds);
    this.lookAtTarget.y = THREE.MathUtils.damp(this.lookAtTarget.y, this.desiredLookAtTarget.y, dampFactor, deltaSeconds);
    this.lookAtTarget.z = THREE.MathUtils.damp(this.lookAtTarget.z, this.desiredLookAtTarget.z, dampFactor, deltaSeconds);

    // Position camera based on spherical coordinates centered on lookAtTarget
    const cx = this.lookAtTarget.x + this.cameraRadius * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    const cy = this.lookAtTarget.y + this.cameraRadius * Math.cos(this.cameraPhi);
    const cz = this.lookAtTarget.z + this.cameraRadius * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.lookAtTarget);

    // Rotate Sun
    this.sunMesh.rotation.y += 0.05 * deltaSeconds;
    this.sunCoronaSprite.material.rotation += 0.02 * deltaSeconds;

    // Update Planets
    const screenLabels: ScreenLabelPos[] = [];
    const maxTrailPoints = this.settings.performanceMode ? 35 : 70;

    // Add Sun label
    this.calculateScreenLabel('sun', 'The Sun', '#ffaa00', this.sunGroup.position, 0, screenLabels);

    for (const entry of this.planetsMap.values()) {
      const spec = entry.spec;

      // Orbit position
      const orb = calculateOrbitalPosition(spec.orbitRadius, spec.orbitSpeed, this.simTime, spec.initialOrbitalAngleRad || 0);
      entry.currentPosition.set(orb.x, 0, orb.z);
      entry.meshGroup.position.copy(entry.currentPosition);

      // Axial spin
      const rotationSpeed = (24 / Math.abs(spec.rotationPeriodHours)) * 0.5;
      const spinDirection = spec.rotationPeriodHours < 0 ? -1 : 1;
      entry.planetSphere.rotation.y += rotationSpeed * spinDirection * deltaSeconds;

      // Earth clouds spin slightly faster
      if (entry.cloudsSphere) {
        entry.cloudsSphere.rotation.y += rotationSpeed * 1.15 * deltaSeconds;
      }

      // Moons rotation
      if (entry.moonGroup) {
        entry.moonGroup.rotation.y += 1.8 * deltaSeconds;
      }

      // Update trails
      if (this.settings.showTrails && entry.trailLine) {
        if (!this.settings.isPaused) {
          entry.trailPositions.push(orb.x, 0, orb.z);
          if (entry.trailPositions.length > maxTrailPoints * 3) {
            entry.trailPositions.splice(0, 3);
          }
        }
        const posAttr = entry.trailLine.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < maxTrailPoints; i++) {
          const idx = i * 3;
          if (idx < entry.trailPositions.length) {
            posAttr.setXYZ(i, entry.trailPositions[idx], entry.trailPositions[idx + 1], entry.trailPositions[idx + 2]);
          } else {
            posAttr.setXYZ(i, orb.x, 0, orb.z);
          }
        }
        posAttr.needsUpdate = true;
      }

      // Calculate 2D screen projected label coordinates
      this.calculateScreenLabel(spec.id, spec.name, spec.accentColor, entry.currentPosition, spec.distanceFromSunAU, screenLabels);
    }

    // Update selection reticle position and scale
    if (this.settings.selectedPlanetId) {
      let targetPos: THREE.Vector3 | null = null;
      let targetRadius = 3;
      if (this.settings.selectedPlanetId === 'sun') {
        targetPos = this.sunGroup.position;
        targetRadius = SUN_DATA.sizeRadius * 1.3;
      } else {
        const ent = this.planetsMap.get(this.settings.selectedPlanetId);
        if (ent) {
          targetPos = ent.currentPosition;
          targetRadius = ent.spec.sizeRadius * 1.5;
        }
      }

      if (targetPos) {
        this.selectionReticle.position.copy(targetPos);
        this.selectionReticle.scale.set(targetRadius, targetRadius, targetRadius);
        this.selectionReticle.rotation.y += 0.8 * deltaSeconds;
        this.selectionReticle.visible = true;
      } else {
        this.selectionReticle.visible = false;
      }
    } else {
      this.selectionReticle.visible = false;
    }

    // Emit screen labels callback
    if (this.onLabelsUpdateCallback && this.settings.showLabels) {
      this.onLabelsUpdateCallback(screenLabels);
    }

    // Render frame
    this.renderer.render(this.scene, this.camera);

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private calculateScreenLabel(
    id: string,
    name: string,
    color: string,
    worldPos: THREE.Vector3,
    distanceAu: number,
    labelsList: ScreenLabelPos[]
  ) {
    if (!this.settings.showLabels) return;

    this._v3A.copy(worldPos);
    this._v3A.project(this.camera);

    // Check if behind camera
    const isVisible = this._v3A.z < 1.0;
    const width = this.renderer.domElement.clientWidth;
    const height = this.renderer.domElement.clientHeight;

    const sx = (this._v3A.x * 0.5 + 0.5) * width;
    const sy = (-this._v3A.y * 0.5 + 0.5) * height;

    labelsList.push({
      id,
      name,
      color,
      x: sx,
      y: sy,
      visible: isVisible && sx >= -50 && sx <= width + 50 && sy >= -50 && sy <= height + 50,
      distanceAu,
    });
  }

  // Public controls API
  public selectPlanet(planetId: string | null) {
    this.settings.selectedPlanetId = planetId;
    if (!planetId) {
      this.selectionReticle.visible = false;
      if (this.onSelectPlanetCallback) this.onSelectPlanetCallback(null);
      return;
    }

    const spec = planetId === 'sun' ? SUN_DATA : PLANETS_DATA.find((p) => p.id === planetId) || null;
    if (this.onSelectPlanetCallback) {
      this.onSelectPlanetCallback(spec);
    }
  }

  public focusPlanet(planetId: string | null) {
    this.settings.focusedPlanetId = planetId;
    this.selectPlanet(planetId);

    if (!planetId) {
      this.desiredLookAtTarget.set(0, 0, 0);
      this.cameraTargetRadius = 280;
      return;
    }

    if (planetId === 'sun') {
      this.desiredLookAtTarget.set(0, 0, 0);
      this.cameraTargetRadius = 38;
      return;
    }

    const entry = this.planetsMap.get(planetId);
    if (entry) {
      this.desiredLookAtTarget.copy(entry.currentPosition);
      // Adjust distance based on size
      this.cameraTargetRadius = entry.spec.sizeRadius * 5.5 + 8;
    }
  }

  public applyCameraPreset(presetId: string) {
    const preset = CAMERA_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    this.settings.focusedPlanetId = null;
    this.desiredLookAtTarget.set(...preset.target);

    const pos = new THREE.Vector3(...preset.position);
    const target = new THREE.Vector3(...preset.target);
    const offset = pos.clone().sub(target);

    this.cameraTargetRadius = offset.length();
    this.cameraTargetPhi = Math.acos(clamp(offset.y / this.cameraTargetRadius, -1, 1));
    this.cameraTargetTheta = Math.atan2(offset.x, offset.z);
  }

  public resetCamera() {
    this.settings.focusedPlanetId = null;
    this.desiredLookAtTarget.set(0, 0, 0);
    this.cameraTargetRadius = 280;
    this.cameraTargetTheta = Math.PI / 4;
    this.cameraTargetPhi = Math.PI / 3.2;
  }

  public resetSimulation() {
    this.simTime = 0;
    this.settings.isPaused = false;
    this.resetCamera();
    this.selectPlanet(null);

    // Clear trails
    for (const entry of this.planetsMap.values()) {
      entry.trailPositions = [];
      if (entry.trailLine) {
        const posAttr = entry.trailLine.geometry.attributes.position as THREE.BufferAttribute;
        posAttr.needsUpdate = true;
      }
    }
  }

  public setTimeSpeed(speed: number) {
    this.settings.timeSpeed = speed;
  }

  public setPaused(paused: boolean) {
    this.settings.isPaused = paused;
  }

  public toggleOrbits(show?: boolean) {
    this.settings.showOrbits = show !== undefined ? show : !this.settings.showOrbits;
    for (const entry of this.planetsMap.values()) {
      if (entry.orbitLine) entry.orbitLine.visible = this.settings.showOrbits;
    }
    return this.settings.showOrbits;
  }

  public toggleLabels(show?: boolean) {
    this.settings.showLabels = show !== undefined ? show : !this.settings.showLabels;
    return this.settings.showLabels;
  }

  public toggleTrails(show?: boolean) {
    this.settings.showTrails = show !== undefined ? show : !this.settings.showTrails;
    for (const entry of this.planetsMap.values()) {
      if (entry.trailLine) entry.trailLine.visible = this.settings.showTrails;
    }
    return this.settings.showTrails;
  }

  public toggleGrid(show?: boolean) {
    this.settings.showGrid = show !== undefined ? show : !this.settings.showGrid;
    if (this.gridHelper) this.gridHelper.visible = this.settings.showGrid;
    return this.settings.showGrid;
  }

  public toggleRealisticLighting(realistic?: boolean) {
    this.settings.realisticLighting = realistic !== undefined ? realistic : !this.settings.realisticLighting;
    if (this.ambientLight) {
      this.ambientLight.intensity = this.settings.realisticLighting ? 0.12 : 0.45;
    }
    return this.settings.realisticLighting;
  }

  public toggleStars(show?: boolean) {
    this.settings.showStars = show !== undefined ? show : !this.settings.showStars;
    if (this.starsGroup) this.starsGroup.visible = this.settings.showStars;
    return this.settings.showStars;
  }

  public toggleDarkSpaceMode(enabled?: boolean) {
    this.settings.darkSpaceMode = enabled !== undefined ? enabled : !this.settings.darkSpaceMode;
    if (this.scene) {
      this.scene.background = new THREE.Color(this.settings.darkSpaceMode ? 0x000000 : 0x020308);
    }
    return this.settings.darkSpaceMode;
  }

  public togglePerformanceMode(enabled?: boolean) {
    this.settings.performanceMode = enabled !== undefined ? enabled : !this.settings.performanceMode;
    // Lower shadow maps and pixel ratio if performance mode
    this.renderer.setPixelRatio(this.settings.performanceMode ? 1 : Math.min(window.devicePixelRatio, 2));
    return this.settings.performanceMode;
  }

  public toggleAutoRotate(auto?: boolean) {
    this.settings.autoRotateCamera = auto !== undefined ? auto : !this.settings.autoRotateCamera;
    return this.settings.autoRotateCamera;
  }

  public takeScreenshot(): string {
    // Render current frame to ensure buffer has latest imagery
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  public getSettings(): SimulationSettings {
    return { ...this.settings };
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const el = this.renderer.domElement;
    el.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    el.removeEventListener('wheel', this.onWheel);
    el.removeEventListener('dblclick', this.onDoubleClick);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    el.removeEventListener('touchstart', this.onTouchStart);
    el.removeEventListener('touchmove', this.onTouchMove);
    el.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('resize', this.onWindowResize);

    this.renderer.dispose();
    if (el.parentElement) {
      el.parentElement.removeChild(el);
    }
  }
}
