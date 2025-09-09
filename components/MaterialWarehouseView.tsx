import React, { useState, useMemo } from 'react';
// FIX: Use LeatherInventoryItem type as MaterialInventoryItem does not exist.
import { LeatherInventoryItem, WarehouseCategory } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
import { Card } from './Card';

interface MaterialWarehouseViewProps {
  // FIX: Update prop type to use LeatherInventoryItem.
  items: LeatherInventoryItem[];
}

export const MaterialWarehouseView: React.FC<MaterialWarehouseViewProps> = ({ items }) => {
  const [filter, setFilter] = useState('');

  const filteredItems = useMemo(() => {
    if (!filter.trim()) {
      return items;
    }
    const lowerCaseFilter = filter.toLowerCase().trim();
    // FIX: Removed filtering by 'unit' as it does not exist on LeatherInventoryItem.
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerCaseFilter) ||
      item.supplier.toLowerCase().includes(lowerCaseFilter)
    );
  }, [items, filter]);

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        {/* FIX: Use WarehouseCategory.LEATHER as RAW_MATERIALS does not exist. */}
        <h2 className="text-2xl font-bold text-white">{WAREHOUSE_NAMES[WarehouseCategory.LEATHER]}</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Cari jenis kulit..."
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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jenis Kulit</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Supplier</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Jumlah Stok (kaki)</th>
            </tr>
          </thead>
          <tbody className="bg-slate-800/50 divide-y divide-slate-700">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-white font-semibold">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-300">{item.supplier}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium text-right">{item.quantity}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-10 text-slate-400">
                  {items.length > 0 ? 'Tidak ada jenis kulit yang cocok dengan filter.' : 'Tidak ada stok di gudang ini.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};