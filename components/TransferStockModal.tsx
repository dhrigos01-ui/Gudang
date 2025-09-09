import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { AppData, WarehouseCategory, MaklunMaster } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
import * as inventoryService from '../services/inventoryService';

interface TransferStockModalProps {
  inventory: AppData['inventory'];
  maklunMasters: MaklunMaster[];
  onClose: () => void;
  onStockTransferred: () => void;
}

const transferFlow: Partial<Record<WarehouseCategory, WarehouseCategory>> = {
  [WarehouseCategory.WIP]: WarehouseCategory.NEARLY_FINISHED,
  [WarehouseCategory.NEARLY_FINISHED]: WarehouseCategory.FINISHED_GOODS,
};
const allowedSources = Object.keys(transferFlow) as WarehouseCategory[];

export const TransferStockModal: React.FC<TransferStockModalProps> = ({ inventory, maklunMasters, onClose, onStockTransferred }) => {
  const [fromWarehouse, setFromWarehouse] = useState<WarehouseCategory | ''>('');
  const [toWarehouse, setToWarehouse] = useState<WarehouseCategory | ''>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const [sourceType, setSourceType] = useState<'pabrik' | 'maklun'>('pabrik');
  const [sourceName, setSourceName] = useState('');
  
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
    if (sourceType === 'maklun' && !sourceName.trim()) {
      setError('Nama sumber Maklun harus dipilih.');
      return;
    }

    try {
      const source = sourceType === 'maklun' ? sourceName.trim() : 'Pabrik';
      inventoryService.transferStock(currentItem.id, quantityNum, fromWarehouse, toWarehouse, source);
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

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Batal</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-md">Konfirmasi Transfer</button>
        </div>
      </form>
    </Modal>
  );
};