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
        paper: {
          50: '#FBF9F5',
          100: '#F5F2EB',
          200: '#ECE6DA',
          300: '#DFD7C6',
          border: '#E2DBD0',
        },
        stone: {
          750: '#363230',
          850: '#23201e',
          950: '#0c0a09',
        },
        ink: {
          900: '#1C1B1A',
          800: '#2C2B29',
          700: '#4A4844',
          600: '#5E5B55',
          500: '#75726B',
          400: '#9E9A92',
          300: '#C5C1B8',
          200: '#DDD9D0',
          100: '#EBE7DF',
          50: '#F5F2EB',
        },
        icebreaker: {
          DEFAULT: '#4C85C0',
          dark: '#3A6A9C',
          light: '#EBF3FB',
          border: '#B3D0F0',
        },
        oneStar: {
          DEFAULT: '#C4D63C',
          dark: '#9CB025',
          light: '#F8FAE5',
          border: '#DDE98B',
        },
        twoStar: {
          DEFAULT: '#E98C37',
          dark: '#C86E20',
          light: '#FDF3E7',
          border: '#F5CCA0',
        },
        threeStar: {
          DEFAULT: '#E87483',
          dark: '#C75162',
          light: '#FDF0F2',
          border: '#F5B8C0',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang TC"',
          '"Noto Sans TC"',
          '"Microsoft JhengHei"',
          'sans-serif',
        ],
        serif: [
          '"Songti TC"',
          '"Noto Serif TC"',
          'Georgia',
          'serif',
        ],
      },
      boxShadow: {
        'card': '0 8px 30px -4px rgba(28, 27, 26, 0.08), 0 2px 8px -2px rgba(28, 27, 26, 0.04)',
        'card-hover': '0 16px 40px -6px rgba(28, 27, 26, 0.12), 0 4px 12px -2px rgba(28, 27, 26, 0.06)',
        'tactile': '0 1px 3px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.7)',
      },
    },
  },
  plugins: [],
}
