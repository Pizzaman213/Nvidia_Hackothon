/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Child-friendly color palette
        'child-primary': '#FF6B9D',
        'child-secondary': '#FFA07A',
        'child-accent': '#FFD700',
        'child-success': '#90EE90',
        'child-warning': '#FFB347',
        'child-danger': '#FF6B6B',
        'child-bg': '#FFF9E6',
        'parent-primary': '#4A90E2',
        'parent-secondary': '#7B68EE',
        'parent-accent': '#20B2AA',

        // Modern dark theme palette (Claude Code / Vercel / Linear inspired)
        'dark': {
          DEFAULT: '#0A0E27',
          50: '#1A1D29',
          100: '#252938',
          200: '#2D3447',
          300: '#353F56',
          400: '#3D4A65',
          500: '#455574',
          600: '#4D6083',
          700: '#556B92',
          800: '#5D76A1',
          900: '#6581B0',
        },
        'neon-cyan': {
          DEFAULT: '#00E5FF',
          500: '#00E5FF',
          600: '#00B8CC',
        },
        'neon-purple': {
          DEFAULT: '#8B5CF6',
          500: '#8B5CF6',
          600: '#7C3AED',
        },
        'terminal-green': {
          DEFAULT: '#4ADE80',
          500: '#4ADE80',
        },
      },
      fontFamily: {
        'child': ['Comic Neue', 'Comic Sans MS', 'cursive'],
        'parent': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
        'geometric': ['Inter', 'Satoshi', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'waveform': 'waveform 1.2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        waveform: {
          '0%, 100%': { height: '20%' },
          '50%': { height: '100%' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 229, 255, 0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}