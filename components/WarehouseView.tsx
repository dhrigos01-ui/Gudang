import React, { useEffect, useMemo, useState } from 'react';
import { InventoryItem, ShoeMaster, User, UserRole, WarehouseCategory } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
import { Card } from './Card';
import { InputFinishingModal } from './InputFinishingModal';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface WarehouseViewProps {
  category: WarehouseCategory;
  items: InventoryItem[];
  onEditRequest: (item: InventoryItem) => void;
  onDeleteRequest: (item: InventoryItem) => void;
  currentUser: User;
  onDataChanged?: () => void;
  shoeMasters: ShoeMaster[];
}

const WarehouseViewComponent: React.FC<WarehouseViewProps> = ({ category, items, onEditRequest, onDeleteRequest, currentUser, onDataChanged, shoeMasters }) => {
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilter(filter), 300);
    return () => clearTimeout(t);
  }, [filter]);
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const [isInputFinishingOpen, setIsInputFinishingOpen] = useState<boolean>(false);

  const groupedAndFilteredItems = useMemo(() => {
    // Peta stok aktual: shoeType-size -> item
    const mapByTypeAndSize = new Map<string, InventoryItem>();
    for (const it of items) {
      mapByTypeAndSize.set(`${it.shoeType}__${it.size}`, it);
    }

    // Bangun grup berdasarkan master agar semua Jenis dan Ukuran tampil meski 0
    const allGroups: Record<string, InventoryItem[]> = {};
    for (const master of shoeMasters) {
      const sizes = [...master.sizes].sort((a, b) => a - b);
      const rows: InventoryItem[] = sizes.map((size) => {
        const key = `${master.shoeType}__${size}`;
        const found = mapByTypeAndSize.get(key);
        if (found) return found;
        // Sintetis item 0 stok (tanpa id unik nyata, gunakan key gabungan)
        return {
          id: `synthetic-${master.shoeType}-${size}`,
          shoeType: master.shoeType,
          size,
          quantity: 0,
        } as InventoryItem;
      });
      allGroups[master.shoeType] = rows;
    }

    // Filter berdasarkan teks jika ada
    if (!debouncedFilter.trim()) return allGroups;
    const lower = debouncedFilter.toLowerCase().trim();
    return Object.entries(allGroups)
      .filter(([shoeType]) => shoeType.toLowerCase().includes(lower))
      .reduce((acc, [shoeType, rows]) => {
        acc[shoeType] = rows;
        return acc;
      }, {} as Record<string, InventoryItem[]>);
  }, [items, debouncedFilter, shoeMasters]);

  const shoeTypes = Object.keys(groupedAndFilteredItems);
  const totalsByShoeType = useMemo(() => {
    return Object.entries(groupedAndFilteredItems).reduce((acc, [shoeType, shoeItems]) => {
      acc[shoeType] = shoeItems.reduce((sum, item) => sum + item.quantity, 0);
      return acc;
    }, {} as Record<string, number>);
  }, [groupedAndFilteredItems]);

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">{WAREHOUSE_NAMES[category]}</h2>
        {isAdmin && category === WarehouseCategory.FINISHING && (
          <button
            onClick={() => setIsInputFinishingOpen(true)}
            className="px-3 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-md"
          >
            Input Finishing → Gudang
          </button>
        )}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari jenis sepatu..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-64 bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto max-h-[70vh] overflow-y-auto rounded-md">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jenis</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Ukuran</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Stok</th>
              {isAdmin && <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Aksi</th>}
            </tr>
          </thead>
          <tbody className="bg-slate-800/50 divide-y divide-slate-700">
            {shoeTypes.length > 0 ? (
              Object.entries(groupedAndFilteredItems).map(([shoeType, shoeItems]) =>
                (shoeItems.length > 0 ? (
                  shoeItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-700/50">
                      {index === 0 && (
                        <td
                          rowSpan={shoeItems.length}
                          className="px-6 py-4 whitespace-nowrap text-white font-semibold align-top"
                        >
                          {shoeType} <span className="block text-slate-300 text-sm font-normal">Total: {totalsByShoeType[shoeType] || 0}</span>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-center align-middle">
                        {item.size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium text-center align-middle">
                        {item.quantity}
                      </td>
                      {isAdmin && item.quantity > 0 && !item.id.startsWith('synthetic-') && (
                          <td className="px-6 py-4 whitespace-nowrap text-center align-middle">
                          <div className="flex justify-center items-center gap-2">
                              <button 
                              onClick={() => onEditRequest(item)} 
                              className="p-2 text-slate-400 hover:text-amber-300 transition-colors rounded-full hover:bg-slate-600" title="Edit/Penyesuaian Stok">
                              <PencilIcon className="h-5 w-5" />
                              </button>
                              <button 
                              onClick={() => onDeleteRequest(item)} 
                              className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-full hover:bg-slate-600"
                              title="Hapus Stok"
                              >
                              <TrashIcon className="h-5 w-5" />
                              </button>
                          </div>
                          </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr key={shoeType}>
                    <td className="px-6 py-4 whitespace-nowrap text-white font-semibold align-top">
                      {shoeType} <span className="block text-slate-300 text-sm font-normal">Total: 0</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-center align-middle">-</td>
                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium text-center align-middle">0</td>
                    {isAdmin && <td className="px-6 py-4 whitespace-nowrap text-center align-middle">-</td>}
                  </tr>
                ))
              )
            ) : (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="text-center py-10 text-slate-400">
                  Tidak ada stok di gudang ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isInputFinishingOpen && category === WarehouseCategory.FINISHING && (
        <InputFinishingModal
          finishingItems={items}
          onClose={() => setIsInputFinishingOpen(false)}
          onTransferred={() => { setIsInputFinishingOpen(false); onDataChanged && onDataChanged(); }}
        />
      )}
    </Card>
  );
};

export const WarehouseView = React.memo(WarehouseViewComponent);