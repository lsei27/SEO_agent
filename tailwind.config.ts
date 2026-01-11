import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f0f0f',
          surface: '#1a1a1a',
          border: '#2a2a2a',
          hover: '#232323',
          text: {
            primary: '#e5e5e5',
            secondary: '#a3a3a3',
            tertiary: '#737373',
          },
        },
        accent: {
          primary: '#3b82f6',
          hover: '#2563eb',
        },
      },
    },
  },
  plugins: [],
}

export default config
