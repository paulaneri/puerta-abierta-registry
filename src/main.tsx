import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { instalarAvisosGlobales } from './lib/avisoErrores'

// Si se publicó una versión nueva y faltan archivos de la anterior, recargar una vez
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault();
  const k = 'recarga-version';
  if (sessionStorage.getItem(k)) return;
  sessionStorage.setItem(k, '1');
  window.location.reload();
});
window.addEventListener('load', () => setTimeout(() => sessionStorage.removeItem('recarga-version'), 10000));


instalarAvisosGlobales();

createRoot(document.getElementById("root")!).render(<App />);
