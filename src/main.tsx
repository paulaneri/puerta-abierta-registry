import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { instalarAvisosGlobales } from './lib/avisoErrores'

instalarAvisosGlobales();

createRoot(document.getElementById("root")!).render(<App />);
