/** @type {import('tailwindcss').Config} */
// Mirrors the old inline `tailwind.config` from ot265/index.html.
// Recompile after changing utility classes:
//   npx tailwindcss@3 -i tailwind-input.css -o ot265/css/tailwind.css --minify
module.exports = {
  content: ['./ot265/index.html', './ot265/js/app.js'],
  theme: {
    extend: {
      colors: {
        earth: {
          bg: '#FAF6F1',
          text: '#3D3229',
          accent: '#C4956A',
          secondary: '#8B7355',
          pill: '#E8DDD3',
          'pill-text': '#6B5744',
        },
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
