/** @type {import('tailwindcss').Config} */
module.exports = {
  // Colors are driven by CSS variables (see css/tailwind.src.css) so the
  // existing theme-manager (data-theme="dark|light") keeps working.
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './_layouts/**/*.html',
    './_includes/**/*.html',
    './_pages/**/*.{html,md}',
    './*.html',
    './*.md',
    './_posts/**/*.{md,markdown}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        foreground: 'var(--fg)',
        muted: 'var(--muted)',
        subtle: 'var(--subtle)',
        border: 'var(--border)',
        primary: 'var(--primary)',
        'primary-fg': 'var(--primary-fg)',
        accent: 'var(--accent)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: {
        content: '72rem',
        prose: '46rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.4,0,0.2,1) both',
      },
    },
  },
  plugins: [],
}
