
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService, getSupabase } from '../services/api';
import { notificationService } from '../services/notification';
import { STORES, TYPOGRAPHY, UI } from '../constants';
import { Card, Button, Input } from '../components/Button';
import { QueueEntry } from '../types';
// Fixed: Added Users to the imports from lucide-react
import { Bell, Loader2, User, AlertCircle, Mail, Send, CheckCircle2, Users } from 'lucide-react';

export const Booking: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const store = STORES.find(s => s.id === storeId);

  const [name, setName] = useState('');
  const [myTicket, setMyTicket] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [isDemo, setIsDemo] = useState(false);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    setIsDemo(getSupabase() === null);
  }, []);

  useEffect(() => {
    if (storeId) {
      const saved = localStorage.getItem(`carestino_ticket_${storeId}`);
      if (saved) {
        setMyTicket(JSON.parse(saved));
      }
    }
  }, [storeId]);

  const fetchQueue = useCallback(async () => {
    if (!storeId) return;
    try {
      const data = await apiService.getQueueByStore(storeId);
      setQueue(data);

      if (myTicket) {
        const updated = data.find(t => t.id === myTicket.id);
        if (updated && updated.status !== myTicket.status) {
          if (updated.status === 'called') {
            notificationService.sendNotification(
              "¡ES TU TURNO!",
              `Por favor acércate al mostrador de ${store?.name}`
            );
          }
          setMyTicket(updated);
          localStorage.setItem(`carestino_ticket_${storeId}`, JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.error("Fetch Error:", e);
    }
  }, [storeId, myTicket, store?.name]);

  useEffect(() => {
    fetchQueue();
    if (storeId) {
      const cleanup = apiService.subscribeToStoreChanges(storeId, () => {
        fetchQueue();
      });
      return cleanup;
    }
  }, [storeId, fetchQueue]);

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !name.trim()) return;
    
    setLoading(true);
    try {
      notificationService.requestPermission().catch(console.error);
      const ticket = await apiService.addQueueEntry(storeId, name);
      setMyTicket(ticket);
      localStorage.setItem(`carestino_ticket_${storeId}`, JSON.stringify(ticket));
    } catch (err) {
      console.error("Join Queue Error:", err);
      alert("Error al unirse a la fila.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    try {
      await apiService.subscribeNewsletter(newsletterEmail);
      setSubscribed(true);
      setNewsletterEmail('');
    } catch (err) {
      console.error("Newsletter error:", err);
      alert("Error al suscribirse.");
    } finally {
      setSubscribing(false);
    }
  };

  if (!store) return (
    <div className="max-w-md mx-auto text-center p-8 md:p-12 bg-white rounded-[3rem] shadow-xl mt-10 px-4">
      <AlertCircle className="mx-auto text-red-500 mb-6" size={56} />
      <h2 className={`${TYPOGRAPHY.heading} text-2xl text-slate-900`}>SUCURSAL NO ENCONTRADA</h2>
      <p className="text-slate-500 mt-3 font-bold uppercase tracking-widest text-[10px]">Verifica el link o selecciona una de la lista.</p>
      <Link to="/" className="inline-block mt-8 text-[#FF5100] font-black italic uppercase tracking-widest text-sm">Ver todas las tiendas</Link>
    </div>
  );

  const currentBeingServed = queue.find(t => t.status === 'called')?.number || '--';
  const peopleAhead = myTicket ? queue.filter(t => t.status === 'waiting' && t.created_at < myTicket.created_at).length : 0;

  if (myTicket?.status === 'called') {
    return (
      <div className="max-w-md mx-auto h-full flex flex-col justify-center px-4 animate-in fade-in zoom-in duration-500">
        <Card className="text-center flex flex-col items-center gap-10 py-12 md:py-20 rounded-[4rem]">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-green-50 rounded-full flex items-center justify-center text-green-500 shadow-xl border-4 border-white">
             <Bell className="w-16 h-16 md:w-20 md:h-20" fill="currentColor" />
          </div>

          <div className="space-y-2">
            <h1 className={`${TYPOGRAPHY.heading} text-5xl md:text-6xl text-green-600`}>¡TU TURNO!</h1>
            <p className={`${TYPOGRAPHY.subheading} !text-slate-400`}>CARESTINO {store.name.toUpperCase()}</p>
          </div>

          <div className="bg-slate-50 p-8 md:p-10 rounded-[3rem] w-full border border-slate-100 shadow-inner">
            <p className="text-slate-900 font-black text-xl leading-tight uppercase italic tracking-tight">
              Por favor, acércate al mostrador principal. ¡Te estamos esperando!
            </p>
          </div>

          <Link to="/" onClick={() => {
            if (storeId) localStorage.removeItem(`carestino_ticket_${storeId}`);
            setMyTicket(null);
          }} className="text-slate-400 font-black uppercase italic tracking-widest text-[10px] hover:text-[#FF5100] mt-4">
            CONFIRMAR Y FINALIZAR
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-full flex flex-col justify-center px-4 animate-in fade-in duration-700">
      {isDemo && !myTicket && (
        <div className="mb-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 text-white border border-white/20">
          <AlertCircle size={20} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Modo Demo • Offline</p>
        </div>
      )}

      {!myTicket ? (
        <Card className="space-y-10 py-12 px-8 rounded-[4rem]">
          <div className="text-center space-y-4">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 border border-slate-100">
               <User size={48} />
             </div>
             <div className="space-y-1">
                <h2 className={`${TYPOGRAPHY.heading} text-4xl text-slate-900`}>HOLA!</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Ingresá tu nombre para {store.name}</p>
             </div>
          </div>
          <form onSubmit={handleJoinQueue} className="space-y-6">
            <Input 
              placeholder="Nombre Completo" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="!py-5 !px-8 text-center uppercase tracking-widest !rounded-3xl"
            />
            <Button fullWidth disabled={loading} variant="primary" type="submit" className="!py-6">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "SACAR TURNO"}
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="text-center flex flex-col items-center gap-8 py-12 md:py-16 px-8 rounded-[4rem] relative overflow-hidden">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-2 shadow-inner">
             <svg viewBox="0 0 24 24" className="w-12 h-12 text-[#FF5100] fill-current">
               <path d="M18 10V7c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v3c1.1 0 2 .9 2 2s-.9 2-2 2v3c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-3c-1.1 0-2-.9-2-2s.9-2 2-2zM8 17v-1.5c1.1 0 2-.9 2-2s-.9-2-2-2V7h8v4.5c-1.1 0-2 .9-2 2s.9 2 2 2V17H8z" />
             </svg>
          </div>

          <div className="space-y-1">
            <h2 className={`${TYPOGRAPHY.heading} text-6xl md:text-7xl text-slate-900 leading-none`}>#{myTicket.number}</h2>
            <p className={`${TYPOGRAPHY.subheading} !text-slate-300`}>CARESTINO {store.name.toUpperCase()}</p>
          </div>

          <div className="bg-slate-50 px-8 py-10 rounded-[3.5rem] w-full space-y-6 relative border border-slate-100 shadow-inner">
             <div className="flex items-center justify-center gap-3 text-slate-500">
                <Users size={18} className="text-[#FF5100]" />
                <p className="font-black uppercase tracking-widest text-[11px]">Gente delante: <span className="text-slate-900">{peopleAhead}</span></p>
             </div>
             
             <div className="w-1/3 h-px bg-slate-200 mx-auto" />

             <div className="space-y-1">
               <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">
                 ATENDIENDO AHORA
               </p>
               <p className="text-3xl font-black text-slate-900">#{currentBeingServed}</p>
             </div>
          </div>

          <Button variant="secondary" fullWidth className="flex items-center justify-center gap-3 !py-5 !rounded-3xl shadow-slate-200">
            <Bell size={18} className="text-[#FF5100]" fill="currentColor" />
            VIBRAR AL LLAMAR
          </Button>

          {/* Newsletter Section */}
          <div className="w-full bg-slate-900 p-8 rounded-[3rem] space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-white/40">
              <Mail size={16} />
              <p className="font-black uppercase tracking-widest text-[9px]">Newsletter Carestino</p>
            </div>
            {subscribed ? (
              <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in">
                <CheckCircle2 className="text-green-500" size={32} />
                <p className="text-green-500 font-black uppercase italic text-[10px] tracking-widest">
                  ¡SUSCRITO CON ÉXITO!
                </p>
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className="relative group">
                <input 
                  type="email"
                  placeholder="Tu e-mail..."
                  className="w-full bg-white/10 rounded-2xl px-6 py-4 pr-14 text-sm font-bold text-white placeholder-white/20 outline-none border border-white/10 focus:border-[#FF5100] transition-colors"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
                <button 
                  type="submit"
                  disabled={subscribing}
                  className="absolute right-2 top-2 bottom-2 bg-[#FF5100] text-white rounded-xl px-4 hover:scale-105 transition-all flex items-center justify-center active:scale-95"
                >
                  {subscribing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            )}
          </div>

          <Link to="/" onClick={() => {
             if (storeId) localStorage.removeItem(`carestino_ticket_${storeId}`);
             setMyTicket(null);
          }} className="text-slate-300 font-black uppercase italic tracking-widest text-[9px] hover:text-[#FF5100] mt-2">
            CANCELAR MI TURNO
          </Link>
        </Card>
      )}
    </div>
  );
};
