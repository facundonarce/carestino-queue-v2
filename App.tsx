
import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, matchPath } from 'react-router-dom';
import { Home } from './views/Home';
import { Booking } from './views/Booking';
import { Admin } from './views/Admin';
import { TvView } from './views/TvView';
import { Menu, Settings } from 'lucide-react';
import { TYPOGRAPHY } from './constants';

const Header: React.FC = () => {
  const location = useLocation();
  
  // Logic to show Admin link only on Home ('/') or Booking ('/:storeId')
  const isAdminPage = matchPath('/admin', location.pathname);
  const isTvPage = matchPath('/tv/:storeId', location.pathname);
  const showAdminLink = !isAdminPage && !isTvPage;

  if (isTvPage) return null;

  return (
    <header className="bg-white px-6 py-4 flex justify-between items-center w-full sticky top-0 z-50 shadow-sm">
      <Link to="/" className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#FF5100] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
           <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
             <path d="M18 10V7c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v3c1.1 0 2 .9 2 2s-.9 2-2 2v3c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-3c-1.1 0-2-.9-2-2s.9-2 2-2zM8 17v-1.5c1.1 0 2-.9 2-2s-.9-2-2-2V7h8v4.5c-1.1 0-2 .9-2 2s.9 2 2 2V17H8z" />
           </svg>
        </div>
        <div className="flex items-baseline">
          <span className={`${TYPOGRAPHY.heading} text-2xl text-[#0f172a]`}>CARESTINO</span>
          <span className={`${TYPOGRAPHY.heading} text-2xl text-[#FF5100] ml-1`}>APP</span>
        </div>
      </Link>
      
      <div className="flex items-center gap-6">
        {showAdminLink && (
          <Link 
            to="/admin" 
            className={`${TYPOGRAPHY.subheading} hover:text-[#FF5100] transition-colors flex items-center gap-2`}
          >
            <Settings size={16} />
            <span>ADMIN</span>
          </Link>
        )}
        <button className="text-slate-900 p-2">
          <Menu size={32} />
        </button>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-[#FF5100] flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex flex-col relative">
          <div className="flex-1 p-6 md:p-12">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/tv/:storeId" element={<TvView />} />
              <Route path="/:storeId" element={<Booking />} />
            </Routes>
          </div>
          
          <footer className="w-full text-center py-6">
            <p className="text-white font-black italic uppercase tracking-[0.2em] text-[10px] opacity-90">
              FILA INTELIGENTE - SIN AUTENTICACIÓN
            </p>
          </footer>
        </main>
      </div>
    </Router>
  );
};

export default App;
