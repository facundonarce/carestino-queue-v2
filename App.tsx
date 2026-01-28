
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
    apiService.getGlobalSettings().then(settings => {
      if (settings.logo) setLogo(settings.logo);
    });

    const unsubscribe = apiService.subscribeToSettings((newLogo) => {
      setLogo(newLogo);
      localStorage.setItem('carestino_custom_logo', newLogo);
    });

    return () => unsubscribe();
  }, []);

  // Ocultar cabecera en TV
  if (matchPath('/tv/:storeId', location.pathname)) return null;

  return (
    <header className="bg-white px-6 py-4 flex justify-between items-center w-full sticky top-0 z-50 shadow-sm border-b border-slate-50">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 bg-[#FF5100] rounded-xl flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-105 transition-transform">
          {logo ? (
            <img src={logo} alt="Logo" className="w-full h-full object-contain p-1" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
              <path d="M18 10V7c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v3c1.1 0 2 .9 2 2s-.9 2-2 2v3c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-3c-1.1 0-2-.9-2-2s.9-2 2-2zM8 17v-1.5c1.1 0 2-.9 2-2s-.9-2-2-2V7h8v4.5c-1.1 0-2 .9-2 2s.9 2 2 2V17H8z" />
            </svg>
          )}
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-black italic uppercase tracking-tighter text-base text-[#0f172a]">CARESTINO</span>
          <span className="font-bold uppercase tracking-widest text-[8px] text-[#FF5100]">FILA DIGITAL</span>
        </div>
      </Link>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end mr-2">
           <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">SISTEMA OFICIAL</p>
           <p className="text-[9px] font-black italic uppercase text-slate-900 leading-none">V 2.5 PREMIUM</p>
        </div>
        <button className="text-slate-900 p-2 hover:bg-slate-50 rounded-xl transition-colors">
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
              <Route path="/admin/:storeId" element={<Admin />} />
              <Route path="/tv/:storeId" element={<TvView />} />
              <Route path="/:storeId" element={<Booking />} />
            </Routes>
          </div>
          
          <footer className="w-full text-center py-6">
            <p className="text-white/40 font-black italic uppercase tracking-[0.3em] text-[8px]">
              CARESTINO DIGITAL QUEUE SYSTEM &copy; {new Date().getFullYear()}
            </p>
          </footer>
        </main>
      </div>
    </Router>
  );
};

export default App;
