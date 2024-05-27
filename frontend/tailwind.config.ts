const animate = require('tailwindcss-animate')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  safelist: ['dark'],
  prefix: '',

  content: [
    './pages/**/*.{ts,tsx,vue}',
    './components/**/*.{ts,tsx,vue}',
    './app/**/*.{ts,tsx,vue}',
    './src/**/*.{ts,tsx,vue}'
  ],

  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        // background: 'var(--color-background)',
        // foreground: 'var(--color-foreground)',
        // muted: 'var(--color-muted)',
        // 'muted-foreground': 'var(--color-muted-foreground)',
        // popover: 'var(--color-popover)',
        // 'popover-foreground': 'var(--color-popover-foreground)',
        // card: 'var(--color-card)',
        // 'card-foreground': 'var(--color-card-foreground)',
        // border: 'var(--color-border)',
        // input: 'var(--color-input)',
        // primary: 'var(--color-primary)',
        // 'primary-foreground': 'var(--color-primary-foreground)',
        // secondary: 'var(--color-secondary)',
        // 'secondary-foreground': 'var(--color-secondary-foreground)',
        // accent: 'var(--color-accent)',
        // 'accent-foreground': 'var(--color-accent-foreground)',
        // destructive: 'var(--color-destructive)',
        // 'destructive-foreground': 'var(--color-destructive-foreground)',
        // ring: 'var(--color-ring)',
        // radius: 'var(--color-radius)'
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 }
        },
        'collapsible-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-collapsible-content-height)' }
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: 0 }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'collapsible-down': 'collapsible-down 0.2s ease-in-out',
        'collapsible-up': 'collapsible-up 0.2s ease-in-out'
      }
    }
  },
  plugins: [animate]
}
