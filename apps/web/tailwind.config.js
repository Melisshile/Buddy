/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        buddy: {
          ink: '#0a1220',
          navy: '#0f1c2e',
          slate: '#1a2d45',
          mist: '#c5d4e8',
          accent: '#3d9b8f',
          glow: '#5ec4b6',
          warn: '#e8a87c',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'buddy-mesh':
          'radial-gradient(ellipse at 20% 0%, rgba(62,155,143,0.22), transparent 50%), radial-gradient(ellipse at 90% 20%, rgba(94,196,182,0.12), transparent 45%), linear-gradient(165deg, #0a1220 0%, #0f1c2e 45%, #132438 100%)',
      },
    },
  },
  plugins: [],
};
