// Toon-Shading nach STYLEGUIDE_3D: zwei Stufen, Tusche-Kontur, Papier und Buntstift.
import * as THREE from 'three';

const INK = 0x2e2e33;

const ramp = new Uint8Array([255, 150]);
const gradient = new THREE.DataTexture(ramp, 2, 1, THREE.RedFormat);
gradient.minFilter = THREE.NearestFilter;
gradient.magFilter = THREE.NearestFilter;
gradient.needsUpdate = true;
gradient.colorSpace = THREE.NoColorSpace;

let paper = null;
let hatch = null;

function noise(i) {
  const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function paperTexture() {
  if (paper) return paper;
  const s = 256;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  const img = g.createImageData(s, s);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = y * s + x;
      const fiber = noise(i) * 18 + noise(x * 3 + y * 19) * 10;
      const streak = (x + y * 2) % 17 === 0 ? -16 : 0;
      const v = Math.max(214, Math.min(252, 236 + fiber * 0.45 + streak));
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v - 4;
      img.data[i * 4 + 2] = v - 14;
      img.data[i * 4 + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  g.strokeStyle = 'rgba(120, 86, 52, 0.05)';
  g.lineWidth = 1;
  for (let y = 8; y < s; y += 9) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(s, y + 2);
    g.stroke();
  }
  paper = new THREE.CanvasTexture(c);
  paper.wrapS = paper.wrapT = THREE.RepeatWrapping;
  paper.colorSpace = THREE.SRGBColorSpace;
  paper.anisotropy = 4;
  return paper;
}

/** Buntstift-Schraffur, hell, damit sie als Multiply auf der Wiese liegt. */
export function hatchTexture() {
  if (hatch) return hatch;
  const s = 256;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, s, s);
  g.strokeStyle = '#8fb56a';
  g.lineWidth = 2;
  for (let i = -s; i < s * 2; i += 7) {
    g.globalAlpha = 0.28 + (i % 3) * 0.08;
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + 90, s);
    g.stroke();
  }
  g.globalAlpha = 0.2;
  g.strokeStyle = '#4F8A2C';
  g.lineWidth = 1.5;
  for (let i = -s; i < s * 2; i += 15) {
    g.beginPath();
    g.moveTo(i, s);
    g.lineTo(i + 70, 0);
    g.stroke();
  }
  hatch = new THREE.CanvasTexture(c);
  hatch.wrapS = hatch.wrapT = THREE.RepeatWrapping;
  hatch.colorSpace = THREE.SRGBColorSpace;
  hatch.anisotropy = 4;
  return hatch;
}

export function toonMat(color, opts = {}) {
  const m = new THREE.MeshToonMaterial({
    color: color || '#ffffff',
    gradientMap: gradient,
    vertexColors: !!opts.vertexColors,
    flatShading: !!opts.flat,
  });
  if (opts.map) m.map = opts.map;
  return m;
}

export function inkMat() {
  return new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
}

function expand(geometry, amount) {
  const g = geometry.toNonIndexed();
  g.computeVertexNormals();
  const pos = g.getAttribute('position');
  const nrm = g.getAttribute('normal');
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) + nrm.getX(i) * amount,
      pos.getY(i) + nrm.getY(i) * amount,
      pos.getZ(i) + nrm.getZ(i) * amount,
    );
  }
  pos.needsUpdate = true;
  return g;
}

/** Inverted Hull: Flächennormalen nach außen, nur Rückseiten. */
export function hullFrom(geometry, amount) {
  const mesh = new THREE.Mesh(expand(geometry, amount), inkMat());
  mesh.userData.outline = true;
  return mesh;
}

export function hullGeo(geometry, amount) {
  return expand(geometry, amount);
}

export function skinnedOutline(source, amount) {
  const mat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide, skinning: true });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\ntransformed += normalize(objectNormal) * ${amount.toFixed(3)};`,
    );
  };
  const mesh = new THREE.SkinnedMesh(source.geometry, mat);
  mesh.bind(source.skeleton, source.bindMatrix);
  mesh.frustumCulled = false;
  mesh.userData.outline = true;
  return mesh;
}
