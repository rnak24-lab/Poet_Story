/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFF9F3',
          100: '#F5EDE3',
          200: '#EDE1D3',
          300: '#E0D0BC',
          400: '#D4C0A8',
        },
        warm: {
          50: '#FFFBF5',
          100: '#FFF5E8',
          200: '#FFE8CC',
          300: '#F8D5A8',
          400: '#E8B878',
          500: '#D4A060',
          600: '#B8864A',
        },
        sage: {
          100: '#EEF2EA',
          200: '#D8E0D0',
          300: '#B8C8A8',
          400: '#8CAA78',
          500: '#6B8F58',
        },
        ink: {
          50: '#F5F5F5',
          100: '#E8E8E8',
          200: '#D1D1D1',
          300: '#999999',
          400: '#666666',
          500: '#444444',
          600: '#2A2A2A',
          700: '#1A1A1A',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif KR', 'Georgia', 'serif'],
      },
      borderRadius: {
        'card': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
