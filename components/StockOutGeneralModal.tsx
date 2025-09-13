import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { AppData, WarehouseCategory, LeatherInventoryItem, InventoryItem, MaklunMaster } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
// FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
import * as api from '../lib/api';

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
  const [entries, setEntries] = useState<Array<{ itemId: string; quantity: string }>>([{ itemId: '', quantity: '' }]);
  const [destinationType, setDestinationType] = useState<'pabrik' | 'maklun' | ''>('pabrik');
  const [releasedTo, setReleasedTo] = useState('');
  const [error, setError] = useState('');
  const [customDate, setCustomDate] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });

  const shoeWarehouses = Object.entries(WAREHOUSE_NAMES).filter(([key]) => key !== WarehouseCategory.LEATHER && key !== WarehouseCategory.FINISHED_GOODS && key !== WarehouseCategory.FINISHING);

  const availableItems = useMemo(() => {
    if (stockType === 'shoe') {
      return selectedWarehouse ? shoeInventory[selectedWarehouse as Exclude<WarehouseCategory, 'leather'>] : [];
    }
    return leatherInventory;
  }, [stockType, selectedWarehouse, shoeInventory, leatherInventory]);

  const addEntryRow = () => setEntries(prev => [...prev, { itemId: '', quantity: '' }]);
  const removeEntryRow = (index: number) => setEntries(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = entries
      .map(r => ({ 
        itemId: r.itemId, 
        qty: stockType === 'leather' ? parseFloat(r.quantity.replace(',', '.')) : parseInt(r.quantity, 10), 
        item: availableItems.find(it => it.id === r.itemId) as any 
      }))
      .filter(r => r.item && !isNaN(r.qty) && r.qty > 0);

    if (parsed.length === 0) {
      setError('Tambahkan minimal satu baris barang dengan jumlah valid.');
      return;
    }
    if (!destinationType) {
      setError('Harap pilih tujuan pengeluaran (Pabrik atau Maklun).');
      return;
    }
    if (destinationType === 'maklun' && !releasedTo.trim()) {
      setError('Penerima barang (Maklun) harus dipilih.');
      return;
    }

    // Validasi stok
    const over = parsed.find(r => r.qty > r.item.quantity);
    if (over) {
      setError(`Jumlah tidak boleh melebihi stok yang ada (${over.item.quantity}).`);
      return;
    }

    // Validasi khusus untuk stok kulit dengan desimal
    if (stockType === 'leather') {
      const invalidDecimal = entries.find(r => {
        if (!r.quantity || !r.itemId) return false;
        const quantityStr = r.quantity.replace(',', '.');
        const qty = parseFloat(quantityStr);
        return isNaN(qty) || qty <= 0 || !/^[0-9]+([,.][0-9]+)?$/.test(r.quantity);
      });
      if (invalidDecimal) {
        setError('Format jumlah untuk stok kulit tidak valid. Gunakan angka dengan koma atau titik untuk desimal (contoh: 1,5 atau 2.5).');
        return;
      }
    }

    try {
      if (stockType === 'shoe' && selectedWarehouse) {
        const destinationName = destinationType === 'pabrik' ? 'Pabrik' : releasedTo;
        await Promise.all(parsed.map(async (r) => {
          if (selectedWarehouse === WarehouseCategory.WIP) {
            await api.transferStock(r.itemId, r.qty, WarehouseCategory.WIP, 'Transfer ke Molding', destinationName, customDate);
          } else if (selectedWarehouse === WarehouseCategory.NEARLY_FINISHED) {
            await api.transferStock(r.itemId, r.qty, WarehouseCategory.NEARLY_FINISHED, 'Transfer ke Finishing', destinationName, customDate);
          } else if (selectedWarehouse === WarehouseCategory.FINISHING) {
            await api.transferStock(r.itemId, r.qty, WarehouseCategory.FINISHING, 'Transfer ke Gudang', destinationName, customDate);
          }
        }));
      } else {
        const releasedToName = destinationType === 'pabrik' ? 'Pabrik' : releasedTo;
        await Promise.all(parsed.map(r => api.removeLeatherStock((r.item as LeatherInventoryItem).id, r.qty, releasedToName, customDate)));
      }
      onStockRemoved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };

  const handleStockTypeChange = (type: StockType) => {
    setStockType(type);
    setSelectedWarehouse('');
    setEntries([{ itemId: '', quantity: '' }]);
    setDestinationType('pabrik');
    setReleasedTo('');
    setError('');
  };

  return (
    <Modal title="Catat Barang Keluar (Non-Penjualan)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="space-y-4 md:col-span-4">
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
                    setEntries([{ itemId: '', quantity: '' }]);
                  }} 
                  className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="" disabled>-- Pilih Gudang --</option>
                  {shoeWarehouses.map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
                {selectedWarehouse && (
                  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                    <p className="text-sm text-blue-300">
                      {selectedWarehouse === WarehouseCategory.WIP && "• Stok Upper akan dipindahkan ke Molding"}
                      {selectedWarehouse === WarehouseCategory.NEARLY_FINISHED && "• Stok Molding akan dipindahkan ke Finishing"}
                      {selectedWarehouse === WarehouseCategory.FINISHING && "• Stok Finishing akan dipindahkan ke Gudang"}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300">Tujuan Pengeluaran</label>
              <div className="mt-2 flex gap-x-4">
                  <label className="flex items-center">
                      <input 
                          type="radio" 
                          name="destinationType" 
                          value="pabrik" 
                          checked={destinationType === 'pabrik'} 
                          onChange={(e) => {
                              setDestinationType(e.target.value as 'pabrik');
                              setReleasedTo('');
                          }} 
                          className="h-4 w-4 text-cyan-600 border-gray-300 focus:ring-cyan-500" 
                      />
                      <span className="ml-2 text-sm text-slate-200">Pabrik</span>
                  </label>
                  <label className="flex items-center">
                      <input 
                          type="radio" 
                          name="destinationType" 
                          value="maklun" 
                          checked={destinationType === 'maklun'} 
                          onChange={(e) => {
                              setDestinationType(e.target.value as 'maklun');
                              setReleasedTo('');
                          }} 
                          className="h-4 w-4 text-cyan-600 border-gray-300 focus:ring-cyan-500" 
                      />
                      <span className="ml-2 text-sm text-slate-200">Maklun</span>
                  </label>
              </div>
            </div>

            {destinationType === 'maklun' && (
                <div>
                    <label htmlFor="releasedTo" className="block text-sm font-medium text-slate-300">Dikeluarkan Kepada</label>
                    <select 
                        id="releasedTo" 
                        value={releasedTo} 
                        onChange={(e) => setReleasedTo(e.target.value)} 
                        className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                        aria-label="Pilih Maklun"
                    >
                        <option value="" disabled>-- Pilih Maklun --</option>
                        {maklunMasters.map(master => (
                        <option key={master.id} value={master.name}>{master.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div>
              <label htmlFor="customDate" className="block text-sm font-medium text-slate-300">Tanggal Transaksi</label>
              <input
                id="customDate"
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div className="space-y-3 md:col-span-8 max-h-[50vh] overflow-y-auto pr-1">
            {entries.map((row, idx) => {
              const selected = availableItems.find(i => i.id === row.itemId) as any;
              const disabled = (stockType === 'shoe' && (!selectedWarehouse || availableItems.length === 0)) || (stockType === 'leather' && availableItems.length === 0);
              return (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-slate-700 p-3 rounded-md bg-slate-800/40">
                  <div className="md:col-span-8">
                    <label className="block text-sm font-medium text-slate-300">Pilih Barang</label>
                    <select 
                      value={row.itemId}
                      onChange={(e) => setEntries(prev => prev.map((r, i) => i === idx ? { ...r, itemId: e.target.value } : r))}
                      disabled={disabled}
                      aria-label="Pilih Barang"
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
                  <div className="md:col-span-4 flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-300">Jumlah Keluar</label>
                      <input 
                        type={stockType === 'leather' ? 'text' : 'number'}
                        value={row.quantity}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Untuk stok kulit, hanya izinkan angka, koma, dan titik
                          if (stockType === 'leather') {
                            const validValue = value.replace(/[^0-9,.]/g, '');
                            setEntries(prev => prev.map((r, i) => i === idx ? { ...r, quantity: validValue } : r));
                          } else {
                            setEntries(prev => prev.map((r, i) => i === idx ? { ...r, quantity: value } : r));
                          }
                        }}
                        min={stockType === 'leather' ? undefined : "1"}
                        max={stockType === 'leather' ? undefined : selected?.quantity}
                        disabled={!row.itemId}
                        aria-label="Jumlah Keluar"
                        placeholder={stockType === 'leather' ? 'Contoh: 1,5 atau 2.5' : ''}
                        className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-slate-800"
                      />
                      
                    </div>
                    <button type="button" onClick={() => removeEntryRow(idx)} className="h-10 mt-6 px-3 text-sm font-medium text-slate-200 bg-slate-600 hover:bg-slate-500 rounded-md" disabled={entries.length === 1}>Hapus</button>
                  </div>
                </div>
              );
            })}
            <div>
              <button type="button" onClick={addEntryRow} className="px-3 py-2 text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-md">Tambah Baris</button>
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {destinationType === 'maklun' && maklunMasters.length === 0 && (
            <p className="text-amber-400 text-sm p-3 bg-amber-500/10 rounded-md">
                Data master maklun kosong. Silakan tambahkan data melalui 'Master Maklun' terlebih dahulu.
            </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Batal</button>
          <button 
            type="submit" 
            className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-md disabled:bg-slate-500 disabled:cursor-not-allowed" 
            disabled={destinationType === 'maklun' && maklunMasters.length === 0}
          >
            Konfirmasi Keluar
          </button>
        </div>
      </form>
    </Modal>
  );
};