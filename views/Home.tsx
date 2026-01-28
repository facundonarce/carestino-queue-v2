
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { STORES, TYPOGRAPHY } from '../constants';
import { Card } from '../components/Button';
import { MapPin, ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto space-y-12">
      <header className="text-center space-y-2">
        <h1 className={`${TYPOGRAPHY.heading} text-6xl text-white`}>HOLA!</h1>
        <p className="text-white font-black italic uppercase tracking-[0.2em] text-xs opacity-90">
          Seleccioná tu sucursal para comenzar
        </p>
      </header>

      <div className="space-y-4">
        {STORES.map((store) => (
          <button
            key={store.id}
            onClick={() => navigate(`/${store.id}`)}
            className="w-full bg-white p-8 rounded-[2.5rem] shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-all duration-300"
          >
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-slate-50 text-[#FF5100]">
                <MapPin size={28} />
              </div>
              <div className="text-left">
                <h3 className={`${TYPOGRAPHY.heading} text-2xl text-slate-900`}>{store.name}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{store.address}</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-200 group-hover:bg-[#FF5100] group-hover:text-white group-hover:border-[#FF5100] transition-all">
              <ArrowRight size={24} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
