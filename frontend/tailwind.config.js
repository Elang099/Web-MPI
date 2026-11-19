/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic (theme-aware) tokens — prefer these in the main website.
        bg: v('bg'),
        surface: v('surface'),
        'surface-2': v('surface-2'),
        line: v('line'),
        ink: v('ink'),
        muted: v('muted'),
        // Brand palette (fixed)
        midnight: '#050816',
        navy: { 950: '#050816', 900: '#0A1030', 800: '#111A45', 700: '#1B2763', 600: '#26358A' },
        cyan: { DEFAULT: '#00D1FF', 50: '#E6FAFF', 100: '#B3F1FF', 300: '#4DE1FF', 400: '#1AD7FF', 500: '#00D1FF', 600: '#00A8CC', 700: '#007E99' },
        neon: { DEFAULT: '#A855F7', 300: '#D0A3FB', 400: '#BC7AF9', 500: '#A855F7', 600: '#8B2FE8', 700: '#6D1BC2' },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#F43F5E',
        // Game palette (Game Center only)
        game: { sky: '#4FC3FF', grass: '#58D26B', sun: '#FFD23F', candy: '#FF4D8D', grape: '#7C5CFF', orange: '#FF8A3D' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
        game: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: { '4xl': '2rem' },
      boxShadow: {
        glow: '0 0 0 1px rgba(0,209,255,.25), 0 8px 40px -8px rgba(0,209,255,.35)',
        'glow-purple': '0 0 0 1px rgba(168,85,247,.25), 0 8px 40px -8px rgba(168,85,247,.45)',
        soft: '0 10px 30px -12px rgba(2,6,23,.45)',
        game: '0 6px 0 0 rgba(0,0,0,.25)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #00D1FF 0%, #7C5CFF 55%, #A855F7 100%)',
        'grid-faint':
          'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pop-in': { '0%': { transform: 'scale(.6)', opacity: 0 }, '70%': { transform: 'scale(1.08)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
        wiggle: { '0%,100%': { transform: 'rotate(-3deg)' }, '50%': { transform: 'rotate(3deg)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        'pop-in': 'pop-in .45s cubic-bezier(.2,.9,.3,1.3) both',
        wiggle: 'wiggle .5s ease-in-out infinite',
        'spin-slow': 'spin-slow 18s linear infinite',
      },
    },
  },
  plugins: [],
};
