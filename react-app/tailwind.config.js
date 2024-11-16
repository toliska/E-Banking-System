/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{html,js}',  // This tells Tailwind to look for classes in .html and .js files in the pages directory
    './components/**/*.{html,js}',  // Same for the components directory
  ],
  theme: {
    extend: {
      backgroundColor: {
        'black-t-50': 'rgba(0,0,0,0.5)'  // Custom background color
      },
      colors: {
        'soft-peach': '#FFDAB9',  // Custom color
        'light-cream': '#FFFDD0',  // Custom color
        'dark-slate-gray': '#2F4F4F',  // Custom color
        'coral': '#FF7F50',  // Custom color
        'light-salmon': '#FFA07A',  // Custom color
      },
    },
  },
  plugins: [],
}
