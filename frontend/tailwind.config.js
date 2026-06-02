/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#edfcf4',
          100: '#d3f8e5',
          200: '#aaf0ce',
          300: '#73e3b3',
          400: '#38ce93',
          500: '#14b37a',
          600: '#099162',
          700: '#097451',
          800: '#0b5c42',
          900: '#0a4c37',
          950: '#042b20',
        },
        dark: {
          900: '#080c10',
          850: '#0d1117',
          800: '#111720',
          750: '#151d2b',
          700: '#1a2333',
          600: '#1e2a3d',
          500: '#243044',
          400: '#2d3d55',
        },
        accent: {
          gold: '#f4c430',
          red:  '#f04438',
          green:'#12b76a',
          blue: '#2e90fa',
          purple:'#7c3aed',
        },
      },
      backgroundImage: {
        'grid-dark': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%23ffffff08' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E\")",
        'glow-brand': 'radial-gradient(ellipse at center, rgba(20,179,122,0.15) 0%, transparent 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'ticker': 'ticker 20s linear infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        glow: { '0%': { boxShadow: '0 0 5px rgba(20,179,122,0.2)' }, '100%': { boxShadow: '0 0 20px rgba(20,179,122,0.6)' } },
        ticker: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'brand': '0 0 20px rgba(20,179,122,0.25)',
        'brand-lg': '0 0 40px rgba(20,179,122,0.35)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.5)',
        'input': 'inset 0 1px 2px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
