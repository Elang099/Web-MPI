import { useCallback, useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import type { PublicQuestion } from '@fec/shared';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Magnet, Shield, Sparkles, Zap } from 'lucide-react';
import { api } from '@/services/api';
import { celebrate, toast } from '@/stores/ui';
import { gameAudio } from '../core/audioManager';
import { GameHudBar, GameOverlayModal, type GameResultSummary, type GameState } from '../core/GameStateMachine';
import { drawPhaserAvatar } from '../core/phaserAvatar';
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

/**
 * Phaser 3 Behind-the-Character 2.5D 3-Lane Endless Runner ("English Dash").
 * Answer questions are mounted on a glowing Highway Gantry directly above the 3 gate boxes
 * inside the canvas, and approach gently so players have clear time to read and steer.
 */
class EnglishDashScene extends Phaser.Scene {
  private questions: PublicQuestion[] = [];
  private cb!: DashCallbacks;
  private avatar?: AvatarConfig | null;

  private g!: Phaser.GameObjects.Graphics;
  private gateTexts: Phaser.GameObjects.Text[] = [];
  private gateBannerText!: Phaser.GameObjects.Text;
  private itemTexts: Phaser.GameObjects.Text[] = [];
  private popups: { text: Phaser.GameObjects.Text; life: number }[] = [];

  private lane = 1;
  private visualLane = 1;
  private jumpY = 0;
  private jumpVel = 0;
  private slideTimer = 0;
  private lives = 3;
  private score = 0;
  private distance = 0;
  private coins = 0;
  private combo = 0;
  private baseSpeed = 0.23; // comfortable reading & dodging pace

  private shieldTimer = 0;
  private magnetTimer = 0;
  private doubleTimer = 0;

  private wordIdx = 0;
  private targetWord = TARGET_WORDS[0];
  private letterProgress = 0;

  private qIdx = 0;
  private spawnTimer = 1.3;
  private gateTimer = 3.6;
  private activeGateQ: PublicQuestion | null = null;
  private gateFlashTimer = 0;
  private gateFlash: { text: string; good: boolean } | null = null;

  private props: { side: -1 | 1; z: number; kind: 'lamp' | 'tree' }[] = [];
  private propTimer = 0.4;

  private objects: {
    kind: 'barrier_low' | 'barrier_high' | 'coin' | 'letter' | 'magnet' | 'shield' | 'x2' | 'gate';
    lane: number;
    z: number;
    label?: string;
    questionId?: string;
    hit?: boolean;
  }[] = [];

  private isPaused = false;
  private finished = false;
  private swipeStart: { x: number; y: number } | null = null;
  private hudTick = 0;

  constructor(questions: PublicQuestion[], cb: DashCallbacks, avatar?: AvatarConfig | null) {
    super('EnglishDashScene');
    this.questions = questions;
    this.cb = cb;
    this.avatar = avatar;
  }

