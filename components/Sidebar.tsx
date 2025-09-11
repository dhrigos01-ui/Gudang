import React from 'react';
import { type Page, WarehouseCategory, User, UserRole } from '../types';
import { ShoeIcon } from './icons/ShoeIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { BuildingStorefrontIcon } from './icons/BuildingStorefrontIcon';
import { CubeIcon } from './icons/CubeIcon';
import { ArrowUturnLeftIcon } from './icons/ArrowUturnLeftIcon';

interface SidebarProps {
  activePage: Page;
  setPage: (page: Page) => void;
  onAddStock: () => void;
  onAddLeather: () => void;
  onRemoveStock: () => void;
  onOpenTransfer: () => void;
  onReturnLeather: () => void;
  currentUser: User;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    activePage, setPage, onAddStock, onAddLeather, onRemoveStock, 
    onOpenTransfer,
    onReturnLeather,
    currentUser,
    onLogout,
    isOpen,
    onToggle
}) => {
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const mainNavItems: { id: Page; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: WarehouseCategory.FINISHED_GOODS, label: 'Stok Gudang' },
    { id: WarehouseCategory.NEARLY_FINISHED, label: 'Stok Molding' },
    { id: WarehouseCategory.WIP, label: 'Stok Upper' },
    { id: WarehouseCategory.LEATHER, label: 'Stok Kulit'},
    { id: 'transactions', label: 'Riwayat Histori' },
  ];

  const masterNavItems: { id: Page; label: string, icon: React.ReactNode }[] = [
      { id: 'master_shoe', label: 'Master Sepatu', icon: <ListBulletIcon className="h-5 w-5 mr-3" /> },
      { id: 'master_leather', label: 'Master Kulit', icon: <CubeIcon className="h-5 w-5 mr-3" /> },
      { id: 'master_maklun', label: 'Master Maklun', icon: <BuildingStorefrontIcon className="h-5 w-5 mr-3" /> },
  ];

  const actionItems = [
    { label: 'Penjualan Barang', onClick: onOpenTransfer, icon: <ArrowPathIcon className="h-5 w-5" />, className: 'bg-green-500 hover:bg-green-600' },
    { label: 'Retur Kulit', onClick: onReturnLeather, icon: <ArrowUturnLeftIcon className="h-5 w-5" />, className: 'bg-orange-500 hover:bg-orange-600' },
    { label: 'Barang Keluar', onClick: onRemoveStock, icon: <ArrowLeftOnRectangleIcon className="h-5 w-5" />, className: 'bg-amber-500 hover:bg-amber-600' },
    { label: 'Tambah Stok Sepatu', onClick: onAddStock, icon: <PlusIcon className="h-5 w-5" />, className: 'bg-cyan-500 hover:bg-cyan-600' },
    { label: 'Tambah Kulit', onClick: onAddLeather, icon: <PlusIcon className="h-5 w-5" />, className: 'bg-cyan-500 hover:bg-cyan-600' },
  ];

  const renderNavButton = (item: {id: Page, label: string, icon?: React.ReactNode}) => (
    <button
        key={item.id}
        onClick={() => setPage(item.id)}
        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
          activePage === item.id
            ? 'bg-cyan-500 text-white'
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
      >
        {item.icon}
        {item.label}
    </button>
  );

  return (
    <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-800 flex flex-col h-full border-r border-slate-700 z-40 transform transition-transform duration-200 ease-in-out will-change-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <ShoeIcon className="h-8 w-8 text-cyan-400" />
          <h1 className="text-xl font-bold tracking-tight text-white">Gudang Sepatu</h1>
        </div>
        <button onClick={onToggle} className="md:hidden text-slate-400 hover:text-white">✕</button>
      </div>

      <div className="p-2 flex-1 overflow-y-auto">
        <div className="space-y-1 pr-1">
          <p className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
          {mainNavItems.map(item => renderNavButton(item))}
          {isAdmin && (
              <>
                  <p className="px-2 pt-4 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Master Data</p>
                  {masterNavItems.map(item => renderNavButton(item))}
              </>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="p-2 border-t border-slate-700 space-y-2">
          <p className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Aksi</p>
          {actionItems.map((action) => (
              <button
                  key={action.label}
                  onClick={action.onClick}
                  className={`w-full flex items-center justify-start gap-3 ${action.className} text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 transform hover:scale-105 shadow-md`}
              >
                  {action.icon}
                  <span className="text-sm">{action.label}</span>
              </button>
          ))}
        </div>
      )}

      <div className="mt-auto p-2 border-t border-slate-700">
        <div className="p-2">
            <p className="text-sm text-slate-400">Login sebagai: <span className="font-bold text-white">{currentUser.username} ({currentUser.role})</span></p>
            <button
                onClick={onLogout}
                className="w-full mt-2 text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center text-slate-300 hover:bg-slate-700 hover:text-white"
            >
                <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3 transform rotate-180" />
                Logout
            </button>
        </div>
      </div>
    </aside>
  );
};