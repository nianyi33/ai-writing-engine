/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          main: '#1a1a2e',
          secondary: '#16213e',
          card: '#0f3460',
          hover: '#1a4a7a',
        },
        accent: {
          primary: '#e94560',
          success: '#27ae60',
          warning: '#f39c12',
          error: '#e74c3c',
        },
        ink: {
          body: '#e0e0e0',
          title: '#ffffff',
          muted: '#a0a0b0',
          disabled: '#606070',
        },
      },
      fontFamily: {
        editor: ['"Source Han Serif SC"', '"Noto Serif CJK SC"', 'Georgia', 'serif'],
        ui: ['"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        code: ['"Cascadia Code"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      fontSize: {
        editor: ['16px', { lineHeight: '1.8' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'typewriter': 'typewriter 0.05s linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