  create() {
    this.g = this.add.graphics();

    // Seed initial roadside lampposts & palms for depth immediately
    for (let i = 0; i < 6; i++) {
      const z = (i + 1) / 6;
      this.props.push({ side: -1, z, kind: i % 2 === 0 ? 'lamp' : 'tree' });
      this.props.push({ side: 1, z, kind: i % 2 === 0 ? 'lamp' : 'tree' });
    }

    // Overhead Question Gantry Text attached right above the 3 gate boxes
    this.gateBannerText = this.add
      .text(450, 0, '', {
        fontFamily: 'Outfit, Plus Jakarta Sans, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#FFFFFF',
        stroke: '#050816',
        strokeThickness: 4,
        align: 'center',
        wordWrap: { width: 520 },
      })
      .setOrigin(0.5)
      .setDepth(25)
      .setVisible(false);

    for (let i = 0; i < 3; i++) {
      const t = this.add
        .text(0, 0, '', {
          fontFamily: 'Outfit, Plus Jakarta Sans, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#FFFFFF',
          stroke: '#050816',
          strokeThickness: 5,
          align: 'center',
          wordWrap: { width: 130 },
        })
        .setOrigin(0.5)
        .setDepth(22)
        .setVisible(false);
      this.gateTexts.push(t);
    }

    for (let i = 0; i < 18; i++) {
      const t = this.add
        .text(0, 0, '', {
          fontFamily: 'Outfit, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#FFFFFF',
          stroke: '#050816',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(15)
        .setVisible(false);
      this.itemTexts.push(t);
    }

    this.input.keyboard?.addCapture([
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.D,
    ]);

    this.input.keyboard?.on('keydown-LEFT', (event?: KeyboardEvent) => {
      event?.preventDefault();
      this.moveLane(-1);
    });
    this.input.keyboard?.on('keydown-A', (event?: KeyboardEvent) => {
      event?.preventDefault();
      this.moveLane(-1);
    });
    this.input.keyboard?.on('keydown-RIGHT', (event?: KeyboardEvent) => {
      event?.preventDefault();
      this.moveLane(1);
    });
    this.input.keyboard?.on('keydown-D', (event?: KeyboardEvent) => {
      event?.preventDefault();
      this.moveLane(1);
    });
    this.input.keyboard?.on('keydown-UP', (event?: KeyboardEvent) => {
      event?.preventDefault();
      this.jump();
    });
    this.input.keyboard?.on('keydown-W', (event?: KeyboardEvent) => {
      event?.preventDefault();
      this.jump();
    });
    this.input.keyboard?.on('keydown-SPACE', (event?: KeyboardEvent) => {
      event?.preventDefault();
      this.jump();
    });
    this.input.keyboard?.on('keydown-DOWN', (event?: KeyboardEvent) => {
      event?.preventDefault();
      this.slide();
    });
    this.input.keyboard?.on('keydown-S', (event?: KeyboardEvent) => {
      event?.preventDefault();
      this.slide();
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.swipeStart = { x: p.x, y: p.y };
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.swipeStart) return;
      const dx = p.x - this.swipeStart.x;
      const dy = p.y - this.swipeStart.y;
      this.swipeStart = null;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) this.moveLane(dx > 0 ? 1 : -1);
      else if (dy < 0) this.jump();
      else this.slide();
    });

    this.pushHud();
  }

  private spawnPopup(x: number, y: number, label: string, color = '#FFD23F') {
    const t = this.add
      .text(x, y, label, { fontFamily: 'Outfit, sans-serif', fontSize: '19px', fontStyle: 'bold', color, stroke: '#050816', strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(30);
    this.popups.push({ text: t, life: 0.8 });
  }

  public setPaused(p: boolean) {
    this.isPaused = p;
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
      this.jumpVel = 560;
      this.slideTimer = 0;
      gameAudio.jump();
    }
  }

  public slide() {
    if (this.isPaused || this.finished) return;
    if (this.jumpY > 0) this.jumpVel = -700;
    if (this.slideTimer <= 0.1) gameAudio.slide();
    this.slideTimer = 0.65;
  }

  private laneX(laneIdx: number, z: number): number {
    const cx = 450;
    const spread = 42 + z * 215;
    return cx + (laneIdx - 1) * spread;
  }

  private projY(z: number): number {
    return 145 + Math.pow(z, 1.32) * 335;
  }

  private spawnRow() {
    // Pause obstacle spawning while a Question Gate wave is approaching so players can focus on reading!
    if (this.activeGateQ) return;

    const roll = Math.random();
    if (roll < 0.3) {
      const safeLane = Phaser.Math.Between(0, 2);
      for (let l = 0; l < 3; l++) {
        if (l === safeLane) this.objects.push({ kind: 'coin', lane: l, z: 0.03 });
        else if (Math.random() < 0.72) this.objects.push({ kind: Math.random() < 0.35 ? 'barrier_high' : 'barrier_low', lane: l, z: 0.03 });
      }
    } else if (roll < 0.76) {
      const lane = Phaser.Math.Between(0, 2);
      this.objects.push({ kind: 'coin', lane, z: 0.03 });
      this.objects.push({ kind: 'coin', lane, z: 0.1 });
      if (Math.random() < 0.5 && this.letterProgress < this.targetWord.length) {
        this.objects.push({ kind: 'letter', lane: (lane + 1) % 3, z: 0.06, label: this.targetWord[this.letterProgress] });
      }
    } else {
      const lane = Phaser.Math.Between(0, 2);
      const pKind = (['magnet', 'shield', 'x2'] as const)[Phaser.Math.Between(0, 2)];
      this.objects.push({ kind: pKind, lane, z: 0.03 });
    }
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
      this.objects.push({ kind: 'gate', lane: l, z: 0.02, label: opts[l], questionId: q.id });
    }
  }

