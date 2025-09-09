import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { AppData, WarehouseCategory, LeatherInventoryItem, InventoryItem, MaklunMaster } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
import * as inventoryService from '../services/inventoryService';

interface StockOutGeneralModalProps {
  shoeInventory: AppData['inventory'];
  leatherInventory: LeatherInventoryItem[];
  maklunMasters: MaklunMaster[];
  onClose: () => void;
  onStockRemoved: () => void;
}

type StockType = 'shoe' | 'leather';

export const StockOutGeneralModal: React.FC<StockOutGeneralModalProps> = ({ shoeInventory, leatherInventory, maklunMasters, onClose, onStockRemoved }) => {
  const [stockType, setStockType] = useState<StockType>('shoe');
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseCategory | ''>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [releasedTo, setReleasedTo] = useState('');
  const [error, setError] = useState('');

  const shoeWarehouses = Object.entries(WAREHOUSE_NAMES).filter(([key]) => key !== WarehouseCategory.LEATHER);

  const availableItems = useMemo(() => {
    if (stockType === 'shoe') {
      return selectedWarehouse ? shoeInventory[selectedWarehouse as Exclude<WarehouseCategory, 'leather'>] : [];
    }
    return leatherInventory;
  }, [stockType, selectedWarehouse, shoeInventory, leatherInventory]);
  
  const currentItem = availableItems.find(item => item.id === selectedItem);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const quantityNum = parseInt(quantity, 10);

    if (!currentItem) {
      setError('Harap pilih barang yang akan dikeluarkan.');
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
    if (!releasedTo.trim()) {
      setError('Penerima barang (Maklun) harus dipilih.');
      return;
    }

    try {
      if (stockType === 'shoe' && selectedWarehouse) {
        inventoryService.removeStock(currentItem.id, selectedWarehouse as WarehouseCategory, quantityNum, releasedTo);
      } else {
        inventoryService.removeLeatherStock(currentItem as LeatherInventoryItem, quantityNum, releasedTo);
      }
      onStockRemoved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };

  const handleStockTypeChange = (type: StockType) => {
    setStockType(type);
    setSelectedWarehouse('');
    setSelectedItem('');
    setQuantity('1');
    setError('');
  };

  return (
    <Modal title="Catat Barang Keluar (Non-Penjualan)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">Jenis Stok Keluar</label>
          <div className="mt-2 flex gap-x-4">
            <label className="flex items-center">
              <input type="radio" name="stockType" value="shoe" checked={stockType === 'shoe'} onChange={() => handleStockTypeChange('shoe')} className="h-4 w-4 text-cyan-600 border-gray-300 focus:ring-cyan-500" />
              <span className="ml-2 text-sm text-slate-200">Stok Sepatu</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="stockType" value="leather" checked={stockType === 'leather'} onChange={() => handleStockTypeChange('leather')} className="h-4 w-4 text-cyan-600 border-gray-300 focus:ring-cyan-500" />
              <span className="ml-2 text-sm text-slate-200">Stok Kulit</span>
            </label>
          </div>
        </div>

        {stockType === 'shoe' && (
          <div>
            <label htmlFor="warehouse" className="block text-sm font-medium text-slate-300">Pilih Gudang Sepatu</label>
            <select 
              id="warehouse" 
              value={selectedWarehouse} 
              onChange={(e) => {
                setSelectedWarehouse(e.target.value as WarehouseCategory);
                setSelectedItem('');
              }} 
              className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="" disabled>-- Pilih Gudang --</option>
              {shoeWarehouses.map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="item" className="block text-sm font-medium text-slate-300">Pilih Barang</label>
          <select 
            id="item" 
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            disabled={(stockType === 'shoe' && (!selectedWarehouse || availableItems.length === 0)) || (stockType === 'leather' && availableItems.length === 0)}
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-slate-800 disabled:text-slate-500"
          >
            <option value="" disabled>
              {availableItems.length === 0 ? '-- Tidak ada stok --' : '-- Pilih Barang --'}
            </option>
            {availableItems.map(item => (
              <option key={item.id} value={item.id}>
                { 'shoeType' in item 
                  ? `${(item as InventoryItem).shoeType} (No. ${(item as InventoryItem).size}) - Stok: ${item.quantity}`
                  : `${(item as LeatherInventoryItem).name} (Supplier: ${(item as LeatherInventoryItem).supplier}) - Stok: ${item.quantity} kaki`
                }
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
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
                <label htmlFor="releasedTo" className="block text-sm font-medium text-slate-300">Dikeluarkan Kepada</label>
                <select 
                    id="releasedTo" 
                    value={releasedTo} 
                    onChange={(e) => setReleasedTo(e.target.value)} 
                    className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                    required
                >
                    <option value="" disabled>-- Pilih Maklun --</option>
                    {maklunMasters.map(master => (
                    <option key={master.id} value={master.name}>{master.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        {maklunMasters.length === 0 && (
            <p className="text-amber-400 text-sm p-3 bg-amber-500/10 rounded-md">
                Data master maklun kosong. Silakan tambahkan data melalui 'Master Maklun' terlebih dahulu.
            </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Batal</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-md" disabled={maklunMasters.length === 0}>Konfirmasi Keluar</button>
        </div>
      </form>
    </Modal>
  );
};