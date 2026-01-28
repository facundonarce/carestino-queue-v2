
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, matchPath } from 'react-router-dom';
import { Home } from './views/Home';
import { Booking } from './views/Booking';
import { Admin } from './views/Admin';
import { TvView } from './views/TvView';
import { Menu } from 'lucide-react';
import { apiService } from './services/api';

const Header: React.FC = () => {
  const location = useLocation();
  const [logo, setLogo] = useState<string | null>(localStorage.getItem('carestino_custom_logo'));
  
  useEffect(() => {
    // Carga inicial sincronizada
    apiService.getGlobalSettings().then(settings => {
      if (settings.logo) setLogo(settings.logo);
    });

    // Suscripción a cambios en DB (Realtime)
    const unsubscribe = apiService.subscribeToSettings((newLogo) => {
      setLogo(newLogo);
    });

    const handleStorage = () => {
      setLogo(localStorage.getItem('carestino_custom_logo'));
    };
    window.addEventListener('storage', handleStorage);
    
    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const isTvPage = matchPath('/tv/:storeId', location.pathname);
  if (isTvPage) return null;

  return (
    <header className="bg-white px-4 py-3 flex justify-between items-center w-full sticky top-0 z-50 shadow-sm border-b border-slate-50">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#FF5100] rounded-lg flex items-center justify-center shadow-md overflow-hidden">
          {logo ? (
            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <path d="M18 10V7c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v3c1.1 0 2 .9 2 2s-.9 2-2 2v3c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-3c-1.1 0-2-.9-2-2s.9-2 2-2zM8 17v-1.5c1.1 0 2-.9 2-2s-.9-2-2-2V7h8v4.5c-1.1 0-2 .9-2 2s.9 2 2 2V17H8z" />
            </svg>
          )}
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-black italic uppercase tracking-tighter text-sm text-[#0f172a]">CARESTINO</span>
          <span className="font-bold uppercase tracking-widest text-[8px] text-[#FF5100]">RESERVA DE TURNOS</span>
        </div>
      </Link>
      
      <div className="flex items-center gap-4">
        <button className="text-slate-900 p-1">
          <Menu size={24} />
        </button>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-[#FF5100] flex flex-col font-sans overflow-x-hidden">
        <Header />
        <main className="flex-1 flex flex-col relative">
          <div className="flex-1 p-4 md:p-8 lg:p-12">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/tv/:storeId" element={<TvView />} />
              <Route path="/:storeId" element={<Booking />} />
            </Routes>
          </div>
          
          <footer className="w-full text-center py-4">
            <p className="text-white font-black italic uppercase tracking-[0.2em] text-[8px] opacity-70">
              FILA INTELIGENTE - CARESTINO DIGITAL
            </p>
          </footer>
        </main>
      </div>
    </Router>
  );
};

export default App;
