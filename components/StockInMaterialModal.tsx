import React, { useState } from 'react';
import { Modal } from './Modal';
// FIX: Use LeatherMaster type as MaterialMaster does not exist.
import { LeatherMaster, MaklunMaster } from '../types';
// FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
import * as api from '../lib/api';

interface StockInMaterialModalProps {
  onClose: () => void;
  onStockAdded: () => void;
  // FIX: Update prop type to use LeatherMaster.
  leatherMasters: LeatherMaster[];
  maklunMasters: MaklunMaster[];
}

export const StockInMaterialModal: React.FC<StockInMaterialModalProps> = ({ onClose, onStockAdded, leatherMasters, maklunMasters }) => {
  const [selectedLeatherId, setSelectedLeatherId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sourceType, setSourceType] = useState<'pabrik' | 'maklun'>('pabrik');
  const [sourceName, setSourceName] = useState('');
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
    const quantityNum = parseInt(quantity, 10);
    const selectedLeather = leatherMasters.find(m => m.id === selectedLeatherId);

    if (!selectedLeather || isNaN(quantityNum) || quantityNum <= 0) {
      setError('Semua field harus diisi dengan nilai yang valid.');
      return;
    }
    if (sourceType === 'maklun' && !sourceName.trim()) {
      setError('Nama sumber Maklun harus dipilih.');
      return;
    }
    
    try {
      const source = sourceType === 'maklun' ? sourceName.trim() : 'Pabrik';
      // FIX: Call addLeatherStock as addMaterialStock does not exist, and pass master ID.
      await api.addLeatherStock(selectedLeather.id, quantityNum, source, entryDate);
      onStockAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <Modal title="Tambah Stok Kulit Masuk" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-slate-300">Jumlah (kaki)</label>
              <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" min="1" required />
            </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300">Sumber Stok</label>
          <div className="mt-2 flex gap-x-4">
            <label className="flex items-center">
              <input type="radio" name="sourceType" value="pabrik" checked={sourceType === 'pabrik'} onChange={() => setSourceType('pabrik')} className="h-4 w-4 text-cyan-600 border-gray-300 focus:ring-cyan-500" />
              <span className="ml-2 text-sm text-slate-200">Pabrik</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="sourceType" value="maklun" checked={sourceType === 'maklun'} onChange={() => setSourceType('maklun')} className="h-4 w-4 text-cyan-600 border-gray-300 focus:ring-cyan-500" />
              <span className="ml-2 text-sm text-slate-200">Maklun</span>
            </label>
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

        {sourceType === 'maklun' && (
          <div>
            <label htmlFor="sourceName" className="block text-sm font-medium text-slate-300">Nama Sumber (Maklun)</label>
             <select 
              id="sourceName" 
              value={sourceName} 
              onChange={(e) => setSourceName(e.target.value)} 
              className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              required
            >
              <option value="" disabled>-- Pilih Sumber Maklun --</option>
              {maklunMasters.map(master => (
                <option key={master.id} value={master.name}>{master.name}</option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        {!leatherMasters || leatherMasters.length === 0 && (
            <p className="text-amber-400 text-sm p-3 bg-amber-500/10 rounded-md">
                Data master kulit kosong. Silakan tambahkan data melalui 'Master Kulit' terlebih dahulu.
            </p>
        )}
        
        {sourceType === 'maklun' && (!maklunMasters || maklunMasters.length === 0) && (
            <p className="text-amber-400 text-sm p-3 bg-amber-500/10 rounded-md">
                Data master maklun kosong. Silakan tambahkan data melalui 'Master Maklun' terlebih dahulu.
            </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Batal</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 rounded-md" disabled={!leatherMasters || leatherMasters.length === 0 || (sourceType === 'maklun' && maklunMasters.length === 0)}>Simpan</button>
        </div>
      </form>
    </Modal>
  );
};