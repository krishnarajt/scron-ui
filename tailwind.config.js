/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#0a0a0b',
          1: '#111113',
          2: '#1a1a1d',
          3: '#232326',
          4: '#2c2c30',
        },
        accent: {
          DEFAULT: '#22d3a7',
          dim: '#1a9e7e',
          bright: '#34fac8',
          glow: 'rgba(34, 211, 167, 0.15)',
        },
        danger: {
          DEFAULT: '#ef4444',
          dim: '#991b1b',
        },
        warn: '#f59e0b',
        txt: {
          DEFAULT: '#e4e4e7',
          muted: '#71717a',
          dim: '#52525b',
        },
        border: {
          DEFAULT: '#27272a',
          hover: '#3f3f46',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
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
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(34, 211, 167, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(34, 211, 167, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
