import React, { useMemo, useState } from 'react';
import { InventoryItem, WarehouseCategory } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
import { Card } from './Card';
import { TagIcon } from './icons/TagIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface WarehouseViewProps {
  category: WarehouseCategory;
  items: InventoryItem[];
  onSellRequest: (item: InventoryItem) => void;
  onEditRequest: (item: InventoryItem) => void;
  onDeleteRequest: (item: InventoryItem) => void;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({ category, items, onSellRequest, onEditRequest, onDeleteRequest }) => {
  const [filter, setFilter] = useState('');

  const groupedAndFilteredItems = useMemo(() => {
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.shoeType]) {
        acc[item.shoeType] = [];
      }
      acc[item.shoeType].push(item);
      acc[item.shoeType].sort((a, b) => a.size - b.size);
      return acc;
    }, {} as Record<string, InventoryItem[]>);

    if (!filter.trim()) {
      return grouped;
    }

    return Object.entries(grouped)
      .filter(([shoeType]) => shoeType.toLowerCase().includes(filter.toLowerCase().trim()))
      .reduce((acc, [shoeType, items]) => {
        acc[shoeType] = items;
        return acc;
      }, {} as Record<string, InventoryItem[]>);
      
  }, [items, filter]);

  const shoeTypes = Object.keys(groupedAndFilteredItems);

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">{WAREHOUSE_NAMES[category]}</h2>
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

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jenis</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Ukuran</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Stok</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-slate-800/50 divide-y divide-slate-700">
            {shoeTypes.length > 0 ? (
              Object.entries(groupedAndFilteredItems).map(([shoeType, shoeItems]) =>
                shoeItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-700/50">
                    {index === 0 && (
                      <td
                        rowSpan={shoeItems.length}
                        className="px-6 py-4 whitespace-nowrap text-white font-semibold align-top"
                      >
                        {shoeType}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-center align-middle">
                      {item.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium text-center align-middle">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center align-middle">
                      <div className="flex justify-center items-center gap-2">
                        {category === WarehouseCategory.FINISHED_GOODS && (
                          <button
                            onClick={() => onSellRequest(item)}
                            className="inline-flex items-center justify-center gap-1 text-sm bg-cyan-600/50 text-cyan-300 hover:bg-cyan-600 hover:text-white transition-colors rounded px-3 py-1"
                            title="Jual"
                          >
                            <TagIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Jual</span>
                          </button>
                        )}
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
                  </tr>
                ))
              )
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-10 text-slate-400">
                  {items.length > 0 ? 'Tidak ada jenis sepatu yang cocok dengan filter.' : 'Tidak ada stok di gudang ini.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};