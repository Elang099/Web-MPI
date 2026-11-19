import type Phaser from 'phaser';
import type { AvatarConfig } from '../AvatarRenderer';

const OUTFIT_HEX: Record<string, { main: number; accent: number }> = {
  'outfit-hoodie-cyan': { main: 0x00a8cc, accent: 0x00d1ff },
  'outfit-varsity-purple': { main: 0x7c3aed, accent: 0xc084fc },
  'outfit-blazer-navy': { main: 0x1b2763, accent: 0xf59e0b },
  'outfit-runner-gold': { main: 0xd97706, accent: 0xfde047 },
  'outfit-explorer-emerald': { main: 0x16a34a, accent: 0x86efac },
  'outfit-cyber-legend': { main: 0x0f172a, accent: 0x00d1ff },
};

const SHOE_HEX: Record<string, number> = {
  'shoes-sneakers': 0xf8fafc,
  'shoes-turbo': 0xff4d8d,
  'shoes-hover': 0x00d1ff,
};

function hexNum(hex: string | null | undefined, fallback: number): number {
  if (!hex) return fallback;
  const n = parseInt(hex.replace('#', ''), 16);
  return Number.isNaN(n) ? fallback : n;
}

/**
 * Draws the user's customized shop Avatar onto a Phaser Graphics object.
 * Supports both front/platformer view (Adventure) and runner view (English Dash).
 */
