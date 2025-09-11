import React, { useMemo, useState } from 'react';
import { Modal } from './Modal';
import { InventoryItem, WarehouseCategory } from '../types';
import * as api from '../lib/api';

interface InputFinishingModalProps {
  finishingItems: InventoryItem[];
  onClose: () => void;
  onTransferred: () => void;
}

export const InputFinishingModal: React.FC<InputFinishingModalProps> = ({ finishingItems, onClose, onTransferred }) => {
  const [entries, setEntries] = useState<Array<{ itemId: string; quantity: string }>>([{ itemId: '', quantity: '' }]);
  const [error, setError] = useState<string>('');
  const [customDate, setCustomDate] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = entries
      .map(r => ({ itemId: r.itemId, qty: parseInt(r.quantity, 10), item: finishingItems.find(i => i.id === r.itemId) }))
      .filter(r => r.item && !isNaN(r.qty) && r.qty > 0) as Array<{ itemId: string; qty: number; item: InventoryItem }>;

    if (parsed.length === 0) {
      setError('Tambahkan minimal satu baris jenis dan jumlah yang valid.');
      return;
    }
    const over = parsed.find(r => r.qty > r.item.quantity);
    if (over) {
      setError(`Jumlah tidak boleh melebihi stok (${over.item.quantity}).`);
      return;
    }
    try {
      setIsLoading(true);
      await Promise.all(parsed.map(r => api.transferStock(r.itemId, r.qty, WarehouseCategory.FINISHING, 'Transfer ke Gudang', undefined, customDate)));
      onTransferred();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Input Finishing → Stok Gudang" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="space-y-4 md:col-span-4">
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
            <p className="text-sm text-slate-400">Pilih jenis dari Data Finishing dan masukkan jumlah untuk dipindahkan ke Stok Gudang.</p>
          </div>

          <div className="space-y-3 md:col-span-8 max-h-[50vh] overflow-y-auto pr-1">
          {entries.map((row, idx) => {
            const selected = finishingItems.find(i => i.id === row.itemId);
            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-slate-700 p-3 rounded-md bg-slate-800/40">
                <div className="md:col-span-8">
                  <label className="block text-sm font-medium text-slate-300">Jenis</label>
                  <select
                    value={row.itemId}
                    onChange={(e) => setEntries(prev => prev.map((r, i) => i === idx ? { ...r, itemId: e.target.value } : r))}
                    aria-label="Pilih Jenis"
                    className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="" disabled>-- Pilih Jenis --</option>
                    {finishingItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.shoeType} (No. {item.size}) - Stok: {item.quantity}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-4 flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-300">Jumlah</label>
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={(e) => setEntries(prev => prev.map((r, i) => i === idx ? { ...r, quantity: e.target.value } : r))}
                      min={1}
                      max={selected?.quantity}
                      disabled={!row.itemId}
                      aria-label="Jumlah"
                      className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-slate-800"
                    />
                  </div>
                  <button type="button" onClick={() => setEntries(prev => prev.filter((_, i) => i !== idx))} className="h-10 mt-6 px-3 text-sm font-medium text-slate-200 bg-slate-600 hover:bg-slate-500 rounded-md" disabled={entries.length === 1}>Hapus</button>
                </div>
              </div>
            );
          })}
            <div>
              <button type="button" onClick={() => setEntries(prev => [...prev, { itemId: '', quantity: '' }])} className="px-3 py-2 text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-md">Tambah Baris</button>
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">Batal</button>
          <button type="submit" disabled={isLoading || entries.every(e => !e.itemId || !e.quantity)} className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed">
            {isLoading ? 'Memproses...' : 'Pindahkan ke Gudang'}
          </button>
        </div>
      </form>
    </Modal>
  );
};


