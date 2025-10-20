/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2196F3',
          dark: '#1976D2',
          light: '#E3F2FD',
        },
        success: {
          DEFAULT: '#4CAF50',
          dark: '#2E7D32',
          light: '#E8F5E9',
        },
        warning: {
          DEFAULT: '#FF9800',
          dark: '#E65100',
          light: '#FFF3E0',
        },
        error: {
          DEFAULT: '#F44336',
          dark: '#C62828',
          light: '#FFEBEE',
        },
        info: {
          DEFAULT: '#9C27B0',
          dark: '#6A1B9A',
          light: '#F3E5F5',
        },
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'xxl': '24px',
        'xxxl': '32px',
      }
    },
  },
  plugins: [],
}

