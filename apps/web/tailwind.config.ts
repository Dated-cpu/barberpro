import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0A0A0B',
        ivory: '#F5F0EB',
        gold: { DEFAULT: '#C9A96E', light: '#DFC594', muted: 'rgba(201,169,110,0.15)', glow: 'rgba(201,169,110,0.3)' },
        accent: { DEFAULT: '#C9A96E', hover: '#DFC594', muted: 'rgba(201,169,110,0.15)', glow: 'rgba(201,169,110,0.3)' },
        copper: '#8B5E3C',
        stone: '#6B6560',
        espresso: '#2A1F1A',
        bg: {
          primary: '#0A0A0B',
          secondary: '#1A1512',
          tertiary: '#2A1F1A',
          elevated: '#1E1815',
          card: '#221B17',
          glass: 'rgba(26,21,18,0.6)',
        },
        text: {
          primary: '#F5F0EB',
          secondary: '#8A8480',
          tertiary: '#5E5550',
          inverse: '#0A0A0B',
        },
        border: {
          DEFAULT: '#2A1F1A',
          light: '#3A3030',
          accent: '#C9A96E',
        },
        error: { DEFAULT: '#FF453A', bg: 'rgba(255,69,58,0.1)' },
        success: { DEFAULT: '#34C759', bg: 'rgba(52,199,89,0.1)' },
        warning: { DEFAULT: '#FF9F0A', bg: 'rgba(255,159,10,0.1)' },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '1.875rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.05' }],
        '7xl': ['4.5rem', { lineHeight: '1.05' }],
        '8xl': ['6rem', { lineHeight: '1' }],
      },
      spacing: {
        '1': '4px', '2': '8px', '3': '12px', '4': '16px', '5': '20px',
        '6': '24px', '8': '32px', '10': '40px', '12': '48px', '16': '64px',
        '20': '80px', '24': '96px', '32': '128px', '40': '160px',
      },
      animation: {
        'gold-draw': 'goldDraw 1.2s cubic-bezier(0.65,0,0.35,1) forwards',
        'fade-in': 'fadeIn 0.7s cubic-bezier(0.65,0,0.35,1) forwards',
        'slide-up': 'slideUp 0.7s cubic-bezier(0.65,0,0.35,1) forwards',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.65,0,0.35,1) forwards',
        'toast-in': 'toastIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'star-pop': 'starPop 0.4s ease-out forwards',
      },
      keyframes: {
        goldDraw: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.96)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        starPop: {
          '0%': { opacity: '0', transform: 'scale(0)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      transitionDuration: {
        '400': '400ms',
      },
      transitionTimingFunction: {
        'gold': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backdropBlur: {
        glass: '16px',
      },
    },
  },
  plugins: [],
};

export default config;
