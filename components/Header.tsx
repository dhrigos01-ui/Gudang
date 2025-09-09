import React from 'react';
import { type Page, WarehouseCategory } from '../types';
import { ShoeIcon } from './icons/ShoeIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

interface HeaderProps {
  activePage: Page;
  setPage: (page: Page) => void;
  onAddStock: () => void;
  onRemoveStock: () => void;
  onOpenMasterData: () => void;
  onOpenTransfer: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activePage, setPage, onAddStock, onRemoveStock, onOpenMasterData, onOpenTransfer }) => {
  const navItems: { id: Page; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: WarehouseCategory.FINISHED_GOODS, label: 'Stok Jadi' },
    { id: WarehouseCategory.NEARLY_FINISHED, label: 'Hampir Jadi' },
    { id: WarehouseCategory.WIP, label: '1/2 Jadi' },
    { id: 'transactions', label: 'Transaksi' },
  ];

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10 shadow-lg shadow-slate-900/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <ShoeIcon className="h-8 w-8 text-cyan-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">Gudang Sepatu</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activePage === item.id
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMasterData}
              className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 transform hover:scale-105 shadow-md"
            >
              <ListBulletIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Master Data</span>
            </button>
            <button
              onClick={onOpenTransfer}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 transform hover:scale-105 shadow-md"
            >
              <ArrowPathIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Transfer Stok</span>
            </button>
            <button
              onClick={onRemoveStock}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 transform hover:scale-105 shadow-md"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Barang Keluar</span>
            </button>
            <button
              onClick={onAddStock}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 transform hover:scale-105 shadow-md"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Tambah Stok</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
