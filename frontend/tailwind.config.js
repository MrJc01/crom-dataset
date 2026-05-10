/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        crom: {
          dark: '#0a0a0f',
          darker: '#060609',
          surface: '#12121a',
          'surface-2': '#1a1a26',
          'surface-3': '#22222f',
          border: '#2a2a3a',
          'border-light': '#3a3a4f',
          text: '#e4e4ed',
          'text-muted': '#8888a0',
          'text-dim': '#5a5a72',
          accent: '#6366f1',
          'accent-light': '#818cf8',
          'accent-dark': '#4f46e5',
          'accent-glow': 'rgba(99, 102, 241, 0.15)',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'gradient-x': 'gradientX 8s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.25)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.12) 0%, transparent 60%)',
      },
      boxShadow: {
        'glow': '0 0 24px rgba(99, 102, 241, 0.15)',
        'glow-lg': '0 0 48px rgba(99, 102, 241, 0.2)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}
