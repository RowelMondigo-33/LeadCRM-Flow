import Head from 'next/head';
import { ThemeProvider } from '../context/ThemeContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <Head>
        <title>LeadCRM Flow — Enterprise Client Acquisition & Management</title>
        <meta name="description" content="Next-generation lead capture and client management system built for high-growth businesses." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}