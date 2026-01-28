
import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { STORES, TYPOGRAPHY, UI } from '../constants';
import { Card, Button, Input } from '../components/Button';
import { QueueEntry, StoreStats } from '../types';
import { 
  User, ChevronDown, Plus, UserCheck, Lock, LogOut, Trash2, 
  CheckCircle2, Clock, BarChart3, LayoutGrid, Users, Timer, 
  TrendingUp, X, UserPlus, Monitor, Settings, Image as ImageIcon,
  Save, RefreshCw
} from 'lucide-react';

type AdminView = 'store' | 'dashboard' | 'settings';

export const Admin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeView, setActiveView] = useState<AdminView>('store');
  const [selectedStoreId, setSelectedStoreId] = useState(STORES[0].id);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<StoreStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  
  // Settings state
  const [customLogo, setCustomLogo] = useState(localStorage.getItem('carestino_custom_logo') || '');

  const selectedStore = STORES.find(s => s.id === selectedStoreId);

  const fetchQueue = useCallback(async () => {
    try {
      const data = await apiService.getQueueByStore(selectedStoreId);
      setQueue(data);
    } catch (e) {
      console.error(e);
    }
  }, [selectedStoreId]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiService.getAllStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      if (activeView === 'store') {
        fetchQueue();
        const cleanup = apiService.subscribeToStoreChanges(selectedStoreId, () => {
          fetchQueue();
        });
        return cleanup;
      } else if (activeView === 'dashboard') {
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
      }
    }
  }, [selectedStoreId, fetchQueue, fetchStats, isAuthorized, activeView]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '2410') {
      setIsAuthorized(true);
    } else {
      alert('Contraseña incorrecta');
      setPassword('');
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('carestino_custom_logo', customLogo);
    window.dispatchEvent(new Event('storage'));
    alert('Configuración guardada correctamente');
  };

  const handleCallNext = async () => {
    try {
      await apiService.callNext(selectedStoreId);
      fetchQueue();
    } catch (e) {
      alert("Error al llamar siguiente");
    }
  };

  const handleFinish = async (id: string) => {
    try {
      await apiService.updateStatus(id, 'finished');
      fetchQueue();
    } catch (e) {
      alert("Error al finalizar turno");
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    setLoading(true);
    try {
      await apiService.addQueueEntry(selectedStoreId, manualName);
      fetchQueue();
      setManualName('');
      setShowManualModal(false);
    } catch (e) {
      alert("Error al agregar manual");
    } finally {
      setLoading(false);
    }
  };

  const openTvView = () => {
    window.open(`/tv/${selectedStoreId}`, '_blank');
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto h-[70vh] flex flex-col justify-center px-4">
        <Card className="space-y-8 text-center animate-in fade-in zoom-in duration-500 rounded-[3rem]">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <h2 className={`${TYPOGRAPHY.heading} text-2xl text-slate-900`}>ACCESO ADMIN</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Ingresá la clave de seguridad</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password"
              placeholder="Clave" 
              className={`${UI.input} text-center tracking-[1em] text-2xl bg-slate-50 focus:bg-white !py-5`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <Button fullWidth variant="secondary" type="submit">ENTRAR</Button>
          </form>
        </Card>
      </div>
    );
  }

  const currentCalled = queue.find(q => q.status === 'called');
  const waitingList = queue.filter(q => q.status === 'waiting');

  const globalServed = stats.reduce((acc, s) => acc + s.servedToday, 0);
  const globalWaiting = stats.reduce((acc, s) => acc + s.peopleWaiting, 0);
  const globalAvg = stats.length > 0 ? (stats.reduce((acc, s) => acc + parseFloat(s.avgWaitTime), 0) / stats.length).toFixed(1) : "0";

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 pb-20 px-2">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3">
          <h1 className={`${TYPOGRAPHY.heading} text-3xl md:text-5xl text-white leading-none`}>PANEL DE CONTROL</h1>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setActiveView('store')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${activeView === 'store' ? 'bg-white text-[#FF5100]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <LayoutGrid size={14} /> GESTION
            </button>
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${activeView === 'dashboard' ? 'bg-white text-[#FF5100]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <BarChart3 size={14} /> DASHBOARD
            </button>
            <button 
              onClick={() => setActiveView('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${activeView === 'settings' ? 'bg-white text-[#FF5100]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <Settings size={14} /> CONFIG
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 self-end md:self-center">
          <button onClick={openTvView} className="bg-white text-[#FF5100] rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg font-black uppercase tracking-widest text-[9px]">
            <Monitor size={16} /> TV
          </button>
          <button onClick={() => setIsAuthorized(false)} className="bg-slate-900/40 text-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg font-black uppercase tracking-widest text-[9px]">
            <LogOut size={16} /> SALIR
          </button>
        </div>
      </header>

      {activeView === 'store' && (
        <div className="grid lg:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2rem] p-4 flex items-center justify-between shadow-xl border border-slate-100">
               <div className="flex items-center gap-4 text-slate-400 w-full">
                 <div className="p-3 bg-slate-50 rounded-2xl text-[#FF5100]">
                   <Users size={20} />
                 </div>
                 <div className="flex-1">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Sucursal</p>
                   <select 
                     className="bg-transparent font-black uppercase italic tracking-widest outline-none text-slate-900 text-base md:text-xl appearance-none w-full cursor-pointer"
                     value={selectedStoreId}
                     onChange={(e) => setSelectedStoreId(e.target.value)}
                   >
                     {STORES.map(s => (
                       <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                     ))}
                   </select>
                 </div>
                 <ChevronDown size={18} className="text-slate-300" />
               </div>
            </div>

            <Card className="text-center flex flex-col items-center gap-8 py-12 min-h-[400px] rounded-[3rem]">
               {currentCalled ? (
                  <div className="space-y-6 animate-in fade-in zoom-in duration-500 w-full px-6">
                     <div className="relative mx-auto w-fit">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-orange-50 rounded-full flex items-center justify-center text-[#FF5100]">
                           <UserCheck size={48} md:size={64} />
                        </div>
                        <div className="absolute bottom-0 right-0 bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                           <CheckCircle2 size={20} />
                        </div>
                     </div>
                     <div className="space-y-1">
                       <h2 className={`${TYPOGRAPHY.heading} text-6xl md:text-8xl text-slate-900 leading-none`}>#{currentCalled.number}</h2>
                       <p className="font-black italic uppercase text-[#FF5100] text-xl md:text-3xl tracking-tight truncate max-w-full">
                         {currentCalled.client_name}
                       </p>
                     </div>
                     <button onClick={() => handleFinish(currentCalled.id)} className="bg-green-500 text-white font-black italic uppercase tracking-widest px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95 text-xs">
                        FINALIZAR TURNO
                      </button>
                  </div>
               ) : (
                  <div className="space-y-6 opacity-30">
                     <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto">
                        <UserCheck size={48} />
                     </div>
                     <h2 className={`${TYPOGRAPHY.heading} text-2xl text-slate-300`}>SIN ATENCIÓN ACTUAL</h2>
                  </div>
               )}
               <div className="w-full max-w-sm pt-4 px-6">
                  <Button fullWidth variant="primary" onClick={handleCallNext} disabled={waitingList.length === 0} className="!py-6 !text-lg">
                    LLAMAR SIGUIENTE
                  </Button>
               </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className={`${TYPOGRAPHY.heading} text-white text-xl`}>En Espera</h3>
              <button onClick={() => setShowManualModal(true)} className="bg-slate-900 text-white p-3 rounded-2xl flex items-center gap-2 hover:scale-105 shadow-xl">
                <Plus size={16} className="text-[#FF5100]" />
                <span className="font-black italic uppercase tracking-widest text-[9px]">Cargar Manual</span>
              </button>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {waitingList.map((entry, i) => (
                <div key={entry.id} className="bg-white/95 backdrop-blur-md p-4 rounded-[2rem] flex items-center justify-between shadow-lg border border-white/20 animate-in slide-in-from-right duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-black text-xl text-[#FF5100] shadow-sm flex-shrink-0">
                      #{entry.number}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black italic uppercase text-slate-900 text-sm tracking-tight leading-none truncate">{entry.client_name}</p>
                      <div className="flex items-center gap-1 text-slate-400 mt-1">
                        <Clock size={10} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => apiService.updateStatus(entry.id, 'cancelled')} className="p-2 text-slate-200 hover:text-red-500 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 flex items-center gap-6">
               <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-500">
                  <CheckCircle2 size={32} />
               </div>
               <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Atendidos</p>
                 <h4 className="text-3xl font-black text-slate-900">{globalServed}</h4>
               </div>
            </div>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 flex items-center gap-6">
               <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                  <Timer size={32} />
               </div>
               <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">T. Promedio</p>
                 <h4 className="text-3xl font-black text-slate-900">{globalAvg} <span className="text-sm text-slate-300">min</span></h4>
               </div>
            </div>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 flex items-center gap-6">
               <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-[#FF5100]">
                  <TrendingUp size={32} />
               </div>
               <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">En Fila</p>
                 <h4 className="text-3xl font-black text-slate-900">{globalWaiting}</h4>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'settings' && (
        <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
          <Card className="p-10 space-y-10 rounded-[3rem]">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[#FF5100]">
                  <Settings size={32} />
               </div>
               <div>
                 <h3 className={`${TYPOGRAPHY.heading} text-2xl text-slate-900 leading-none`}>CONFIGURACIÓN DE MARCA</h3>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1">Personaliza el logo de la aplicación</p>
               </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <ImageIcon size={14} /> URL DEL LOGO
                 </label>
                 <Input 
                   placeholder="https://tu-sitio.com/logo.png"
                   value={customLogo}
                   onChange={(e) => setCustomLogo(e.target.value)}
                   className="!py-4 !text-sm"
                 />
                 <p className="text-[9px] text-slate-400 italic">Este logo aparecerá en el encabezado y en el ticket de los clientes.</p>
               </div>

               <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Vista Previa</p>
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden border-4 border-white">
                    {customLogo ? (
                      <img src={customLogo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={32} className="text-slate-200" />
                    )}
                  </div>
               </div>

               <div className="flex gap-4">
                 <Button fullWidth onClick={handleSaveSettings} className="!py-5 flex items-center justify-center gap-2">
                    <Save size={18} /> GUARDAR CAMBIOS
                 </Button>
                 <button 
                   onClick={() => { setCustomLogo(''); localStorage.removeItem('carestino_custom_logo'); window.dispatchEvent(new Event('storage')); }}
                   className="px-6 py-5 bg-slate-100 text-slate-400 rounded-3xl hover:bg-slate-200 transition-colors"
                   title="Restablecer"
                 >
                    <RefreshCw size={20} />
                 </button>
               </div>
            </div>
          </Card>
        </div>
      )}

      {showManualModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <Card className="w-full max-w-md relative p-8 space-y-8 animate-in zoom-in-95 duration-300 rounded-[3rem]">
              <button onClick={() => setShowManualModal(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-[#FF5100]"><UserPlus size={32} /></div>
                 <h3 className={`${TYPOGRAPHY.heading} text-3xl text-slate-900`}>CARGA MANUAL</h3>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Ingresá el nombre del cliente</p>
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                 <Input placeholder="Nombre y Apellido" value={manualName} onChange={(e) => setManualName(e.target.value)} autoFocus required className="!py-5 bg-slate-50 focus:bg-white" />
                 <Button fullWidth variant="primary" type="submit" disabled={loading} className="!py-5">AGREGAR A FILA</Button>
              </form>
           </Card>
        </div>
      )}
    </div>
  );
};
