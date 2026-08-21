/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens bound to CSS custom properties
        app: {
          bg:      'var(--bg-canvas)',
          card:    'var(--bg-card)',
          hover:   'var(--bg-hover)',
          input:   'var(--bg-input)',
          border:  'var(--border-color)',
          text:    'var(--text-primary)',
          muted:   'var(--text-secondary)',
          accent:  'var(--accent-primary)',
          accentText: 'var(--accent-text)',
        },
        // Legacy/Direct Emerald Spring Whisper Accent Tokens
        accent: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#52B788',
          500: '#34D399',
          600: '#10B981',
          700: '#059669',
          950: '#081C15',
        },
        dark: {
          bg:      '#081C15',
          sidebar: '#081C15',
          card:    '#163B2C',
          hover:   '#214E3A',
          border:  '#2D5F48',
          header:  '#163B2C',
        },
        surface: {
          50:  '#163B2C',
          100: '#214E3A',
          200: '#2D5F48',
          300: '#52B788',
          400: '#94D2BD',
          500: '#B7E4C7',
          600: '#D8F3DC',
          700: '#E8F5E9',
          800: '#F1F8F5',
          900: '#F8FAFC',
        },
      },
      fontFamily: {
        sans: ['"SF UI Display"', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'neon': 'var(--shadow-neon)',
        'neon-sm': '0 0 10px 0 rgba(52, 211, 153, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
