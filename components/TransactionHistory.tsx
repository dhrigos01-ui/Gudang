import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
import { Card } from './Card';
import { DownloadIcon } from './icons/DownloadIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (sortOrder === 'asc') {
        return dateA - dateB;
      }
      return dateB - dateA; // desc
    });
  }, [transactions, sortOrder]);
  
  const toggleSortOrder = () => {
    setSortOrder(currentOrder => (currentOrder === 'desc' ? 'asc' : 'desc'));
  };

  const handleExport = () => {
    const headers = [
      "Tanggal",
      "Waktu",
      "Jenis Transaksi",
      "Tipe Sepatu",
      "Nomor",
      "Jumlah",
      "Gudang",
      "Sumber (IN)",
      "Keterangan (OUT)"
    ];

    const rows = sortedTransactions.map(tx => {
      const date = new Date(tx.date);
      return [
        date.toLocaleDateString('id-ID'),
        date.toLocaleTimeString('id-ID'),
        tx.type,
        `"${tx.item.shoeType.replace(/"/g, '""')}"`,
        tx.item.size,
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Riwayat Transaksi</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 transform hover:scale-105 shadow-md"
        >
          <DownloadIcon className="h-5 w-5" />
          Ekspor ke Excel
        </button>
      </div>
       <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                <button onClick={toggleSortOrder} className="flex items-center gap-1 hover:text-white transition-colors">
                  Tanggal
                  {sortOrder === 'desc' ? <ArrowDownIcon className="h-4 w-4" /> : <ArrowUpIcon className="h-4 w-4" />}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jenis</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Barang</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jumlah</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Gudang</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Sumber/Keterangan</th>
            </tr>
          </thead>
          <tbody className="bg-slate-800/50 divide-y divide-slate-700">
            {sortedTransactions.length > 0 ? (
              sortedTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{new Date(tx.date).toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      tx.type === TransactionType.IN ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{`${tx.item.shoeType} (No. ${tx.item.size})`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{tx.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{WAREHOUSE_NAMES[tx.warehouse]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{tx.source || tx.notes || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  Belum ada transaksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};