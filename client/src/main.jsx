import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import ScrollToTop from './components/ScrollToTop';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
