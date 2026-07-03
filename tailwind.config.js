/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        industrial: {
          950: '#0b0f19', // Deep space dark background
          900: '#0f172a', // Card dark background (Slate 900)
          800: '#1e293b', // Panel border (Slate 800)
          700: '#334155', // Slate 700
          600: '#475569', // Slate 600
          400: '#94a3b8', // Gray labels
          200: '#e2e8f0', // Light mode panels
          100: '#f1f5f9', // Light mode bg
          50:  '#f8fafc',
        },
        scada: {
          cyan: '#06b6d4',      // Normal/Operational status (Neon Cyan)
          emerald: '#10b981',   // Normal status alternative
          amber: '#f59e0b',     // Warning status (Neon Amber)
          rose: '#f43f5e',      // Critical status (Neon Rose/Pink)
          slate: '#64748b',     // Offline status
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}
