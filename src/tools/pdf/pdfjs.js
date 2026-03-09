import * as pdfjsLib from 'pdfjs-dist';

// Use local worker file from public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export { pdfjsLib };