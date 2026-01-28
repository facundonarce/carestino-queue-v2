
export type QueueStatus = 'waiting' | 'called' | 'finished' | 'cancelled';

export interface QueueEntry {
  id: string;
  store_id: string;
  number: number;
  client_name: string;
  status: QueueStatus;
  created_at: string;
  updated_at?: string; // Track when status changes
}

export interface Store {
  id: string;
  name: string;
  address: string;
}

export interface NewsletterEntry {
  id: string;
  email: string;
  created_at: string;
}

export interface StoreStats {
  storeId: string;
  storeName: string;
  servedToday: number;
  avgWaitTime: string; // Time in minutes
  peopleWaiting: number;
  totalEntries: number;
}
