/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'g-bg':      '#0F0F0F',
        'g-s1':      '#1A1A1A',
        'g-s2':      '#212121',
        'g-s3':      '#2A2A2A',
        'g-s4':      '#333333',
        'g-ol':      '#373737',
        'g-ol-v':    '#282828',
        'g-blue':    '#8AB4F8',
        'g-blue-c':  '#0842A0',
        'g-green':   '#81C995',
        'g-red':     '#F28B82',
        'g-yellow':  '#FDD663',
        'g-hi':      '#E3E3E3',
        'g-med':     'rgba(255,255,255,0.60)',
        'g-low':     'rgba(255,255,255,0.38)',
      },
      fontFamily: {
        sans: ['"Google Sans"', '"Product Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'spin-slow': 'spin 1.4s linear infinite',
        'indeterminate': 'indeterminate 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        indeterminate: {
          '0%':   { left: '-100%', right: '100%' },
          '60%':  { left: '107%',  right: '-8%'  },
          '100%': { left: '107%',  right: '-8%'  },
        },
      },
    },
  },
  plugins: [],
}
