
import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { STORES, TYPOGRAPHY, UI } from '../constants';
import { Card, Button, Input } from '../components/Button';
import { QueueEntry, StoreStats } from '../types';
import { 
  User, ChevronDown, Plus, UserCheck, Lock, LogOut, Trash2, 
  CheckCircle2, Clock, BarChart3, LayoutGrid, Users, Timer, 
  TrendingUp, X, UserPlus, Monitor 
} from 'lucide-react';

type AdminView = 'store' | 'dashboard';

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
      } else {
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
    window.open(`#/tv/${selectedStoreId}`, '_blank');
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto h-[70vh] flex flex-col justify-center px-4">
        <Card className="space-y-8 text-center animate-in fade-in zoom-in duration-500 rounded-[3rem]">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <h2 className={`${TYPOGRAPHY.heading} text-3xl text-slate-900`}>ACCESO ADMIN</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Ingresá la clave de seguridad</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password"
              placeholder="Clave" 
              className={`${UI.input} text-center tracking-[1em] text-2xl bg-slate-50 focus:bg-white`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <Button fullWidth variant="secondary" type="submit">
              ENTRAR
            </Button>
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
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 pb-20 px-4">
      {/* Header Admin */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3">
          <h1 className={`${TYPOGRAPHY.heading} text-4xl md:text-5xl text-white leading-none`}>PANEL DE CONTROL</h1>
          <div className="flex flex-wrap gap-2 md:gap-4">
            <button 
              onClick={() => setActiveView('store')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all ${activeView === 'store' ? 'bg-white text-[#FF5100]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <LayoutGrid size={16} /> GESTION TIENDA
            </button>
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all ${activeView === 'dashboard' ? 'bg-white text-[#FF5100]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <BarChart3 size={16} /> DASHBOARD GLOBAL
            </button>
          </div>
        </div>
        
        <div className="flex gap-4 self-end md:self-center">
          <button 
            onClick={openTvView}
            className="bg-white text-[#FF5100] rounded-2xl px-5 py-3 flex items-center gap-3 transition-all active:scale-95 shadow-lg font-black uppercase tracking-widest text-[10px]"
          >
            <Monitor size={18} />
            <span>Ver Pantalla TV</span>
          </button>
          
          <button 
            onClick={() => setIsAuthorized(false)}
            className="bg-slate-900/40 hover:bg-slate-900 text-white rounded-2xl px-5 py-3 flex items-center gap-3 transition-all active:scale-95 shadow-lg border border-white/10"
          >
            <LogOut size={18} />
            <span className="font-black uppercase tracking-widest text-[10px]">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {activeView === 'store' ? (
        <div className="grid lg:grid-cols-12 gap-6 md:gap-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            {/* Store Selector Responsive */}
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 flex items-center justify-between shadow-xl border border-slate-100">
               <div className="flex items-center gap-4 text-slate-400 w-full">
                 <div className="p-2 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl text-[#FF5100]">
                   <Users size={24} />
                 </div>
                 <div className="flex-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sucursal</p>
                   <select 
                     className="bg-transparent font-black uppercase italic tracking-widest outline-none text-slate-900 text-lg md:text-xl appearance-none w-full"
                     value={selectedStoreId}
                     onChange={(e) => setSelectedStoreId(e.target.value)}
                   >
                     {STORES.map(s => (
                       <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                     ))}
                   </select>
                 </div>
                 <ChevronDown className="text-slate-300" />
               </div>
            </div>

            {/* Calling Card Responsive */}
            <Card className="text-center flex flex-col items-center gap-6 md:gap-10 py-10 md:py-16 justify-center relative overflow-hidden min-h-[400px] md:min-h-[500px] rounded-[3rem]">
               <div className="absolute top-6 md:top-8 left-0 right-0">
                 <p className={`${TYPOGRAPHY.subheading} !text-slate-300 text-[9px]`}>ESTADO DE ATENCIÓN ACTUAL</p>
               </div>
               
               {currentCalled ? (
                  <div className="space-y-6 md:space-y-8 animate-in fade-in zoom-in duration-500 w-full px-6">
                     <div className="relative mx-auto w-fit">
                        <div className="w-28 h-28 md:w-40 md:h-40 bg-orange-50 rounded-full flex items-center justify-center text-[#FF5100] shadow-inner">
                           <UserCheck className="w-16 h-16 md:w-20 md:h-20" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                           <CheckCircle2 size={24} />
                        </div>
                     </div>
                     <div className="space-y-1">
                       <h2 className={`${TYPOGRAPHY.heading} text-6xl md:text-8xl text-slate-900 leading-none`}>#{currentCalled.number}</h2>
                       <p className="font-black italic uppercase text-[#FF5100] text-2xl md:text-3xl tracking-tight truncate max-w-full">
                         {currentCalled.client_name}
                       </p>
                     </div>
                     <button 
                        onClick={() => handleFinish(currentCalled.id)}
                        className="bg-green-500 hover:bg-green-600 text-white font-black italic uppercase tracking-widest px-8 py-4 rounded-2xl shadow-lg shadow-green-100 transition-all active:scale-95 text-sm"
                      >
                        FINALIZAR TURNO
                      </button>
                  </div>
               ) : (
                  <div className="space-y-6 md:space-y-8 opacity-40">
                     <div className="w-28 h-28 md:w-40 md:h-40 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto">
                        <UserCheck className="w-16 h-16 md:w-20 md:h-20" />
                     </div>
                     <h2 className={`${TYPOGRAPHY.heading} text-3xl md:text-4xl text-slate-300`}>NADIE SIENDO LLAMADO</h2>
                  </div>
               )}

               <div className="w-full max-w-sm pt-4 md:pt-8 px-6">
                  <Button 
                    fullWidth 
                    variant="primary"
                    onClick={handleCallNext} 
                    disabled={waitingList.length === 0}
                    className="!py-6 md:!py-8 !text-lg md:!text-2xl shadow-[#FF5100]/20"
                  >
                    LLAMAR SIGUIENTE
                  </Button>
               </div>
            </Card>
          </div>

          {/* List Section Responsive */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className={`${TYPOGRAPHY.heading} text-white text-xl md:text-2xl`}>Lista de Espera</h3>
              <button 
                onClick={() => setShowManualModal(true)}
                className="bg-slate-900 text-white p-3 md:p-4 rounded-2xl md:rounded-3xl flex items-center gap-2 md:gap-3 hover:scale-105 transition-all shadow-xl shadow-black/20"
              >
                <Plus size={18} className="text-[#FF5100]" />
                <span className="font-black italic uppercase tracking-widest text-[9px] md:text-[11px]">Cargar Manual</span>
              </button>
            </div>

            <div className="space-y-3 md:space-y-4 max-h-[500px] md:max-h-[700px] overflow-y-auto pr-1 scrollbar-hide">
              {waitingList.length > 0 ? (
                waitingList.map((entry, i) => (
                  <div 
                    key={entry.id} 
                    className="bg-white/95 backdrop-blur-md p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-between shadow-lg group hover:bg-white transition-all border border-white/20 animate-in slide-in-from-right duration-300"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-center gap-4 md:gap-5 min-w-0">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl text-[#FF5100] shadow-sm flex-shrink-0">
                        #{entry.number}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black italic uppercase text-slate-900 text-base md:text-lg tracking-tight leading-none truncate">
                          {entry.client_name}
                        </p>
                        <div className="flex items-center gap-2 text-slate-400 mt-1 md:mt-2">
                          <Clock size={12} />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => apiService.updateStatus(entry.id, 'cancelled')}
                      className="p-2 md:p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all flex-shrink-0"
                    >
                      <Trash2 size={20} md:size={24} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 md:py-24 bg-white/10 rounded-[3rem] md:rounded-[4rem] border-4 border-dashed border-white/20">
                  <p className="text-white font-black italic uppercase tracking-[0.3em] text-[10px] md:text-xs opacity-40">Sin turnos en espera</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* DASHBOARD GLOBAL */
        <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
          {/* Summary Cards Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 shadow-2xl border border-slate-100 flex items-center gap-5 md:gap-8">
               <div className="w-14 h-14 md:w-20 md:h-20 bg-green-50 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-green-500">
                  <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" />
               </div>
               <div>
                 <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Atendidos Hoy</p>
                 <h4 className="text-3xl md:text-5xl font-black text-slate-900 leading-none">{globalServed}</h4>
               </div>
            </div>
            <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 shadow-2xl border border-slate-100 flex items-center gap-5 md:gap-8">
               <div className="w-14 h-14 md:w-20 md:h-20 bg-blue-50 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-blue-500">
                  <Timer className="w-8 h-8 md:w-10 md:h-10" />
               </div>
               <div>
                 <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiempo Promedio</p>
                 <h4 className="text-3xl md:text-5xl font-black text-slate-900 leading-none">{globalAvg} <span className="text-lg md:text-xl text-slate-300">min</span></h4>
               </div>
            </div>
            <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 shadow-2xl border border-slate-100 flex items-center gap-5 md:gap-8">
               <div className="w-14 h-14 md:w-20 md:h-20 bg-orange-50 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-[#FF5100]">
                  <TrendingUp className="w-8 h-8 md:w-10 md:h-10" />
               </div>
               <div>
                 <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gente Esperando</p>
                 <h4 className="text-3xl md:text-5xl font-black text-slate-900 leading-none">{globalWaiting}</h4>
               </div>
            </div>
          </div>

          {/* Detailed Table Responsive */}
          <div className="bg-white rounded-[3rem] md:rounded-[4rem] p-6 md:p-12 shadow-2xl border border-slate-100 overflow-hidden">
             <div className="mb-6 md:mb-10 flex items-center justify-between">
               <h3 className={`${TYPOGRAPHY.heading} text-xl md:text-3xl text-slate-900`}>RENDIMIENTO POR TIENDA</h3>
               <div className="p-2 bg-slate-50 rounded-xl text-slate-400 md:hidden">
                 <BarChart3 size={20} />
               </div>
             </div>
             
             <div className="overflow-x-auto -mx-6 md:mx-0">
                <table className="w-full text-left border-separate border-spacing-x-4 md:border-spacing-x-0">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="pb-6 px-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Sucursal</th>
                      <th className="pb-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Atendidos</th>
                      <th className="pb-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">En Fila</th>
                      <th className="pb-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">T. Promedio</th>
                      <th className="pb-6 px-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.map((s) => (
                      <tr key={s.storeId} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-6 px-4">
                           <p className="font-black italic uppercase text-slate-900 tracking-tight text-sm md:text-base">{s.storeName}</p>
                           <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">#{s.storeId.slice(0, 5)}</p>
                        </td>
                        <td className="py-6 text-center">
                          <span className="inline-block px-3 py-1 md:px-4 md:py-2 bg-green-50 text-green-600 rounded-xl font-black text-xs md:text-sm">
                            {s.servedToday}
                          </span>
                        </td>
                        <td className="py-6 text-center">
                           <span className="inline-block px-3 py-1 md:px-4 md:py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-xs md:text-sm">
                            {s.peopleWaiting}
                          </span>
                        </td>
                        <td className="py-6 text-center">
                          <p className="font-black text-slate-900 text-sm md:text-base">{s.avgWaitTime} <span className="text-[10px] text-slate-300">min</span></p>
                        </td>
                        <td className="py-6 px-4 text-right">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${s.peopleWaiting > 10 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${s.peopleWaiting > 10 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                              {s.peopleWaiting > 10 ? 'Saturada' : 'Normal'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <Card className="w-full max-w-md relative p-8 md:p-10 space-y-8 animate-in zoom-in-95 duration-300 rounded-[3rem]">
              <button 
                onClick={() => setShowManualModal(false)}
                className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-[#FF5100]">
                    <UserPlus size={32} />
                 </div>
                 <h3 className={`${TYPOGRAPHY.heading} text-3xl text-slate-900`}>CARGA MANUAL</h3>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Ingresá el nombre del cliente</p>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                 <Input 
                   placeholder="Nombre y Apellido"
                   value={manualName}
                   onChange={(e) => setManualName(e.target.value)}
                   autoFocus
                   required
                   className="!py-5 !text-lg !px-8 bg-slate-50 focus:bg-white"
                 />
                 <div className="pt-2">
                    <Button 
                      fullWidth 
                      variant="primary" 
                      type="submit" 
                      disabled={loading}
                      className="!py-5"
                    >
                      {loading ? "CARGANDO..." : "AGREGAR A FILA"}
                    </Button>
                 </div>
              </form>
           </Card>
        </div>
      )}
    </div>
  );
};
