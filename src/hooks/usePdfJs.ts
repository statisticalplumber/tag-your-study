import { useEffect, useState } from 'react';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export const usePdfJs = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already loaded in context
    if (window.pdfjsLib) {
      setIsReady(true);
      return;
    }

    const scriptId = 'pdfjs-core-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.async = true;
      document.head.appendChild(script);
    }

    const loadWorker = () => {
      try {
        const pdfjs = window['pdfjsLib'] || (window as any)['pdfjs-dist/build/pdf'];
        if (pdfjs) {
          // Register global for typescript/helpers
          window.pdfjsLib = pdfjs;
          pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
          setIsReady(true);
        } else {
          setError('PDF.js layout bindings mismatch.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to bind PDF worker.');
      }
    };

    if (script.dataset.loaded === 'true') {
      loadWorker();
    } else {
      script.addEventListener('load', () => {
        script!.dataset.loaded = 'true';
        loadWorker();
      });
      script.addEventListener('error', () => {
        setError('Error downloading PDF render module from CDN.');
      });
    }
  }, []);

  return { isReady, error };
};