  update(_time: number, deltaMs: number) {
    if (this.isPaused || this.finished) return;
    const dt = Math.min(0.05, deltaMs / 1000);

    // Gentle speed ramp; slows slightly whenever an Answer Gate is on track so reading is effortless!
    this.baseSpeed = Math.min(0.45, 0.23 + this.distance * 0.0001);
    const activeSpeed = this.activeGateQ ? Math.min(0.165, this.baseSpeed * 0.72) : this.baseSpeed;
    const mult = this.doubleTimer > 0 ? 2 : 1;

    this.distance += dt * (22 + activeSpeed * 42);
    this.score += dt * 16 * mult;

    // Sideway props
    this.propTimer -= dt;
    if (this.propTimer <= 0) {
      this.propTimer = 0.55;
      const kind = Math.random() < 0.5 ? 'lamp' : 'tree';
      this.props.push({ side: -1, z: 0.02, kind }, { side: 1, z: 0.02, kind });
    }
    for (const pr of this.props) pr.z += activeSpeed * dt * 1.15;
    this.props = this.props.filter((pr) => pr.z < 1.18);

    // Popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.life -= dt;
      p.text.y -= 45 * dt;
      p.text.setAlpha(Math.max(0, p.life / 0.8));
      if (p.life <= 0) {
        p.text.destroy();
        this.popups.splice(i, 1);
      }
    }

    this.visualLane = Phaser.Math.Linear(this.visualLane, this.lane, Math.min(1, dt * 16));
    if (this.jumpY > 0 || this.jumpVel !== 0) {
      this.jumpY += this.jumpVel * dt;
      this.jumpVel -= 1540 * dt;
      if (this.jumpY <= 0) {
        this.jumpY = 0;
        this.jumpVel = 0;
      }
    }
    if (this.slideTimer > 0) this.slideTimer = Math.max(0, this.slideTimer - dt);
    if (this.shieldTimer > 0) this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    if (this.magnetTimer > 0) this.magnetTimer = Math.max(0, this.magnetTimer - dt);
    if (this.doubleTimer > 0) this.doubleTimer = Math.max(0, this.doubleTimer - dt);
    if (this.gateFlashTimer > 0) {
      this.gateFlashTimer -= dt;
      if (this.gateFlashTimer <= 0) this.gateFlash = null;
    }

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

    for (const obj of this.objects) {
      obj.z += activeSpeed * dt;
      if (this.magnetTimer > 0 && (obj.kind === 'coin' || obj.kind === 'letter') && obj.z > 0.48 && obj.z < 1.0) {
        obj.lane = Phaser.Math.Linear(obj.lane, this.lane, dt * 10);
      }
      if (!obj.hit && obj.z >= 0.88 && obj.z <= 1.03) {
        if (Math.abs(obj.lane - this.visualLane) < 0.48) this.handleHit(obj);
      }
    }

    const gatesRemaining = this.objects.some((o) => o.kind === 'gate' && o.z <= 1.05);
    if (!gatesRemaining && this.activeGateQ) this.activeGateQ = null;
    this.objects = this.objects.filter((o) => o.z < 1.15 && !(o.hit && o.kind !== 'gate'));

    this.renderScene();

