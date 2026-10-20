import tailwindcssAnimate from 'tailwindcss-animate';
import tailwindcssSafeArea from 'tailwindcss-safe-area';

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
      fontSize: {
        '2xs': ['0.72rem', { lineHeight: '1.35' }],
      },
      borderWidth: {
        '3': '3px',
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
          base: 'rgba(255, 255, 255, 0.88)',
          light: 'rgba(255, 255, 255, 0.94)',
          border: 'rgba(226, 232, 240, 0.9)',
          highlight: 'rgba(255, 255, 255, 0.98)',
        }
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(15, 23, 42, 0.03)',
        'xs': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'liquid': '0 16px 40px -12px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
        'liquid-sm': '0 8px 20px -5px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.85) inset',
        'liquid-lg': '0 25px 55px -12px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(255, 255, 255, 0.95) inset',
        'liquid-glow-blue': '0 0 35px -5px rgba(56, 189, 248, 0.35), 0 0 15px rgba(59, 130, 246, 0.2)',
        'liquid-glow-emerald': '0 0 35px -5px rgba(52, 199, 89, 0.35)',
        'liquid-glow-purple': '0 0 35px -5px rgba(175, 82, 222, 0.35)',
        'liquid-glow-amber': '0 0 35px -5px rgba(245, 158, 11, 0.35)',
        'dock': '0 20px 45px -10px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(226, 232, 240, 0.9) inset, 0 1px 3px 0 rgba(255, 255, 255, 0.95) inset',
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
        'fadeIn': 'agyFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scaleUp': 'agyZoomIn95 0.24s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shake': 'agyShake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
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
        },
        agyFadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        agyZoomIn95: {
          from: { opacity: '0', transform: 'scale(0.96) translateY(6px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        agyShake: {
          '10%, 90%': { transform: 'translate3d(-2px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(4px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-6px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(6px, 0, 0)' },
        }
      }
    },
  },
  plugins: [
    tailwindcssAnimate,
    tailwindcssSafeArea,
  ],
}
