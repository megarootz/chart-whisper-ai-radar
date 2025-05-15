
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeStorage } from './utils/storageUtils.ts'

// Initialize storage bucket for chart images
initializeStorage().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
