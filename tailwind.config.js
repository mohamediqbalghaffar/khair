/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Speda', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        speda: ['Speda', 'sans-serif'],
      },
      colors: {
        ios: {
          blue: '#007AFF',
          indigo: '#5856D6',
          purple: '#AF52DE',
          pink: '#FF2D55',
          rose: '#FF375F',
          teal: '#30B0C7',
          cyan: '#32ADE6',
          emerald: '#34C759',
          amber: '#FF9500',
          orange: '#FF9F0A',
        },
        liquid: {
          base: 'rgba(15, 23, 42, 0.65)',
          light: 'rgba(255, 255, 255, 0.75)',
          border: 'rgba(255, 255, 255, 0.18)',
          highlight: 'rgba(255, 255, 255, 0.35)',
        }
      },
      boxShadow: {
        'liquid': '0 20px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15) inset, 0 1px 2px 0 rgba(255, 255, 255, 0.3) inset',
        'liquid-sm': '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.12) inset',
        'liquid-lg': '0 30px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2) inset, 0 2px 4px 0 rgba(255, 255, 255, 0.4) inset',
        'liquid-glow-blue': '0 0 35px -5px rgba(56, 189, 248, 0.35), 0 0 15px rgba(59, 130, 246, 0.2)',
        'liquid-glow-emerald': '0 0 35px -5px rgba(52, 199, 89, 0.35)',
        'liquid-glow-purple': '0 0 35px -5px rgba(175, 82, 222, 0.35)',
        'liquid-glow-amber': '0 0 35px -5px rgba(245, 158, 11, 0.35)',
        'dock': '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.2) inset, 0 1px 3px 0 rgba(255, 255, 255, 0.5) inset',
      },
      backdropBlur: {
        '2xl': '24px',
        '3xl': '36px',
        '4xl': '48px',
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
        '4xl': '36px',
      },
      animation: {
        'liquid-pulse': 'liquidPulse 8s ease-in-out infinite',
        'liquid-float': 'liquidFloat 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
      },
      keyframes: {
        liquidPulse: {
          '0%, 100%': { transform: 'scale(1) translate(0px, 0px)', opacity: '0.45' },
          '50%': { transform: 'scale(1.15) translate(15px, -20px)', opacity: '0.7' },
        },
        liquidFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
