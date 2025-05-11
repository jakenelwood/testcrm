import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

// Load Inter font (used by Notion)
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

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
