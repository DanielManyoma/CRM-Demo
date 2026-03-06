import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary accent: Coral orange for action and energy
        coral: {
          50: '#FFF4ED',
          100: '#FFE6D5',
          200: '#FFC9AA',
          300: '#FFA574',
          400: '#FF7A3C',
          500: '#FF5716',
          600: '#F03F0C',
          700: '#C72F0C',
          800: '#9E2812',
          900: '#7F2412',
        },
      },
    },
  },
  plugins: [],
}
export default config
