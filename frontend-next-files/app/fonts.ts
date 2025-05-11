import localFont from 'next/font/local';

// Load Futura font
export const futura = localFont({
  src: [
    {
      path: '../public/fonts/futura-medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/futura-bold.woff2',
      weight: '700',
      style: 'normal',
    }
  ],
  variable: '--font-futura',
  display: 'swap',
});
