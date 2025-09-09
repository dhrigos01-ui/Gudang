import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { AppData, WarehouseCategory } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
import * as inventoryService from '../services/inventoryService';

interface TransferStockModalProps {
  inventory: AppData['inventory'];
  onClose: () => void;
  onStockTransferred: () => void;
}

const transferFlow: Partial<Record<WarehouseCategory, WarehouseCategory>> = {
  [WarehouseCategory.WIP]: WarehouseCategory.NEARLY_FINISHED,
  [WarehouseCategory.NEARLY_FINISHED]: WarehouseCategory.FINISHED_GOODS,
};
const allowedSources = Object.keys(transferFlow) as WarehouseCategory[];

export const TransferStockModal: React.FC<TransferStockModalProps> = ({ inventory, onClose, onStockTransferred }) => {
  const [fromWarehouse, setFromWarehouse] = useState<WarehouseCategory | ''>('');
  const [toWarehouse, setToWarehouse] = useState<WarehouseCategory | ''>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  
  const availableItems = useMemo(() => {
    return fromWarehouse ? inventory[fromWarehouse] : [];
  }, [fromWarehouse, inventory]);

  const currentItem = availableItems.find(item => item.id === selectedItem);

  const handleFromWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const source = e.target.value as WarehouseCategory;
    setFromWarehouse(source);
    setSelectedItem('');
    setQuantity('1');
    setToWarehouse(transferFlow[source] || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const quantityNum = parseInt(quantity, 10);

    if (!fromWarehouse || !toWarehouse || !selectedItem || !currentItem) {
      setError('Semua field harus dipilih.');
      return;
    }
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Jumlah harus berupa angka positif.');
      return;
    }
    if (quantityNum > currentItem.quantity) {
      setError(`Jumlah transfer tidak boleh melebihi stok yang ada (${currentItem.quantity}).`);
      return;
    }

    try {
      inventoryService.transferStock(currentItem.id, quantityNum, fromWarehouse, toWarehouse);
      onStockTransferred();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <Modal title="Transfer Stok Antar Gudang" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fromWarehouse" className="block text-sm font-medium text-slate-300">Dari Gudang</label>
            <select
              id="fromWarehouse"
              value={fromWarehouse}
              onChange={handleFromWarehouseChange}
              className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="" disabled>-- Pilih Gudang Asal --</option>
              {allowedSources.map(key => (
                <option key={key} value={key}>{WAREHOUSE_NAMES[key]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="toWarehouse" className="block text-sm font-medium text-slate-300">Ke Gudang</label>
            <input
              type="text"
              id="toWarehouse"
              value={toWarehouse ? WAREHOUSE_NAMES[toWarehouse] : ''}
              readOnly
              className="mt-1 block w-full bg-slate-800 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-slate-400 cursor-not-allowed"
              placeholder="Otomatis terisi"
            />
          </div>
        </div>

        <div>
          <label htmlFor="item" className="block text-sm font-medium text-slate-300">Pilih Barang</label>
          <select
            id="item"
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            disabled={!fromWarehouse || availableItems.length === 0}
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-slate-800 disabled:text-slate-500"
          >
            <option value="" disabled>
              { !fromWarehouse ? '-- Pilih gudang asal dulu --' : availableItems.length === 0 ? '-- Tidak ada stok --' : '-- Pilih Barang --'}
            </option>
            {availableItems.map(item => (
              <option key={item.id} value={item.id}>
                {`${item.shoeType} (No. ${item.size}) - Stok: ${item.quantity}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-slate-300">Jumlah Transfer</label>
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

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Batal</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-md">Konfirmasi Transfer</button>
        </div>
      </form>
    </Modal>
  );
};
