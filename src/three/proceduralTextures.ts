import * as THREE from 'three';

// Cache generated textures so we do not recompute on every re-render
const textureCache = new Map<string, THREE.Texture>();

function createNoiseHelper(width: number, height: number, octaves = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // Simple multi-octave pseudo-noise generator
  const p = new Uint8Array(512);
  for (let i = 0; i < 256; i++) p[i] = p[i + 256] = Math.floor(Math.random() * 256);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let v = 0;
      let freq = 0.015;
      let amp = 1;
      let totalAmp = 0;

      for (let o = 0; o < octaves; o++) {
        const nx = x * freq;
        const ny = y * freq;
        const val = Math.sin(nx * 3.14) * Math.cos(ny * 3.14) + Math.sin(nx * 7.1 + ny * 5.3) * 0.5;
        v += val * amp;
        totalAmp += amp;
        freq *= 2.1;
        amp *= 0.5;
      }

      const normalized = Math.max(0, Math.min(255, Math.floor(((v / totalAmp) * 0.5 + 0.5) * 255)));
      const idx = (y * width + x) * 4;
      data[idx] = normalized;
      data[idx + 1] = normalized;
      data[idx + 2] = normalized;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function getSunTexture(): THREE.CanvasTexture {
  if (textureCache.has('sun')) return textureCache.get('sun') as THREE.CanvasTexture;

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Base fiery gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#ff9900');
  grad.addColorStop(0.3, '#ffcc00');
  grad.addColorStop(0.5, '#ffee66');
  grad.addColorStop(0.7, '#ffaa00');
  grad.addColorStop(1, '#ff6600');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Convective granules and turbulent plasma
  const noiseCanvas = createNoiseHelper(width, height, 4);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.65;
  ctx.drawImage(noiseCanvas, 0, 0);

  // Solar flares & sunspots
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1.0;
  for (let i = 0; i < 40; i++) {
    const sx = Math.random() * width;
    const sy = height * 0.2 + Math.random() * (height * 0.6);
    const rad = 4 + Math.random() * 12;

    const spotGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad);
    spotGrad.addColorStop(0, 'rgba(120, 25, 0, 0.85)');
    spotGrad.addColorStop(0.5, 'rgba(200, 70, 0, 0.5)');
    spotGrad.addColorStop(1, 'rgba(255, 180, 0, 0)');

    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('sun', texture);
  return texture;
}

export function getSunGlowSpriteTexture(): THREE.CanvasTexture {
  if (textureCache.has('sun_glow')) return textureCache.get('sun_glow') as THREE.CanvasTexture;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const radGrad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  radGrad.addColorStop(0, 'rgba(255, 250, 220, 1.0)');
  radGrad.addColorStop(0.2, 'rgba(255, 180, 50, 0.7)');
  radGrad.addColorStop(0.5, 'rgba(255, 100, 10, 0.25)');
  radGrad.addColorStop(0.8, 'rgba(255, 60, 0, 0.08)');
  radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('sun_glow', texture);
  return texture;
}

export function getMercuryTexture(): THREE.CanvasTexture {
  if (textureCache.has('mercury')) return textureCache.get('mercury') as THREE.CanvasTexture;

  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Gray rocky base
  ctx.fillStyle = '#827f7a';
  ctx.fillRect(0, 0, w, h);

  // Surface roughness
  const noise = createNoiseHelper(w, h, 4);
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.5;
  ctx.drawImage(noise, 0, 0);

  // Impact craters
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 90; i++) {
    const cx = Math.random() * w;
    const cy = Math.random() * h;
    const r = 2 + Math.random() * 10;

    // Rim highlight
    ctx.strokeStyle = 'rgba(220, 220, 215, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Dark crater bowl
    ctx.fillStyle = 'rgba(50, 48, 45, 0.7)';
    ctx.beginPath();
    ctx.arc(cx + 0.5, cy + 0.5, r * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Central peak
    if (r > 6) {
      ctx.fillStyle = 'rgba(210, 205, 195, 0.7)';
      ctx.beginPath();
      ctx.arc(cx, cy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('mercury', texture);
  return texture;
}

export function getVenusTexture(): THREE.CanvasTexture {
  if (textureCache.has('venus')) return textureCache.get('venus') as THREE.CanvasTexture;

  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Smooth sulfuric acid cloud bands
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#c79f64');
  grad.addColorStop(0.2, '#dfbc82');
  grad.addColorStop(0.4, '#e9ce9d');
  grad.addColorStop(0.6, '#dfbc82');
  grad.addColorStop(0.8, '#caa066');
  grad.addColorStop(1, '#a87e45');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Swirling vortices and chevron cloud patterns
  ctx.globalAlpha = 0.25;
  for (let y = 10; y < h - 10; y += 12) {
    ctx.strokeStyle = y % 24 === 0 ? '#fff3d6' : '#966d3a';
    ctx.lineWidth = 6 + Math.sin(y) * 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < w; x += 20) {
      ctx.lineTo(x, y + Math.sin(x * 0.03 + y * 0.05) * 8);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('venus', texture);
  return texture;
}

export function getEarthTexture(): THREE.CanvasTexture {
  if (textureCache.has('earth')) return textureCache.get('earth') as THREE.CanvasTexture;

  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Deep oceanic blue
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0, '#0c2e59');
  oceanGrad.addColorStop(0.5, '#16487e');
  oceanGrad.addColorStop(1, '#0c2e59');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  // Continents: Eurasia, Africa, Americas, Australia, Antarctica
  ctx.fillStyle = '#2d6a3a'; // lush green
  ctx.strokeStyle = '#6e8a4a';

  function drawContinent(points: [number, number][], color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.fill();
  }

  // North America
  drawContinent(
    [
      [150, 80],
      [280, 90],
      [310, 150],
      [270, 220],
      [220, 240],
      [210, 200],
      [140, 160],
      [120, 110],
    ],
    '#396b34'
  );
  // South America
  drawContinent(
    [
      [250, 250],
      [320, 280],
      [310, 370],
      [280, 430],
      [260, 420],
      [240, 320],
    ],
    '#2f5e31'
  );
  // Eurasia
  drawContinent(
    [
      [480, 70],
      [840, 80],
      [890, 180],
      [800, 240],
      [680, 260],
      [640, 190],
      [540, 210],
      [460, 140],
    ],
    '#536b37'
  );
  // Africa
  drawContinent(
    [
      [490, 200],
      [600, 220],
      [620, 310],
      [560, 400],
      [510, 390],
      [480, 280],
    ],
    '#917d47'
  );
  // Australia
  drawContinent(
    [
      [780, 320],
      [870, 330],
      [860, 410],
      [790, 400],
    ],
    '#9c7c4b'
  );
  // Antarctica polar cap
  ctx.fillStyle = '#e8f4f8';
  ctx.fillRect(0, 460, w, 52);
  // Arctic ice
  ctx.fillRect(0, 0, w, 35);

  // Soft blending & mountain relief noise
  const noise = createNoiseHelper(w, h, 3);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.45;
  ctx.drawImage(noise, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('earth', texture);
  return texture;
}

export function getEarthCloudsTexture(): THREE.CanvasTexture {
  if (textureCache.has('earth_clouds')) return textureCache.get('earth_clouds') as THREE.CanvasTexture;

  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  // Swirling white cloud streaks
  const noise = createNoiseHelper(w, h, 4);
  const nCtx = noise.getContext('2d')!;
  const nData = nCtx.getImageData(0, 0, w, h);
  const imgData = ctx.createImageData(w, h);

  for (let i = 0; i < nData.data.length; i += 4) {
    const val = nData.data[i];
    if (val > 140) {
      const alpha = Math.min(255, (val - 140) * 2.2);
      imgData.data[i] = 255;
      imgData.data[i + 1] = 255;
      imgData.data[i + 2] = 255;
      imgData.data[i + 3] = alpha;
    } else {
      imgData.data[i + 3] = 0;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('earth_clouds', texture);
  return texture;
}

export function getMoonTexture(): THREE.CanvasTexture {
  if (textureCache.has('moon')) return textureCache.get('moon') as THREE.CanvasTexture;

  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b0b0b0';
  ctx.fillRect(0, 0, w, h);

  // Dark lunar maria patches
  ctx.fillStyle = '#6e7075';
  ctx.beginPath();
  ctx.ellipse(180, 100, 70, 45, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(320, 130, 80, 50, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(130, 160, 50, 35, 0.1, 0, Math.PI * 2);
  ctx.fill();

  const noise = createNoiseHelper(w, h, 4);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.55;
  ctx.drawImage(noise, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('moon', texture);
  return texture;
}

export function getMarsTexture(): THREE.CanvasTexture {
  if (textureCache.has('mars')) return textureCache.get('mars') as THREE.CanvasTexture;

  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Rusty red-orange base
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#c7542d');
  grad.addColorStop(0.5, '#dd6b3d');
  grad.addColorStop(1, '#a33d1c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Dark volcanic plains (Syrtis Major)
  ctx.fillStyle = 'rgba(74, 39, 27, 0.65)';
  ctx.beginPath();
  ctx.ellipse(260, 140, 90, 50, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(120, 120, 60, 35, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Polar ice caps
  ctx.fillStyle = '#f5f9fa';
  ctx.beginPath();
  ctx.arc(w / 2, 8, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w / 2, h - 8, 30, 0, Math.PI * 2);
  ctx.fill();

  // Noise overlay
  const noise = createNoiseHelper(w, h, 4);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.45;
  ctx.drawImage(noise, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('mars', texture);
  return texture;
}

export function getJupiterTexture(): THREE.CanvasTexture {
  if (textureCache.has('jupiter')) return textureCache.get('jupiter') as THREE.CanvasTexture;

  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Alternating gas bands
  const bandColors = [
    '#997150',
    '#c49e78',
    '#ebd2b2',
    '#9e6c46',
    '#dfba94',
    '#9c6439',
    '#e2c2a0',
    '#82512f',
    '#dbb68e',
    '#91603d',
    '#c7a381',
  ];

  const bandH = h / bandColors.length;
  for (let i = 0; i < bandColors.length; i++) {
    ctx.fillStyle = bandColors[i];
    ctx.fillRect(0, i * bandH, w, bandH);
  }

  // Turbulent horizontal eddies
  ctx.globalAlpha = 0.35;
  for (let y = 0; y < h; y += 8) {
    ctx.strokeStyle = y % 16 === 0 ? '#442312' : '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < w; x += 15) {
      ctx.lineTo(x, y + Math.sin(x * 0.05 + y * 0.1) * 6);
    }
    ctx.stroke();
  }

  // Great Red Spot storm
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#b34729';
  ctx.beginPath();
  ctx.ellipse(620, 310, 55, 32, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Storm inner swirl ring
  ctx.strokeStyle = '#e6734e';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(620, 310, 38, 20, 0.08, 0, Math.PI * 2);
  ctx.stroke();

  // Storm center eye
  ctx.fillStyle = '#7a2712';
  ctx.beginPath();
  ctx.arc(620, 310, 10, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('jupiter', texture);
  return texture;
}

export function getSaturnTexture(): THREE.CanvasTexture {
  if (textureCache.has('saturn')) return textureCache.get('saturn') as THREE.CanvasTexture;

  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#af9b6b');
  grad.addColorStop(0.25, '#d8c293');
  grad.addColorStop(0.5, '#eed9b3');
  grad.addColorStop(0.75, '#cfb989');
  grad.addColorStop(1, '#9b8455');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle pastel cloud banding
  for (let y = 0; y < h; y += 12) {
    ctx.fillStyle = y % 24 === 0 ? 'rgba(255, 245, 220, 0.12)' : 'rgba(120, 95, 60, 0.12)';
    ctx.fillRect(0, y, w, 6);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('saturn', texture);
  return texture;
}

export function getSaturnRingsTexture(): THREE.CanvasTexture {
  if (textureCache.has('saturn_rings')) return textureCache.get('saturn_rings') as THREE.CanvasTexture;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  const center = size / 2;
  const maxRadius = size * 0.48;
  const minRadius = size * 0.22;

  // Draw concentric rings with varying opacity and the Cassini division
  for (let r = minRadius; r <= maxRadius; r += 0.8) {
    const norm = (r - minRadius) / (maxRadius - minRadius);

    let alpha = 0.7;
    // Cassini division gap at around 65% - 70%
    if (norm >= 0.62 && norm <= 0.68) {
      alpha = 0.03;
    } else if (norm < 0.2) {
      // Inner faint C ring
      alpha = 0.25;
    } else if (norm > 0.88) {
      // Outer F ring faint
      alpha = 0.35;
    }

    // Add fine ringlet variations
    alpha *= 0.65 + Math.sin(r * 2.5) * 0.35;

    ctx.strokeStyle = `rgba(225, 205, 165, ${alpha.toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(center, center, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('saturn_rings', texture);
  return texture;
}

export function getUranusTexture(): THREE.CanvasTexture {
  if (textureCache.has('uranus')) return textureCache.get('uranus') as THREE.CanvasTexture;

  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Smooth cyan-aquamarine
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#4ea7a7');
  grad.addColorStop(0.3, '#6dd6d6');
  grad.addColorStop(0.5, '#7eebeb');
  grad.addColorStop(0.7, '#6dd6d6');
  grad.addColorStop(1, '#479b9b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('uranus', texture);
  return texture;
}

export function getNeptuneTexture(): THREE.CanvasTexture {
  if (textureCache.has('neptune')) return textureCache.get('neptune') as THREE.CanvasTexture;

  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Deep azure
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1c34a8');
  grad.addColorStop(0.5, '#2f4edb');
  grad.addColorStop(1, '#182b8f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Great Dark Spot
  ctx.fillStyle = 'rgba(10, 20, 80, 0.7)';
  ctx.beginPath();
  ctx.ellipse(320, 160, 45, 25, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // High altitude white cirrus streaks
  ctx.strokeStyle = 'rgba(215, 230, 255, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(100, 130);
  ctx.lineTo(260, 133);
  ctx.moveTo(350, 185);
  ctx.lineTo(480, 188);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('neptune', texture);
  return texture;
}

export function getPlutoTexture(): THREE.CanvasTexture {
  if (textureCache.has('pluto')) return textureCache.get('pluto') as THREE.CanvasTexture;

  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Reddish-tan frozen world
  ctx.fillStyle = '#9c7b64';
  ctx.fillRect(0, 0, w, h);

  // Heart-shaped Tombaugh Regio
  ctx.fillStyle = '#eeddd0';
  ctx.beginPath();
  const hx = 240;
  const hy = 130;
  // Two lobe shapes for the nitrogen glacier heart
  ctx.ellipse(hx - 25, hy, 28, 35, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hx + 20, hy + 5, 26, 30, 0.2, 0, Math.PI * 2);
  ctx.fill();

  const noise = createNoiseHelper(w, h, 4);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.45;
  ctx.drawImage(noise, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('pluto', texture);
  return texture;
}
