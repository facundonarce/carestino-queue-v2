
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QueueEntry, QueueStatus, StoreStats } from '../types';
import { STORES } from '../constants';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;
  
  const url = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://vymftuaidjmkhtsncspb.supabase.co';
  const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bWZ0dWFpZGpta2h0c25jc3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTMyMzgsImV4cCI6MjA4NTE4OTIzOH0.p99yMFtBUrC7MpBwYobnnagV9O8MIZw8zc-KmoxpePQ';
  
  if (!url || !key) return null;
  
  try {
    supabaseInstance = createClient(url, key);
    return supabaseInstance;
  } catch (e) {
    console.error("Supabase connection error:", e);
    return null;
  }
};

const mockDb = {
  getEntries(storeId: string): QueueEntry[] {
    const saved = localStorage.getItem(`mock_queue_${storeId}`);
    return saved ? JSON.parse(saved) : [];
  },
  saveEntries(storeId: string, entries: QueueEntry[]) {
    localStorage.setItem(`mock_queue_${storeId}`, JSON.stringify(entries));
  }
};

export const apiService = {
  // Configuración Global (Logo, etc)
  async getGlobalSettings(): Promise<{ logo: string | null }> {
    const sb = getSupabase();
    if (!sb) return { logo: localStorage.getItem('carestino_custom_logo') };
    
    const { data, error } = await sb
      .from('app_settings')
      .select('value')
      .eq('key', 'custom_logo')
      .maybeSingle();
    
    if (error || !data) return { logo: localStorage.getItem('carestino_custom_logo') };
    return { logo: data.value };
  },

  async updateGlobalSettings(logo: string): Promise<void> {
    const sb = getSupabase();
    localStorage.setItem('carestino_custom_logo', logo);
    
    if (!sb) return;
    
    const { error } = await sb
      .from('app_settings')
      .upsert({ key: 'custom_logo', value: logo }, { onConflict: 'key' });
    
    if (error) console.error("Error saving settings:", error);
  },

  // Suscripción a cambios de configuración (Logo en tiempo real)
  subscribeToSettings(callback: (logo: string) => void) {
    const sb = getSupabase();
    if (!sb) return () => {};

    const channel = sb.channel('global-settings')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'app_settings',
        filter: 'key=eq.custom_logo'
      }, (payload: any) => {
        if (payload.new && payload.new.value) {
          localStorage.setItem('carestino_custom_logo', payload.new.value);
          callback(payload.new.value);
        }
      })
      .subscribe();

    return () => { sb.removeChannel(channel); };
  },

  async getQueueByStore(storeId: string): Promise<QueueEntry[]> {
    const sb = getSupabase();
    if (!sb) return mockDb.getEntries(storeId);
    const { data, error } = await sb
      .from('queue_entries')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: true });
    if (error) return mockDb.getEntries(storeId);
    return data || [];
  },

  async addQueueEntry(storeId: string, clientName: string): Promise<QueueEntry> {
    const sb = getSupabase();
    if (!sb) {
      const entries = mockDb.getEntries(storeId);
      const nextNumber = (entries.length > 0 ? Math.max(...entries.map(e => e.number)) : 0) + 1;
      const newEntry: QueueEntry = {
        id: crypto.randomUUID(),
        store_id: storeId,
        client_name: clientName,
        number: nextNumber,
        status: 'waiting',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockDb.saveEntries(storeId, [...entries, newEntry]);
      return newEntry;
    }
    const { data: latest } = await sb.from('queue_entries').select('number').eq('store_id', storeId).order('number', { ascending: false }).limit(1);
    const nextNumber = (latest?.[0]?.number || 0) + 1;
    const { data, error } = await sb.from('queue_entries').insert([{ store_id: storeId, client_name: clientName, number: nextNumber, status: 'waiting' }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: QueueStatus): Promise<void> {
    const sb = getSupabase();
    const now = new Date().toISOString();
    if (!sb) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('mock_queue_')) {
          const entries: QueueEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
          const idx = entries.findIndex(e => e.id === id);
          if (idx !== -1) {
            entries[idx].status = status;
            entries[idx].updated_at = now;
            localStorage.setItem(key, JSON.stringify(entries));
            break;
          }
        }
      }
      return;
    }
    const { error } = await sb.from('queue_entries').update({ status, updated_at: now }).eq('id', id);
    if (error) console.error(error);
  },

  async callNext(storeId: string): Promise<QueueEntry | null> {
    const sb = getSupabase();
    if (!sb) {
      const entries = mockDb.getEntries(storeId);
      const nextIdx = entries.findIndex(e => e.status === 'waiting');
      if (nextIdx === -1) return null;
      entries[nextIdx].status = 'called';
      entries[nextIdx].updated_at = new Date().toISOString();
      mockDb.saveEntries(storeId, entries);
      return entries[nextIdx];
    }
    const { data: waiting } = await sb.from('queue_entries').select('*').eq('store_id', storeId).eq('status', 'waiting').order('created_at', { ascending: true }).limit(1);
    if (!waiting || waiting.length === 0) return null;
    const entry = waiting[0];
    await this.updateStatus(entry.id, 'called');
    return entry;
  },

  async getAllStats(): Promise<StoreStats[]> {
    const stats: StoreStats[] = [];
    for (const store of STORES) {
      const entries = await this.getQueueByStore(store.id);
      const finished = entries.filter(e => e.status === 'finished');
      const waiting = entries.filter(e => e.status === 'waiting');
      let totalTime = 0;
      finished.forEach(e => {
        if (e.updated_at) {
          const start = new Date(e.created_at).getTime();
          const end = new Date(e.updated_at).getTime();
          totalTime += (end - start);
        }
      });
      const avg = finished.length > 0 ? (totalTime / finished.length / 60000).toFixed(1) : "0";
      stats.push({
        storeId: store.id,
        storeName: store.name,
        servedToday: finished.length,
        avgWaitTime: avg,
        peopleWaiting: waiting.length,
        totalEntries: entries.length
      });
    }
    return stats;
  },

  async subscribeNewsletter(email: string): Promise<void> {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('newsletter').insert([{ email }]);
  },

  subscribeToStoreChanges(storeId: string, callback: (payload: any) => void) {
    const sb = getSupabase();
    if (!sb) {
      const interval = setInterval(() => callback({}), 2000);
      return () => clearInterval(interval);
    }
    const channel = sb.channel(`store-${storeId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries', filter: `store_id=eq.${storeId}` }, callback).subscribe();
    return () => { sb.removeChannel(channel); };
  }
};
