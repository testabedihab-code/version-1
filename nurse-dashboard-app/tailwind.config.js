/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-1': '#f0fdfa',
        'primary-2': '#ccfbf1',
        'primary-3': '#5eead4',
        'primary-4': '#2dd4bf',
        'primary-5': '#14b8a6',
        'primary-6': '#0d9488',
        'primary-7': '#0f766e',
        'primary-8': '#115e59',
        'primary-9': '#134e4a',
        'primary-10': '#042f2e',
      },
      fontFamily: {
        arabic: ['Tajawal', 'IBM Plex Sans Arabic', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
