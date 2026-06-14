/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        spy: {
          black: '#0a0a0f',
          dark: '#12121a',
          panel: '#1a1a2e',
          cyan: '#00f0ff',
          green: '#00ff88',
          amber: '#ffb800',
          red: '#ff3366',
          purple: '#a855f7',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 240, 255, 0.3), 0 0 20px rgba(0, 240, 255, 0.1)' },
          '100%': { boxShadow: '0 0 10px rgba(0, 240, 255, 0.5), 0 0 40px rgba(0, 240, 255, 0.2), 0 0 60px rgba(0, 240, 255, 0.1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
}
