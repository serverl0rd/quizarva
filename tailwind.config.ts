import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode colors - Orange theme
        'primary-light': '#FF6B35',
        'primary-light-hover': '#FF8A50',
        'primary-light-active': '#E65100',
        'bg-light': '#FAFAFA',
        'surface-light': '#FFFFFF',
        'text-primary-light': '#1A1A1A',
        'text-secondary-light': '#666666',
        'border-light': '#E0E0E0',
        
        // Dark mode colors - Purple theme
        'primary-dark': '#9C27B0',
        'primary-dark-hover': '#BA68C8',
        'primary-dark-active': '#6A1B9A',
        'bg-dark': '#0A0A0A',
        'surface-dark': '#1A1A1A',
        'text-primary-dark': '#FFFFFF',
        'text-secondary-dark': '#B0B0B0',
        'border-dark': '#2A2A2A',
        
        // Semantic colors
        'success': '#4CAF50',
        'success-dark': '#66BB6A',
        'error': '#F44336',
        'error-dark': '#EF5350',
        'warning': '#FFA726',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'buzz': 'buzz 0.5s ease-in-out',
        'score-update': 'score-update 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
            filter: 'brightness(1)',
          },
          '50%': {
            opacity: '0.8',
            transform: 'scale(1.05)',
            filter: 'brightness(1.2)',
          },
        },
        'buzz': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        'score-update': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config