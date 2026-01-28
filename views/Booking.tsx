
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService, getSupabase } from '../services/api';
import { notificationService } from '../services/notification';
import { STORES, TYPOGRAPHY } from '../constants';
import { Card, Button, Input } from '../components/Button';
import { QueueEntry } from '../types';
import { Bell, Loader2, User, AlertCircle, Mail, Send, CheckCircle2, Users, Heart, Volume2 } from 'lucide-react';

export const Booking: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const store = STORES.find(s => s.id === storeId);

  const [name, setName] = useState('');
  const [myTicket, setMyTicket] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [logo, setLogo] = useState<string | null>(localStorage.getItem('carestino_custom_logo'));
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    apiService.getGlobalSettings().then(settings => {
      if (settings.logo) setLogo(settings.logo);
    });

    const unsubscribeLogo = apiService.subscribeToSettings((newLogo) => {
      setLogo(newLogo);
    });

    if (storeId) {
      const saved = localStorage.getItem(`carestino_ticket_${storeId}`);
      if (saved) {
        setMyTicket(JSON.parse(saved));
      }
    }

    return () => unsubscribeLogo();
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
            notificationService.sendNotification("¡ES TU TURNO!", `${myTicket.client_name}, por favor acércate al mostrador.`);
            notificationService.vibrate([500, 200, 500, 200, 500]);
            notificationService.speak(`${myTicket.client_name}, es tu turno. Por favor, acércate al mostrador de la sucursal ${store?.name}.`);
          }
          setMyTicket(updated);
          localStorage.setItem(`carestino_ticket_${storeId}`, JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.error(e);
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
      setIsAcknowledged(false);
      localStorage.setItem(`carestino_ticket_${storeId}`, JSON.stringify(ticket));
    } catch (err) {
      alert("Error al unirse a la fila.");
    } finally {
      setLoading(false);
    }
  };

  const enableAlerts = () => {
    notificationService.requestPermission();
    notificationService.vibrate([100, 50, 100]);
    notificationService.speak("Avisos activados. Te avisaremos cuando sea tu turno.");
    setAlertsEnabled(true);
  };

  const handleFinishProcess = () => {
    if (storeId) localStorage.removeItem(`carestino_ticket_${storeId}`);
    setMyTicket(null);
    setIsAcknowledged(true);
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    try {
      await apiService.subscribeNewsletter(newsletterEmail);
      setSubscribed(true);
      setNewsletterEmail('');
    } finally {
      setSubscribing(false);
    }
  };

  if (!store) return (
    <div className="max-w-md mx-auto text-center p-8 bg-white rounded-[2.5rem] mt-10 px-4">
      <AlertCircle className="mx-auto text-red-500 mb-6" size={48} />
      <h2 className={`${TYPOGRAPHY.heading} text-xl`}>TIENDA NO ENCONTRADA</h2>
      <Link to="/" className="inline-block mt-6 text-[#FF5100] font-black italic uppercase tracking-widest text-[10px]">Ver tiendas</Link>
    </div>
  );

  if (isAcknowledged || myTicket?.status === 'finished') {
    return (
      <div className="max-w-md mx-auto h-full flex flex-col justify-center px-2 animate-in fade-in zoom-in duration-500">
        <Card className="text-center flex flex-col items-center gap-8 py-12 rounded-[3.5rem]">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-[#FF5100] shadow-xl">
             <Heart className="w-12 h-12" fill="currentColor" />
          </div>
          <div className="space-y-3">
            <h1 className={`${TYPOGRAPHY.heading} text-4xl text-slate-900`}>¡MUCHAS GRACIAS!</h1>
            <p className="text-slate-400 font-black uppercase italic tracking-[0.2em] text-[9px]">
              Esperamos que disfrutes tu experiencia en {store.name}
            </p>
          </div>
          <button onClick={() => { setIsAcknowledged(false); setMyTicket(null); if (storeId) localStorage.removeItem(`carestino_ticket_${storeId}`); }} className="text-[#FF5100] font-black uppercase italic tracking-widest text-[9px] hover:underline pt-4">VOLVER A SACAR TURNO</button>
        </Card>
      </div>
    );
  }

  const currentBeingServed = queue.find(t => t.status === 'called')?.number || '--';
  const peopleAhead = myTicket ? queue.filter(t => t.status === 'waiting' && t.created_at < myTicket.created_at).length : 0;

  if (myTicket?.status === 'called') {
    return (
      <div className="max-w-md mx-auto h-full flex flex-col justify-center px-2 animate-in fade-in zoom-in duration-500">
        <Card className="text-center flex flex-col items-center gap-8 py-10 rounded-[3.5rem]">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 shadow-xl border-4 border-white">
             <Bell className="w-12 h-12" fill="currentColor" />
          </div>
          <div className="space-y-1">
            <h1 className={`${TYPOGRAPHY.heading} text-4xl text-green-600`}>¡TU TURNO!</h1>
            <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400">CARESTINO {store.name.toUpperCase()}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-[2.5rem] w-full border border-slate-100 shadow-inner">
            <p className="text-slate-900 font-black text-lg leading-tight uppercase italic tracking-tight">Acércate al mostrador. ¡Te esperamos!</p>
          </div>
          <Button variant="primary" fullWidth onClick={handleFinishProcess} className="!py-5 !rounded-[1.5rem] text-xs">ENTIENDO, VOY ALLÁ</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-full flex flex-col justify-center px-2 animate-in fade-in duration-700">
      {!myTicket ? (
        <Card className="space-y-8 py-10 px-6 rounded-[3.5rem]">
          <div className="text-center space-y-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 border border-slate-100 overflow-hidden">
               {logo ? <img src={logo} alt="Store Logo" className="w-full h-full object-cover" /> : <User size={40} />}
             </div>
             <div className="space-y-1">
                <h2 className={`${TYPOGRAPHY.heading} text-3xl text-slate-900`}>¡HOLA!</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Ingresá tu nombre para {store.name}</p>
             </div>
          </div>
          <form onSubmit={handleJoinQueue} className="space-y-5">
            <Input placeholder="Nombre Completo" value={name} onChange={(e) => setName(e.target.value)} required className="!py-4 !px-6 text-center uppercase tracking-widest !rounded-2xl text-sm" />
            <Button fullWidth disabled={loading} variant="primary" type="submit" className="!py-5 text-xs">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "SACAR TURNO"}
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="text-center flex flex-col items-center gap-6 py-10 px-6 rounded-[3.5rem] relative overflow-hidden">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center shadow-inner overflow-hidden">
             {logo ? <img src={logo} alt="Logo" className="w-full h-full object-cover" /> : (
               <svg viewBox="0 0 24 24" className="w-10 h-10 text-[#FF5100] fill-current">
                 <path d="M18 10V7c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v3c1.1 0 2 .9 2 2s-.9 2-2 2v3c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-3c-1.1 0-2-.9-2-2s.9-2 2-2zM8 17v-1.5c1.1 0 2-.9 2-2s-.9-2-2-2V7h8v4.5c-1.1 0-2 .9-2 2s.9 2 2 2V17H8z" />
               </svg>
             )}
          </div>
          <div className="space-y-1">
            <h2 className={`${TYPOGRAPHY.heading} text-5xl text-slate-900 leading-none`}>#{myTicket.number}</h2>
            <p className="font-bold uppercase tracking-widest text-[9px] text-slate-300">CARESTINO {store.name.toUpperCase()}</p>
          </div>
          <div className="bg-slate-50 px-6 py-6 rounded-[2.5rem] w-full space-y-4 relative border border-slate-100 shadow-inner">
             <div className="flex items-center justify-center gap-2 text-slate-500">
                <Users size={14} className="text-[#FF5100]" />
                <p className="font-black uppercase tracking-widest text-[10px]">Gente delante: <span className="text-slate-900">{peopleAhead}</span></p>
             </div>
             <div className="w-1/4 h-px bg-slate-200 mx-auto" />
             <div className="space-y-1">
               <p className="text-slate-400 font-black uppercase tracking-widest text-[8px]">ATENDIENDO AHORA</p>
               <p className="text-2xl font-black text-slate-900">#{currentBeingServed}</p>
             </div>
          </div>
          
          <Button 
            variant={alertsEnabled ? "outline" : "secondary"} 
            fullWidth 
            onClick={enableAlerts}
            className={`flex items-center justify-center gap-2 !py-4 !rounded-2xl text-[10px] shadow-sm transition-all ${alertsEnabled ? '!border-green-500 !text-green-600 !bg-green-50' : ''}`}
          >
            {alertsEnabled ? (
              <><CheckCircle2 size={14} /> AVISOS ACTIVADOS</>
            ) : (
              <><Volume2 size={14} className="text-[#FF5100]" /> ACTIVAR AVISOS (VOZ Y VIBRACIÓN)</>
            )}
          </Button>

          <div className="w-full bg-slate-900 p-6 rounded-[2.5rem] space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-white/30">
              <Mail size={12} />
              <p className="font-black uppercase tracking-widest text-[8px]">Newsletter Carestino</p>
            </div>
            {subscribed ? (
              <div className="flex flex-col items-center gap-1 animate-in fade-in zoom-in">
                <CheckCircle2 className="text-green-500" size={24} />
                <p className="text-green-500 font-black uppercase italic text-[8px] tracking-widest">¡SUSCRITO!</p>
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className="relative">
                <input type="email" placeholder="Tu e-mail..." className="w-full bg-white/5 rounded-xl px-4 py-3 pr-12 text-xs font-bold text-white placeholder-white/20 outline-none border border-white/10" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} required />
                <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#FF5100] text-white rounded-lg px-3 flex items-center justify-center"><Send size={14} /></button>
              </form>
            )}
          </div>
          <button onClick={() => { if (storeId) localStorage.removeItem(`carestino_ticket_${storeId}`); setMyTicket(null); }} className="text-slate-300 font-black uppercase italic tracking-widest text-[8px] hover:text-[#FF5100]">CANCELAR MI TURNO</button>
        </Card>
      )}
    </div>
  );
};
