import clsx from 'clsx';

export interface AvatarConfig {
  skinTone?: string | null;
  hairStyle?: string | null;
  hairColor?: string | null;
  outfit?: string | null;
  accessory?: string | null;
  shoes?: string | null;
  effect?: string | null;
  expression?: string | null;
  name?: string | null;
}

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

/**
 * Expressive animated SVG character rendered dynamically from the user's equipped
 * cosmetics. Appears across the Game Center, Avatar Customizer, Leaderboard, and Games.
 */
export function AvatarRenderer({
  avatar,
  size = 140,
  pose = 'idle',
  className,
}: {
  avatar?: AvatarConfig | null;
  size?: number;
  pose?: 'idle' | 'run' | 'jump' | 'celebrate';
  className?: string;
}) {
  const skin = avatar?.skinTone || '#F1C27D';
  const hairStyle = avatar?.hairStyle || 'hair-short';
  const hairColor = avatar?.hairColor || '#2B1B12';
  const outfit = avatar?.outfit || 'outfit-hoodie-cyan';
  const accessory = avatar?.accessory || null;
  const shoes = avatar?.shoes || 'shoes-sneakers';
  const effect = avatar?.effect || null;
  const expression = avatar?.expression || 'happy';

  const outfitC = OUTFIT_COLORS[outfit] ?? OUTFIT_COLORS['outfit-hoodie-cyan'];
  const shoeC = SHOE_COLORS[shoes] ?? '#F8FAFC';
  const bodyAnim = pose === 'run' ? 'animate-wiggle' : pose === 'celebrate' || pose === 'jump' ? 'animate-bounce' : 'animate-float';

  return (
    <div className={clsx('relative inline-flex items-center justify-center select-none', className)} style={{ width: size, height: size }}>
      {/* Optional Aura / Effect behind character */}
      {effect === 'fx-sparkle' && (
        <div className="pointer-events-none absolute inset-1 rounded-full bg-cyan/20 blur-xl animate-pulse" />
      )}
      {effect === 'fx-aurora' && (
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-tr from-cyan/35 via-neon/35 to-pink-500/35 blur-xl animate-spin-slow" />
      )}

      <svg viewBox="0 0 160 190" className={clsx('h-full w-full overflow-visible drop-shadow-[0_10px_14px_rgba(0,0,0,0.35)]', bodyAnim)}>
        {/* Ground shadow */}
        <ellipse cx="80" cy="178" rx={pose === 'jump' ? 24 : 34} ry="7" fill="rgba(0,0,0,0.28)" />

        {/* Effect sparkles */}
        {effect && (
          <g fill={effect === 'fx-aurora' ? '#D0A3FB' : '#00D1FF'}>
            <circle cx="24" cy="60" r="3.5" opacity="0.85" />
            <circle cx="136" cy="48" r="4" opacity="0.85" />
            <circle cx="132" cy="128" r="3" opacity="0.7" />
            <path d="M26 116 L29 122 L35 125 L29 128 L26 134 L23 128 L17 125 L23 122 Z" opacity="0.85" />
          </g>
        )}

        {/* Legs & Shoes */}
        <g transform={pose === 'run' ? 'rotate(-8 80 135)' : undefined}>
          <rect x="61" y="132" width="14" height="32" rx="6" fill="#1E293B" />
          <rect x="85" y="132" width="14" height="32" rx="6" fill="#1E293B" />
          {/* Shoes */}
          <rect x="56" y="159" width="22" height="12" rx="6" fill={shoeC} />
          <rect x="82" y="159" width="22" height="12" rx="6" fill={shoeC} />
          {shoes === 'shoes-hover' && (
            <>
              <ellipse cx="67" cy="173" rx="10" ry="2.5" fill="#00D1FF" opacity="0.85" />
              <ellipse cx="93" cy="173" rx="10" ry="2.5" fill="#00D1FF" opacity="0.85" />
            </>
          )}
        </g>

        {/* Torso / Outfit */}
        <g>
          <path d="M48 92 C48 80 62 76 80 76 C98 76 112 80 112 92 L109 136 C109 140 105 142 101 142 L59 142 C55 142 51 140 51 136 Z" fill={outfitC.main} />
          {/* Accent stripe / collar */}
          <path d="M64 78 L80 96 L96 78" fill="none" stroke={outfitC.accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {outfit === 'outfit-cyber-legend' && (
            <path d="M56 112 L80 120 L104 112" fill="none" stroke="#00D1FF" strokeWidth="3.5" strokeLinecap="round" />
          )}
          {/* Left & Right Arms */}
          <rect
            x="34"
            y={pose === 'celebrate' ? 62 : 84}
            width="14"
            height="40"
            rx="7"
            fill={outfitC.main}
            transform={pose === 'celebrate' ? 'rotate(-30 41 84)' : pose === 'run' ? 'rotate(18 41 84)' : 'rotate(8 41 84)'}
          />
          <rect
            x="112"
            y={pose === 'celebrate' ? 62 : 84}
            width="14"
            height="40"
            rx="7"
            fill={outfitC.main}
            transform={pose === 'celebrate' ? 'rotate(30 119 84)' : pose === 'run' ? 'rotate(-18 119 84)' : 'rotate(-8 119 84)'}
          />
          {/* Hands */}
          <circle cx={pose === 'celebrate' ? 28 : 37} cy={pose === 'celebrate' ? 62 : 124} r="7" fill={skin} />
          <circle cx={pose === 'celebrate' ? 132 : 123} cy={pose === 'celebrate' ? 62 : 124} r="7" fill={skin} />
        </g>

        {/* Neck */}
        <rect x="72" y="66" width="16" height="14" rx="6" fill={skin} />

        {/* Back Hair (for long/ponytail/wavy) */}
        {hairStyle === 'hair-ponytail' && (
          <path d="M104 34 C126 32 132 62 118 82 C110 74 106 58 102 48 Z" fill={hairColor} />
        )}
        {hairStyle === 'hair-wavy' && (
          <path d="M44 40 C34 62 36 86 48 92 L112 92 C124 86 126 62 116 40 Z" fill={hairColor} />
        )}

        {/* Ears */}
        <circle cx="48" cy="48" r="7" fill={skin} />
        <circle cx="112" cy="48" r="7" fill={skin} />

        {/* Head */}
        <rect x="49" y="18" width="62" height="58" rx="28" fill={skin} />

        {/* Cheek blush */}
        <ellipse cx="59" cy="54" rx="5" ry="2.8" fill="#F43F5E" opacity="0.24" />
        <ellipse cx="101" cy="54" rx="5" ry="2.8" fill="#F43F5E" opacity="0.24" />

        {/* Eyes + Expression */}
        <g>
          {expression === 'wink' ? (
            <>
              <circle cx="67" cy="45" r="4.5" fill="#0F172A" />
              <circle cx="68.5" cy="43.5" r="1.4" fill="#FFFFFF" />
              <path d="M88 45 Q93 40 98 45" fill="none" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="67" cy="45" r="4.5" fill="#0F172A" />
              <circle cx="68.5" cy="43.5" r="1.4" fill="#FFFFFF" />
              <circle cx="93" cy="45" r="4.5" fill="#0F172A" />
              <circle cx="94.5" cy="43.5" r="1.4" fill="#FFFFFF" />
            </>
          )}
          {/* Mouth */}
          {expression === 'surprised' ? (
            <ellipse cx="80" cy="59" rx="4.5" ry="5.5" fill="#0F172A" />
          ) : expression === 'determined' ? (
            <path d="M71 58 L89 56" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
          ) : (
            <path d="M70 56 Q80 65 90 56" fill="none" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
          )}
        </g>

        {/* Top Hair Styles */}
        {hairStyle === 'hair-short' && (
          <path d="M47 38 C47 16 62 12 80 12 C98 12 113 16 113 38 C104 28 92 26 80 26 C68 26 56 28 47 38 Z" fill={hairColor} />
        )}
        {hairStyle === 'hair-spiky' && (
          <path d="M46 38 L52 16 L64 24 L74 8 L86 22 L98 10 L108 24 L114 38 C102 28 60 28 46 38 Z" fill={hairColor} />
        )}
        {hairStyle === 'hair-bob' && (
          <path d="M45 64 C44 20 60 12 80 12 C100 12 116 20 115 64 C107 52 106 32 98 28 C82 28 62 28 54 32 C50 40 51 54 45 64 Z" fill={hairColor} />
        )}
        {(hairStyle === 'hair-ponytail' || hairStyle === 'hair-wavy') && (
          <path d="M47 38 C47 15 64 11 80 11 C96 11 113 15 113 38 C100 26 60 26 47 38 Z" fill={hairColor} />
        )}
        {hairStyle === 'hair-neon-crest' && (
          <path d="M48 36 L60 12 L75 18 L82 4 L94 18 L106 14 L112 36 C96 26 64 26 48 36 Z" fill="#00D1FF" />
        )}

        {/* Accessories */}
        {accessory === 'acc-glasses' && (
          <g fill="none" stroke="#E2E8F0" strokeWidth="2.5">
            <rect x="57" y="38" width="19" height="13" rx="4" fill="rgba(0,209,255,0.12)" />
            <rect x="84" y="38" width="19" height="13" rx="4" fill="rgba(0,209,255,0.12)" />
            <line x1="76" y1="44" x2="84" y2="44" />
          </g>
        )}
        {accessory === 'acc-visor' && (
          <rect x="54" y="37" width="52" height="15" rx="7" fill="rgba(0,209,255,0.55)" stroke="#00D1FF" strokeWidth="2" />
        )}
        {accessory === 'acc-headphones' && (
          <g>
            <path d="M45 48 C45 14 115 14 115 48" fill="none" stroke="#A855F7" strokeWidth="5" strokeLinecap="round" />
            <rect x="40" y="39" width="10" height="20" rx="5" fill="#00D1FF" />
            <rect x="110" y="39" width="10" height="20" rx="5" fill="#00D1FF" />
          </g>
        )}
        {accessory === 'acc-crown' && (
          <path d="M58 20 L62 4 L72 13 L80 2 L88 13 L98 4 L102 20 Z" fill="#FFD23F" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" />
        )}
      </svg>
    </div>
  );
}