export function drawPhaserAvatar(
  g: Phaser.GameObjects.Graphics,
  opts: {
    x: number;
    y: number; // feet baseline
    avatar?: AvatarConfig | null;
    scale?: number;
    stride?: number;
    sliding?: boolean;
    facing?: 1 | -1;
    view?: 'front' | 'back';
  },
) {
  const { x, y, avatar, scale = 1, stride = 0, sliding = false, facing = 1, view = 'front' } = opts;
  const skin = hexNum(avatar?.skinTone, 0xf1c27d);
  const hairColor = hexNum(avatar?.hairColor, 0x2b1b12);
  const hairStyle = avatar?.hairStyle || 'hair-short';
  const outfitSpec = OUTFIT_HEX[avatar?.outfit || 'outfit-hoodie-cyan'] ?? OUTFIT_HEX['outfit-hoodie-cyan'];
  const shoeCol = SHOE_HEX[avatar?.shoes || 'shoes-sneakers'] ?? 0xf8fafc;
  const accessory = avatar?.accessory || null;
  const effect = avatar?.effect || null;

  // Aura / Effect
  if (effect === 'fx-sparkle') {
    g.fillStyle(0x00d1ff, 0.16);
    g.fillCircle(x, y - 34 * scale, 38 * scale);
  } else if (effect === 'fx-aurora') {
    g.fillStyle(0xa855f7, 0.2);
    g.fillCircle(x, y - 34 * scale, 42 * scale);
    g.lineStyle(2 * scale, 0x00d1ff, 0.5);
    g.strokeCircle(x, y - 34 * scale, 44 * scale);
  }

  const legH = (sliding ? 10 : 18) * scale;
  const bodyH = (sliding ? 20 : 32) * scale;
  const bodyW = 28 * scale;
  const headR = 14 * scale;

  // Legs & Shoes
  const leftY = y - legH + stride * 0.5 * scale;
  const rightY = y - legH - stride * 0.5 * scale;
  g.fillStyle(0x0f172a, 1);
  g.fillRoundedRect(x - 11 * scale, leftY, 9 * scale, legH, 4 * scale);
  g.fillRoundedRect(x + 2 * scale, rightY, 9 * scale, legH, 4 * scale);
  g.fillStyle(shoeCol, 1);
  g.fillRoundedRect(x - 12 * scale, leftY + legH - 6 * scale, 11 * scale, 6 * scale, 3 * scale);
  g.fillRoundedRect(x + 1 * scale, rightY + legH - 6 * scale, 11 * scale, 6 * scale, 3 * scale);

  if (avatar?.shoes === 'shoes-hover') {
    g.fillStyle(0x00d1ff, 0.75);
    g.fillEllipse(x - 6 * scale, leftY + legH + 2 * scale, 12 * scale, 3 * scale);
    g.fillEllipse(x + 6 * scale, rightY + legH + 2 * scale, 12 * scale, 3 * scale);
  }

  // Torso / Outfit + accent stripe
  const torsoTop = y - legH - bodyH + 4 * scale;
  g.fillStyle(outfitSpec.main, 1);
  g.fillRoundedRect(x - bodyW / 2, torsoTop, bodyW, bodyH, 9 * scale);
  g.fillStyle(outfitSpec.accent, 1);
  g.fillRoundedRect(x - (bodyW * 0.55) / 2, torsoTop + 5 * scale, bodyW * 0.55, 6 * scale, 3 * scale);

  // Arms
  g.fillStyle(outfitSpec.main, 1);
  g.fillRoundedRect(x - bodyW / 2 - 6 * scale, torsoTop + 2 * scale + stride * 0.3 * scale, 7 * scale, bodyH * 0.72, 3.5 * scale);
  g.fillRoundedRect(x + bodyW / 2 - 1 * scale, torsoTop + 2 * scale - stride * 0.3 * scale, 7 * scale, bodyH * 0.72, 3.5 * scale);

  // Head
  const headY = torsoTop - headR + 2 * scale;
  if (hairStyle === 'hair-wavy') {
    g.fillStyle(hairColor, 1);
    g.fillRoundedRect(x - headR * 1.15, headY - headR * 0.6, headR * 2.3, headR * 1.9, 8 * scale);
  } else if (hairStyle === 'hair-ponytail') {
    const tailX = view === 'back' ? x : x - facing * headR * 0.95;
    g.fillStyle(hairColor, 1);
    g.fillEllipse(tailX, headY + 2 * scale, 10 * scale, 18 * scale);
  }

  g.fillStyle(skin, 1);
  g.fillCircle(x, headY, headR);

  // Eyes (front view only)
  if (view === 'front') {
    const ex = facing * 3 * scale;
    g.fillStyle(0x0f172a, 1);
    g.fillCircle(x - 4.5 * scale + ex, headY - 1 * scale, 2 * scale);
    g.fillCircle(x + 4.5 * scale + ex, headY - 1 * scale, 2 * scale);
  }

  // Top Hair Style
  const topHairCol = hairStyle === 'hair-neon-crest' ? 0x00d1ff : hairColor;
  g.fillStyle(topHairCol, 1);
  if (view === 'back') {
    // Back of head covered with hair
    g.fillCircle(x, headY - 2 * scale, headR * 1.02);
    if (hairStyle === 'hair-spiky' || hairStyle === 'hair-neon-crest') {
      g.fillTriangle(x - 8 * scale, headY - headR, x - 3 * scale, headY - headR - 10 * scale, x + 2 * scale, headY - headR);
      g.fillTriangle(x + 1 * scale, headY - headR, x + 7 * scale, headY - headR - 10 * scale, x + 11 * scale, headY - headR);
    }
  } else {
    g.fillEllipse(x, headY - headR * 0.65, headR * 2.05, headR * 0.95);
    if (hairStyle === 'hair-spiky' || hairStyle === 'hair-neon-crest') {
      g.fillTriangle(x - 9 * scale, headY - headR * 0.8, x - 3 * scale, headY - headR - 9 * scale, x + 3 * scale, headY - headR * 0.8);
      g.fillTriangle(x + 1 * scale, headY - headR * 0.8, x + 7 * scale, headY - headR - 8 * scale, x + 11 * scale, headY - headR * 0.8);
    } else if (hairStyle === 'hair-bob') {
      g.fillRoundedRect(x - headR * 1.1, headY - headR * 0.6, 5 * scale, headR * 1.4, 2 * scale);
      g.fillRoundedRect(x + headR * 0.75, headY - headR * 0.6, 5 * scale, headR * 1.4, 2 * scale);
    }
  }

  // Accessories
  if (accessory === 'acc-headphones') {
    g.lineStyle(3 * scale, 0xa855f7, 1);
    g.strokeCircle(x, headY, headR * 1.08);
    g.fillStyle(0x00d1ff, 1);
    g.fillRoundedRect(x - headR - 3 * scale, headY - 5 * scale, 5 * scale, 10 * scale, 2 * scale);
    g.fillRoundedRect(x + headR - 2 * scale, headY - 5 * scale, 5 * scale, 10 * scale, 2 * scale);
  } else if (accessory === 'acc-visor' && view === 'front') {
    g.fillStyle(0x00d1ff, 0.75);
    g.fillRoundedRect(x - 10 * scale + facing * 2 * scale, headY - 4 * scale, 20 * scale, 7 * scale, 3 * scale);
  } else if (accessory === 'acc-glasses' && view === 'front') {
    g.lineStyle(1.8 * scale, 0xe2e8f0, 1);
    g.strokeRoundedRect(x - 10 * scale + facing * 2 * scale, headY - 4 * scale, 8 * scale, 6 * scale, 2 * scale);
    g.strokeRoundedRect(x + 2 * scale + facing * 2 * scale, headY - 4 * scale, 8 * scale, 6 * scale, 2 * scale);
  } else if (accessory === 'acc-crown') {
    g.fillStyle(0xffd23f, 1);
    g.fillTriangle(x - 9 * scale, headY - headR, x - 6 * scale, headY - headR - 10 * scale, x - 2 * scale, headY - headR);
    g.fillTriangle(x - 3 * scale, headY - headR, x, headY - headR - 12 * scale, x + 3 * scale, headY - headR);
    g.fillTriangle(x + 2 * scale, headY - headR, x + 6 * scale, headY - headR - 10 * scale, x + 9 * scale, headY - headR);
  }
}
