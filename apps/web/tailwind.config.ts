import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        brand: {
          600: '#0f766e',
          700: '#115e59'
        }
      }
    }
  },
  plugins: []
};

export default config;

