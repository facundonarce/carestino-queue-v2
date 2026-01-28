
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { STORES, TYPOGRAPHY, UI } from '../constants';
import { Card, Button, Input } from '../components/Button';
import { QueueEntry, StoreStats } from '../types';
import { 
  User, ChevronDown, Plus, UserCheck, Lock, LogOut, Trash2, 
  CheckCircle2, Clock, BarChart3, LayoutGrid, Users, Timer, 
  TrendingUp, X, UserPlus, Monitor, Settings, Image as ImageIcon,
  Save, RefreshCw, Upload, Loader2
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Carga inicial sincronizada desde DB
    apiService.getGlobalSettings().then(settings => {
      if (settings.logo) setCustomLogo(settings.logo);
    });
  }, []);

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
        const cleanup = apiService.subscribeToStoreChanges(selectedStoreId, () => fetchQueue());
        return cleanup;
      } else if (activeView === 'dashboard') {
        fetchStats();
      }
    }
  }, [selectedStoreId, fetchQueue, fetchStats, isAuthorized, activeView]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '2410') setIsAuthorized(true);
    else { alert('Contraseña incorrecta'); setPassword(''); }
  };

  const handleSaveSettings = async () => {
    if (!customLogo) return;
    setLoading(true);
    try {
      await apiService.updateGlobalSettings(customLogo);
      alert('Logo actualizado y sincronizado en la nube');
    } catch (e) {
      alert('Error al guardar. Intenta con una imagen más pequeña.');
    } finally {
      setLoading(false);
    }
  };

  // Función para redimensionar la imagen antes de subirla
  const resizeImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', 0.8)); // WebP para máximo ahorro de espacio
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

  const handleCallNext = async () => {
    try { await apiService.callNext(selectedStoreId); fetchQueue(); } catch (e) { alert("Error al llamar"); }
  };

  const handleFinish = async (id: string) => {
    try { await apiService.updateStatus(id, 'finished'); fetchQueue(); } catch (e) { alert("Error al finalizar"); }
  };

  const openTvView = () => window.open(`/tv/${selectedStoreId}`, '_blank');

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto h-[70vh] flex flex-col justify-center px-4">
        <Card className="space-y-8 text-center animate-in fade-in zoom-in duration-500 rounded-[3rem]">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400"><Lock size={32} /></div>
          <div className="space-y-2">
            <h2 className={`${TYPOGRAPHY.heading} text-2xl text-slate-900`}>ACCESO ADMIN</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Ingresá la clave de seguridad</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="Clave" className={`${UI.input} text-center tracking-[1em] text-2xl bg-slate-50`} value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            <Button fullWidth variant="secondary" type="submit">ENTRAR</Button>
          </form>
        </Card>
      </div>
    );
  }

  const currentCalled = queue.find(q => q.status === 'called');
  const waitingList = queue.filter(q => q.status === 'waiting');

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 pb-20 px-2">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3">
          <h1 className={`${TYPOGRAPHY.heading} text-3xl md:text-5xl text-white leading-none`}>PANEL DE CONTROL</h1>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveView('store')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${activeView === 'store' ? 'bg-white text-[#FF5100]' : 'bg-white/10 text-white hover:bg-white/20'}`}><LayoutGrid size={14} /> GESTIÓN</button>
            <button onClick={() => setActiveView('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${activeView === 'dashboard' ? 'bg-white text-[#FF5100]' : 'bg-white/10 text-white hover:bg-white/20'}`}><BarChart3 size={14} /> DASHBOARD</button>
            <button onClick={() => setActiveView('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${activeView === 'settings' ? 'bg-white text-[#FF5100]' : 'bg-white/10 text-white hover:bg-white/20'}`}><Settings size={14} /> CONFIG</button>
          </div>
        </div>
        <div className="flex gap-2 self-end md:self-center">
          <button onClick={openTvView} className="bg-white text-[#FF5100] rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg font-black uppercase tracking-widest text-[9px]"><Monitor size={16} /> TV</button>
          <button onClick={() => setIsAuthorized(false)} className="bg-slate-900/40 text-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg font-black uppercase tracking-widest text-[9px]"><LogOut size={16} /> SALIR</button>
        </div>
      </header>

      {activeView === 'store' && (
        <div className="grid lg:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2rem] p-4 flex items-center justify-between shadow-xl border border-slate-100">
               <div className="flex items-center gap-4 text-slate-400 w-full">
                 <div className="p-3 bg-slate-50 rounded-2xl text-[#FF5100]"><Users size={20} /></div>
                 <div className="flex-1">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Sucursal</p>
                   <select className="bg-transparent font-black uppercase italic tracking-widest outline-none text-slate-900 text-base md:text-xl appearance-none w-full cursor-pointer" value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)}>
                     {STORES.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                   </select>
                 </div>
                 <ChevronDown size={18} className="text-slate-300" />
               </div>
            </div>
            <Card className="text-center flex flex-col items-center gap-8 py-12 min-h-[400px] rounded-[3rem]">
               {currentCalled ? (
                  <div className="space-y-6 animate-in fade-in zoom-in duration-500 w-full px-6">
                     <div className="relative mx-auto w-fit">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-orange-50 rounded-full flex items-center justify-center text-[#FF5100]"><UserCheck size={48} md:size={64} /></div>
                        <div className="absolute bottom-0 right-0 bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg"><CheckCircle2 size={20} /></div>
                     </div>
                     <div className="space-y-1">
                       <h2 className={`${TYPOGRAPHY.heading} text-6xl md:text-8xl text-slate-900 leading-none`}>#{currentCalled.number}</h2>
                       <p className="font-black italic uppercase text-[#FF5100] text-xl md:text-3xl tracking-tight truncate max-w-full">{currentCalled.client_name}</p>
                     </div>
                     <button onClick={() => handleFinish(currentCalled.id)} className="bg-green-500 text-white font-black italic uppercase tracking-widest px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95 text-xs">FINALIZAR TURNO</button>
                  </div>
               ) : (
                  <div className="space-y-6 opacity-30">
                     <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto"><UserCheck size={48} /></div>
                     <h2 className={`${TYPOGRAPHY.heading} text-2xl text-slate-300`}>SIN ATENCIÓN ACTUAL</h2>
                  </div>
               )}
               <div className="w-full max-w-sm pt-4 px-6">
                  <Button fullWidth variant="primary" onClick={handleCallNext} disabled={waitingList.length === 0} className="!py-6 !text-lg">LLAMAR SIGUIENTE</Button>
               </div>
            </Card>
          </div>
          <div className="lg:col-span-4 space-y-4">
            <h3 className={`${TYPOGRAPHY.heading} text-white text-xl px-2`}>En Espera ({waitingList.length})</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {waitingList.map((entry) => (
                <div key={entry.id} className="bg-white/95 backdrop-blur-md p-4 rounded-[2rem] flex items-center justify-between shadow-lg border border-white/20 animate-in slide-in-from-right">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-black text-xl text-[#FF5100]">#{entry.number}</div>
                    <div className="min-w-0">
                      <p className="font-black italic uppercase text-slate-900 text-sm tracking-tight truncate">{entry.client_name}</p>
                      <div className="flex items-center gap-1 text-slate-400 mt-1"><Clock size={10} /><span className="text-[8px] font-black uppercase tracking-widest">{new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                    </div>
                  </div>
                  <button onClick={() => apiService.updateStatus(entry.id, 'cancelled')} className="p-2 text-slate-200 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'settings' && (
        <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4">
          <Card className="p-10 space-y-10 rounded-[3rem]">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[#FF5100]"><Settings size={32} /></div>
               <div><h3 className={`${TYPOGRAPHY.heading} text-2xl text-slate-900 leading-none`}>SINCRONIZACIÓN DE MARCA</h3><p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1">Este logo optimizado se sincronizará en todos los dispositivos</p></div>
            </div>
            <div className="space-y-8">
               <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Upload size={14} /> CARGAR LOGO (PC/MOVIL)</label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-[#FF5100] hover:bg-orange-50 transition-all group">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-[#FF5100] shadow-sm"><Upload size={24} /></div>
                      <span className="font-black italic uppercase tracking-widest text-[10px] text-slate-400 group-hover:text-[#FF5100]">ELEGIR ARCHIVO</span>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </button>
                    <div className="p-6 bg-slate-50 rounded-[2rem] flex flex-col items-center gap-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">VISTA PREVIA</p>
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden border-2 border-white">
                        {customLogo ? <img src={customLogo} alt="Preview" className="w-full h-full object-contain" /> : <ImageIcon size={24} className="text-slate-200" />}
                      </div>
                    </div>
                 </div>
               </div>
               <div className="flex gap-4">
                 <Button fullWidth onClick={handleSaveSettings} disabled={loading} className="!py-5 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> GUARDAR LOGO NUBE</>}
                 </Button>
                 <button onClick={() => { setCustomLogo(''); localStorage.removeItem('carestino_custom_logo'); }} className="px-6 py-5 bg-slate-100 text-slate-400 rounded-3xl hover:bg-slate-200"><RefreshCw size={20} /></button>
               </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
