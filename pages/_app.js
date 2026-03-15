import '../styles/globals.css'
import { Toaster } from 'react-hot-toast'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#242422',
            color: '#F0EDE6',
            border: '1px solid #2E2E2B',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#C9A84C', secondary: '#1a1200' } },
        }}
      />
    </>
  )
}
