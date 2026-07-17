import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App';
import ScrollToTop from './components/ScrollToTop';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <App />
        <Toaster
          position="top-right"
          containerClassName="!top-28 sm:!top-16 lg:!top-24"
          toastOptions={{
            duration: 3000,
            style: { fontFamily: 'Poppins, sans-serif' },
            success: { iconTheme: { primary: '#C2185B', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
