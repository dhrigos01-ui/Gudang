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
  const [selectedLeatherId, setSelectedLeatherId] = useState('');
  const [quantity, setQuantity] = useState('');
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
    const normalizedQuantity = quantity.replace(/\./g, '').replace(',', '.').trim();
    const quantityNum = parseFloat(normalizedQuantity);
    const selectedLeather = leatherMasters.find(m => m.id === selectedLeatherId);

    if (!selectedLeather || isNaN(quantityNum) || quantityNum <= 0) {
      setError('Jenis kulit dan jumlah harus diisi dengan nilai yang valid.');
      return;
    }
    if (!supplier.trim()) {
      setError('Nama supplier harus diisi.');
      return;
    }
    
    try {
      // FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
      // Pass the leather master ID instead of the full object.
      await api.addLeatherStock(selectedLeather.id, quantityNum, supplier.trim(), entryDate);
      onStockAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <Modal title="Tambah Stok Kulit Masuk" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="leatherId" className="block text-sm font-medium text-slate-300">Jenis Kulit</label>
            <select 
              id="leatherId" 
              value={selectedLeatherId} 
              onChange={(e) => setSelectedLeatherId(e.target.value)} 
              className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              required
            >
              <option value="" disabled>-- Pilih Jenis Kulit --</option>
              {leatherMasters.map(master => (
                <option key={master.id} value={master.id}>{master.name}</option>
              ))}
            </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-slate-300">Jumlah (kaki)</label>
              <input type="text" inputMode="decimal" id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" placeholder="Contoh: 12,5" required />
            </div>
            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-slate-300">Nama Supplier</label>
              <input type="text" id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" placeholder="Contoh: CV Kulit Jaya" required />
            </div>
        </div>
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