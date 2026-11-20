import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { PublicQuestion } from '@fec/shared';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Magnet, Shield, Sparkles, Zap } from 'lucide-react';
import { api } from '@/services/api';
import { celebrate, toast } from '@/stores/ui';
import { gameAudio } from '../core/audioManager';
import { GameHudBar, GameOverlayModal, type GameResultSummary, type GameState } from '../core/GameStateMachine';
import type { AvatarConfig } from '../AvatarRenderer';

interface DashCallbacks {
  onHud: (hud: {
    score: number;
    distance: number;
    coins: number;
    lives: number;
    combo: number;
    speedMult: number;
    shieldSec: number;
    magnetSec: number;
    doubleSec: number;
    targetWord: string;
    collectedLetters: string;
    gateFlash: { text: string; good: boolean } | null;
  }) => void;
  onAnswer: (questionId: string, response: string) => void;
  onGameOver: (stats: { score: number; distance: number; coins: number }) => void;
}

const TARGET_WORDS = ['FUTURE', 'FLUENT', 'LEARN', 'SPEAK', 'BRIDGE', 'SMART'];
const LANE_X = [-2.55, 0, 2.55];
const SPAWN_Z = -86;
const DESPAWN_Z = 8;

const OUTFIT_COLORS: Record<string, { main: string; accent: string }> = {
  'outfit-hoodie-cyan': { main: '#00A8CC', accent: '#00D1FF' },
  'outfit-varsity-purple': { main: '#7C3AED', accent: '#C084FC' },
  'outfit-blazer-navy': { main: '#1B2763', accent: '#F59E0B' },
  'outfit-runner-gold': { main: '#D97706', accent: '#FDE047' },
  'outfit-explorer-emerald': { main: '#16A34A', accent: '#86EFAC' },
  'outfit-cyber-legend': { main: '#0F172A', accent: '#00D1FF' },
};

const SHOE_COLORS: Record<string, string> = {
  'shoes-sneakers': '#F8FAFC',
  'shoes-turbo': '#FF4D8D',
  'shoes-hover': '#00D1FF',
};

