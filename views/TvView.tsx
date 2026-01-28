
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { notificationService } from '../services/notification';
import { STORES, TYPOGRAPHY } from '../constants';
import { QueueEntry } from '../types';
import { Volume2, Users, Clock } from 'lucide-react';

export const TvView: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const store = STORES.find(s => s.id === storeId);
  
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [logo, setLogo] = useState<string | null>(localStorage.getItem('carestino_custom_logo'));
  const lastCalledId = useRef<string | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!storeId) return;
    try {
      const data = await apiService.getQueueByStore(storeId);
      setQueue(data);

      const currentCalled = data.find(t => t.status === 'called');
      if (currentCalled && currentCalled.id !== lastCalledId.current) {
        lastCalledId.current = currentCalled.id;
        notificationService.speak(`Turno número ${currentCalled.number}. ${currentCalled.client_name}. Por favor, acercarse al mostrador.`);
      }
    } catch (e) {
      console.error(e);
    }
  }, [storeId]);

  useEffect(() => {
    fetchQueue();
    // Carga de logo sincronizada
    apiService.getGlobalSettings().then(settings => {
      if (settings.logo) setLogo(settings.logo);
    });

    if (storeId) {
      const cleanup = apiService.subscribeToStoreChanges(storeId, () => fetchQueue());
      return cleanup;
    }
  }, [storeId, fetchQueue]);

  if (!store) return <div className="text-white text-center p-20">Sucursal no encontrada</div>;

  const currentCalled = queue.find(t => t.status === 'called');
  const upcoming = queue.filter(t => t.status === 'waiting').slice(0, 5);

  return (
    <div className="fixed inset-0 bg-[#0f172a] flex flex-col animate-in fade-in duration-1000">
      <div className="bg-white p-6 flex justify-between items-center shadow-2xl z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-[#FF5100] rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
             {logo ? <img src={logo} alt="Logo" className="w-full h-full object-cover" /> : (
               <svg viewBox="0 0 24 24" className="w-10 h-10 text-white fill-current">
                 <path d="M18 10V7c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v3c1.1 0 2 .9 2 2s-.9 2-2 2v3c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-3c-1.1 0-2-.9-2-2s.9-2 2-2zM8 17v-1.5c1.1 0 2-.9 2-2s-.9-2-2-2V7h8v4.5c-1.1 0-2 .9-2 2s.9 2 2 2V17H8z" />
               </svg>
             )}
          </div>
          <div>
            <h1 className={`${TYPOGRAPHY.heading} text-5xl text-slate-900`}>CARESTINO</h1>
            <p className="text-[#FF5100] font-black tracking-[0.3em] uppercase text-sm">{store.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
           <Clock size={32} />
           <span className="text-4xl font-black italic">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-[2] flex flex-col items-center justify-center p-12 border-r border-slate-800 relative">
          <div className="absolute top-12 left-12 flex items-center gap-3 text-slate-500">
            <Volume2 className="animate-pulse text-[#FF5100]" size={32} />
            <span className="font-black uppercase tracking-widest text-xl">LLAMANDO AHORA</span>
          </div>
          {currentCalled ? (
            <div className="text-center space-y-8 animate-in zoom-in duration-500">
               <div className="text-[20rem] font-black italic text-white leading-none tracking-tighter drop-shadow-[0_20px_50px_rgba(255,81,0,0.3)]">#{currentCalled.number}</div>
               <div className="bg-[#FF5100] px-12 py-6 rounded-[3rem] inline-block shadow-2xl">
                 <h2 className="text-white text-6xl font-black italic uppercase tracking-tight">{currentCalled.client_name}</h2>
               </div>
            </div>
          ) : (
            <div className="text-center opacity-20">
               <div className="text-[10rem] font-black italic text-white leading-none mb-10">--</div>
               <p className="text-white text-4xl font-black uppercase tracking-[0.4em]">ESPERANDO TURNOS</p>
            </div>
          )}
        </div>

        <div className="flex-1 bg-slate-900/50 p-12 space-y-10 overflow-hidden">
          <div className="flex items-center gap-4 text-slate-500 border-b border-slate-800 pb-6">
            <Users size={28} />
            <span className="font-black uppercase tracking-widest text-lg">PRÓXIMOS EN FILA</span>
          </div>
          <div className="space-y-6">
            {upcoming.length > 0 ? upcoming.map((entry, idx) => (
              <div key={entry.id} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex items-center justify-between animate-in slide-in-from-right" style={{ animationDelay: `${idx * 150}ms` }}>
                <div className="flex items-center gap-8"><span className="text-4xl font-black italic text-[#FF5100]">#{entry.number}</span><span className="text-3xl font-bold text-white uppercase truncate max-w-[200px]">{entry.client_name}</span></div>
                <div className="w-3 h-3 rounded-full bg-slate-700" />
              </div>
            )) : <p className="text-slate-600 font-black italic uppercase tracking-widest text-center py-20">Fila vacía</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
