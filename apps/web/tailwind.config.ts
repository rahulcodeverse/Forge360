import type { Config } from 'tailwindcss';
import tailwindPreset from '@hrms/config/tailwind-preset';

const config: Config = {
  presets: [tailwindPreset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
