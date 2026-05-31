import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light Mode - Premium Palette
        'bg-primary': '#FAFAF8',
        'bg-secondary': '#F3F3F0',
        'surface-base': '#FFFFFF',
        'surface-elevated': '#F8F8F6',
        'surface-overlay': 'rgba(0, 0, 0, 0.04)',
        'text-primary': '#111111',
        'text-secondary': '#6B7280',
        'text-tertiary': '#9CA3AF',
        'text-inverse': '#FFFFFF',

        // Accent
        'accent-primary': '#0F172A',
        'accent-light': '#1E293B',
        'accent-gold': '#D4AF37',
        'accent-gold-light': '#E8D5B7',

        // Semantic Colors
        'color-success': '#15803D',
        'color-warning': '#CA8A04',
        'color-error': '#DC2626',
        'color-info': '#0EA5E9',

        // Borders
        'border-default': '#E5E5E5',
        'border-subtle': '#F0F0F0',

        // Backgrounds for dark mode
        'dark-bg-primary': '#0B0B0B',
        'dark-bg-secondary': '#121212',
        'dark-bg-tertiary': '#1A1A1A',
        'dark-surface-base': '#1A1A1A',
        'dark-surface-elevated': '#252525',
        'dark-surface-overlay': 'rgba(255, 255, 255, 0.08)',
        'dark-text-primary': '#FFFFFF',
        'dark-text-secondary': '#A1A1AA',
        'dark-text-tertiary': '#71717A',
        'dark-border-default': '#2A2A2A',
        'dark-border-subtle': '#1F1F1F',

        // Legacy compatibility
        primary: '#0D47A1',
        'primary-light': '#1976D2',
        'primary-lighter': '#42A5F5',
        secondary: '#01579B',
        accent: '#B8860B',
        charcoal: '#1A1A1A',
        slate: '#2D3E50',
        'slate-light': '#455A64',
        stone: '#78909C',
        'stone-light': '#90A4AE',
        ash: '#BDBDBD',
        cream: '#F5F5F0',
        success: '#2E7D32',
        warning: '#F57C00',
        error: '#C62828',
        info: '#0277BD',
        'border-light': '#E0E0E0',
        'bg-subtle': '#FAFAF8',
      },
      fontFamily: {
        display: ['Inter Display', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        'display': ['72px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h1': ['56px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h2': ['40px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h3': ['32px', { lineHeight: '1.3', fontWeight: '600' }],
        'h4': ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        'subtitle': ['20px', { lineHeight: '1.4', fontWeight: '500' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '500' }],
        'caption-sm': ['12px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '400' }],
      },
      boxShadow: {
        'elevation-1': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'elevation-2': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'elevation-3': '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        'elevation-4': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
        'elevation-5': '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
        'elevation-lg': '0 25px 50px rgba(0, 0, 0, 0.15)',
        'dark-elevation-1': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'dark-elevation-2': '0 1px 3px rgba(0, 0, 0, 0.4)',
        'dark-elevation-3': '0 4px 6px rgba(0, 0, 0, 0.5)',
      },
      spacing: {
        xs: '0.25rem',    // 4px
        sm: '0.5rem',     // 8px
        md: '1rem',       // 16px
        lg: '1.5rem',     // 24px
        xl: '2rem',       // 32px
        '2xl': '3rem',    // 48px
        '3xl': '4rem',    // 64px
        '4xl': '5rem',    // 80px
        '5xl': '6rem',    // 96px
        '6xl': '8rem',    // 128px
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
        full: '9999px',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        300: '300ms',
        400: '400ms',
        500: '500ms',
        600: '600ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-out': 'fadeOut 0.2s ease-in forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'scale-grow': 'scaleGrow 0.25s ease-out forwards',
        'scale-shrink': 'scaleShrink 0.2s ease-in forwards',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse': 'pulse 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'spin-medium': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleGrow: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleShrink: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
export default config
