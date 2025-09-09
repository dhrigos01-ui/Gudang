import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { AppData, WarehouseCategory } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
import * as inventoryService from '../services/inventoryService';

interface StockOutGeneralModalProps {
  inventory: AppData['inventory'];
  onClose: () => void;
  onStockRemoved: () => void;
}

export const StockOutGeneralModal: React.FC<StockOutGeneralModalProps> = ({ inventory, onClose, onStockRemoved }) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseCategory | ''>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const availableItems = useMemo(() => {
    return selectedWarehouse ? inventory[selectedWarehouse] : [];
  }, [selectedWarehouse, inventory]);
  
  const currentItem = availableItems.find(item => item.id === selectedItem);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const quantityNum = parseInt(quantity, 10);

    if (!selectedWarehouse || !selectedItem || !currentItem) {
      setError('Harap pilih gudang dan barang.');
      return;
    }
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Jumlah harus berupa angka positif.');
      return;
    }
    if (quantityNum > currentItem.quantity) {
      setError(`Jumlah tidak boleh melebihi stok yang ada (${currentItem.quantity}).`);
      return;
    }
    if (!notes.trim()) {
      setError('Keterangan harus diisi (contoh: barang rusak, transfer, dll).');
      return;
    }

    try {
      inventoryService.removeStock(currentItem.id, selectedWarehouse, quantityNum, notes);
      onStockRemoved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <Modal title="Catat Barang Keluar (Non-Penjualan)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="warehouse" className="block text-sm font-medium text-slate-300">Pilih Gudang</label>
          <select 
            id="warehouse" 
            value={selectedWarehouse} 
            onChange={(e) => {
              setSelectedWarehouse(e.target.value as WarehouseCategory);
              setSelectedItem(''); // Reset item selection when warehouse changes
            }} 
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
          >
            <option value="" disabled>-- Pilih Gudang --</option>
            {Object.entries(WAREHOUSE_NAMES).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="item" className="block text-sm font-medium text-slate-300">Pilih Barang</label>
          <select 
            id="item" 
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            disabled={!selectedWarehouse || availableItems.length === 0}
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-slate-800 disabled:text-slate-500"
          >
            <option value="" disabled>
              {availableItems.length === 0 ? '-- Tidak ada stok --' : '-- Pilih Barang --'}
            </option>
            {availableItems.map(item => (
              <option key={item.id} value={item.id}>
                {`${item.shoeType} (No. ${item.size}) - Stok: ${item.quantity}`}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-slate-300">Jumlah Keluar</label>
          <input 
            type="number" 
            id="quantity" 
            value={quantity} 
            onChange={(e) => setQuantity(e.target.value)} 
            max={currentItem?.quantity}
            min="1"
            disabled={!currentItem}
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-slate-800" 
          />
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-300">Keterangan</label>
           <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            placeholder="Contoh: Barang rusak, Transfer ke cabang, Sampel pameran"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Batal</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-md">Konfirmasi Keluar</button>
        </div>
      </form>
    </Modal>
  );
};