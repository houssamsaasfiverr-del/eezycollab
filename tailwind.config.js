/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {colors: {
        'pink-200': '#fbcfe8',
        'pink-300': '#f9a8d4',
        'pink-400': '#f472b6',
        'pink-500': '#ec4899',
        'purple-200': '#e9d5ff',
        'purple-300': '#d8b4fe',
        'purple-400': '#a78bfa',
        'purple-500': '#8b5cf6',
        'yellow-200': '#fef08a',
        'yellow-300': '#fde047',
        'yellow-400': '#facc15',
        'yellow-500': '#eab308'
      }},
  },
  plugins: [],
};
