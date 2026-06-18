/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0F0F1A',
          secondary: '#1A1A2E',
          tertiary: '#252542',
          elevated: '#1E1E35',
          card: '#1A1A2E',
          overlay: 'rgba(26,26,46,0.75)',
        },
        brand: {
          primary: '#6366F1',
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        accent: {
          primary: '#EC4899',
          pink: '#EC4899',
          purple: '#8B5CF6',
          cyan: '#22D3EE',
          green: '#34D399',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#CBD5E1',
          muted: '#94A3B8',
        },
        border: {
          subtle: 'rgba(148, 163, 184, 0.1)',
          default: 'rgba(148, 163, 184, 0.15)',
          strong: 'rgba(148, 163, 184, 0.25)',
        },
        success: {
          DEFAULT: '#10B981',
          500: '#10B981',
          600: '#059669',
          '/10': 'rgba(16,185,129,0.1)',
          '/15': 'rgba(16,185,129,0.15)',
        },
        error: {
          DEFAULT: '#EF4444',
          500: '#EF4444',
          '/10': 'rgba(239,68,68,0.1)',
          '/15': 'rgba(239,68,68,0.15)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          500: '#F59E0B',
          '/20': 'rgba(245,158,11,0.2)',
          '/60': 'rgba(245,158,11,0.6)',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        'accent-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
        'success-gradient': 'linear-gradient(135deg, #10B981 0%, #22D3EE 100%)',
        'warning-gradient': 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
        'glow-gradient': 'radial-gradient(ellipse at top, rgba(99,102,241,0.15) 0%, transparent 50%)',
        'card-gradient': 'linear-gradient(180deg, rgba(30,30,53,0.8) 0%, rgba(26,26,46,0.8) 100%)',
      },
      boxShadow: {
        'glow-sm': '0 0 20px rgba(99,102,241,0.25)',
        'glow-md': '0 0 30px rgba(99,102,241,0.35)',
        'glow-lg': '0 0 50px rgba(99,102,241,0.45)',
        'card-hover': '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'danmaku-scroll': 'danmakuScroll 8s linear forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 20px rgba(99,102,241,0.25)' },
          '50%': { boxShadow: '0 0 40px rgba(99,102,241,0.5)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        danmakuScroll: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
