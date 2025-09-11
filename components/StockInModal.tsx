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
  const [entries, setEntries] = useState<Array<{ shoeType: string; size: string; quantity: string }>>([{ shoeType: '', size: '', quantity: '' }]);
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

  const sizesByShoeType = useMemo(() => {
    const map: Record<string, number[]> = {};
    shoeMasters.forEach(m => { map[m.shoeType] = m.sizes; });
    return map;
  }, [shoeMasters]);

  const updateEntryField = (index: number, field: 'shoeType' | 'size' | 'quantity', value: string) => {
    setEntries(prev => prev.map((row, i) => {
      if (i !== index) return row;
      if (field === 'shoeType') {
        return { shoeType: value, size: '', quantity: '' };
      }
      return { ...row, [field]: value };
    }));
  };

  const addEntryRow = () => {
    setEntries(prev => [...prev, { shoeType: '', size: '', quantity: '' }]);
  };

  const removeEntryRow = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const isRowValid = (row: { shoeType: string; size: string; quantity: string }) => {
    const sizeNum = parseInt(row.size, 10);
    const qtyNum = parseInt(row.quantity, 10);
    return !!row.shoeType && !isNaN(sizeNum) && !isNaN(qtyNum) && qtyNum > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const parsedEntries = entries
      .map(e => ({ shoeType: e.shoeType, sizeNum: parseInt(e.size, 10), qtyNum: parseInt(e.quantity, 10) }))
      .filter(e => !isNaN(e.sizeNum) && !isNaN(e.qtyNum) && e.qtyNum > 0);

    if (parsedEntries.length === 0) {
      setError('Tambahkan minimal satu baris nomor dengan jumlah yang valid.');
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
      await Promise.all(
        parsedEntries.map(e =>
          api.addStock({ shoeType: e.shoeType, size: e.sizeNum }, e.qtyNum, warehouse as WarehouseCategory, source, entryDate)
        )
      );
      onStockAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Modal title="Tambah Stok Masuk" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Kiri: metadata & sumber */}
          <div className="space-y-4 md:col-span-4">
            <div>
              <label htmlFor="entryDate" className="block text-sm font-medium text-slate-300">Tanggal Masuk</label>
              <input
                type="datetime-local"
                id="entryDate"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="mt-1 block w-full md:max-w-sm bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                required
              />
              <label htmlFor="warehouse" className="block text-sm font-medium text-slate-300 mt-4">Masukkan ke Gudang</label>
              <select id="warehouse" value={warehouse} onChange={(e) => setWarehouse(e.target.value as WarehouseCategory | '')} className="mt-1 block w-full md:max-w-sm bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" required>
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
            {/* Peringatan */}
            {(!shoeMasters || shoeMasters.length === 0) && (
              <p className="text-amber-400 text-sm p-3 bg-amber-500/10 rounded-md">
                Data master sepatu kosong. Silakan tambahkan data melalui 'Master Data' terlebih dahulu.
              </p>
            )}
            {sourceType === 'maklun' && (!maklunMasters || maklunMasters.length === 0) && (
              <p className="text-amber-400 text-sm p-3 bg-amber-500/10 rounded-md">
                Data master maklun kosong. Silakan tambahkan data melalui 'Master Maklun' terlebih dahulu.
              </p>
            )}
          </div>

          {/* Kanan: daftar input barang */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 md:col-span-8">
            {entries.map((row, idx) => {
              const sizes = row.shoeType ? (sizesByShoeType[row.shoeType] || []) : [];
              return (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-slate-700 p-3 rounded-md bg-slate-800/40">
                  <div className="md:col-span-5">
                    <label htmlFor={`shoeType-${idx}`} className="block text-sm font-medium text-slate-300">Jenis Sepatu</label>
                    <select
                      id={`shoeType-${idx}`}
                      value={row.shoeType}
                      onChange={(e) => updateEntryField(idx, 'shoeType', e.target.value)}
                      className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                      required
                    >
                      <option value="" disabled>-- Pilih Jenis --</option>
                      {shoeMasters.map(master => (
                        <option key={master.id} value={master.shoeType}>{master.shoeType}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label htmlFor={`size-${idx}`} className="block text-sm font-medium text-slate-300">Nomor</label>
                    <select
                      id={`size-${idx}`}
                      aria-label="Nomor"
                      value={row.size}
                      onChange={(e) => updateEntryField(idx, 'size', e.target.value)}
                      className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-slate-800 disabled:text-slate-500"
                      disabled={sizes.length === 0}
                      required
                    >
                      <option value="" disabled>-- Pilih Ukuran --</option>
                      {sizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 md:col-span-4">
                    <div className="flex-1">
                      <label htmlFor={`qty-${idx}`} className="block text-sm font-medium text-slate-300">Jumlah</label>
                      <input id={`qty-${idx}`} aria-label="Jumlah" type="number" value={row.quantity} onChange={(e) => updateEntryField(idx, 'quantity', e.target.value)} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" min="1" required />
                    </div>
                    <button type="button" onClick={() => removeEntryRow(idx)} className="h-10 mt-6 px-3 text-sm font-medium text-slate-200 bg-slate-600 hover:bg-slate-500 rounded-md whitespace-nowrap" disabled={entries.length === 1}>Hapus</button>
                  </div>
                </div>
              );
            })}
            <div>
              <button type="button" onClick={addEntryRow} className="px-3 py-2 text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-md">Tambah Baris</button>
            </div>
          </div>
        </div>
        {/* akhir grid dua kolom */}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Batal</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 rounded-md" disabled={isLoading || !shoeMasters || shoeMasters.length === 0 || (sourceType === 'maklun' && maklunMasters.length === 0) || entries.every(e => !isRowValid(e))}>
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