function makeTextTexture(
  text: string,
  opts: {
    width?: number;
    height?: number;
    bg?: string;
    border?: string;
    color?: string;
    fontSize?: number;
    maxLines?: number;
  } = {},
): THREE.CanvasTexture {
  const w = opts.width ?? 512;
  const h = opts.height ?? 160;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  if (opts.bg && opts.bg !== 'transparent') {
    ctx.fillStyle = opts.bg;
    ctx.beginPath();
    ctx.roundRect(6, 6, w - 12, h - 12, 22);
    ctx.fill();
  }
  if (opts.border) {
    ctx.strokeStyle = opts.border;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(6, 6, w - 12, h - 12, 22);
    ctx.stroke();
  }

  const fontSize = opts.fontSize ?? 34;
  ctx.font = `800 ${fontSize}px Outfit, "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = opts.color ?? '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Word wrap
  const maxWidth = w - 48;
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const clipped = lines.slice(0, opts.maxLines ?? 3);
  const lineH = fontSize * 1.22;
  const startY = h / 2 - ((clipped.length - 1) * lineH) / 2;
  ctx.shadowColor = 'rgba(5, 8, 22, 0.85)';
  ctx.shadowBlur = 8;
  clipped.forEach((ln, i) => {
    ctx.fillText(ln, w / 2, startY + i * lineH);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function makeStripeTexture(c1: string, c2: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = c2;
  for (let x = -64; x < 320; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 64);
    ctx.lineTo(x + 24, 64);
    ctx.lineTo(x + 48, 0);
    ctx.lineTo(x + 24, 0);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

interface DashObject {
  kind: 'barrier_low' | 'barrier_high' | 'coin' | 'letter' | 'magnet' | 'shield' | 'x2' | 'gate';
  lane: number;
  z: number;
  label?: string;
  questionId?: string;
  hit?: boolean;
  mesh: THREE.Object3D;
}

interface SideProp {
  z: number;
  mesh: THREE.Group;
}

interface Popup3D {
  sprite: THREE.Sprite;
  life: number;
}

/**
 * Three.js 3D Behind-the-Character Subway Surfers-style Endless Runner ("English Dash").
 * Preserves all obstacles (red jump barriers, orange slide overhead beams), collectibles
 * (coins, word letters, magnet/shield/x2 powerups), customizable 3D avatar, and glowing
 * 3D Highway Question Gantries + 3 Answer Gates.
 */
class EnglishDash3DEngine {
  private container: HTMLElement;
  private questions: PublicQuestion[];
  private cb: DashCallbacks;
  private avatar?: AvatarConfig | null;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private resizeObs?: ResizeObserver;

  private playerGroup!: THREE.Group;
  private playerBody!: THREE.Group;
  private leftArm!: THREE.Mesh;
  private rightArm!: THREE.Mesh;
  private leftLeg!: THREE.Mesh;
  private rightLeg!: THREE.Mesh;
  private shieldSphere!: THREE.Mesh;
  private magnetRing!: THREE.Mesh;
  private x2Ring!: THREE.Mesh;

  private sleepers: THREE.Mesh[] = [];
  private buildings: THREE.Mesh[] = [];
  private props: SideProp[] = [];
  private objects: DashObject[] = [];
  private popups: Popup3D[] = [];
  private gateBannerMesh: THREE.Group | null = null;

  private sharedCoinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.14, 24);
  private sharedCoinMat = new THREE.MeshStandardMaterial({
    color: 0xffd23f,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.45,
    metalness: 0.72,
    roughness: 0.22,
  });
  private redStripeTex = makeStripeTexture('#F43F5E', '#FFFFFF');
  private orangeStripeTex = makeStripeTexture('#F97316', '#FEF08A');

  private lane = 1;
  private visualLane = 1;
  private jumpY = 0;
  private jumpVel = 0;
  private slideTimer = 0;
  private shakeTimer = 0;
  private runTime = 0;
  private stridePhase = 0;

  private lives = 3;
  private score = 0;
  private distance = 0;
  private coins = 0;
  private combo = 0;
  private baseSpeed = 0.23;
  private currentSpeed = 0.23;

  private shieldTimer = 0;
  private magnetTimer = 0;
  private doubleTimer = 0;

  private wordIdx = 0;
  private targetWord = TARGET_WORDS[0];
  private letterProgress = 0;

  private qIdx = 0;
  private spawnTimer = 1.1;
  private gateTimer = 3.6;
  private propTimer = 0.25;
  private activeGateQ: PublicQuestion | null = null;
  private gateFlashTimer = 0;
  private gateFlash: { text: string; good: boolean } | null = null;

  private isPaused = false;
  private finished = false;
  private destroyed = false;
  private rafId = 0;
  private lastTime = 0;
  private hudTick = 0;
  private swipeStart: { x: number; y: number } | null = null;

  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onPointerDownBound: (e: PointerEvent) => void;
  private onPointerUpBound: (e: PointerEvent) => void;

  constructor(container: HTMLElement, questions: PublicQuestion[], cb: DashCallbacks, avatar?: AvatarConfig | null) {
    this.container = container;
    this.questions = questions;
    this.cb = cb;
    this.avatar = avatar;

    this.onKeyDownBound = this.handleKeyDown.bind(this);
    this.onPointerDownBound = this.handlePointerDown.bind(this);
    this.onPointerUpBound = this.handlePointerUp.bind(this);

    this.initThree();
    this.buildEnvironment();
    this.buildPlayer();
    this.bindInputs();
    this.pushHud();

    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  private initThree() {
    const w = this.container.clientWidth || 900;
    const h = this.container.clientHeight || 520;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.innerHTML = '';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1b1464);
    this.scene.fog = new THREE.FogExp2(0x2e1065, 0.0115);

    this.camera = new THREE.PerspectiveCamera(62, w / h, 0.1, 180);
    this.camera.position.set(0, 3.85, 6.4);
    this.camera.lookAt(0, 1.4, -22);

    const hemi = new THREE.HemisphereLight(0xa5f3fc, 0x1e1b4b, 1.15);
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xfff1d6, 1.55);
    dir.position.set(8, 16, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 65;
    dir.shadow.camera.left = -12;
    dir.shadow.camera.right = 12;
    dir.shadow.camera.top = 12;
    dir.shadow.camera.bottom = -35;
    this.scene.add(dir);

    this.resizeObs = new ResizeObserver(() => {
      if (this.destroyed) return;
      const cw = this.container.clientWidth || 900;
      const ch = this.container.clientHeight || 520;
      this.camera.aspect = cw / ch;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(cw, ch);
    });
    this.resizeObs.observe(this.container);
  }

  private buildEnvironment() {
    // Sunset gradient backdrop plane & glowing sun
    const sunGeo = new THREE.CircleGeometry(14, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xff9e3d, fog: false });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(0, 14, -125);
    this.scene.add(sun);

    const haloGeo = new THREE.CircleGeometry(22, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.25, fog: false });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(0, 14, -126);
    this.scene.add(halo);

    // Grass / Embankment ground
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0f2e24, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.05, -55);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Main 3-lane subway track bed
    const trackGeo = new THREE.BoxGeometry(9.2, 0.16, 150);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x1e295b, roughness: 0.75, metalness: 0.15 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.position.set(0, -0.04, -55);
    track.receiveShadow = true;
    this.scene.add(track);

    // Side concrete curbs with neon trim
    const curbGeo = new THREE.BoxGeometry(0.65, 0.35, 150);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const neonCurbMat = new THREE.MeshBasicMaterial({ color: 0x00d1ff });
    for (const side of [-1, 1]) {
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(side * 4.85, 0.1, -55);
      curb.receiveShadow = true;
      this.scene.add(curb);

      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 150), neonCurbMat);
      trim.position.set(side * 4.55, 0.29, -55);
      this.scene.add(trim);
    }

    // 3 pairs of metallic/neon subway rails
    const railGeo = new THREE.BoxGeometry(0.12, 0.08, 150);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.45, metalness: 0.7, roughness: 0.25 });
    for (const lx of LANE_X) {
      for (const offset of [-0.68, 0.68]) {
        const rail = new THREE.Mesh(railGeo, railMat);
        rail.position.set(lx + offset, 0.06, -55);
        this.scene.add(rail);
      }
    }

    // Lane divider glow lines
    const divGeo = new THREE.PlaneGeometry(0.08, 150);
    const divMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.55 });
    for (const dx of [-1.275, 1.275]) {
      const div = new THREE.Mesh(divGeo, divMat);
      div.rotation.x = -Math.PI / 2;
      div.position.set(dx, 0.045, -55);
      this.scene.add(div);
    }

    // Scrolling railway sleepers
    const sleeperGeo = new THREE.BoxGeometry(8.4, 0.06, 0.32);
    const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });
    for (let z = 6; z >= -102; z -= 2.4) {
      const s = new THREE.Mesh(sleeperGeo, sleeperMat);
      s.position.set(0, 0.03, z);
      s.receiveShadow = true;
      this.scene.add(s);
      this.sleepers.push(s);
    }

    // Stylized city skyline buildings on both sides
    const bColors = [0x1e1b4b, 0x312e81, 0x3b0764, 0x172554];
    for (let z = 0; z >= -110; z -= 9) {
      for (const side of [-1, 1]) {
        const bh = 6 + Math.random() * 14;
        const bw = 4.5 + Math.random() * 3.5;
        const bGeo = new THREE.BoxGeometry(bw, bh, 6.2);
        const bMat = new THREE.MeshStandardMaterial({
          color: bColors[Math.floor(Math.random() * bColors.length)],
          roughness: 0.65,
        });
        const b = new THREE.Mesh(bGeo, bMat);
        b.position.set(side * (11.5 + Math.random() * 5), bh / 2 - 0.1, z);

        // Glowing window strip
        const winGeo = new THREE.PlaneGeometry(bw * 0.65, bh * 0.65);
        const winMat = new THREE.MeshBasicMaterial({
          color: Math.random() < 0.5 ? 0x38bdf8 : 0xfbbf24,
          transparent: true,
          opacity: 0.32,
        });
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.set(side < 0 ? bw / 2 + 0.02 : -bw / 2 - 0.02, 0.4, 0);
        win.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        b.add(win);

        this.scene.add(b);
        this.buildings.push(b);
      }
    }

    // Initial roadside lamps & cyber palms
    for (let z = 2; z >= -80; z -= 11) {
      this.spawnSideProp(z);
    }
  }

  private spawnSideProp(z: number) {
    const isLamp = Math.random() < 0.55;
    for (const side of [-1, 1] as const) {
      const grp = new THREE.Group();
      if (isLamp) {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.11, 3.8, 8),
          new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6 }),
        );
        pole.position.y = 1.9;
        grp.add(pole);

        const arm = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.08, 0.1),
          new THREE.MeshStandardMaterial({ color: 0x64748b }),
        );
        arm.position.set(-side * 0.4, 3.75, 0);
        grp.add(arm);

        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 10, 10),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
        );
        bulb.position.set(-side * 0.8, 3.65, 0);
        grp.add(bulb);
      } else {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.22, 2.8, 8),
          new THREE.MeshStandardMaterial({ color: 0x78350f }),
        );
        trunk.position.y = 1.4;
        grp.add(trunk);

        const leaves = new THREE.Mesh(
          new THREE.ConeGeometry(1.15, 2.1, 7),
          new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.7 }),
        );
        leaves.position.y = 3.2;
        grp.add(leaves);
      }
      grp.position.set(side * 5.65, 0, z);
      this.scene.add(grp);
      this.props.push({ z, mesh: grp });
    }
  }

  private buildPlayer() {
    const skin = this.avatar?.skinTone || '#F1C27D';
    const hair = this.avatar?.hairColor || '#1E293B';
    const outfitKey = this.avatar?.outfit || 'outfit-hoodie-cyan';
    const outfit = OUTFIT_COLORS[outfitKey] ?? OUTFIT_COLORS['outfit-hoodie-cyan'];
    const shoeColor = SHOE_COLORS[this.avatar?.shoes || 'shoes-sneakers'] ?? '#F8FAFC';

    this.playerGroup = new THREE.Group();
    this.playerBody = new THREE.Group();
    this.playerGroup.add(this.playerBody);

    const torsoMat = new THREE.MeshStandardMaterial({ color: outfit.main, roughness: 0.5 });
    const accentMat = new THREE.MeshStandardMaterial({ color: outfit.accent, emissive: outfit.accent, emissiveIntensity: 0.25 });
    const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: 0.6 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.4 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.78, 0.38), torsoMat);
    torso.position.y = 1.12;
    torso.castShadow = true;
    this.playerBody.add(torso);

    // Backpack / Jet-pack accent
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.2), accentMat);
    pack.position.set(0, 1.14, 0.26);
    pack.castShadow = true;
    this.playerBody.add(pack);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.48, 0.48), skinMat);
    head.position.y = 1.8;
    head.castShadow = true;
    this.playerBody.add(head);

    // Hair cap
    const hairCap = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.22, 0.52), hairMat);
    hairCap.position.set(0, 2.04, 0.02);
    this.playerBody.add(hairCap);

    // Optional Hat / Cap if equipped
    if (this.avatar?.accessory?.includes('cap') || this.avatar?.accessory?.includes('crown')) {
      const capColor = this.avatar.accessory.includes('crown') ? 0xfacc15 : 0x00d1ff;
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.16, 0.56),
        new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.4 }),
      );
      cap.position.set(0, 2.15, 0);
      this.playerBody.add(cap);
    }

    // Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.64, 0.2);
    this.leftArm = new THREE.Mesh(armGeo, torsoMat);
    this.leftArm.position.set(-0.48, 1.12, 0);
    this.leftArm.castShadow = true;
    this.playerBody.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, torsoMat);
    this.rightArm.position.set(0.48, 1.12, 0);
    this.rightArm.castShadow = true;
    this.playerBody.add(this.rightArm);

    // Legs + Shoes
    const legGeo = new THREE.BoxGeometry(0.24, 0.62, 0.24);
    const shoeGeo = new THREE.BoxGeometry(0.26, 0.18, 0.38);

    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.18, 0.44, 0);
    this.leftLeg.castShadow = true;
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.32, -0.05);
    this.leftLeg.add(leftShoe);
    this.playerBody.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.18, 0.44, 0);
    this.rightLeg.castShadow = true;
    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0, -0.32, -0.05);
    this.rightLeg.add(rightShoe);
    this.playerBody.add(this.rightLeg);

    // Powerup Auras (hidden until active)
    this.shieldSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.18, 20, 16),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.25, wireframe: true }),
    );
    this.shieldSphere.position.y = 1.1;
    this.shieldSphere.visible = false;
    this.playerGroup.add(this.shieldSphere);

    this.magnetRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.06, 10, 28),
      new THREE.MeshBasicMaterial({ color: 0xec4899 }),
    );
    this.magnetRing.rotation.x = Math.PI / 2;
    this.magnetRing.position.y = 1.05;
    this.magnetRing.visible = false;
    this.playerGroup.add(this.magnetRing);

    this.x2Ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.8, 0.05, 10, 24),
      new THREE.MeshBasicMaterial({ color: 0xa855f7 }),
    );
    this.x2Ring.rotation.x = Math.PI / 2;
    this.x2Ring.position.y = 0.25;
    this.x2Ring.visible = false;
    this.playerGroup.add(this.x2Ring);

    this.scene.add(this.playerGroup);
  }

  private bindInputs() {
    window.addEventListener('keydown', this.onKeyDownBound, { passive: false });
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDownBound);
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUpBound);
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '].includes(e.key) || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.repeat) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.moveLane(-1);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.moveLane(1);
    else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') this.jump();
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.slide();
  }

  private handlePointerDown(e: PointerEvent) {
    this.swipeStart = { x: e.clientX, y: e.clientY };
  }

  private handlePointerUp(e: PointerEvent) {
    if (!this.swipeStart) return;
    const dx = e.clientX - this.swipeStart.x;
    const dy = e.clientY - this.swipeStart.y;
    this.swipeStart = null;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) this.moveLane(dx > 0 ? 1 : -1);
    else if (dy < 0) this.jump();
    else this.slide();
  }

  public setPaused(p: boolean) {
    this.isPaused = p;
    if (!p) this.lastTime = performance.now();
  }

  public moveLane(dir: -1 | 1) {
    if (this.isPaused || this.finished) return;
    const next = Math.max(0, Math.min(2, this.lane + dir));
    if (next !== this.lane) {
      this.lane = next;
      gameAudio.laneSwitch();
    }
  }

  public jump() {
    if (this.isPaused || this.finished) return;
    if (this.jumpY === 0) {
      this.jumpVel = 12.6;
      this.slideTimer = 0;
      gameAudio.jump();
    }
  }

  public slide() {
    if (this.isPaused || this.finished) return;
    if (this.jumpY > 0) this.jumpVel = -16;
    if (this.slideTimer <= 0.1) gameAudio.slide();
    this.slideTimer = 0.65;
  }

  private spawnPopup(label: string, color = '#FFD23F') {
    const tex = makeTextTexture(label, { width: 300, height: 96, bg: 'transparent', color, fontSize: 44, maxLines: 1 });
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(this.playerGroup.position.x, this.jumpY + 2.55, 0);
    sprite.scale.set(2.2, 0.72, 1);
    this.scene.add(sprite);
    this.popups.push({ sprite, life: 0.85 });
  }

  private createObstacleMesh(kind: DashObject['kind'], label?: string, lane = 1): THREE.Object3D {
    if (kind === 'barrier_low') {
      // Red/White Subway Surfers Sawhorse Barrier — Jump over!
      const grp = new THREE.Group();
      const postMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.5 });
      const barMat = new THREE.MeshStandardMaterial({ map: this.redStripeTex, roughness: 0.4 });
      for (const lx of [-0.82, 0.82]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.08, 0.22), postMat);
        post.position.set(lx, 0.54, 0);
        post.castShadow = true;
        grp.add(post);
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.45, 0.24), barMat);
      beam.position.set(0, 0.82, 0);
      beam.castShadow = true;
      grp.add(beam);

      const tag = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: makeTextTexture('JUMP ↑', { width: 220, height: 70, bg: '#9F1239', border: '#FDA4AF', fontSize: 30 }), transparent: true }),
      );
      tag.position.set(0, 1.45, 0);
      tag.scale.set(1.3, 0.42, 1);
      grp.add(tag);
      return grp;
    }

    if (kind === 'barrier_high') {
      // Orange Overhead Construction Beam — Slide under!
      const grp = new THREE.Group();
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.5 });
      const beamMat = new THREE.MeshStandardMaterial({ map: this.orangeStripeTex, roughness: 0.4 });
      for (const lx of [-0.95, 0.95]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.55, 0.24), pillarMat);
        pillar.position.set(lx, 1.275, 0);
        pillar.castShadow = true;
        grp.add(pillar);
      }
      const overhead = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.05, 0.34), beamMat);
      overhead.position.set(0, 1.95, 0);
      overhead.castShadow = true;
      grp.add(overhead);

      const tag = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: makeTextTexture('SLIDE ↓', { width: 220, height: 70, bg: '#9A3412', border: '#FDBA74', fontSize: 30 }), transparent: true }),
      );
      tag.position.set(0, 2.85, 0);
      tag.scale.set(1.35, 0.42, 1);
      grp.add(tag);
      return grp;
    }

    if (kind === 'coin') {
      const grp = new THREE.Group();
      const coin = new THREE.Mesh(this.sharedCoinGeo, this.sharedCoinMat);
      coin.rotation.z = Math.PI / 2;
      coin.position.y = 1.05;
      coin.castShadow = true;
      grp.add(coin);

      // Subtle golden ground ring so coin pops clearly above the dark track
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.28, 0.42, 20),
        new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.4, side: THREE.DoubleSide }),
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.09;
      grp.add(halo);
      return grp;
    }

    if (kind === 'letter') {
      const grp = new THREE.Group();
      const tex = makeTextTexture(label || 'A', { width: 160, height: 160, bg: '#0E7490', border: '#22D3EE', color: '#FFFFFF', fontSize: 88 });
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.95, 0.95),
        new THREE.MeshStandardMaterial({ map: tex, emissive: 0x06b6d4, emissiveIntensity: 0.38 }),
      );
      box.position.y = 1.15;
      box.castShadow = true;
      grp.add(box);

      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.45, 0.62, 24),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.09;
      grp.add(halo);
      return grp;
    }

    if (kind === 'magnet' || kind === 'shield' || kind === 'x2') {
      const cfg =
        kind === 'magnet'
          ? { color: 0xec4899, text: 'MAGNET' }
          : kind === 'shield'
            ? { color: 0x22c55e, text: 'SHIELD' }
            : { color: 0xa855f7, text: '2X' };
      const grp = new THREE.Group();
      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.5, 0),
        new THREE.MeshStandardMaterial({ color: cfg.color, emissive: cfg.color, emissiveIntensity: 0.45, roughness: 0.2 }),
      );
      orb.position.y = 1.1;
      grp.add(orb);

      const tag = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: makeTextTexture(cfg.text, { width: 220, height: 70, bg: '#0F172A', border: '#FFFFFF', fontSize: 28 }), transparent: true }),
      );
      tag.position.set(0, 1.95, 0);
      tag.scale.set(1.3, 0.42, 1);
      grp.add(tag);
      return grp;
    }

    // Educational Answer Gate Arch
    const palette = [
      { frame: 0x0ea5e9, bg: '#075985', border: '#38BDF8' },
      { frame: 0x9333ea, bg: '#581C87', border: '#C084FC' },
      { frame: 0xec4899, bg: '#831843', border: '#F472B6' },
    ][lane % 3];

    const grp = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: palette.frame, emissive: palette.frame, emissiveIntensity: 0.35 });
    for (const lx of [-1.05, 1.05]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.55, 0.2), frameMat);
      pillar.position.set(lx, 1.275, 0);
      grp.add(pillar);
    }
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.18, 0.22), frameMat);
    topBar.position.set(0, 2.55, 0);
    grp.add(topBar);

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.94, 2.38),
      new THREE.MeshBasicMaterial({ color: palette.frame, transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
    );
    glass.position.set(0, 1.24, 0);
    grp.add(glass);

    const signTex = makeTextTexture(label || '—', {
      width: 360,
      height: 150,
      bg: palette.bg,
      border: palette.border,
      color: '#FFFFFF',
      fontSize: 34,
      maxLines: 2,
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 0.85), new THREE.MeshBasicMaterial({ map: signTex, transparent: true }));
    sign.position.set(0, 1.55, 0.14);
    grp.add(sign);

    return grp;
  }

  private spawnRow() {
    if (this.activeGateQ) return;

    const roll = Math.random();
    if (roll < 0.34) {
      const safeLane = Math.floor(Math.random() * 3);
      for (let l = 0; l < 3; l++) {
        if (l === safeLane) {
          this.addObj('coin', l, SPAWN_Z);
        } else if (Math.random() < 0.74) {
          this.addObj(Math.random() < 0.38 ? 'barrier_high' : 'barrier_low', l, SPAWN_Z);
        }
      }
    } else if (roll < 0.78) {
      const lane = Math.floor(Math.random() * 3);
      this.addObj('coin', lane, SPAWN_Z);
      this.addObj('coin', lane, SPAWN_Z - 3.6);
      this.addObj('coin', lane, SPAWN_Z - 7.2);
      if (Math.random() < 0.55 && this.letterProgress < this.targetWord.length) {
        this.addObj('letter', (lane + 1) % 3, SPAWN_Z - 2.0, this.targetWord[this.letterProgress]);
      }
    } else {
      const lane = Math.floor(Math.random() * 3);
      const pKind = (['magnet', 'shield', 'x2'] as const)[Math.floor(Math.random() * 3)];
      this.addObj(pKind, lane, SPAWN_Z);
    }
  }

  private addObj(kind: DashObject['kind'], lane: number, z: number, label?: string, questionId?: string) {
    const mesh = this.createObstacleMesh(kind, label, lane);
    mesh.position.set(LANE_X[lane], 0, z);
    this.scene.add(mesh);
    this.objects.push({ kind, lane, z, label, questionId, mesh });
  }

  private spawnEducationalGates() {
    const mcqs = this.questions.filter((q) => (q.data.options?.length ?? 0) >= 2);
    if (!mcqs.length) return;
    const q = mcqs[this.qIdx % mcqs.length];
    this.qIdx++;
    this.activeGateQ = q;
    const opts = [...(q.data.options ?? [])].slice(0, 3);
    while (opts.length < 3) opts.push('—');

    for (let l = 0; l < 3; l++) {
      this.addObj('gate', l, SPAWN_Z, opts[l], q.id);
    }

    // Overhead 3D Highway Question Gantry spanning all 3 lanes
    if (this.gateBannerMesh) {
      this.scene.remove(this.gateBannerMesh);
      this.gateBannerMesh = null;
    }
    const gantry = new THREE.Group();
    const boardTex = makeTextTexture(q.prompt, {
      width: 1024,
      height: 220,
      bg: '#0B133B',
      border: '#38BDF8',
      color: '#FFFFFF',
      fontSize: 34,
      maxLines: 3,
    });
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(8.8, 1.8),
      new THREE.MeshBasicMaterial({ map: boardTex, transparent: true }),
    );
    board.position.set(0, 3.55, 0);
    gantry.add(board);
    gantry.position.set(0, 0, SPAWN_Z);
    this.scene.add(gantry);
    this.gateBannerMesh = gantry;
  }

  private loop = (now: number) => {
    if (this.destroyed) return;
    this.rafId = requestAnimationFrame(this.loop);

    const deltaMs = now - this.lastTime;
    this.lastTime = now;
    if (!this.isPaused && !this.finished) {
      const dt = Math.min(0.05, Math.max(0.001, deltaMs / 1000));
      this.step(dt);
    }
    this.renderer.render(this.scene, this.camera);
  };

  private step(dt: number) {
    this.runTime += dt;

    // Gentle speed ramp; smoothly slows down when approaching a Question Gate so players can read & think!
    this.baseSpeed = Math.min(0.45, 0.23 + this.distance * 0.0001);
    const approachingGate = this.objects.find((o) => o.kind === 'gate' && !o.hit);
    let targetSpeed = this.baseSpeed;
    if (this.activeGateQ && approachingGate) {
      targetSpeed = approachingGate.z > -62 ? 0.088 : 0.14;
    }
    this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, targetSpeed, Math.min(1, dt * 3.5));

    const activeSpeed = this.currentSpeed;
    const worldSpeed = activeSpeed * 84;
    const mult = this.doubleTimer > 0 ? 2 : 1;

    this.distance += dt * (22 + activeSpeed * 42);
    this.score += dt * 16 * mult;

    // Scroll sleepers & buildings
    for (const s of this.sleepers) {
      s.position.z += worldSpeed * dt;
      if (s.position.z > 8) s.position.z -= 110.4;
    }
    for (const b of this.buildings) {
      b.position.z += worldSpeed * dt * 0.9;
      if (b.position.z > 12) b.position.z -= 117;
    }

    // Side props
    this.propTimer -= dt;
    if (this.propTimer <= 0) {
      this.propTimer = 0.55;
      this.spawnSideProp(SPAWN_Z);
    }
    for (let i = this.props.length - 1; i >= 0; i--) {
      const pr = this.props[i];
      pr.z += worldSpeed * dt;
      pr.mesh.position.z = pr.z;
      if (pr.z > DESPAWN_Z + 4) {
        this.scene.remove(pr.mesh);
        this.props.splice(i, 1);
      }
    }

    // Popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.life -= dt;
      p.sprite.position.y += 1.8 * dt;
      (p.sprite.material as THREE.SpriteMaterial).opacity = Math.max(0, p.life / 0.85);
      if (p.life <= 0) {
        this.scene.remove(p.sprite);
        this.popups.splice(i, 1);
      }
    }

    // Player lane & physics
    const prevVisual = this.visualLane;
    this.visualLane = THREE.MathUtils.lerp(this.visualLane, this.lane, Math.min(1, dt * 14));
    const laneDelta = (this.visualLane - prevVisual) / Math.max(dt, 0.001);

    if (this.jumpY > 0 || this.jumpVel !== 0) {
      this.jumpY += this.jumpVel * dt;
      this.jumpVel -= 34 * dt;
      if (this.jumpY <= 0) {
        this.jumpY = 0;
        this.jumpVel = 0;
      }
    }
    if (this.slideTimer > 0) this.slideTimer = Math.max(0, this.slideTimer - dt);
    if (this.shieldTimer > 0) this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    if (this.magnetTimer > 0) this.magnetTimer = Math.max(0, this.magnetTimer - dt);
    if (this.doubleTimer > 0) this.doubleTimer = Math.max(0, this.doubleTimer - dt);
    if (this.shakeTimer > 0) this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    if (this.gateFlashTimer > 0) {
      this.gateFlashTimer -= dt;
      if (this.gateFlashTimer <= 0) this.gateFlash = null;
    }

    // Animate 3D player avatar (stride slows down smoothly when avatar slows near Question Gates)
    const px = LANE_X[0] + (this.visualLane / 2) * (LANE_X[2] - LANE_X[0]);
    const isSliding = this.slideTimer > 0;
    this.stridePhase += dt * (15 * (this.currentSpeed / 0.23));
    const stride = this.jumpY === 0 && !isSliding ? Math.sin(this.stridePhase) : 0;

    this.playerGroup.position.set(px, this.jumpY + (this.jumpY === 0 && !isSliding ? Math.abs(stride) * 0.08 : 0), 0);
    this.playerGroup.rotation.z = THREE.MathUtils.clamp(-laneDelta * 0.035, -0.28, 0.28);

    if (isSliding) {
      this.playerBody.scale.set(1.06, 0.5, 1.06);
      this.playerBody.rotation.x = 0.42;
    } else {
      this.playerBody.scale.set(1, 1, 1);
      this.playerBody.rotation.x = this.jumpY > 0 ? -0.15 : 0.1;
    }

    this.leftLeg.rotation.x = this.jumpY > 0 ? 0.45 : stride * 0.85;
    this.rightLeg.rotation.x = this.jumpY > 0 ? -0.45 : -stride * 0.85;
    this.leftArm.rotation.x = this.jumpY > 0 ? -0.9 : -stride * 0.85;
    this.rightArm.rotation.x = this.jumpY > 0 ? -0.9 : stride * 0.85;

    this.shieldSphere.visible = this.shieldTimer > 0;
    this.shieldSphere.rotation.y += dt * 1.8;
    this.magnetRing.visible = this.magnetTimer > 0;
    this.magnetRing.rotation.z += dt * 3;
    this.x2Ring.visible = this.doubleTimer > 0;
    this.x2Ring.rotation.z -= dt * 3;

    // Camera follow & shake
    const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * 0.25 : 0;
    const shakeY = this.shakeTimer > 0 ? (Math.random() - 0.5) * 0.25 : 0;
    this.camera.position.set(px * 0.42 + shakeX, 3.85 + this.jumpY * 0.35 + shakeY, 6.4);
    this.camera.lookAt(px * 0.22, 1.45 + this.jumpY * 0.2, -22);

    // Spawn waves & question gates
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 1.25;
      this.spawnRow();
    }
    this.gateTimer -= dt;
    if (this.gateTimer <= 0) {
      this.gateTimer = 8.5;
      this.spawnEducationalGates();
    }

    // Move & collide objects
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      obj.z += worldSpeed * dt;

      if (this.magnetTimer > 0 && (obj.kind === 'coin' || obj.kind === 'letter') && obj.z > -38 && obj.z < 1) {
        obj.lane = THREE.MathUtils.lerp(obj.lane, this.lane, dt * 10);
      }

      const ox = LANE_X[0] + (obj.lane / 2) * (LANE_X[2] - LANE_X[0]);
      obj.mesh.position.set(ox, 0, obj.z);

      if (obj.kind === 'coin' && obj.mesh.children[0]) {
        obj.mesh.children[0].rotation.y += dt * 3.8;
        obj.mesh.children[0].position.y = 1.05 + Math.sin(this.runTime * 4.5 + i) * 0.14;
      } else if (obj.kind === 'letter' && obj.mesh.children[0]) {
        obj.mesh.children[0].rotation.y += dt * 2.2;
        obj.mesh.children[0].position.y = 1.15 + Math.sin(this.runTime * 4 + i) * 0.14;
      } else if ((obj.kind === 'magnet' || obj.kind === 'shield' || obj.kind === 'x2') && obj.mesh.children[0]) {
        obj.mesh.children[0].rotation.y += dt * 2.2;
      }

      if (!obj.hit && obj.z >= -0.85 && obj.z <= 0.85) {
        if (Math.abs(obj.lane - this.visualLane) < 0.48) {
          this.handleHit(obj);
        }
      }

      if (obj.z > DESPAWN_Z || (obj.hit && obj.kind !== 'gate')) {
        this.scene.remove(obj.mesh);
        this.objects.splice(i, 1);
      }
    }

    if (this.gateBannerMesh) {
      this.gateBannerMesh.position.z += worldSpeed * dt;
      if (this.gateBannerMesh.position.z > DESPAWN_Z || !this.activeGateQ) {
        this.scene.remove(this.gateBannerMesh);
        this.gateBannerMesh = null;
      }
    }

    const gatesRemaining = this.objects.some((o) => o.kind === 'gate' && o.z <= 1.2);
    if (!gatesRemaining && this.activeGateQ) this.activeGateQ = null;

    this.hudTick += dt;
    if (this.hudTick >= 0.1) {
      this.hudTick = 0;
      this.pushHud();
    }
  }

  private handleHit(obj: DashObject) {
    obj.hit = true;
    const mult = this.doubleTimer > 0 ? 2 : 1;

    if (obj.kind === 'coin') {
      this.coins += 1;
      const pts = 20 * mult;
      this.score += pts;
      gameAudio.coin();
      this.spawnPopup(`+${pts}`, '#FFD23F');
      return;
    }
    if (obj.kind === 'letter') {
      this.score += 45 * mult;
      gameAudio.letter();
      if (obj.label === this.targetWord[this.letterProgress]) {
        this.letterProgress++;
        this.spawnPopup(`${obj.label}!`, '#00D1FF');
        if (this.letterProgress >= this.targetWord.length) {
          this.score += 250 * mult;
          this.coins += 15;
          gameAudio.victory();
          this.gateFlash = { text: `Word "${this.targetWord}" Complete! +${250 * mult}`, good: true };
          this.gateFlashTimer = 2.0;
          this.spawnPopup(`WORD +${250 * mult}!`, '#22C55E');
          this.wordIdx++;
          this.targetWord = TARGET_WORDS[this.wordIdx % TARGET_WORDS.length];
          this.letterProgress = 0;
        }
      }
      return;
    }
    if (obj.kind === 'magnet') {
      this.magnetTimer = 8;
      gameAudio.powerup();
      this.spawnPopup('MAGNET!', '#EC4899');
      return;
    }
    if (obj.kind === 'shield') {
      this.shieldTimer = 10;
      gameAudio.powerup();
      this.spawnPopup('SHIELD!', '#22C55E');
      return;
    }
    if (obj.kind === 'x2') {
      this.doubleTimer = 8;
      gameAudio.powerup();
      this.spawnPopup('2X BOOST!', '#A855F7');
      return;
    }
    if (obj.kind === 'barrier_low') {
      if (this.jumpY > 0.72) return;
      this.takeDamage();
      return;
    }
    if (obj.kind === 'barrier_high') {
      if (this.slideTimer > 0) return;
      this.takeDamage();
      return;
    }
    if (obj.kind === 'gate' && obj.questionId && obj.label) {
      for (const g of this.objects) if (g.kind === 'gate' && g.questionId === obj.questionId) g.hit = true;
      this.cb.onAnswer(obj.questionId, obj.label);
      this.combo += 1;
      const pts = 100 * mult;
      this.score += pts;
      gameAudio.correct();
      this.gateFlash = { text: `Gate "${obj.label}" Picked! +${pts}`, good: true };
      this.gateFlashTimer = 1.6;
      this.spawnPopup(`+${pts}`, '#00D1FF');
      this.activeGateQ = null;
    }
  }

  private takeDamage() {
    if (this.shieldTimer > 0) {
      this.shieldTimer = 0;
      this.gateFlash = { text: 'Shield Saved You!', good: true };
      this.gateFlashTimer = 1.4;
      gameAudio.powerup();
      this.spawnPopup('SAVED!', '#22C55E');
      return;
    }
    this.lives -= 1;
    this.combo = 0;
    this.shakeTimer = 0.25;
    gameAudio.hit();
    this.spawnPopup('-1 ❤️', '#FB7185');
    if (this.lives <= 0) {
      this.finished = true;
      gameAudio.gameOver();
      this.pushHud();
      this.cb.onGameOver({ score: Math.round(this.score), distance: Math.round(this.distance), coins: this.coins });
    }
  }

  private pushHud() {
    this.cb.onHud({
      score: Math.round(this.score),
      distance: Math.round(this.distance),
      coins: this.coins,
      lives: this.lives,
      combo: this.combo,
      speedMult: Number((this.baseSpeed / 0.23).toFixed(1)),
      shieldSec: Math.ceil(this.shieldTimer),
      magnetSec: Math.ceil(this.magnetTimer),
      doubleSec: Math.ceil(this.doubleTimer),
      targetWord: this.targetWord,
      collectedLetters: this.targetWord.slice(0, this.letterProgress),
      gateFlash: this.gateFlash,
    });
  }

  public destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    this.resizeObs?.disconnect();
    window.removeEventListener('keydown', this.onKeyDownBound);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDownBound);
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUpBound);
    this.redStripeTex.dispose();
    this.orangeStripeTex.dispose();
    this.sharedCoinGeo.dispose();
    this.sharedCoinMat.dispose();
    this.renderer.dispose();
    this.container.innerHTML = '';
  }
}

export function EnglishDashGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<EnglishDash3DEngine | null>(null);

  const [state, setState] = useState<GameState>('MENU');
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const [result, setResult] = useState<GameResultSummary | null>(null);
  const answersRef = useRef<{ questionId: string; response: string }[]>([]);

  const [hud, setHud] = useState({
    score: 0,
    distance: 0,
    coins: 0,
    lives: 3,
    combo: 0,
    speedMult: 1.0,
    shieldSec: 0,
    magnetSec: 0,
    doubleSec: 0,
    targetWord: TARGET_WORDS[0],
    collectedLetters: '',
    gateFlash: null as { text: string; good: boolean } | null,
  });

  useEffect(() => {
    void api.get<{ avatar: AvatarConfig }>('/avatar').then((r) => setAvatar(r.avatar)).catch(() => undefined);
    return () => {
      gameAudio.stopMusic();
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  const startRun = useCallback(async () => {
    setState('LOADING');
    setResult(null);
    answersRef.current = [];

    try {
      const startRes = await api.post<{ sessionId: string; questions: PublicQuestion[] }>('/games/sessions/start', {
        gameSlug: 'english-dash',
      });

      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }

      engineRef.current = new EnglishDash3DEngine(
        mountRef.current!,
        startRes.questions,
        {
          onHud: (next) => setHud(next),
          onAnswer: (questionId, response) => answersRef.current.push({ questionId, response }),
          onGameOver: (stats) => {
            gameAudio.stopMusic();
            setState('GAME_OVER');
            void finishRun(startRes.sessionId, stats);
          },
        },
        avatar,
      );

      gameAudio.startMusic('dash');
      setState('PLAYING');
    } catch (e) {
      toast.error((e as Error).message);
      setState('MENU');
    }
  }, [avatar]);

  const finishRun = async (sid: string, stats: { score: number; distance: number; coins: number }) => {
    try {
      const res = await api.post<GameResultSummary>(`/games/sessions/${sid}/finish`, {
        score: stats.score,
        distance: stats.distance,
        coinsCollected: stats.coins,
        answers: answersRef.current,
      });
      setResult(res);
      setState('RESULTS');
      if (res.reward) celebrate(res.reward, 'English Dash Complete!');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const togglePause = () => {
    if (state === 'PLAYING') {
      engineRef.current?.setPaused(true);
      gameAudio.stopMusic();
      setState('PAUSED');
    } else if (state === 'PAUSED') {
      engineRef.current?.setPaused(false);
      gameAudio.startMusic('dash');
      setState('PLAYING');
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <GameHudBar
        title="English Dash 3D"
        state={state}
        score={hud.score}
        streak={hud.combo}
        lives={hud.lives}
        onPauseToggle={togglePause}
        extra={
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
            <span className="rounded-xl bg-white/10 px-2.5 py-1 text-game-sky">{hud.distance}m</span>
            <span className="rounded-xl bg-white/10 px-2.5 py-1 text-white/80">{hud.speedMult}x</span>
            <span className="rounded-xl bg-white/10 px-2.5 py-1 text-game-sun">🪙 {hud.coins}</span>
            {hud.shieldSec > 0 && (
              <span className="flex items-center gap-1 rounded-xl bg-emerald-500/25 px-2.5 py-1 text-emerald-300">
                <Shield className="h-3.5 w-3.5" /> {hud.shieldSec}s
              </span>
            )}
            {hud.magnetSec > 0 && (
              <span className="flex items-center gap-1 rounded-xl bg-pink-500/25 px-2.5 py-1 text-pink-300">
                <Magnet className="h-3.5 w-3.5" /> {hud.magnetSec}s
              </span>
            )}
            {hud.doubleSec > 0 && (
              <span className="flex items-center gap-1 rounded-xl bg-purple-500/25 px-2.5 py-1 text-purple-200">
                <Zap className="h-3.5 w-3.5" /> 2x {hud.doubleSec}s
              </span>
            )}
          </div>
        }
      />

      {/* Compact Word Quest Strip */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/15 bg-[#131C56]/90 px-4 py-2">
        <div className="flex items-center gap-2 text-xs font-extrabold">
          <Sparkles className="h-4 w-4 text-game-sky" />
          <span className="text-white/80">WORD:</span>
          <span className="flex gap-1">
            {hud.targetWord.split('').map((ch, idx) => (
              <span
                key={idx}
                className={`grid h-6 w-6 place-items-center rounded-md text-xs font-black ${
                  idx < hud.collectedLetters.length ? 'bg-game-sky text-navy-950' : 'bg-white/10 text-white/45'
                }`}
              >
                {ch}
              </span>
            ))}
          </span>
        </div>

        {hud.gateFlash ? (
          <span className={`rounded-xl px-3 py-1 text-xs font-extrabold ${hud.gateFlash.good ? 'bg-emerald-500/25 text-emerald-300' : 'bg-rose-500/25 text-rose-300'}`}>
            {hud.gateFlash.text}
          </span>
        ) : (
          <span className="text-xs text-white/75">←/→ Lane · ↑ Jump · ↓ Slide · Questions appear right above the 3D gates!</span>
        )}
      </div>

      {/* 3D WebGL Canvas Container */}
      <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-[#1B1464] shadow-2xl no-touch-callout">
        <div ref={mountRef} className="aspect-[900/520] w-full" />
        <GameOverlayModal
          state={state}
          title="English Dash 3D"
          subtitle="Sprint in full 3D down neon subway rails with your customized avatar! Dodge 3D barriers, collect letters, and steer into the right 3D Answer Gate!"
          result={result}
          onStart={() => void startRun()}
          onResume={togglePause}
          onRestart={() => void startRun()}
          menuExtra={
            <div className="rounded-2xl bg-white/10 p-3.5 text-xs space-y-1.5 text-white/85">
              <p>• <strong>← / →</strong> or <strong>Swipe</strong>: Switch lanes & choose the right 3D Answer Gate</p>
              <p>• <strong>↑ / Space</strong>: Jump over red 3D barriers</p>
              <p>• <strong>↓</strong>: Slide under orange 3D overhead beams</p>
            </div>
          }
        />
      </div>

      {/* Touch Controls */}
      {state === 'PLAYING' && (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:hidden">
          <button onClick={() => engineRef.current?.moveLane(-1)} className="btn-game bg-white/15 py-3" aria-label="Move Left">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button onClick={() => engineRef.current?.jump()} className="btn-game bg-game-sky text-navy-950 py-3" aria-label="Jump">
            <ArrowUp className="h-5 w-5" />
          </button>
          <button onClick={() => engineRef.current?.slide()} className="btn-game bg-game-grape py-3" aria-label="Slide">
            <ArrowDown className="h-5 w-5" />
          </button>
          <button onClick={() => engineRef.current?.moveLane(1)} className="btn-game bg-white/15 py-3" aria-label="Move Right">
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
