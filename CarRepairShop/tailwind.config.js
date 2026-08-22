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
          bg:         'var(--bg-canvas)',
          card:       'var(--bg-card)',
          hover:      'var(--bg-hover)',
          input:      'var(--bg-input)',
          border:     'var(--border-color)',
          text:       'var(--text-primary)',
          muted:      'var(--text-secondary)',
          caption:    'var(--text-muted)',
          accent:     'var(--accent-primary)',
          accentHover:'var(--accent-hover)',
          accentLight:'var(--accent-secondary)',
          accentText: 'var(--accent-text)',
        },
        primary: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        surface: {
          50:  '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'subtle': 'var(--shadow-subtle)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