    this.hudTick += dt;
    if (this.hudTick >= 0.1) {
      this.hudTick = 0;
      this.pushHud();
    }
  }

  private handleHit(obj: (typeof this.objects)[number]) {
    obj.hit = true;
    const mult = this.doubleTimer > 0 ? 2 : 1;
    const px = this.laneX(this.visualLane, 0.94);

    if (obj.kind === 'coin') {
      this.coins += 1;
      const pts = 20 * mult;
      this.score += pts;
      gameAudio.coin();
      this.spawnPopup(px, 390, `+${pts}`, '#FFD23F');
      return;
    }
    if (obj.kind === 'letter') {
      this.score += 45 * mult;
      gameAudio.letter();
      if (obj.label === this.targetWord[this.letterProgress]) {
        this.letterProgress++;
        this.spawnPopup(px, 370, `${obj.label}!`, '#00D1FF');
        if (this.letterProgress >= this.targetWord.length) {
          this.score += 250 * mult;
          this.coins += 15;
          gameAudio.victory();
          this.gateFlash = { text: `Word "${this.targetWord}" Complete! +${250 * mult}`, good: true };
          this.gateFlashTimer = 2.0;
          this.spawnPopup(px, 335, `WORD +${250 * mult}!`, '#22C55E');
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
      this.spawnPopup(px, 370, 'MAGNET!', '#EC4899');
      return;
    }
    if (obj.kind === 'shield') {
      this.shieldTimer = 10;
      gameAudio.powerup();
      this.spawnPopup(px, 370, 'SHIELD!', '#22C55E');
      return;
    }
    if (obj.kind === 'x2') {
      this.doubleTimer = 8;
      gameAudio.powerup();
      this.spawnPopup(px, 370, '2X BOOST!', '#A855F7');
      return;
    }
    if (obj.kind === 'barrier_low') {
      if (this.jumpY > 36) return;
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
      this.spawnPopup(px, 345, `+${pts}`, '#00D1FF');
      this.activeGateQ = null;
    }
  }

  private takeDamage() {
    if (this.shieldTimer > 0) {
      this.shieldTimer = 0;
      this.gateFlash = { text: 'Shield Saved You!', good: true };
      this.gateFlashTimer = 1.4;
      gameAudio.powerup();
      return;
    }
    this.lives -= 1;
    this.combo = 0;
    gameAudio.hit();
    this.cameras.main.shake(180, 0.015);
    if (this.lives <= 0) {
      this.finished = true;
      gameAudio.gameOver();
      this.pushHud();
      this.cb.onGameOver({ score: Math.round(this.score), distance: Math.round(this.distance), coins: this.coins });
    }
  }

  private renderScene() {
    const g = this.g;
    g.clear();

    // 1. Vibrant Casual-Mobile Sunset-Cyber Sky + Fluffy Clouds + City Skyline
    g.fillGradientStyle(0x162266, 0x162266, 0x7c3aed, 0xec4899, 1);
    g.fillRect(0, 0, 900, 150);

    // Glowing sun & clouds
    g.fillStyle(0xffd23f, 0.25);
    g.fillCircle(450, 128, 74);
    g.fillStyle(0xff8a3d, 0.5);
    g.fillCircle(450, 128, 44);
    g.fillStyle(0xffffff, 0.22);
    [
      [130, 54],
      [310, 38],
      [630, 48],
      [780, 62],
    ].forEach(([cx, cy]) => {
      g.fillCircle(cx, cy, 22);
      g.fillCircle(cx + 18, cy + 4, 16);
      g.fillCircle(cx - 18, cy + 5, 15);
    });

    // Colorful layered city skyline
    [20, 88, 154, 228, 595, 668, 740, 818].forEach((bx, i) => {
      const bh = 46 + ((i * 27) % 52);
      g.fillStyle(i % 2 === 0 ? 0x1d1b5e : 0x281e70, 1);
      g.fillRoundedRect(bx, 145 - bh, 56, bh + 4, 4);
      g.fillStyle(i % 2 === 0 ? 0x4fc3ff : 0xffd23f, 0.55);
      for (let wy = 145 - bh + 10; wy < 134; wy += 16) {
        g.fillRect(bx + 10, wy, 9, 8);
        g.fillRect(bx + 32, wy, 9, 8);
      }
    });

    // 2. Green/Teal Sidewalk Embankments + Asphalt Subway Track
    g.fillGradientStyle(0x1b4332, 0x1b4332, 0x0f2922, 0x0f2922, 1);
    g.fillRect(0, 145, 900, 375);

    // Side track neon curb
    g.fillStyle(0x334155, 1);
    g.beginPath();
    g.moveTo(372, 145);
    g.lineTo(528, 145);
    g.lineTo(860, 520);
    g.lineTo(40, 520);
    g.closePath();
    g.fillPath();

    // Main track bed
    g.fillStyle(0x1e295b, 1);
    g.beginPath();
    g.moveTo(388, 145);
    g.lineTo(512, 145);
    g.lineTo(820, 520);
    g.lineTo(80, 520);
    g.closePath();
    g.fillPath();

    // Alternating track sleepers (ties) for crisp motion depth
    const tieOffset = (this.distance * 0.085) % 1;
    for (let i = 0; i < 9; i++) {
      const z = (i + tieOffset) / 9;
      const y = this.projY(z);
      const half = 60 + Math.pow(z, 1.32) * 305;
      g.lineStyle(Math.max(2, 5 * z), 0x475569, 0.55);
      g.lineBetween(450 - half, y, 450 + half, y);
    }

    // Bright steel/neon subway rails per lane
    g.lineStyle(4, 0x00d1ff, 0.9);
    g.lineBetween(388, 145, 80, 520);
    g.lineBetween(512, 145, 820, 520);
    g.lineStyle(3, 0xffd23f, 0.75);
    g.lineBetween(429, 145, 325, 520);
    g.lineBetween(471, 145, 575, 520);

    // Roadside lampposts & palm trees
    for (const pr of [...this.props].sort((a, b) => a.z - b.z)) {
      const y = this.projY(pr.z);
      const scale = 0.25 + pr.z * 0.95;
      const edgeOffset = 82 + Math.pow(pr.z, 1.32) * 340;
      const px = 450 + pr.side * edgeOffset;
      if (pr.kind === 'lamp') {
        g.fillStyle(0x94a3b8, 1);
        g.fillRect(px - 3 * scale, y - 85 * scale, 6 * scale, 85 * scale);
        g.fillStyle(0xffd23f, 0.9);
        g.fillCircle(px - pr.side * 10 * scale, y - 85 * scale, 9 * scale);
      } else {
        g.fillStyle(0x78350f, 1);
        g.fillRect(px - 5 * scale, y - 62 * scale, 10 * scale, 62 * scale);
        g.fillStyle(0x22c55e, 1);
        g.fillCircle(px, y - 68 * scale, 22 * scale);
        g.fillStyle(0x4ade80, 1);
        g.fillCircle(px - 10 * scale, y - 74 * scale, 14 * scale);
      }
    }

    // 3. Draw Track Objects far-to-near
    for (const gt of this.gateTexts) gt.setVisible(false);
    for (const it of this.itemTexts) it.setVisible(false);
    this.gateBannerText.setVisible(false);
    let gtIdx = 0;
    let itIdx = 0;

    // Find current gate wave z so we can draw the connected Overhead Question Signboard right above the 3 gate boxes!
    const activeGates = this.objects.filter((o) => o.kind === 'gate');
    let gantryDrawn = false;

    const sorted = [...this.objects].sort((a, b) => a.z - b.z);
    const gateStyles = [
      { fill: 0x0284c7, border: 0x38bdf8 },
      { fill: 0x7c3aed, border: 0xc084fc },
      { fill: 0xdb2777, border: 0xf472b6 },
    ];

    for (const obj of sorted) {
      const x = this.laneX(obj.lane, obj.z);
      const y = this.projY(obj.z);
      const scale = 0.25 + obj.z * 0.95;

      // Draw Question Highway Gantry right above the 3 gates before drawing the gate boxes
      if (obj.kind === 'gate' && !gantryDrawn && this.activeGateQ && activeGates.length > 0) {
        gantryDrawn = true;
        const gz = activeGates[0].z;
        const gy = this.projY(gz);
        const gScale = 0.25 + gz * 0.95;
        const leftX = this.laneX(0, gz);
        const rightX = this.laneX(2, gz);
        const spanW = Math.max(320, rightX - leftX + 165 * gScale);
        const boxH = 82 * gScale;
        const boardH = Math.max(48, 66 * gScale);
        const boardY = Math.max(46, gy - boxH - boardH - 12 * gScale);

        // Support pillars connecting the Question Signboard down to the 3 gates
        g.fillStyle(0x94a3b8, 0.9);
        g.fillRect(leftX - 55 * gScale, boardY + boardH, 8 * gScale, gy - (boardY + boardH));
        g.fillRect(rightX + 47 * gScale, boardY + boardH, 8 * gScale, gy - (boardY + boardH));

        // Glossy Question Board right above the 3 answer boxes!
        g.fillStyle(0x0b1033, 0.94);
        g.lineStyle(3.5, 0xffd23f, 0.95);
        g.fillRoundedRect(450 - spanW / 2, boardY, spanW, boardH, 14);
        g.strokeRoundedRect(450 - spanW / 2, boardY, spanW, boardH, 14);

        this.gateBannerText.setPosition(450, boardY + boardH / 2);
        this.gateBannerText.setText(this.activeGateQ.prompt.replace(/\*\*/g, ''));
        this.gateBannerText.setScale(Math.max(0.76, Math.min(1.05, 0.68 + gz * 0.42)));
        this.gateBannerText.setVisible(true);
      }

      if (obj.kind === 'gate') {
        const w = 136 * scale;
        const h = 82 * scale;
        const st = gateStyles[obj.lane % 3];
        g.fillStyle(st.fill, 0.72);
        g.lineStyle(3.5 * scale + 1, st.border, 1);
        g.fillRoundedRect(x - w / 2, y - h, w, h, 12 * scale);
        g.strokeRoundedRect(x - w / 2, y - h, w, h, 12 * scale);
        // Gloss top strip
        g.fillStyle(0xffffff, 0.18);
        g.fillRoundedRect(x - w / 2 + 4 * scale, y - h + 4 * scale, w - 8 * scale, 12 * scale, 6 * scale);
        if (gtIdx < this.gateTexts.length && obj.z > 0.06) {
          const t = this.gateTexts[gtIdx++];
          t.setPosition(x, y - h / 2);
          t.setText(obj.label ?? '');
          t.setScale(Math.max(0.55, scale));
          t.setVisible(true);
        }
      } else if (obj.kind === 'barrier_low') {
        const w = 112 * scale;
        const h = 44 * scale;
        // Striped Subway Roadblock
        g.fillStyle(0xdc2626, 1);
        g.fillRoundedRect(x - w / 2, y - h, w, h, 8 * scale);
        g.fillStyle(0xfacc15, 1);
        g.fillRect(x - w / 2 + 6 * scale, y - h + 8 * scale, w - 12 * scale, 10 * scale);
        g.fillStyle(0x1e293b, 1);
        g.fillRect(x - w / 2 + 12 * scale, y - 10 * scale, 14 * scale, 10 * scale);
        g.fillRect(x + w / 2 - 26 * scale, y - 10 * scale, 14 * scale, 10 * scale);
      } else if (obj.kind === 'barrier_high') {
        const w = 122 * scale;
        const barY = y - 92 * scale;
        g.fillStyle(0x64748b, 1);
        g.fillRect(x - w / 2, barY, 9 * scale, 92 * scale);
        g.fillRect(x + w / 2 - 9 * scale, barY, 9 * scale, 92 * scale);
        g.fillStyle(0xf97316, 1);
        g.fillRoundedRect(x - w / 2, barY, w, 28 * scale, 7 * scale);
        g.fillStyle(0xfef08a, 1);
        g.fillRect(x - w / 2 + 10 * scale, barY + 9 * scale, w - 20 * scale, 8 * scale);
      } else if (obj.kind === 'coin') {
        g.fillStyle(0xffd23f, 1);
        g.fillCircle(x, y - 22 * scale, 15 * scale);
        g.lineStyle(2.5, 0xd97706, 1);
        g.strokeCircle(x, y - 22 * scale, 15 * scale);
        g.fillStyle(0xffffff, 0.7);
        g.fillCircle(x - 4 * scale, y - 27 * scale, 4 * scale);
      } else if (obj.kind === 'letter') {
        g.fillStyle(0x00d1ff, 1);
        g.fillRoundedRect(x - 18 * scale, y - 40 * scale, 36 * scale, 36 * scale, 9 * scale);
        g.lineStyle(2.5, 0xffffff, 0.95);
        g.strokeRoundedRect(x - 18 * scale, y - 40 * scale, 36 * scale, 36 * scale, 9 * scale);
        if (itIdx < this.itemTexts.length) {
          const t = this.itemTexts[itIdx++];
          t.setPosition(x, y - 22 * scale);
          t.setText(obj.label ?? 'A');
          t.setScale(Math.max(0.5, scale));
          t.setVisible(true);
        }
      } else {
        const col = obj.kind === 'shield' ? 0x22c55e : obj.kind === 'magnet' ? 0xec4899 : 0x7c5cff;
        g.fillStyle(col, 1);
        g.fillCircle(x, y - 26 * scale, 19 * scale);
        g.lineStyle(2.5, 0xffffff, 0.9);
        g.strokeCircle(x, y - 26 * scale, 19 * scale);
        if (itIdx < this.itemTexts.length) {
          const t = this.itemTexts[itIdx++];
          t.setPosition(x, y - 26 * scale);
          t.setText(obj.kind === 'shield' ? '🛡️' : obj.kind === 'magnet' ? '🧲' : '2x');
          t.setScale(Math.max(0.5, scale));
          t.setVisible(true);
        }
      }
    }

    // 4. Draw Player's Customized Shop Avatar!
    const px = this.laneX(this.visualLane, 0.94);
    const groundY = this.projY(0.94);
    const py = groundY - this.jumpY;
    const isSliding = this.slideTimer > 0;
    const stride = this.jumpY > 0 ? 0 : Math.sin(this.distance * 0.45) * 9;

    g.fillStyle(0x000000, 0.38);
    g.fillEllipse(px, groundY + 6, Math.max(22, (isSliding ? 56 : 44) - this.jumpY * 0.14), 11);

    if (this.shieldTimer > 0) {
      g.lineStyle(3.5, 0x22c55e, 0.9);
      g.fillStyle(0x22c55e, 0.18);
      g.fillCircle(px, py - 42, 50);
      g.strokeCircle(px, py - 42, 50);
    }

    drawPhaserAvatar(g, {
      x: px,
      y: py,
      avatar: this.avatar,
      scale: 1.28,
      stride,
      sliding: isSliding,
      view: 'back',
    });
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
}

export function EnglishDashGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<EnglishDashScene | null>(null);

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
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Prevent browser window from scrolling when pressing arrow keys or space during gameplay
  useEffect(() => {
    if (state !== 'PLAYING') return;
    const preventScroll = (e: KeyboardEvent) => {
      const keysToBlock = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
      if (keysToBlock.includes(e.code) || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', preventScroll, { passive: false });
    return () => {
      window.removeEventListener('keydown', preventScroll);
    };
  }, [state]);

  const startRun = useCallback(async () => {
    setState('LOADING');
    setResult(null);
    answersRef.current = [];

    try {
      const startRes = await api.post<{ sessionId: string; questions: PublicQuestion[] }>('/games/sessions/start', {
        gameSlug: 'english-dash',
      });

      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }

      const scene = new EnglishDashScene(
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
      sceneRef.current = scene;

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        parent: mountRef.current!,
        width: 900,
        height: 520,
        backgroundColor: '#162266',
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [scene],
      });
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
      sceneRef.current?.setPaused(true);
      gameAudio.stopMusic();
      setState('PAUSED');
    } else if (state === 'PAUSED') {
      sceneRef.current?.setPaused(false);
      gameAudio.startMusic('dash');
      setState('PLAYING');
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <GameHudBar
        title="English Dash"
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
          <span className="text-xs text-white/75">←/→ Lane · ↑ Jump · ↓ Slide · Questions appear right above the 3 gates!</span>
        )}
      </div>

      {/* Phaser Canvas Container */}
      <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-[#162266] shadow-2xl no-touch-callout">
        <div ref={mountRef} className="aspect-[900/520] w-full" />
        <GameOverlayModal
          state={state}
          title="English Dash"
          subtitle="Run with your customized avatar down neon subway rails! Read the question right above the 3 answer gates and steer into the right lane!"
          result={result}
          onStart={() => void startRun()}
          onResume={togglePause}
          onRestart={() => void startRun()}
          menuExtra={
            <div className="rounded-2xl bg-white/10 p-3.5 text-xs space-y-1.5 text-white/85">
              <p>• <strong>← / →</strong> or <strong>Swipe</strong>: Switch lanes & choose the right Answer Gate</p>
              <p>• <strong>↑ / Space</strong>: Jump over red barriers</p>
              <p>• <strong>↓</strong>: Slide under orange overhead beams</p>
            </div>
          }
        />
      </div>

      {/* Touch Controls */}
      {state === 'PLAYING' && (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:hidden">
          <button onClick={() => sceneRef.current?.moveLane(-1)} className="btn-game bg-white/15 py-3" aria-label="Move Left">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button onClick={() => sceneRef.current?.jump()} className="btn-game bg-game-sky text-navy-950 py-3" aria-label="Jump">
            <ArrowUp className="h-5 w-5" />
          </button>
          <button onClick={() => sceneRef.current?.slide()} className="btn-game bg-game-grape py-3" aria-label="Slide">
            <ArrowDown className="h-5 w-5" />
          </button>
          <button onClick={() => sceneRef.current?.moveLane(1)} className="btn-game bg-white/15 py-3" aria-label="Move Right">
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
