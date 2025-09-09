import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { WarehouseCategory, ShoeMaster } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
import * as inventoryService from '../services/inventoryService';

interface StockInModalProps {
  onClose: () => void;
  onStockAdded: () => void;
  shoeMasters: ShoeMaster[];
}

export const StockInModal: React.FC<StockInModalProps> = ({ onClose, onStockAdded, shoeMasters }) => {
  const [selectedShoeType, setSelectedShoeType] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState('');
  const [warehouse, setWarehouse] = useState<WarehouseCategory>(WarehouseCategory.WIP);
  const [sourceType, setSourceType] = useState<'internal' | 'external'>('internal');
  const [sourceName, setSourceName] = useState('');
  const [error, setError] = useState('');

  const availableSizes = useMemo(() => {
    const master = shoeMasters.find(m => m.shoeType === selectedShoeType);
    return master ? master.sizes : [];
  }, [selectedShoeType, shoeMasters]);

  const handleShoeTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedShoeType(e.target.value);
    setSelectedSize(''); // Reset size selection when shoe type changes
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const quantityNum = parseInt(quantity, 10);
    const sizeNum = parseInt(selectedSize, 10);

    if (!selectedShoeType || !selectedSize || isNaN(quantityNum) || quantityNum <= 0) {
      setError('Semua field harus diisi dengan nilai yang valid.');
      return;
    }
    if (sourceType === 'external' && !sourceName.trim()) {
      setError('Nama sumber eksternal harus diisi.');
      return;
    }
    
    try {
      const source = sourceType === 'external' ? sourceName.trim() : 'Internal';
      inventoryService.addStock({ shoeType: selectedShoeType, size: sizeNum }, quantityNum, warehouse, source);
      onStockAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <Modal title="Tambah Stok Masuk" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="shoeType" className="block text-sm font-medium text-slate-300">Jenis Sepatu</label>
          <select 
            id="shoeType" 
            value={selectedShoeType} 
            onChange={handleShoeTypeChange} 
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            required
          >
            <option value="" disabled>-- Pilih Jenis Sepatu --</option>
            {shoeMasters.map(master => (
              <option key={master.id} value={master.shoeType}>{master.shoeType}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="size" className="block text-sm font-medium text-slate-300">Nomor</label>
            <select 
              id="size" 
              value={selectedSize} 
              onChange={(e) => setSelectedSize(e.target.value)} 
              className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-slate-800 disabled:text-slate-500"
              disabled={availableSizes.length === 0}
              required
            >
              <option value="" disabled>-- Pilih Ukuran --</option>
              {availableSizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-slate-300">Jumlah</label>
            <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" min="1" required />
          </div>
        </div>
        <div>
          <label htmlFor="warehouse" className="block text-sm font-medium text-slate-300">Masukkan ke Gudang</label>
          <select id="warehouse" value={warehouse} onChange={(e) => setWarehouse(e.target.value as WarehouseCategory)} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500">
            {Object.entries(WAREHOUSE_NAMES).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Sumber Stok</label>
          <div className="mt-2 flex gap-x-4">
            <label className="flex items-center">
              <input type="radio" name="sourceType" value="internal" checked={sourceType === 'internal'} onChange={() => setSourceType('internal')} className="h-4 w-4 text-cyan-600 border-gray-300 focus:ring-cyan-500" />
              <span className="ml-2 text-sm text-slate-200">Internal</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="sourceType" value="external" checked={sourceType === 'external'} onChange={() => setSourceType('external')} className="h-4 w-4 text-cyan-600 border-gray-300 focus:ring-cyan-500" />
              <span className="ml-2 text-sm text-slate-200">Eksternal</span>
            </label>
          </div>
        </div>

        {sourceType === 'external' && (
          <div>
            <label htmlFor="sourceName" className="block text-sm font-medium text-slate-300">Nama Sumber (Pemasok)</label>
            <input type="text" id="sourceName" value={sourceName} onChange={(e) => setSourceName(e.target.value)} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" placeholder="Contoh: PT Pemasok Jaya"/>
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        {!shoeMasters || shoeMasters.length === 0 && (
            <p className="text-amber-400 text-sm p-3 bg-amber-500/10 rounded-md">
                Data master sepatu kosong. Silakan tambahkan data melalui tombol 'Master Data' di header terlebih dahulu.
            </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Batal</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 rounded-md" disabled={!shoeMasters || shoeMasters.length === 0}>Simpan</button>
        </div>
      </form>
    </Modal>
  );
};