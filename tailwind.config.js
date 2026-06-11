/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          main: 'rgb(var(--surface-main) / <alpha-value>)',
          secondary: 'rgb(var(--surface-secondary) / <alpha-value>)',
          card: 'rgb(var(--surface-card) / <alpha-value>)',
          hover: 'rgb(var(--surface-hover) / <alpha-value>)',
        },
        accent: {
          primary: 'rgb(var(--accent-primary) / <alpha-value>)',
          success: 'rgb(var(--accent-success) / <alpha-value>)',
          warning: 'rgb(var(--accent-warning) / <alpha-value>)',
          error: 'rgb(var(--accent-error) / <alpha-value>)',
        },
        ink: {
          body: 'rgb(var(--ink-body) / <alpha-value>)',
          title: 'rgb(var(--ink-title) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
          disabled: 'rgb(var(--ink-disabled) / <alpha-value>)',
        },
      },
      fontFamily: {
        editor: ['"Source Han Serif SC"', '"Noto Serif CJK SC"', 'Georgia', 'serif'],
        ui: ['"Geist"', '"Geist Fallback"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        code: ['"Cascadia Code"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      fontWeight: {
        medium: '500',
        semibold: '600',
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
