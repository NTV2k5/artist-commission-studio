import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FAF9F6', // Warm Alabaster
          surface: '#F4F4F5', // Zinc 100
        },
        charcoal: {
          DEFAULT: '#18181B', // Deep Charcoal
          muted: '#52525B',   // Zinc 600
        },
        brand: {
          DEFAULT: '#3E5C6E', // Muted Slate-Teal
          hover: '#2F4858',
          light: '#547A92',
        },
        artisan: {
          DEFAULT: '#B45309', // Muted Terracotta
          light: '#D97706',
        },
        hairline: '#E4E4E7',  // Hairline 1px border
        background: '#FAF9F6',
        foreground: '#18181B',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'var(--font-cormorant)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'var(--font-jakarta)', 'Inter', 'sans-serif'],
      },
      letterSpacing: {
        editorial: '0.15em',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
