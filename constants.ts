
import { Store } from './types';

export const COLORS = {
  carestino: '#FF5100',
  navy: '#0f172a',
  white: '#ffffff',
  gray: '#94a3b8',
  statusBox: '#f8fafc',
};

export const STORES: Store[] = [
  { id: 'centro', name: 'Tienda Centro', address: 'Av. Corrientes 1234' },
  { id: 'palermo', name: 'Tienda Palermo', address: 'Honduras 4567' },
  { id: 'belgrano', name: 'Tienda Belgrano', address: 'Av. Cabildo 2345' },
  { id: 'caballito', name: 'Tienda Caballito', address: 'Av. Rivadavia 5678' },
  { id: 'recoleta', name: 'Tienda Recoleta', address: 'Av. Santa Fe 3456' },
];

export const TYPOGRAPHY = {
  heading: "font-black italic uppercase tracking-tighter",
  subheading: "font-bold uppercase tracking-widest text-slate-400 text-xs",
  body: "font-medium text-slate-700",
};

export const UI = {
  card: "bg-white rounded-[4rem] shadow-2xl p-10 border border-slate-100",
  button: "rounded-3xl px-8 py-5 font-black italic uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 text-sm",
  input: "rounded-2xl px-6 py-4 bg-slate-100 border-none focus:ring-2 focus:ring-[#FF5100] outline-none text-slate-900 w-full font-bold",
};
