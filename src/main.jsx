import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import './styles/site.css';
import './styles/homeStyle.css';
import './styles/pdfWPStyle.css';


// import { pdfjs } from 'react-pdf';
// import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

// pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;


ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);