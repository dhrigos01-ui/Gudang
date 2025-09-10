import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, WarehouseCategory, Shoe } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
import { Card } from './Card';
import { DownloadIcon } from './icons/DownloadIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const isShoe = (item: any): item is Shoe => {
    return 'shoeType' in item;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    warehouse: '' as WarehouseCategory | '',
    search: '',
    transactionType: '' as TransactionType | '' | 'RETURN',
  });

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply filters
    if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(tx => new Date(tx.date) >= startDate);
    }
    if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(tx => new Date(tx.date) <= endDate);
    }
    if (filters.warehouse) {
        filtered = filtered.filter(tx => tx.warehouse === filters.warehouse);
    }
     if (filters.transactionType) {
        if (filters.transactionType === 'RETURN') {
            filtered = filtered.filter(tx => tx.type === TransactionType.IN && tx.source === 'Retur');
        } else if (filters.transactionType === TransactionType.IN) {
            filtered = filtered.filter(tx => tx.type === TransactionType.IN && tx.source !== 'Retur');
        } else { // OUT
            filtered = filtered.filter(tx => tx.type === filters.transactionType);
        }
    }
    if (filters.search.trim()) {
        const lowerCaseSearch = filters.search.toLowerCase().trim();
        filtered = filtered.filter(tx => {
            const itemText = isShoe(tx.item)
                ? `${tx.item.shoeType}`
                : `${tx.item.name}`;

            return (tx.source && tx.source.toLowerCase().includes(lowerCaseSearch)) ||
                   (tx.notes && tx.notes.toLowerCase().includes(lowerCaseSearch)) ||
                   (itemText.toLowerCase().includes(lowerCaseSearch));
        });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (sortOrder === 'asc') {
        return dateA - dateB;
      }
      return dateB - dateA; // desc
    });
  }, [transactions, sortOrder, filters]);
  
  const toggleSortOrder = () => {
    setSortOrder(currentOrder => (currentOrder === 'desc' ? 'asc' : 'desc'));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
        startDate: '',
        endDate: '',
        warehouse: '',
        search: '',
        transactionType: '',
    });
  };

  const handleExport = () => {
    const headers = [
      "Tanggal", "Waktu", "Jenis Transaksi", "Barang", "Nomor/Satuan", "Jumlah",
      "Gudang", "Sumber (IN)", "Keterangan (OUT)"
    ];

    const rows = filteredAndSortedTransactions.map(tx => {
      const date = new Date(tx.date);
      const itemDetails = isShoe(tx.item)
        ? [`"${tx.item.shoeType.replace(/"/g, '""')}"`, tx.item.size]
        : [`"${tx.item.name.replace(/"/g, '""')}"`, 'kaki'];
      
      return [
        date.toLocaleDateString('id-ID'),
        date.toLocaleTimeString('id-ID'),
        tx.type,
        ...itemDetails,
        tx.quantity,
        WAREHOUSE_NAMES[tx.warehouse],
        `"${tx.source?.replace(/"/g, '""') || ''}"`,
        `"${tx.notes?.replace(/"/g, '""') || ''}"`,
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + rows.join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `laporan_transaksi_${timestamp}.csv`);
    document.body.appendChild(link); 
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4 px-2 sm:px-0">
        <h2 className="text-2xl font-bold text-white">Riwayat Histori</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 transform hover:scale-105 shadow-md"
        >
          <DownloadIcon className="h-5 w-5" />
          Ekspor ke Excel
        </button>
      </div>

      {/* Filter Panel */}
      <div className="mb-6 p-3 sm:p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-1">Dari Tanggal</label>
            <input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-1">Sampai Tanggal</label>
            <input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
          </div>
          <div>
            <label htmlFor="warehouse" className="block text-sm font-medium text-slate-300 mb-1">Gudang</label>
            <select name="warehouse" id="warehouse" value={filters.warehouse} onChange={handleFilterChange} className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
              <option value="">Semua Gudang</option>
              {Object.entries(WAREHOUSE_NAMES).map(([key, name]) => (
                <option key={key} value={key as WarehouseCategory}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="transactionType" className="block text-sm font-medium text-slate-300 mb-1">Jenis Transaksi</label>
            <select name="transactionType" id="transactionType" value={filters.transactionType} onChange={handleFilterChange} className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
              <option value="">Semua Jenis</option>
              <option value={TransactionType.IN}>IN (Masuk)</option>
              <option value={TransactionType.OUT}>OUT (Keluar)</option>
              <option value="RETURN">Return</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-full">
            <label htmlFor="search" className="block text-sm font-medium text-slate-300 mb-1">Cari Sumber/Ket./Barang</label>
            <input type="text" name="search" id="search" value={filters.search} onChange={handleFilterChange} className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder="Ketik untuk mencari..."/>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={resetFilters} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">
            Reset Filter
          </button>
        </div>
      </div>

       <div className="overflow-x-auto -mx-2 sm:mx-0">
        <table className="min-w-full divide-y divide-slate-700 text-sm">
          <thead className="bg-slate-800">
            <tr>
              <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                <button onClick={toggleSortOrder} className="flex items-center gap-1 hover:text-white transition-colors">
                  Tanggal
                  {sortOrder === 'desc' ? <ArrowDownIcon className="h-4 w-4" /> : <ArrowUpIcon className="h-4 w-4" />}
                </button>
              </th>
              <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jenis</th>
              <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Barang</th>
              <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jumlah</th>
              <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Gudang</th>
              <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Sumber/Keterangan</th>
            </tr>
          </thead>
          <tbody className="bg-slate-800/50 divide-y divide-slate-700">
            {filteredAndSortedTransactions.length > 0 ? (
              filteredAndSortedTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-700/50">
                  <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-slate-300">{new Date(tx.date).toLocaleString('id-ID')}</td>
                  <td className="px-4 sm:px-6 py-3 whitespace-nowrap font-medium">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      tx.type === TransactionType.IN && tx.source === 'Retur' ? 'bg-orange-500/20 text-orange-300' :
                      tx.type === TransactionType.IN ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {tx.type === TransactionType.IN && tx.source === 'Retur' ? 'RETURN' : tx.type}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-white">
                    {isShoe(tx.item) ? `${tx.item.shoeType} (No. ${tx.item.size})` : `${tx.item.name}`}
                  </td>
                  <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-slate-300">{tx.quantity} {tx.warehouse === WarehouseCategory.LEATHER && 'kaki'}</td>
                  <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-slate-300">{WAREHOUSE_NAMES[tx.warehouse]}</td>
                  <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-slate-400">{tx.source || tx.notes || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  Tidak ada transaksi yang cocok dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};