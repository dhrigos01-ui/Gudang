import React, { useState } from 'react';
import { Modal } from './Modal';
import { LeatherMaster } from '../types';
// FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
import * as api from '../lib/api';

interface StockInLeatherModalProps {
  onClose: () => void;
  onStockAdded: () => void;
  leatherMasters: LeatherMaster[];
}

export const StockInLeatherModal: React.FC<StockInLeatherModalProps> = ({ onClose, onStockAdded, leatherMasters }) => {
  const [entries, setEntries] = useState<Array<{ leatherId: string; quantity: string }>>([{ leatherId: '', quantity: '' }]);
  const [supplier, setSupplier] = useState('');
  const [entryDate, setEntryDate] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsedEntries = entries
      .map(r => ({ leatherId: r.leatherId, qty: parseFloat(r.quantity.replace(/\./g, '').replace(',', '.').trim()) }))
      .filter(r => r.leatherId && !isNaN(r.qty) && r.qty > 0);

    if (parsedEntries.length === 0) {
      setError('Tambahkan minimal satu baris Jenis Kulit dengan jumlah yang valid.');
      return;
    }
    if (!supplier.trim()) {
      setError('Nama supplier harus diisi.');
      return;
    }
    
    try {
      await Promise.all(
        parsedEntries.map(r => api.addLeatherStock(r.leatherId, r.qty, supplier.trim(), entryDate))
      );
      onStockAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <Modal title="Tambah Stok Kulit Masuk" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Kiri: metadata */}
          <div className="space-y-4 md:col-span-4">
            <div>
              <label htmlFor="entryDate" className="block text-sm font-medium text-slate-300">Tanggal Masuk</label>
              <input
                type="datetime-local"
                id="entryDate"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-slate-300">Nama Supplier</label>
              <input type="text" id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" placeholder="Contoh: CV Kulit Jaya" required />
            </div>
          </div>

          {/* Kanan: input barang (multi rows) */}
          <div className="space-y-3 md:col-span-8 max-h-[50vh] overflow-y-auto pr-1">
            {entries.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-slate-700 p-3 rounded-md bg-slate-800/40">
                <div className="md:col-span-7">
                  <label htmlFor={`leatherId-${idx}`} className="block text-sm font-medium text-slate-300">Jenis Kulit</label>
                  <select 
                    id={`leatherId-${idx}`}
                    value={row.leatherId}
                    onChange={(e) => setEntries(prev => prev.map((r, i) => i === idx ? { ...r, leatherId: e.target.value } : r))}
                    className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  >
                    <option value="" disabled>-- Pilih Jenis Kulit --</option>
                    {leatherMasters.map(master => (
                      <option key={master.id} value={master.id}>{master.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label htmlFor={`quantity-${idx}`} className="block text-sm font-medium text-slate-300">Jumlah (kaki)</label>
                  <input type="text" inputMode="decimal" id={`quantity-${idx}`} value={row.quantity} onChange={(e) => setEntries(prev => prev.map((r, i) => i === idx ? { ...r, quantity: e.target.value } : r))} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" placeholder="Contoh: 12,5" required />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button type="button" onClick={() => setEntries(prev => prev.filter((_, i) => i !== idx))} className="h-10 mt-6 px-3 text-sm font-medium text-slate-200 bg-slate-600 hover:bg-slate-500 rounded-md" disabled={entries.length === 1}>Hapus</button>
                </div>
              </div>
            ))}
            <div>
              <button type="button" onClick={() => setEntries(prev => [...prev, { leatherId: '', quantity: '' }])} className="px-3 py-2 text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-md">Tambah Baris</button>
            </div>
          </div>
        </div>
        
        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        {!leatherMasters || leatherMasters.length === 0 && (
            <p className="text-amber-400 text-sm p-3 bg-amber-500/10 rounded-md">
                Data master kulit kosong. Silakan tambahkan data melalui 'Master Kulit' terlebih dahulu.
            </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Batal</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 rounded-md" disabled={!leatherMasters || leatherMasters.length === 0}>Simpan</button>
        </div>
      </form>
    </Modal>
  );
};