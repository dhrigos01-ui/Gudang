import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from './Modal';
import { WarehouseCategory, ShoeMaster, MaklunMaster } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
import * as api from '../lib/api';

interface StockInModalProps {
  onClose: () => void;
  onStockAdded: () => void;
  shoeMasters: ShoeMaster[];
  maklunMasters: MaklunMaster[];
}

export const StockInModal: React.FC<StockInModalProps> = ({ onClose, onStockAdded, shoeMasters, maklunMasters }) => {
  const [selectedShoeType, setSelectedShoeType] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState('');
  const [warehouse, setWarehouse] = useState<WarehouseCategory | ''>('');
  const [sourceType, setSourceType] = useState<'pabrik' | 'maklun'>('pabrik');
  const [sourceName, setSourceName] = useState('');
  const [entryDate, setEntryDate] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Jika gudang bukan Upper (WIP), Molding (NEARLY_FINISHED), atau Stok Gudang (FINISHED_GOODS), paksa sumber menjadi Pabrik
  useEffect(() => {
    if (
      warehouse !== WarehouseCategory.WIP &&
      warehouse !== WarehouseCategory.NEARLY_FINISHED &&
      warehouse !== WarehouseCategory.FINISHED_GOODS &&
      sourceType === 'maklun'
    ) {
      setSourceType('pabrik');
      setSourceName('');
    }
  }, [warehouse, sourceType]);

  const availableSizes = useMemo(() => {
    const master = shoeMasters.find(m => m.shoeType === selectedShoeType);
    return master ? master.sizes : [];
  }, [selectedShoeType, shoeMasters]);

  const handleShoeTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedShoeType(e.target.value);
    setSelectedSize(''); // Reset size selection when shoe type changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const quantityNum = parseInt(quantity, 10);
    const sizeNum = parseInt(selectedSize, 10);

    if (!selectedShoeType || !selectedSize || isNaN(quantityNum) || quantityNum <= 0) {
      setError('Semua field harus diisi dengan nilai yang valid.');
      setIsLoading(false);
      return;
    }
    if (!warehouse) {
      setError('Silakan pilih jenis gudang.');
      setIsLoading(false);
      return;
    }
    if (sourceType === 'maklun' && !sourceName.trim()) {
      setError('Nama sumber Maklun harus dipilih.');
      setIsLoading(false);
      return;
    }
    
    try {
      const source = sourceType === 'maklun' ? sourceName.trim() : 'Pabrik';
      await api.addStock({ shoeType: selectedShoeType, size: sizeNum }, quantityNum, warehouse as WarehouseCategory, source, entryDate);
      onStockAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
        setIsLoading(false);
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
          <select id="warehouse" value={warehouse} onChange={(e) => setWarehouse(e.target.value as WarehouseCategory | '')} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" required>
            <option value="" disabled>-- Pilih jenis gudang --</option>
            {Object.values(WarehouseCategory).filter(v => v !== 'leather').map(key => (
              <option key={key} value={key}>{WAREHOUSE_NAMES[key]}</option>
            ))}
          </select>
        </div>
        {warehouse && (
          <div>
            <label className="block text-sm font-medium text-slate-300">Sumber Stok</label>
            <div className="mt-2 flex gap-x-4">
              <label className="flex items-center">
                <input type="radio" name="sourceType" value="pabrik" checked={sourceType === 'pabrik'} onChange={() => setSourceType('pabrik')} className="h-4 w-4 text-cyan-600 border-gray-300 focus:ring-cyan-500" />
                <span className="ml-2 text-sm text-slate-200">Pabrik</span>
              </label>
              {(warehouse === WarehouseCategory.WIP || warehouse === WarehouseCategory.NEARLY_FINISHED || warehouse === WarehouseCategory.FINISHED_GOODS) && (
                <label className="flex items-center">
                  <input type="radio" name="sourceType" value="maklun" checked={sourceType === 'maklun'} onChange={() => setSourceType('maklun')} className="h-4 w-4 text-cyan-600 border-gray-300 focus:ring-cyan-500" />
                  <span className="ml-2 text-sm text-slate-200">
                    {warehouse === WarehouseCategory.NEARLY_FINISHED
                      ? 'Siapa yang mengerjakan'
                      : warehouse === WarehouseCategory.FINISHED_GOODS
                      ? 'Maklun Sepatu tempel'
                      : 'Maklun'}
                  </span>
                </label>
              )}
            </div>
          </div>
        )}

        {sourceType === 'maklun' && (warehouse === WarehouseCategory.WIP || warehouse === WarehouseCategory.NEARLY_FINISHED || warehouse === WarehouseCategory.FINISHED_GOODS) && (
          <div>
            <label htmlFor="sourceName" className="block text-sm font-medium text-slate-300">{warehouse === WarehouseCategory.NEARLY_FINISHED ? 'Siapa yang mengerjakan' : 'Nama Sumber (Maklun)'}</label>
             <select 
              id="sourceName" 
              value={sourceName} 
              onChange={(e) => setSourceName(e.target.value)} 
              className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              required
            >
              <option value="" disabled>-- Pilih --</option>
              {maklunMasters.map(master => (
                <option key={master.id} value={master.name}>{master.name}</option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        {!shoeMasters || shoeMasters.length === 0 && (
            <p className="text-amber-400 text-sm p-3 bg-amber-500/10 rounded-md">
                Data master sepatu kosong. Silakan tambahkan data melalui 'Master Data' terlebih dahulu.
            </p>
        )}
        
        {sourceType === 'maklun' && (!maklunMasters || maklunMasters.length === 0) && (
            <p className="text-amber-400 text-sm p-3 bg-amber-500/10 rounded-md">
                Data master maklun kosong. Silakan tambahkan data melalui 'Master Maklun' terlebih dahulu.
            </p>
        )}


        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Batal</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 rounded-md" disabled={isLoading || !shoeMasters || shoeMasters.length === 0 || (sourceType === 'maklun' && maklunMasters.length === 0)}>
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
