import {createRoot} from 'react-dom/client';import {BrowserRouter} from 'react-router-dom';import AuthGate from './components/AuthGate';import App from './App';import './styles.css';
createRoot(document.getElementById('root')!).render(<BrowserRouter><AuthGate><App/></AuthGate></BrowserRouter>);
if('serviceWorker' in navigator&&import.meta.env.PROD)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
