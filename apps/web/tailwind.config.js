// const { createGlobPatternsForDependencies } = require('@nx/next/tailwind');

// The above utility import will not work if you are using Next.js' --turbo.
// Instead you will have to manually add the dependent paths to be included.
// For example
// ../libs/buttons/**/*.{ts,tsx,js,jsx,html}',                 <--- Adding a shared lib
// !../libs/buttons/**/*.{stories,spec}.{ts,tsx,js,jsx,html}', <--- Skip adding spec/stories files from shared lib

// If you are **not** using `--turbo` you can uncomment both lines 1 & 19.
// A discussion of the issue can be found: https://github.com/nrwl/nx/issues/26510

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './{src,pages,components,app}/**/*.{ts,tsx,js,jsx,html}',
    '!./{src,pages,components,app}/**/*.{stories,spec}.{ts,tsx,js,jsx,html}',
    //     ...createGlobPatternsForDependencies(__dirname)
  ],
  theme: {
    extend: {
      colors: {
        'canvas': 'rgb(var(--canvas) / <alpha-value>)',
        'surface': 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'line': 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',
        'ink': 'rgb(var(--ink) / <alpha-value>)',
        'ink-2': 'rgb(var(--ink-2) / <alpha-value>)',
        'ink-3': 'rgb(var(--ink-3) / <alpha-value>)',
        'ink-4': 'rgb(var(--ink-4) / <alpha-value>)',
        'accent': 'rgb(var(--accent) / <alpha-value>)',
        'accent-text': 'rgb(var(--accent-text) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        'success': 'rgb(var(--success) / <alpha-value>)',
        'success-soft': 'rgb(var(--success-soft) / <alpha-value>)',
        'warning': 'rgb(var(--warning) / <alpha-value>)',
        'warning-soft': 'rgb(var(--warning-soft) / <alpha-value>)',
        'danger': 'rgb(var(--danger) / <alpha-value>)',
        'danger-soft': 'rgb(var(--danger-soft) / <alpha-value>)',
        'danger-solid': 'rgb(var(--danger-solid) / <alpha-value>)',
        'night': 'rgb(var(--night) / <alpha-value>)',
        'night-2': 'rgb(var(--night-2) / <alpha-value>)',
        'night-3': 'rgb(var(--night-3) / <alpha-value>)',
        'night-line': 'rgb(var(--night-line) / <alpha-value>)',
        'night-ink': 'rgb(var(--night-ink) / <alpha-value>)',
        'night-ink-2': 'rgb(var(--night-ink-2) / <alpha-value>)',
        'night-ink-3': 'rgb(var(--night-ink-3) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        micro: ['11px', { lineHeight: '16px', fontWeight: '500' }],
        caption: ['12px', { lineHeight: '16px' }],
        'body-sm': ['13px', { lineHeight: '20px' }],
        body: ['15px', { lineHeight: '24px' }],
        'title-sm': ['16px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '600' }],
        title: ['20px', { lineHeight: '28px', letterSpacing: '-0.015em', fontWeight: '600' }],
        heading: ['24px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-sm': ['32px', { lineHeight: '40px', letterSpacing: '-0.03em', fontWeight: '600' }],
        display: ['48px', { lineHeight: '52px', letterSpacing: '-0.035em', fontWeight: '600' }],
      },
      borderRadius: {
        ctl: '6px',
        card: '12px',
        panel: '16px',
      },
      boxShadow: {
        e1: '0 0 0 1px rgb(0 0 0 / .08)',
        e2: '0 0 0 1px rgb(0 0 0 / .08), 0 1px 1px rgb(0 0 0 / .02), 0 2px 2px rgb(0 0 0 / .04)',
        e3: '0 0 0 1px rgb(0 0 0 / .08), 0 2px 2px rgb(0 0 0 / .04), 0 8px 8px -8px rgb(0 0 0 / .04)',
        e4: '0 0 0 1px rgb(0 0 0 / .08), 0 2px 2px rgb(0 0 0 / .04), 0 8px 16px -4px rgb(0 0 0 / .04)',
        e5: '0 0 0 1px rgb(0 0 0 / .08), 0 1px 1px rgb(0 0 0 / .02), 0 8px 16px -4px rgb(0 0 0 / .04), 0 24px 32px -8px rgb(0 0 0 / .06)',
      },
      zIndex: {
        sticky: '10',
        header: '20',
        drawer: '30',
        overlay: '40',
        modal: '50',
        popover: '60',
        toast: '70',
        palette: '80',
      },
      transitionDuration: {
        press: '120ms',
        hover: '200ms',
        base: '280ms',
        slow: '420ms',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(.16,1,.3,1)',
        'in-quart': 'cubic-bezier(.5,0,.75,0)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        rise: 'rise 280ms cubic-bezier(.16,1,.3,1) both',
      },
    }
  },
  plugins: [],
};
