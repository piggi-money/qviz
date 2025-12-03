/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0d1117',
        secondary: '#161b22',
        tertiary: '#21262d',
        border: '#30363d',
        accent: {
          DEFAULT: '#58a6ff',
          green: '#3fb950',
          red: '#f85149',
          yellow: '#d29922',
        },
      },
      textColor: {
        primary: '#e6edf3',
        secondary: '#8b949e',
      },
      backgroundColor: {
        primary: '#0d1117',
        secondary: '#161b22',
        tertiary: '#21262d',
      },
      borderColor: {
        DEFAULT: '#30363d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

