
import React from 'react';
import { InventoryItem, WarehouseCategory } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
import { Card } from './Card';
import { TagIcon } from './icons/TagIcon';

interface WarehouseViewProps {
  category: WarehouseCategory;
  items: InventoryItem[];
  onSellRequest: (item: InventoryItem) => void;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({ category, items, onSellRequest }) => {
  return (
    <Card>
      <h2 className="text-2xl font-bold text-white mb-4">{WAREHOUSE_NAMES[category]}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jenis Sepatu</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Nomor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jumlah</th>
              {category === WarehouseCategory.FINISHED_GOODS && (
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-slate-800/50 divide-y divide-slate-700">
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.shoeType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{item.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{item.quantity}</td>
                  {category === WarehouseCategory.FINISHED_GOODS && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onSellRequest(item)}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <TagIcon className="h-4 w-4" />
                        Jual
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={category === WarehouseCategory.FINISHED_GOODS ? 4 : 3} className="text-center py-10 text-slate-400">
                  Tidak ada stok di gudang ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
