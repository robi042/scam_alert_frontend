/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#020617',
        card: '#020617',
        accent: '#22c55e',
        accentSoft: '#22c55e1a',
        borderSoft: '#1e293b',
      },
    },
  },
  plugins: [],
}

