// Toon-Shading nach STYLEGUIDE_3D: zwei Stufen, Tusche-Kontur, eine Papierkörnung.
import * as THREE from 'three';

const INK = 0x2e2e33;

const ramp = new Uint8Array([255, 158]);
const gradient = new THREE.DataTexture(ramp, 2, 1, THREE.RedFormat);
gradient.minFilter = THREE.NearestFilter;
gradient.magFilter = THREE.NearestFilter;
gradient.needsUpdate = true;
gradient.colorSpace = THREE.NoColorSpace;

let paper = null;

export function paperTexture() {
  if (paper) return paper;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 128);
  for (let i = 0; i < 128 * 128; i++) {
    const n = 214 + ((i * 13 + (i >> 3)) % 36);
    img.data[i * 4] = n;
    img.data[i * 4 + 1] = n;
    img.data[i * 4 + 2] = n - 6;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  paper = new THREE.CanvasTexture(c);
  paper.wrapS = paper.wrapT = THREE.RepeatWrapping;
  paper.colorSpace = THREE.SRGBColorSpace;
  return paper;
}

export function toonMat(color, opts = {}) {
  const m = new THREE.MeshToonMaterial({
    color: color || '#ffffff',
    gradientMap: gradient,
    vertexColors: !!opts.vertexColors,
  });
  if (opts.map) m.map = opts.map;
  return m;
}

/** Inverted Hull: Flächennormalen nach außen, nur Rückseiten, eine Farbe. */
export function hullFrom(geometry, amount) {
  const g = geometry.clone();
  const pos = g.getAttribute('position');
  let nrm = g.getAttribute('normal');
  if (!nrm) {
    g.computeVertexNormals();
    nrm = g.getAttribute('normal');
  }
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) + nrm.getX(i) * amount,
      pos.getY(i) + nrm.getY(i) * amount,
      pos.getZ(i) + nrm.getZ(i) * amount,
    );
  }
  pos.needsUpdate = true;
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
  mesh.userData.outline = true;
  return mesh;
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
