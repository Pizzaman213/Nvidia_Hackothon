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
      },
      fontFamily: {
        'child': ['Comic Neue', 'Comic Sans MS', 'cursive'],
        'parent': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'waveform': 'waveform 1.2s ease-in-out infinite',
      },
      keyframes: {
        waveform: {
          '0%, 100%': { height: '20%' },
          '50%': { height: '100%' },
        }
      }
    },
  },
  plugins: [],
}
