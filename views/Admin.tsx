
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { STORES, TYPOGRAPHY, UI } from '../constants';
import { Card, Button, Input } from '../components/Button';
import { QueueEntry, StoreStats } from '../types';
import { 
  User, ChevronDown, Plus, UserCheck, Lock, LogOut, Trash2, 
  CheckCircle2, Clock, BarChart3, LayoutGrid, Users, Timer, 
  TrendingUp, Settings, Image as ImageIcon, Save, RefreshCw, 
  Upload, Loader2, Monitor, Activity, Hash, Coffee
} from 'lucide-react';

type AdminView = 'store' | 'dashboard' | 'settings';

export const Admin: React.FC = () => {
  const { storeId: paramStoreId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  
  // Auth & Navigation
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeView, setActiveView] = useState<AdminView>(paramStoreId ? 'store' : 'dashboard');
  
  // Data
  const [selectedStoreId, setSelectedStoreId] = useState(paramStoreId || STORES[0].id);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<StoreStats[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Settings
  const [customLogo, setCustomLogo] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGlobalAdmin = !paramStoreId;
  const currentStore = STORES.find(s => s.id === selectedStoreId);

  useEffect(() => {
    if (paramStoreId) {
      setSelectedStoreId(paramStoreId);
      setActiveView('store');
    }
  }, [paramStoreId]);

  useEffect(() => {
    apiService.getGlobalSettings().then(s => setCustomLogo(s.logo || ''));
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const data = await apiService.getQueueByStore(selectedStoreId);
      setQueue(data);
    } catch (e) { console.error(e); }
  }, [selectedStoreId]);

  const fetchStats = useCallback(async () => {
    if (!isGlobalAdmin && activeView !== 'dashboard') return;
    try {
      const data = await apiService.getAllStats();
      setStats(data);
    } catch (e) { console.error(e); }
  }, [isGlobalAdmin, activeView]);

  useEffect(() => {
    if (isAuthorized) {
      if (activeView === 'store') {
        fetchQueue();
        return apiService.subscribeToStoreChanges(selectedStoreId, fetchQueue);
      } else if (activeView === 'dashboard') {
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
      }
    }
  }, [selectedStoreId, fetchQueue, fetchStats, isAuthorized, activeView]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '2410') setIsAuthorized(true);
    else { alert('Clave incorrecta'); setPassword(''); }
  };

  const handleCallNext = async () => {
    setLoading(true);
    await apiService.callNext(selectedStoreId);
    await fetchQueue();
    setLoading(false);
  };

  const handleFinish = async (id: string) => {
    await apiService.updateStatus(id, 'finished');
    fetchQueue();
  };

  const resizeImage = (base64Str: string): Promise<string> => {
    return new Promise((res) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 400;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
        else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        res(canvas.toDataURL('image/webp', 0.8));
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const resized = await resizeImage(reader.result as string);
        setCustomLogo(resized);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLogo = async () => {
    setLoading(true);
    try {
      await apiService.updateGlobalSettings(customLogo);
      alert('Sincronización exitosa');
    } catch (e) { alert('Error al guardar logo'); }
    setLoading(false);
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto h-[70vh] flex flex-col justify-center px-4">
        <Card className="space-y-8 text-center rounded-[3rem] animate-in zoom-in">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400"><Lock size={32} /></div>
          <div className="space-y-2">
            <h2 className={`${TYPOGRAPHY.heading} text-2xl text-slate-900`}>{paramStoreId ? `ADMIN ${paramStoreId.toUpperCase()}` : 'GLOBAL ADMIN'}</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Ingresá la clave de seguridad</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="••••" className={`${UI.input} text-center tracking-[1em] text-2xl bg-slate-50`} value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            <Button fullWidth variant="secondary" type="submit">ACCEDER</Button>
          </form>
        </Card>
      </div>
    );
  }

  const waitingList = queue.filter(q => q.status === 'waiting');
  const currentCalled = queue.find(q => q.status === 'called');

  // Stats Globales
  const totalTurns = stats.reduce((acc, s) => acc + s.totalEntries, 0);
  const totalWaiting = stats.reduce((acc, s) => acc + s.peopleWaiting, 0);
  const totalBeingServed = stats.reduce((acc, s) => acc + (s as any).beingServed || 0, 0);
  const avgSystemWait = stats.length > 0 ? (stats.reduce((acc, s) => acc + parseFloat(s.avgWaitTime), 0) / stats.length).toFixed(1) : "0";

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 pb-20 px-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h1 className={`${TYPOGRAPHY.heading} text-3xl md:text-5xl text-white`}>
            {isGlobalAdmin ? 'CENTRAL DE CONTROL' : `ADMIN: ${currentStore?.name.toUpperCase()}`}
          </h1>
          <div className="flex flex-wrap gap-2">
            {isGlobalAdmin && (
              <button onClick={() => setActiveView('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${activeView === 'dashboard' ? 'bg-white text-[#FF5100]' : 'bg-white/10 text-white hover:bg-white/20'}`}><BarChart3 size={14} /> Dashboard</button>
            )}
            <button onClick={() => setActiveView('store')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${activeView === 'store' ? 'bg-white text-[#FF5100]' : 'bg-white/10 text-white hover:bg-white/20'}`}><LayoutGrid size={14} /> Gestión</button>
            {isGlobalAdmin && (
              <button onClick={() => setActiveView('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${activeView === 'settings' ? 'bg-white text-[#FF5100]' : 'bg-white/10 text-white hover:bg-white/20'}`}><Settings size={14} /> Config</button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.open(`/tv/${selectedStoreId}`, '_blank')} className="bg-white text-[#FF5100] rounded-xl px-4 py-2 flex items-center gap-2 font-black uppercase tracking-widest text-[9px] shadow-xl"><Monitor size={14} /> Vista TV</button>
          <button onClick={() => setIsAuthorized(false)} className="bg-slate-900/40 text-white rounded-xl px-4 py-2 flex items-center gap-2 font-black uppercase tracking-widest text-[9px]"><LogOut size={14} /> Salir</button>
        </div>
      </header>

      {activeView === 'dashboard' && isGlobalAdmin && (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <MetricCard icon={<Hash />} label="Turnos Hoy" value={totalTurns} color="blue" />
            <MetricCard icon={<Activity />} label="Atendiéndose" value={totalBeingServed} color="green" />
            <MetricCard icon={<Timer />} label="Espera Prom." value={`${avgSystemWait} min`} color="orange" />
            <MetricCard icon={<Users />} label="En Espera" value={totalWaiting} color="slate" />
          </div>

          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl overflow-hidden">
             <h3 className={`${TYPOGRAPHY.heading} text-2xl text-slate-900 mb-8`}>DESEMPEÑO POR TIENDA</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 font-black uppercase tracking-widest text-[10px] border-b border-slate-50">
                      <th className="pb-4">Sucursal</th>
                      <th className="pb-4">Atendidos</th>
                      <th className="pb-4">Espera Avg.</th>
                      <th className="pb-4">En Fila</th>
                      <th className="pb-4">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.map(s => (
                      <tr key={s.storeId} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-5 font-black text-slate-900 text-sm uppercase italic">{s.storeName}</td>
                        <td className="py-5 text-slate-600 font-bold">{s.servedToday}</td>
                        <td className="py-5 text-slate-600 font-bold">{s.avgWaitTime}m</td>
                        <td className="py-5"><span className="bg-orange-100 text-[#FF5100] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">{s.peopleWaiting} ESPERANDO</span></td>
                        <td className="py-5"><button onClick={() => { setSelectedStoreId(s.storeId); setActiveView('store'); }} className="text-[10px] font-black uppercase text-slate-300 group-hover:text-[#FF5100] transition-colors">GESTIONAR →</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {activeView === 'store' && (
        <div className="grid lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-6">
           <div className="lg:col-span-8 space-y-6">
              {isGlobalAdmin && (
                <div className="bg-white rounded-3xl p-5 flex items-center gap-4 shadow-xl">
                  <div className="p-3 bg-slate-50 rounded-2xl text-[#FF5100]"><LayoutGrid size={20} /></div>
                  <select className="flex-1 bg-transparent font-black uppercase italic tracking-widest text-lg outline-none cursor-pointer" value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)}>
                    {STORES.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                  </select>
                </div>
              )}
              
              <Card className="text-center py-16 px-8 min-h-[500px] flex flex-col justify-between items-center rounded-[4rem]">
                {currentCalled ? (
                   <div className="w-full space-y-8 animate-in zoom-in">
                      <div className="bg-orange-50 w-48 h-48 rounded-full flex items-center justify-center mx-auto text-[#FF5100] shadow-inner"><UserCheck size={80} /></div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">TURNO ACTUAL EN MOSTRADOR</p>
                        <h2 className={`${TYPOGRAPHY.heading} text-[8rem] leading-none text-slate-900`}>#{currentCalled.number}</h2>
                        <p className="text-3xl font-black italic uppercase text-[#FF5100] truncate px-10">{currentCalled.client_name}</p>
                      </div>
                      <Button variant="secondary" onClick={() => handleFinish(currentCalled.id)} className="!px-12 !py-6 !text-xs !rounded-2xl bg-green-600 hover:bg-green-700">FINALIZAR TURNO</Button>
                   </div>
                ) : (
                  <div className="my-auto space-y-6 opacity-20">
                    <Coffee size={100} className="mx-auto text-slate-400" />
                    <h2 className={`${TYPOGRAPHY.heading} text-3xl text-slate-900`}>MOSTRADOR LIBRE</h2>
                  </div>
                )}
                <div className="w-full max-w-md pt-10">
                   <Button fullWidth disabled={loading || waitingList.length === 0} onClick={handleCallNext} className="!py-7 !text-xl !rounded-[2rem]">
                      {loading ? <Loader2 className="animate-spin mx-auto" /> : `LLAMAR SIGUIENTE (${waitingList.length})`}
                   </Button>
                </div>
              </Card>
           </div>

           <div className="lg:col-span-4 space-y-6">
              <h3 className={`${TYPOGRAPHY.heading} text-white text-xl flex items-center gap-3`}><Clock /> EN FILA</h3>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {waitingList.map((entry, idx) => (
                  <div key={entry.id} className="bg-white rounded-[2rem] p-6 flex items-center justify-between shadow-xl animate-in slide-in-from-right" style={{animationDelay: `${idx * 50}ms`}}>
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl font-black text-[#FF5100]">#{entry.number}</div>
                      <div>
                        <p className="font-black italic uppercase text-slate-900 truncate max-w-[150px]">{entry.client_name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(entry.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                    <button onClick={() => apiService.updateStatus(entry.id, 'cancelled')} className="p-3 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                  </div>
                ))}
                {waitingList.length === 0 && <p className="text-white/30 text-center font-black italic uppercase tracking-widest py-10">Sin nadie en espera</p>}
              </div>
           </div>
        </div>
      )}

      {activeView === 'settings' && isGlobalAdmin && (
        <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-6">
           <Card className="p-10 space-y-10 rounded-[3rem]">
              <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                 <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-[#FF5100]"><ImageIcon size={32} /></div>
                 <div>
                    <h3 className={`${TYPOGRAPHY.heading} text-2xl text-slate-900 leading-none`}>CONFIGURACIÓN VISUAL</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1">Personaliza el logo que verán tus clientes</p>
                 </div>
              </div>
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CARGAR LOGO</label>
                      <button onClick={() => fileInputRef.current?.click()} className="w-full aspect-square border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:border-[#FF5100] hover:bg-orange-50 transition-all group">
                         <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-[#FF5100]"><Upload size={28} /></div>
                         <span className="font-black italic uppercase text-[9px] text-slate-400">SELECCIONAR</span>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </button>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">VISTA PREVIA</label>
                      <div className="w-full aspect-square bg-slate-50 rounded-[2.5rem] flex items-center justify-center p-8 overflow-hidden">
                         {customLogo ? <img src={customLogo} alt="Preview" className="max-w-full max-h-full object-contain" /> : <ImageIcon size={48} className="text-slate-100" />}
                      </div>
                   </div>
                </div>
                <div className="flex gap-4">
                  <Button fullWidth onClick={handleSaveLogo} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} className="inline mr-2" /> GUARDAR EN NUBE</>}
                  </Button>
                  <button onClick={() => setCustomLogo('')} className="px-8 py-5 bg-slate-100 text-slate-400 rounded-3xl hover:bg-slate-200 transition-colors"><RefreshCw size={20} /></button>
                </div>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number, color: 'blue' | 'green' | 'orange' | 'slate' }> = ({ icon, label, value, color }) => {
  const colors = {
    blue: "text-blue-500 bg-blue-50",
    green: "text-green-500 bg-green-50",
    orange: "text-orange-500 bg-orange-50",
    slate: "text-slate-500 bg-slate-50",
  };
  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col items-center text-center space-y-4">
       <div className={`p-4 rounded-2xl ${colors[color]}`}>{icon}</div>
       <div>
         <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
         <h4 className="text-3xl font-black italic text-slate-900 tracking-tighter">{value}</h4>
       </div>
    </div>
  );
};
