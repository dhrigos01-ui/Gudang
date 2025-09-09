import React, { useState } from 'react';
import { Modal } from './Modal';
import { LeatherMaster } from '../types';
// FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
import * as api from '../lib/api';

interface ReturnLeatherModalProps {
  leatherMasters: LeatherMaster[];
  onClose: () => void;
  onStockReturned: () => void;
}

export const ReturnLeatherModal: React.FC<ReturnLeatherModalProps> = ({ leatherMasters, onClose, onStockReturned }) => {
  const [selectedLeatherMasterId, setSelectedLeatherMasterId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [returneeName, setReturneeName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const quantityNum = parseInt(quantity, 10);
    const selectedMaster = leatherMasters.find(m => m.id === selectedLeatherMasterId);

    if (!selectedMaster) {
      setError('Harap pilih jenis kulit yang akan diretur.');
      return;
    }
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Jumlah harus berupa angka positif.');
      return;
    }
    if (!returneeName.trim()) {
      setError('Nama peretur harus diisi.');
      return;
    }
    if (!notes.trim()) {
      setError('Keterangan retur harus diisi.');
      return;
    }
    
    try {
      // FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
      // Pass the leather master ID instead of the full object.
      await api.returnLeatherStock(selectedMaster.id, quantityNum, returneeName.trim(), notes.trim());
      onStockReturned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <Modal title="Retur Kulit (Barang Masuk)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="item" className="block text-sm font-medium text-slate-300">Pilih Jenis Kulit</label>
          <select 
            id="item" 
            value={selectedLeatherMasterId}
            onChange={(e) => setSelectedLeatherMasterId(e.target.value)}
            disabled={leatherMasters.length === 0}
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-slate-800 disabled:text-slate-500"
          >
            <option value="" disabled>
              {leatherMasters.length === 0 ? '-- Tidak ada master kulit --' : '-- Pilih Kulit --'}
            </option>
            {leatherMasters.map(master => (
              <option key={master.id} value={master.id}>
                {master.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-slate-300">Jumlah Diretur (kaki)</label>
                <input 
                    type="number" 
                    id="quantity" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                    min="1"
                    className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" 
                />
            </div>
            <div>
                <label htmlFor="returneeName" className="block text-sm font-medium text-slate-300">Nama Peretur</label>
                <input 
                    type="text" 
                    id="returneeName" 
                    value={returneeName} 
                    onChange={(e) => setReturneeName(e.target.value)} 
                    className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" 
                    placeholder="Nama yang mengembalikan"
                    required
                />
            </div>
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-300">Keterangan Retur</label>
           <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            placeholder="Contoh: Salah kirim, Kualitas buruk, dll."
            required
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Batal</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md" disabled={leatherMasters.length === 0}>Konfirmasi Retur</button>
        </div>
      </form>
    </Modal>
  );
};