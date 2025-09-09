
import React, { useState } from 'react';
import { Modal } from './Modal';
import { InventoryItem } from '../types';
import * as inventoryService from '../services/inventoryService';

interface StockOutModalProps {
  item: InventoryItem;
  onClose: () => void;
  onStockSold: () => void;
}

export const StockOutModal: React.FC<StockOutModalProps> = ({ item, onClose, onStockSold }) => {
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const quantityNum = parseInt(quantity, 10);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Jumlah harus berupa angka positif.');
      return;
    }
    if (quantityNum > item.quantity) {
      setError(`Jumlah tidak boleh melebihi stok yang ada (${item.quantity}).`);
      return;
    }

    try {
      inventoryService.sellStock(item.id, quantityNum);
      onStockSold();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <Modal title="Jual Stok (Barang Keluar)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h4 className="font-semibold text-white">{item.shoeType}</h4>
          <p className="text-sm text-slate-400">Nomor: {item.size} / Stok Tersedia: {item.quantity}</p>
        </div>
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-slate-300">Jumlah Dijual</label>
          <input 
            type="number" 
            id="quantity" 
            value={quantity} 
            onChange={(e) => setQuantity(e.target.value)} 
            max={item.quantity}
            min="1"
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" 
          />
        </div>
        
        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Batal</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 rounded-md">Konfirmasi Jual</button>
        </div>
      </form>
    </Modal>
  );
};
