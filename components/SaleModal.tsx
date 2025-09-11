import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { AppData, WarehouseCategory, InventoryItem } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
// FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
import * as api from '../lib/api';

interface SaleItem {
  id: string;
  shoeType: string;
  size: number;
  quantity: number;
  maxQuantity: number;
}

interface SaleModalProps {
  inventory: AppData['inventory'];
  onClose: () => void;
  onStockSold: () => void;
}

export const SaleModal: React.FC<SaleModalProps> = ({ inventory, onClose, onStockSold }) => {
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');
  const [pickupDate, setPickupDate] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  
  const availableItems = useMemo(() => {
    return inventory[WarehouseCategory.FINISHED_GOODS] || [];
  }, [inventory]);

  const addSelectedItem = () => {
    if (!selectedItemId) return;
    
    const item = availableItems.find(item => item.id === selectedItemId);
    if (!item) return;
    
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    if (existingItem) {
      setSelectedItems(prev => prev.map(selected => 
        selected.id === item.id 
          ? { ...selected, quantity: Math.min(selected.quantity + 1, selected.maxQuantity) }
          : selected
      ));
    } else {
      setSelectedItems(prev => [...prev, {
        id: item.id,
        shoeType: item.shoeType,
        size: item.size,
        quantity: 1,
        maxQuantity: item.quantity
      }]);
    }
    
    // Reset selection
    setSelectedItemId('');
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setSelectedItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: Math.min(Math.max(1, quantity), item.maxQuantity) }
        : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedItems.length === 0) {
      setError('Harap pilih minimal satu item untuk dijual.');
      return;
    }
    if (!customerName.trim()) {
      setError('Nama pembeli harus diisi.');
      return;
    }

    try {
      // Proses penjualan untuk setiap item
      for (const item of selectedItems) {
        await api.sellStock(item.id, item.quantity, customerName, pickupDate);
      }
      onStockSold();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses penjualan.');
    }
  };

  return (
    <Modal title="Penjualan Barang" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-slate-300">Nama Pembeli</label>
          <input
            type="text"
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Masukkan nama pembeli"
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            required
          />
        </div>

        <div>
          <label htmlFor="pickupDate" className="block text-sm font-medium text-slate-300">Tanggal Pengambilan</label>
          <input
            type="datetime-local"
            id="pickupDate"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            required
          />
        </div>

        <div>
          <label htmlFor="itemSelect" className="block text-sm font-medium text-slate-300">Pilih Barang dari Stok Gudang</label>
          <div className="flex gap-2 mt-1">
            <select 
              id="itemSelect"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              disabled={availableItems.length === 0}
            >
              <option value="" disabled>
                {availableItems.length === 0 ? '-- Tidak ada stok --' : '-- Pilih Barang --'}
              </option>
              {availableItems.map((item: InventoryItem) => (
                <option key={item.id} value={item.id}>
                  {item.shoeType} (No. {item.size}) - Stok: {item.quantity}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addSelectedItem}
              disabled={!selectedItemId}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
            >
              Tambah
            </button>
          </div>
        </div>

        {selectedItems.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Item yang akan dijual</label>
            <div className="border border-slate-600 rounded-md bg-slate-800/50 max-h-64 overflow-y-auto pr-1">
              {selectedItems.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between border-b border-slate-600 last:border-b-0">
                  <div className="flex-1">
                    <div className="text-white font-medium">{item.shoeType}</div>
                    <div className="text-sm text-slate-400">Ukuran: {item.size}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-slate-600 hover:bg-slate-500 text-white rounded-md flex items-center justify-center"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-white">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-slate-600 hover:bg-slate-500 text-white rounded-md flex items-center justify-center"
                      disabled={item.quantity >= item.maxQuantity}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Batal</button>
          <button 
            type="submit" 
            className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md disabled:bg-slate-500 disabled:cursor-not-allowed"
            disabled={selectedItems.length === 0}
          >
            Konfirmasi Penjualan
          </button>
        </div>
      </form>
    </Modal>
  );
};