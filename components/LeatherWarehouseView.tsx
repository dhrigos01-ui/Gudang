import React, { useState, useMemo } from 'react';
import { LeatherInventoryItem, User, UserRole, WarehouseCategory } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
import { Card } from './Card';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';


interface LeatherWarehouseViewProps {
  items: LeatherInventoryItem[];
  onEditRequest: (item: LeatherInventoryItem) => void;
  onDeleteRequest: (item: LeatherInventoryItem) => void;
  currentUser: User;
}

export const LeatherWarehouseView: React.FC<LeatherWarehouseViewProps> = ({ items, onEditRequest, onDeleteRequest, currentUser }) => {
  const [filter, setFilter] = useState('');
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const groupedAndFilteredItems = useMemo(() => {
    // 1. Group items by name
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.name]) {
        acc[item.name] = [];
      }
      acc[item.name].push(item);
      // Sort by supplier name
      acc[item.name].sort((a, b) => a.supplier.localeCompare(b.supplier));
      return acc;
    }, {} as Record<string, LeatherInventoryItem[]>);

    // 2. Filter grouped items based on the search query
    if (!filter.trim()) {
      return grouped;
    }

    return Object.entries(grouped)
      .filter(([name]) => name.toLowerCase().includes(filter.toLowerCase().trim()))
      .reduce((acc, [name, items]) => {
        acc[name] = items;
        return acc;
      }, {} as Record<string, LeatherInventoryItem[]>);
      
  }, [items, filter]);

  const leatherTypes = Object.keys(groupedAndFilteredItems);

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
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

      <div className="overflow-x-auto max-h-[70vh] overflow-y-auto rounded-md">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jenis Kulit</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Supplier</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Jumlah Stok (kaki)</th>
              {isAdmin && <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Aksi</th>}
            </tr>
          </thead>
          <tbody className="bg-slate-800/50 divide-y divide-slate-700">
            {leatherTypes.length > 0 ? (
              Object.entries(groupedAndFilteredItems).map(([leatherName, leatherItems]) => (
                <React.Fragment key={leatherName}>
                  {leatherItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-700/50">
                      {index === 0 && (
                        <td
                          rowSpan={leatherItems.length}
                          className="px-6 py-4 whitespace-nowrap text-white font-semibold align-top"
                        >
                          {leatherName}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300 align-middle">
                        {item.supplier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium text-right align-middle">
                        {item.quantity}
                      </td>
                      {isAdmin && (
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
                  ))}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="text-center py-10 text-slate-400">
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