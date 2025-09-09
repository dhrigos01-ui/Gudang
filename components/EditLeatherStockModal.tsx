import React, { useState } from 'react';
import { Modal } from './Modal';
import { LeatherInventoryItem } from '../types';
// FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
import * as api from '../lib/api';

interface EditLeatherStockModalProps {
  item: LeatherInventoryItem;
  onClose: () => void;
  onStockUpdated: () => void;
}

export const EditLeatherStockModal: React.FC<EditLeatherStockModalProps> = ({ item, onClose, onStockUpdated }) => {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const quantityNum = parseInt(quantity, 10);

    if (isNaN(quantityNum) || quantityNum < 0) {
      setError('Jumlah harus berupa angka positif atau nol.');
      return;
    }
    
    try {
      // FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
      await api.updateLeatherStockQuantity(item.id, quantityNum);
      onStockUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <Modal title="Edit/Penyesuaian Stok Kulit" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h4 className="font-semibold text-white">{item.name}</h4>
          <p className="text-sm text-slate-400">Supplier: {item.supplier}</p>
          <p className="text-sm text-slate-400">Stok Saat Ini: {item.quantity} kaki</p>
        </div>
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-slate-300">Jumlah Stok Baru (kaki)</label>
          <input 
            type="number" 
            id="quantity" 
            value={quantity} 
            onChange={(e) => setQuantity(e.target.value)}
            min="0"
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" 
            autoFocus
          />
           <p className="text-xs text-slate-500 mt-1">Mengubah jumlah akan membuat transaksi "Penyesuaian Stok".</p>
        </div>
        
        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Batal</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-md">Simpan Perubahan</button>
        </div>
      </form>
    </Modal>
  );
};