import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f0f2f5',
          100: '#d8dce3',
          200: '#b8bfcc',
          300: '#909bb0',
          400: '#6b7893',
          500: '#505d7a',
          600: '#3b4561',
          700: '#2a334b',
          800: '#1a2136',
          900: '#0f1526',
          950: '#080c18',
        },
        amber: {
          50: '#fffbf0',
          100: '#fff3d4',
          200: '#ffe2a8',
          300: '#ffcc6b',
          400: '#ffb430',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        ember: {
          50: '#fef2f2',
          100: '#fde6e6',
          200: '#fbbfbf',
          300: '#f78a8a',
          400: '#f05252',
          500: '#e02424',
          600: '#c81e1e',
          700: '#9b1c1c',
          800: '#771d1d',
          900: '#5e1a1a',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url('/noise.png')",
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
