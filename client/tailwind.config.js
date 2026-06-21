/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta única basada en el rosa profundo de la marca (#C2185B)
        // Usa primary-600 / primary-DEFAULT como tono base
        primary: {
          DEFAULT: '#C2185B',
          dark:    '#C2185B', // alias para bg-primary-dark existente (sin cambio visual)
          light:   '#FCE4EC', // alias para bg-primary-light existente (sin cambio visual)
          50:  '#FFF0F5',
          100: '#FCE4EC',
          200: '#F8BBD9',
          300: '#F48FB1',
          400: '#F06292',
          500: '#E91E63',
          600: '#C2185B',
          700: '#AD1457',
          800: '#880E4F',
          900: '#560027',
        },
        'text-dark': '#2D2D2D',
        background:  '#FFF0F5',
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        poppins:  ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
