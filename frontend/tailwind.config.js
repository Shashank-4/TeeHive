/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#f0dd26', // --Y
                    dark: '#c9b800',    // --YD
                    light: '#FEFCE8',   // --YL
                },
                neutral: {
                    black: '#0A0A0A',   // --BK
                    white: '#FFFFFF',   // --W
                    g1: '#F7F7F5',      // --G1
                    g2: '#EFEFEB',      // --G2
                    g3: '#BFBFB8',      // --G3
                    g4: '#6B6B63',      // --G4
                    g5: '#2A2A26',      // --G5
                },
                success: {
                    DEFAULT: '#22C55E', // --GR
                    light: '#DCFCE7',   // --GRL
                },
                danger: {
                    DEFAULT: '#E53935', // --RD
                    light: '#FECACA',   // --RDL
                },
                info: {
                    DEFAULT: '#3B82F6', // --BL
                    light: '#DBEAFE',   // --BLL
                }
            },
            fontFamily: {
                display: ['Changa', 'sans-serif'], // --fd
                body: ['DM Sans', 'sans-serif'],   // --fb
            },
            animation: {
                marquee: 'marquee 40s linear infinite',
                'carousel-center-bounce': 'carouselCenterBounce 0.62s cubic-bezier(0.34, 1.6, 0.64, 1) both',
            },
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-100%)' },
                },
                carouselCenterBounce: {
                    '0%': { transform: 'scale(1) translateY(0)' },
                    '22%': { transform: 'scale(1.1) translateY(-12px)' },
                    '42%': { transform: 'scale(0.96) translateY(6px)' },
                    '65%': { transform: 'scale(1.05) translateY(-4px)' },
                    '100%': { transform: 'scale(1) translateY(0)' },
                },
            },
        },
    },
    plugins: [
        function ({ addUtilities }) {
            addUtilities({
                '.scrollbar-hide': {
                    '-ms-overflow-style': 'none',
                    'scrollbar-width': 'none',
                    '&::-webkit-scrollbar': {
                        display: 'none',
                    },
                },
            });
        },
    ],
};
