import { useCallback, useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import type { PublicQuestion } from '@fec/shared';
import { ArrowLeft, ArrowRight, ArrowUp, Compass, KeyRound, Lock } from 'lucide-react';
import { api } from '@/services/api';
import { celebrate, toast } from '@/stores/ui';
import { gameAudio } from '../core/audioManager';
import { GameHudBar, GameOverlayModal, type GameResultSummary, type GameState } from '../core/GameStateMachine';
import { GameQuestionPrompt } from '../core/GameQuestionPrompt';
import { drawPhaserAvatar } from '../core/phaserAvatar';
import type { AvatarConfig } from '../AvatarRenderer';

interface PlatformDef {
  x: number;
  y: number;
  w: number;
  h: number;
  moveX?: number;
  moveSpeed?: number;
}

interface HazardDef {
  kind: 'spike' | 'patrol' | 'laser' | 'wave';
  x: number;
  y: number;
  w: number;
  h: number;
  range?: number;
  speed?: number;
  period?: number;
}

interface WorldSpec {
  chapter: number;
  name: string;
  sky: number;
  skyBottom: number;
  ground: number;
  clue: string;
  obstacleLabel: string;
  platforms: PlatformDef[];
  hazards: HazardDef[];
  bouncePad?: { x: number; y: number };
  gems: { x: number; y: number }[];
  checkpointX: number;
  checkpointY: number;
  doorX: number;
  portalX: number;
}

const WORLDS: WorldSpec[] = [
  {
    chapter: 1,
    name: 'Whispering Library',
    sky: 0x101c54,
    skyBottom: 0x1e2c7a,
    ground: 0x22c55e,
    clue: 'Hop onto floating bookshelves, dodge Rolling Ink Scrolls, use the Book Bounce Pad, and unlock the Ancient Library Door!',
    obstacleLabel: 'Rolling Ink Scrolls + Book Bounce Pad',
    platforms: [
      { x: 0, y: 400, w: 900, h: 80 },
      { x: 145, y: 335, w: 125, h: 16 },
      { x: 310, y: 265, w: 140, h: 16 },
      { x: 485, y: 310, w: 115, h: 16 },
    ],
    hazards: [
      { kind: 'patrol', x: 330, y: 382, w: 28, h: 28, range: 135, speed: 95 },
    ],
    bouncePad: { x: 255, y: 388 },
    gems: [
      { x: 195, y: 300 },
      { x: 375, y: 230 },
      { x: 540, y: 275 },
      { x: 735, y: 355 },
    ],
    checkpointX: 375,
    checkpointY: 265,
    doorX: 645,
    portalX: 825,
  },
  {
    chapter: 2,
    name: 'Grammar Canyon',
    sky: 0x3b1245,
    skyBottom: 0x6b2248,
    ground: 0xf59e0b,
    clue: 'Cross the moving rope bridge above Spike Pits and leap over Canyon Boulders to unlock the Canyon Gate!',
    obstacleLabel: 'Spike Pits + Moving Bridge + Canyon Boulders',
    platforms: [
      { x: 0, y: 400, w: 220, h: 80 },
      { x: 245, y: 345, w: 115, h: 16, moveX: 70, moveSpeed: 1.5 }, // Moving rope bridge!
      { x: 440, y: 290, w: 130, h: 16 },
      { x: 560, y: 400, w: 340, h: 80 },
    ],
    hazards: [
      { kind: 'spike', x: 220, y: 416, w: 340, h: 32 },
      { kind: 'patrol', x: 140, y: 382, w: 30, h: 30, range: 65, speed: 75 },
      { kind: 'patrol', x: 520, y: 272, w: 26, h: 26, range: 50, speed: 85 },
    ],
    gems: [
      { x: 130, y: 345 },
      { x: 300, y: 295 },
      { x: 500, y: 250 },
      { x: 745, y: 350 },
    ],
    checkpointX: 495,
    checkpointY: 290,
    doorX: 655,
    portalX: 825,
  },
  {
    chapter: 3,
    name: 'Vocab Harbor',
    sky: 0x092847,
    skyBottom: 0x0f5175,
    ground: 0x00d1ff,
    clue: 'Leap across bobbing Harbor Boats over Ocean Waves and dodge swooping Seagull Drones!',
    obstacleLabel: 'Ocean Wave Traps + Bobbing Boats + Swooping Drones',
    platforms: [
      { x: 0, y: 400, w: 175, h: 80 },
      { x: 215, y: 355, w: 105, h: 16, moveX: 55, moveSpeed: 1.8 },
      { x: 380, y: 305, w: 115, h: 16, moveX: 60, moveSpeed: 1.6 },
      { x: 555, y: 400, w: 345, h: 80 },
    ],
    hazards: [
      { kind: 'wave', x: 175, y: 418, w: 380, h: 36 },
      { kind: 'patrol', x: 340, y: 215, w: 32, h: 24, range: 175, speed: 145 }, // Swooping drone
    ],
    bouncePad: { x: 130, y: 388 },
    gems: [
      { x: 255, y: 315 },
      { x: 430, y: 265 },
      { x: 590, y: 350 },
      { x: 745, y: 350 },
    ],
    checkpointX: 430,
    checkpointY: 305,
    doorX: 655,
    portalX: 825,
  },
  {
    chapter: 4,
    name: 'Sky Citadel',
    sky: 0x130f3d,
    skyBottom: 0x2d1b69,
    ground: 0xa855f7,
    clue: 'Time your jumps past pulsing Electric Lasers & Storm Orbs across floating Sky Clouds!',
    obstacleLabel: 'Timed Electric Lasers + Storm Orbs + Wind Bounce Pad',
    platforms: [
      { x: 0, y: 400, w: 245, h: 80 },
      { x: 265, y: 325, w: 115, h: 16 },
      { x: 415, y: 245, w: 120, h: 16, moveX: 55, moveSpeed: 2.0 },
      { x: 560, y: 400, w: 340, h: 80 },
    ],
    hazards: [
      { kind: 'spike', x: 245, y: 418, w: 315, h: 32 },
      { kind: 'laser', x: 318, y: 215, w: 14, h: 110, period: 2.8 },
      { kind: 'patrol', x: 470, y: 345, w: 30, h: 30, range: 110, speed: 155 },
    ],
    bouncePad: { x: 205, y: 388 },
    gems: [
      { x: 320, y: 280 },
      { x: 470, y: 200 },
      { x: 595, y: 345 },
      { x: 745, y: 345 },
    ],
    checkpointX: 320,
    checkpointY: 325,
    doorX: 655,
    portalX: 825,
  },
];

class AdventureScene extends Phaser.Scene {
  private worldSpec: WorldSpec;
  private doorUnlocked = false;
  private playerX = 70;
  private playerY = 340;
  private spawnX = 70;
  private spawnY = 340;
  private vx = 0;
  private vy = 0;
  private facing: 1 | -1 = 1;
  private grounded = false;
  private jumpsLeft = 2;
  private invulnTimer = 0;
  private elapsed = 0;
  private avatar?: AvatarConfig | null;

  private platforms: (PlatformDef & { baseX: number })[] = [];
  private hazards: (HazardDef & { baseX: number; dir: number; active: boolean })[] = [];
  private gems: { x: number; y: number; got: boolean }[] = [];

  private keys!: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveDir = 0;
  private paused = false;
  private g!: Phaser.GameObjects.Graphics;
  private doorPrompted = false;
  private doorLabel!: Phaser.GameObjects.Text;
  private portalLabel!: Phaser.GameObjects.Text;

  private cb: {
    onDoorReach: () => void;
    onGem: (n: number) => void;
    onHit: () => void;
    onGoal: () => void;
  };

  constructor(
    world: WorldSpec,
    cb: { onDoorReach: () => void; onGem: (n: number) => void; onHit: () => void; onGoal: () => void },
    avatar?: AvatarConfig | null,
  ) {
    super('AdventureScene');
    this.worldSpec = world;
    this.cb = cb;
    this.avatar = avatar;
    this.platforms = world.platforms.map((p) => ({ ...p, baseX: p.x }));
    this.hazards = world.hazards.map((h) => ({ ...h, baseX: h.x, dir: 1, active: true }));
    this.gems = world.gems.map((g) => ({ ...g, got: false }));
  }

  create() {
    this.g = this.add.graphics();
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
    this.keys = this.input.keyboard!.createCursorKeys();
    this.doorLabel = this.add
      .text(this.worldSpec.doorX, 278, '🔒 RIDDLE', { fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#FFD23F', stroke: '#050816', strokeThickness: 3 })
      .setOrigin(0.5);
    this.portalLabel = this.add
      .text(this.worldSpec.portalX, 294, '✨ PORTAL', { fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#00D1FF', stroke: '#050816', strokeThickness: 3 })
      .setOrigin(0.5);
  }

  public unlockDoor() {
    this.doorUnlocked = true;
    this.doorPrompted = false;
    this.doorLabel.setText('🔓 OPEN');
    this.doorLabel.setColor('#22C55E');
    gameAudio.powerup();
  }

  public setMove(dir: -1 | 0 | 1) {
    this.moveDir = dir;
  }

  public jump() {
    if (this.paused) return;
    if (this.grounded || this.jumpsLeft > 0) {
      this.vy = -510;
      this.grounded = false;
      this.jumpsLeft = Math.max(0, this.jumpsLeft - 1);
      gameAudio.jump();
    }
  }

  public setPaused(p: boolean) {
    this.paused = p;
  }

  private damagePlayer() {
    if (this.invulnTimer > 0) return;
    this.invulnTimer = 1.4;
    this.playerX = this.spawnX;
    this.playerY = this.spawnY - 40;
    this.vy = 0;
    gameAudio.hit();
    this.cameras.main.shake(180, 0.015);
    this.cb.onHit();
  }

  update(_t: number, deltaMs: number) {
    if (this.paused) return;
    const dt = Math.min(0.04, deltaMs / 1000);
    this.elapsed += dt;
    if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);

    // Move dynamic platforms
    for (const p of this.platforms) {
      if (p.moveX) p.x = p.baseX + Math.sin(this.elapsed * (p.moveSpeed ?? 1.5)) * p.moveX;
    }

    // Move & pulse hazards
    for (const h of this.hazards) {
      if (h.kind === 'patrol' && h.range) {
        h.x += h.dir * (h.speed ?? 90) * dt;
        if (h.x > h.baseX + h.range) h.dir = -1;
        if (h.x < h.baseX - h.range) h.dir = 1;
      } else if (h.kind === 'laser' && h.period) {
        h.active = Math.sin((this.elapsed * Math.PI * 2) / h.period) > -0.15;
      }
    }

    let dir = this.moveDir;
    if (this.keys.left.isDown) dir = -1;
    else if (this.keys.right.isDown) dir = 1;
    if (Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.space)) this.jump();

    if (dir !== 0) this.facing = dir > 0 ? 1 : -1;
    this.vx = dir * 235;
    this.playerX = Math.max(24, Math.min(872, this.playerX + this.vx * dt));
    if (!this.doorUnlocked && this.playerX > this.worldSpec.doorX - 28) {
      this.playerX = this.worldSpec.doorX - 28;
      if (!this.doorPrompted) {
        this.doorPrompted = true;
        this.cb.onDoorReach();
      }
    }

    this.vy += 1220 * dt;
    const nextY = this.playerY + this.vy * dt;
    this.grounded = false;

    for (const p of this.platforms) {
      if (this.playerX >= p.x - 10 && this.playerX <= p.x + p.w + 10 && this.playerY <= p.y && nextY >= p.y && this.vy >= 0) {
        this.playerY = p.y;
        this.vy = 0;
        this.grounded = true;
        this.jumpsLeft = 2;
        break;
      }
    }
    if (!this.grounded) this.playerY = nextY;

    // Bounce pad
    if (this.worldSpec.bouncePad && Math.abs(this.playerX - this.worldSpec.bouncePad.x) < 26 && Math.abs(this.playerY - this.worldSpec.bouncePad.y) < 22) {
      this.vy = -700;
      this.grounded = false;
      this.jumpsLeft = 1;
      gameAudio.bounce();
    }

    // Fall into pit
    if (this.playerY > 475) {
      this.damagePlayer();
    }

    // Hazard collisions
    const px = this.playerX;
    const py = this.playerY - 26;
    for (const h of this.hazards) {
      if (!h.active) continue;
      const hx = h.kind === 'patrol' ? h.x : h.x + h.w / 2;
      const hy = h.kind === 'patrol' ? h.y : h.y + h.h / 2;
      if (Math.abs(px - hx) < h.w / 2 + 8 && Math.abs(py - hy) < h.h / 2 + 16) {
        this.damagePlayer();
        break;
      }
    }

    // Checkpoint update
    if (Math.abs(this.playerX - this.worldSpec.checkpointX) < 35 && Math.abs(this.playerY - this.worldSpec.checkpointY) < 40) {
      this.spawnX = this.worldSpec.checkpointX;
      this.spawnY = this.worldSpec.checkpointY;
    }

    // Collect gems
    for (const gem of this.gems) {
      if (!gem.got && Math.hypot(this.playerX - gem.x, this.playerY - 24 - gem.y) < 34) {
        gem.got = true;
        gameAudio.coin();
        this.cb.onGem(50);
      }
    }

    // Goal Portal
    if (this.doorUnlocked && Math.abs(this.playerX - this.worldSpec.portalX) < 34 && this.playerY > 330) {
      this.paused = true;
      this.cb.onGoal();
    }

    this.draw();
  }

  private draw() {
    const g = this.g;
    g.clear();
    g.fillGradientStyle(this.worldSpec.sky, this.worldSpec.sky, this.worldSpec.skyBottom, this.worldSpec.skyBottom, 1);
    g.fillRect(0, 0, 900, 480);

    // Decorative stars, distant hills & clouds
    g.fillStyle(0xffffff, 0.16);
    [90, 210, 380, 560, 740, 840].forEach((sx, i) => g.fillCircle(sx, 55 + (i % 3) * 28, 3));
    g.fillStyle(0x0b123a, 0.35);
    g.fillTriangle(40, 400, 220, 230, 400, 400);
    g.fillTriangle(320, 400, 540, 210, 760, 400);
    g.fillTriangle(620, 400, 810, 250, 960, 400);

    // Platforms
    for (const p of this.platforms) {
      g.fillStyle(0x1e293b, 1);
      g.fillRoundedRect(p.x, p.y, p.w, p.h, 8);
      g.fillStyle(this.worldSpec.ground, 1);
      g.fillRect(p.x, p.y, p.w, 6);
    }

    // Bounce pad
    if (this.worldSpec.bouncePad) {
      const bp = this.worldSpec.bouncePad;
      g.fillStyle(0xec4899, 1);
      g.fillRoundedRect(bp.x - 20, bp.y - 6, 40, 12, 6);
      g.fillStyle(0xfef08a, 1);
      g.fillTriangle(bp.x - 8, bp.y - 8, bp.x, bp.y - 18, bp.x + 8, bp.y - 8);
    }

    // Hazards (themed per stage!)
    for (const h of this.hazards) {
      if (h.kind === 'spike') {
        g.fillStyle(0xf43f5e, 1);
        for (let sx = h.x; sx < h.x + h.w; sx += 18) {
          g.fillTriangle(sx, h.y + h.h, sx + 9, h.y, sx + 18, h.y + h.h);
        }
      } else if (h.kind === 'wave') {
        g.fillStyle(0x0ea5e9, 0.85);
        g.fillRect(h.x, h.y, h.w, h.h);
        g.fillStyle(0xe0f2fe, 0.7);
        for (let wx = h.x; wx < h.x + h.w; wx += 24) {
          g.fillCircle(wx + 12, h.y, 7);
        }
      } else if (h.kind === 'laser') {
        g.fillStyle(0x475569, 1);
        g.fillRect(h.x - 4, h.y - 8, 22, 8);
        if (h.active) {
          g.fillStyle(0x00d1ff, 0.85);
          g.fillRect(h.x + 2, h.y, 10, h.h);
        }
      } else if (h.kind === 'patrol') {
        const col = this.worldSpec.chapter === 1 ? 0xf59e0b : this.worldSpec.chapter === 2 ? 0x94a3b8 : this.worldSpec.chapter === 3 ? 0xf43f5e : 0xa855f7;
        g.fillStyle(col, 1);
        g.fillCircle(h.x, h.y, h.w / 2);
        g.lineStyle(2, 0xffffff, 0.8);
        g.strokeCircle(h.x, h.y, h.w / 2);
      }
    }

    // Checkpoint flag
    g.fillStyle(0xffffff, 0.75);
    g.fillRect(this.worldSpec.checkpointX, this.worldSpec.checkpointY - 50, 4, 50);
    g.fillStyle(0x22c55e, 1);
    g.fillTriangle(this.worldSpec.checkpointX + 4, this.worldSpec.checkpointY - 50, this.worldSpec.checkpointX + 34, this.worldSpec.checkpointY - 38, this.worldSpec.checkpointX + 4, this.worldSpec.checkpointY - 26);

    // Ancient Door
    if (!this.doorUnlocked) {
      g.fillStyle(0xf59e0b, 1);
      g.fillRoundedRect(this.worldSpec.doorX - 18, 300, 36, 100, 8);
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(this.worldSpec.doorX, 345, 9);
    } else {
      g.lineStyle(3, 0x22c55e, 0.9);
      g.strokeRoundedRect(this.worldSpec.doorX - 18, 300, 36, 100, 8);
    }

    // Victory Portal
    g.fillStyle(0x00d1ff, 0.25);
    g.fillEllipse(this.worldSpec.portalX, 352, 46, 86);
    g.lineStyle(4, 0xa855f7, 1);
    g.strokeEllipse(this.worldSpec.portalX, 352, 46, 86);

    // Gems
    for (const gem of this.gems) {
      if (gem.got) continue;
      g.fillStyle(0xffd23f, 1);
      g.fillCircle(gem.x, gem.y, 11);
      g.lineStyle(2, 0xffffff, 0.8);
      g.strokeCircle(gem.x, gem.y, 11);
    }

    // Explorer Character — uses the player's customized Shop Avatar!
    if (this.invulnTimer <= 0 || Math.floor(this.invulnTimer * 10) % 2 === 0) {
      const stride = this.grounded && Math.abs(this.vx) > 10 ? Math.sin(this.elapsed * 18) * 6 : 0;
      drawPhaserAvatar(g, {
        x: this.playerX,
        y: this.playerY,
        avatar: this.avatar,
        scale: 0.96,
        stride,
        facing: this.facing,
        view: 'front',
      });
    }
  }
}

export function EnglishAdventureGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<AdventureScene | null>(null);

  const [state, setState] = useState<GameState>('MENU');
  const [chapter, setChapter] = useState(1);
  const [unlockedChapter, setUnlockedChapter] = useState(1);
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [lives, setLives] = useState(3);
  const [doorOpen, setDoorOpen] = useState(false);
  const [doorPuzzle, setDoorPuzzle] = useState<PublicQuestion | null>(null);
  const [result, setResult] = useState<GameResultSummary | null>(null);
  const answersRef = useRef<{ questionId: string; response: string | string[] }[]>([]);
  const sessionIdRef = useRef<string | null>(null);

  const addScore = (pts: number) => {
    scoreRef.current += pts;
    setScore(scoreRef.current);
  };

  useEffect(() => {
    void api.get<{ avatar: AvatarConfig; progress: { gameSlug: string; data?: { unlockedChapter?: number } }[] }>('/games/hub').then((r) => {
      setAvatar(r.avatar);
      const p = r.progress.find((g) => g.gameSlug === 'english-adventure');
      if (p?.data?.unlockedChapter) setUnlockedChapter(p.data.unlockedChapter);
    });
    return () => {
      gameAudio.stopMusic();
      gameRef.current?.destroy(true);
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

  const startWorld = useCallback(async (chap: number) => {
    setState('LOADING');
    scoreRef.current = 0;
    setScore(0);
    setLives(3);
    setDoorOpen(false);
    setDoorPuzzle(null);
    setResult(null);
    answersRef.current = [];
    const world = WORLDS.find((w) => w.chapter === chap) ?? WORLDS[0];

    try {
      const res = await api.post<{ sessionId: string; questions: PublicQuestion[] }>('/games/sessions/start', {
        gameSlug: 'english-adventure',
        mode: `chapter-${chap}`,
      });
      sessionIdRef.current = res.sessionId;

      gameRef.current?.destroy(true);
      const scene = new AdventureScene(
        world,
        {
          onGem: (pts) => addScore(pts),
          onHit: () => {
            setLives((l) => {
              const next = l - 1;
              if (next <= 0) {
                sceneRef.current?.setPaused(true);
                gameAudio.stopMusic();
                gameAudio.gameOver();
                setState('GAME_OVER');
                void finishChapter(res.sessionId, chap, false);
              }
              return next;
            });
          },
          onDoorReach: () => {
            sceneRef.current?.setPaused(true);
            setDoorPuzzle(res.questions[0] ?? null);
          },
          onGoal: () => void finishChapter(res.sessionId, chap, true),
        },
        avatar,
      );
      sceneRef.current = scene;

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        parent: mountRef.current!,
        width: 900,
        height: 480,
        backgroundColor: '#12235E',
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [scene],
      });
      gameAudio.startMusic('adventure');
      setState('PLAYING');
    } catch (e) {
      toast.error((e as Error).message);
      setState('MENU');
    }
  }, [avatar]);

  const submitDoorAnswer = (response: string | string[]) => {
    if (!doorPuzzle) return;
    answersRef.current.push({ questionId: doorPuzzle.id, response });
    addScore(150);
    setDoorOpen(true);
    setDoorPuzzle(null);
    sceneRef.current?.unlockDoor();
    sceneRef.current?.setPaused(false);
    toast.success('Ancient Door unlocked! Walk right into the Mastery Portal →');
  };

  const finishChapter = async (sid: string, chap: number, completed: boolean) => {
    gameAudio.stopMusic();
    if (completed) gameAudio.victory();
    const finalScore = scoreRef.current + (completed ? 300 : 0);
    setScore(finalScore);
    setState(completed ? 'RESULTS' : 'GAME_OVER');
    try {
      const res = await api.post<GameResultSummary>(`/games/sessions/${sid}/finish`, {
        score: finalScore,
        answers: answersRef.current,
        meta: { chapter: chap, completed },
      });
      setResult(res);
      if (completed) setUnlockedChapter((u) => Math.max(u, Math.min(4, chap + 1)));
      if (res.reward) celebrate(res.reward, completed ? `Chapter ${chap} Cleared!` : 'Adventure Ended');
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
      gameAudio.startMusic('adventure');
      setState('PLAYING');
    }
  };

  const activeWorld = WORLDS.find((w) => w.chapter === chapter) ?? WORLDS[0];

  return (
    <div className="mx-auto max-w-5xl">
      <GameHudBar
        title={`English Adventure — ${activeWorld.name}`}
        state={state}
        score={score}
        lives={lives}
        onPauseToggle={togglePause}
        extra={
          <span className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1 text-xs font-extrabold text-game-sky">
            <KeyRound className="h-3.5 w-3.5" /> {doorOpen ? 'Door Unlocked' : 'Door Locked'}
          </span>
        }
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/15 bg-[#131C52]/90 px-4 py-2.5 text-xs font-bold text-white/85">
        <span>
          <Compass className="mr-1.5 inline h-4 w-4 text-game-grass" />
          {activeWorld.clue}
        </span>
        <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] text-game-sun">
          Stage Obstacles: {activeWorld.obstacleLabel}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-[#12235E] shadow-2xl no-touch-callout">
        <div ref={mountRef} className="aspect-[900/480] w-full" />

        {/* Door English Riddle Popup */}
        {doorPuzzle && (
          <div className="absolute inset-0 z-30 grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-game-sun/50 bg-[#182366] p-6 text-white shadow-2xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-game-sun">
                <Lock className="h-4 w-4" /> ANCIENT DOOR RIDDLE — SOLVE TO UNLOCK!
              </div>
              <GameQuestionPrompt key={doorPuzzle.id} question={doorPuzzle} submitLabel="Unlock Door" onSubmit={submitDoorAnswer} />
            </div>
          </div>
        )}

        <GameOverlayModal
          state={state}
          title="English Adventure"
          subtitle="Explore 4 unique stages with distinct traps & moving platforms, collect crystals, double-jump over hazards, and solve English riddles!"
          result={result}
          onStart={() => void startWorld(chapter)}
          onResume={togglePause}
          onRestart={() => void startWorld(chapter)}
          menuExtra={
            <div className="grid grid-cols-2 gap-2">
              {WORLDS.map((w) => {
                const locked = w.chapter > unlockedChapter;
                return (
                  <button
                    key={w.chapter}
                    disabled={locked}
                    onClick={() => setChapter(w.chapter)}
                    className={`rounded-2xl border p-2.5 text-left text-xs transition ${
                      chapter === w.chapter ? 'border-game-grass bg-game-grass/20' : 'border-white/15 bg-white/10'
                    } ${locked ? 'opacity-45' : ''}`}
                  >
                    <span className="font-extrabold">
                      {locked ? '🔒 ' : ''}World {w.chapter}: {w.name}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-white/70">{w.obstacleLabel}</span>
                  </button>
                );
              })}
            </div>
          }
        />
      </div>

      {/* Touch Controls */}
      {state === 'PLAYING' && !doorPuzzle && (
        <div className="mt-4 flex justify-between gap-3 sm:hidden">
          <div className="flex gap-2">
            <button
              onTouchStart={() => sceneRef.current?.setMove(-1)}
              onTouchEnd={() => sceneRef.current?.setMove(0)}
              className="btn-game bg-white/15 px-5 py-3"
              aria-label="Walk Left"
            >
              <ArrowLeft />
            </button>
            <button
              onTouchStart={() => sceneRef.current?.setMove(1)}
              onTouchEnd={() => sceneRef.current?.setMove(0)}
              className="btn-game bg-white/15 px-5 py-3"
              aria-label="Walk Right"
            >
              <ArrowRight />
            </button>
          </div>
          <button onClick={() => sceneRef.current?.jump()} className="btn-game bg-game-grass px-7 py-3" aria-label="Jump">
            <ArrowUp /> Jump (x2)
          </button>
        </div>
      )}
    </div>
  );
}
