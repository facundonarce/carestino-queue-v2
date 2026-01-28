
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

export const apiService = {
  async getGlobalSettings(): Promise<{ logo: string | null }> {
    const sb = getSupabase();
    if (!sb) return { logo: localStorage.getItem('carestino_custom_logo') };
    try {
      const { data, error } = await sb.from('app_settings').select('value').eq('key', 'custom_logo').maybeSingle();
      if (error) throw error;
      return { logo: data?.value || localStorage.getItem('carestino_custom_logo') };
    } catch (e) {
      return { logo: localStorage.getItem('carestino_custom_logo') };
    }
  },

  async updateGlobalSettings(logo: string): Promise<void> {
    const sb = getSupabase();
    localStorage.setItem('carestino_custom_logo', logo);
    if (!sb) return;
    const { error } = await sb.from('app_settings').upsert({ key: 'custom_logo', value: logo, updated_at: new Date().toISOString() });
    if (error) throw error;
  },

  subscribeToSettings(callback: (logo: string) => void) {
    const sb = getSupabase();
    if (!sb) return () => {};
    const channel = sb.channel('global-settings-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings', filter: 'key=eq.custom_logo' }, (payload: any) => {
      const newValue = payload.new?.value;
      if (newValue) { callback(newValue); }
    }).subscribe();
    return () => { sb.removeChannel(channel); };
  },

  async getQueueByStore(storeId: string): Promise<QueueEntry[]> {
    const sb = getSupabase();
    if (!sb) return [];
    const { data, error } = await sb.from('queue_entries').select('*').eq('store_id', storeId).order('created_at', { ascending: true });
    return data || [];
  },

  async addQueueEntry(storeId: string, clientName: string): Promise<QueueEntry> {
    const sb = getSupabase();
    if (!sb) throw new Error("Offline");
    const { data: latest } = await sb.from('queue_entries').select('number').eq('store_id', storeId).order('number', { ascending: false }).limit(1);
    const nextNumber = (latest?.[0]?.number || 0) + 1;
    const { data, error } = await sb.from('queue_entries').insert([{ store_id: storeId, client_name: clientName, number: nextNumber, status: 'waiting' }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: QueueStatus): Promise<void> {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('queue_entries').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  },

  async callNext(storeId: string): Promise<QueueEntry | null> {
    const sb = getSupabase();
    if (!sb) return null;
    const { data: waiting } = await sb.from('queue_entries').select('*').eq('store_id', storeId).eq('status', 'waiting').order('created_at', { ascending: true }).limit(1);
    if (!waiting?.length) return null;
    const entry = waiting[0];
    await this.updateStatus(entry.id, 'called');
    return entry;
  },

  async getAllStats(): Promise<StoreStats[]> {
    const sb = getSupabase();
    if (!sb) return [];
    
    // Obtenemos todos los turnos del día para calcular métricas
    const { data: entries, error } = await sb.from('queue_entries').select('*');
    if (error) return [];

    return STORES.map(store => {
      const storeEntries = entries.filter(e => e.store_id === store.id);
      const finished = storeEntries.filter(e => e.status === 'finished');
      const waiting = storeEntries.filter(e => e.status === 'waiting');
      const beingServed = storeEntries.filter(e => e.status === 'called');
      
      let totalMinutes = 0;
      finished.forEach(e => {
        if (e.updated_at) {
          const diff = (new Date(e.updated_at).getTime() - new Date(e.created_at).getTime()) / 60000;
          totalMinutes += diff;
        }
      });

      return {
        storeId: store.id,
        storeName: store.name,
        servedToday: finished.length,
        avgWaitTime: finished.length > 0 ? (totalMinutes / finished.length).toFixed(1) : "0",
        peopleWaiting: waiting.length,
        totalEntries: storeEntries.length,
        // Extendemos el tipo implícitamente para el Dashboard
        beingServed: beingServed.length
      } as any;
    });
  },

  subscribeToStoreChanges(storeId: string, callback: () => void) {
    const sb = getSupabase();
    if (!sb) return () => {};
    const channel = sb.channel(`store-${storeId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries', filter: `store_id=eq.${storeId}` }, callback).subscribe();
    return () => { sb.removeChannel(channel); };
  },

  async subscribeNewsletter(email: string): Promise<void> {
    const sb = getSupabase();
    if (sb) await sb.from('newsletter').insert([{ email }]);
  }
};
