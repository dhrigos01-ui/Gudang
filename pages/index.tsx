import React, { useState, useEffect, useCallback } from 'react';
import type { AppData, InventoryItem, Page, LeatherInventoryItem, User } from '../types';
import { WarehouseCategory, UserRole } from '../types';
import * as api from '../lib/api';
import { Sidebar } from '../components/Sidebar';
import { Dashboard } from '../components/Dashboard';
import { WarehouseView } from '../components/WarehouseView';
import { TransactionHistory } from '../components/TransactionHistory';
import { StockInModal } from '../components/StockInModal';
import { StockOutGeneralModal } from '../components/StockOutGeneralModal';
import { ShoeMasterPage } from '../components/ShoeMasterPage';
import { SaleModal } from '../components/SaleModal';
import { MaklunMasterPage } from '../components/MaklunMasterPage';
import { LeatherMasterPage } from '../components/LeatherMasterPage';
import { StockInLeatherModal } from '../components/StockInLeatherModal';
import { LeatherWarehouseView } from '../components/LeatherWarehouseView';
import { ReturnLeatherModal } from '../components/ReturnLeatherModal';
import { EditShoeStockModal } from '../components/EditShoeStockModal';
import { EditLeatherStockModal } from '../components/EditLeatherStockModal';

interface HomeProps {
    currentUser: User;
    onLogout: () => void;
}

const LoadingScreen: React.FC = () => (
  <div className="fixed inset-0 bg-slate-900 flex flex-col justify-center items-center z-50">
      <svg className="animate-spin h-10 w-10 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-lg text-slate-300">Memuat Data...</p>
  </div>
);

const initialAppData: AppData = {
  inventory: {
    [WarehouseCategory.FINISHED_GOODS]: [],
    [WarehouseCategory.WIP]: [],
    [WarehouseCategory.NEARLY_FINISHED]: [],
    [WarehouseCategory.LEATHER]: [],
  },
  transactions: [],
  shoeMasters: [],
  maklunMasters: [],
  leatherMasters: [],
};

export default function Home({ currentUser, onLogout }: HomeProps) {
  const [data, setData] = useState<AppData>(initialAppData);
  const [page, setPage] = useState<Page>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutGeneralModalOpen, setIsStockOutGeneralModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isStockInLeatherModalOpen, setIsStockInLeatherModalOpen] = useState(false);
  const [isReturnLeatherModalOpen, setIsReturnLeatherModalOpen] = useState(false);

  const [isEditShoeStockModalOpen, setIsEditShoeStockModalOpen] = useState(false);
  const [itemToEditShoe, setItemToEditShoe] = useState<InventoryItem | null>(null);
  const [isEditLeatherStockModalOpen, setIsEditLeatherStockModalOpen] = useState(false);
  const [itemToEditLeather, setItemToEditLeather] = useState<LeatherInventoryItem | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Kunci scroll saat sidebar terbuka di mobile
    if (isSidebarOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isSidebarOpen]);

  const reloadData = useCallback(async () => {
    try {
        const freshData = await api.getData();
        setData(freshData);
    } catch(e) {
        console.error("Failed to reload data:", e);
        if (e instanceof Error && e.message.includes('401')) {
            onLogout(); // If token is invalid, log out
        }
    }
  }, [onLogout]);

  useEffect(() => {
    setIsLoading(true);
    reloadData().finally(() => setIsLoading(false));
  }, [reloadData]);

  const handleDataChanged = () => {
      reloadData();
  }


  const handleEditShoeStockRequest = (item: InventoryItem) => {
    setItemToEditShoe(item);
    setIsEditShoeStockModalOpen(true);
  };

  const handleDeleteShoeStockRequest = async (item: InventoryItem) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus stok ${item.shoeType} No. ${item.size} (${item.quantity} unit) secara permanen? Aksi ini tidak dapat dibatalkan.`)) {
        try {
            await api.deleteShoeStock(item.id);
            reloadData();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Gagal menghapus stok.');
        }
    }
  };
  
  const handleEditLeatherStockRequest = (item: LeatherInventoryItem) => {
    setItemToEditLeather(item);
    setIsEditLeatherStockModalOpen(true);
  };

  const handleDeleteLeatherStockRequest = async (item: LeatherInventoryItem) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus stok ${item.name} dari supplier ${item.supplier} (${item.quantity} kaki) secara permanen? Aksi ini tidak dapat dibatalkan.`)) {
        try {
            await api.deleteLeatherStockByItemId(item.id);
            reloadData();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Gagal menghapus stok.');
        }
    }
  };
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  const renderPage = () => {
    if (currentUser.role === UserRole.USER && ['master_shoe', 'master_leather', 'master_maklun'].includes(page)) {
      setPage('dashboard'); // Redirect
      return <Dashboard inventory={data.inventory} setPage={setPage} />;
    }

    switch (page) {
      case 'dashboard':
        return <Dashboard inventory={data.inventory} setPage={setPage} />;
      case 'transactions':
        return <TransactionHistory transactions={data.transactions} />;
      case 'master_shoe':
        return <ShoeMasterPage shoeMasters={data.shoeMasters} inventory={data.inventory} onDataChanged={handleDataChanged} currentUser={currentUser}/>;
      case 'master_leather':
        return <LeatherMasterPage leatherMasters={data.leatherMasters} leatherInventory={data.inventory.leather} onDataChanged={handleDataChanged} currentUser={currentUser} />;
      case 'master_maklun':
        return <MaklunMasterPage maklunMasters={data.maklunMasters} transactions={data.transactions} onDataChanged={handleDataChanged} currentUser={currentUser} />;
      case WarehouseCategory.LEATHER:
        return <LeatherWarehouseView items={data.inventory.leather} onEditRequest={handleEditLeatherStockRequest} onDeleteRequest={handleDeleteLeatherStockRequest} currentUser={currentUser} />;
      default:
        const warehouseCat = page as Exclude<WarehouseCategory, 'leather'>;
        return <WarehouseView category={warehouseCat} items={data.inventory[warehouseCat] || []} onEditRequest={handleEditShoeStockRequest} onDeleteRequest={handleDeleteShoeStockRequest} currentUser={currentUser} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-200 font-sans">
      {/* Overlay untuk menutup sidebar di mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <Sidebar activePage={page} setPage={(p) => { setPage(p); setIsSidebarOpen(false); }} onAddStock={() => { setIsStockInModalOpen(true); setIsSidebarOpen(false); }} onAddLeather={() => { setIsStockInLeatherModalOpen(true); setIsSidebarOpen(false); }} onRemoveStock={() => { setIsStockOutGeneralModalOpen(true); setIsSidebarOpen(false); }} onOpenTransfer={() => { setIsSaleModalOpen(true); setIsSidebarOpen(false); }} onReturnLeather={() => { setIsReturnLeatherModalOpen(true); setIsSidebarOpen(false); }} currentUser={currentUser} onLogout={onLogout} isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(v => !v)} />
      {/* Topbar */}
      <div className="fixed top-0 left-0 right-0 z-30 h-14 bg-slate-800/80 backdrop-blur border-b border-slate-700 flex items-center px-3 shadow-sm md:hidden">
        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-sm" aria-label="Buka menu">Menu</button>
        <div className="flex-1 text-center">
          <span className="text-white font-semibold">Gudang Sepatu</span>
        </div>
      </div>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pt-20 md:pt-0">
        {renderPage()}
      </main>

      {isStockInModalOpen && (<StockInModal shoeMasters={data.shoeMasters} maklunMasters={data.maklunMasters} onClose={() => setIsStockInModalOpen(false)} onStockAdded={() => { reloadData(); setIsStockInModalOpen(false); }} />)}
      {isStockInLeatherModalOpen && (<StockInLeatherModal leatherMasters={data.leatherMasters} onClose={() => setIsStockInLeatherModalOpen(false)} onStockAdded={() => { reloadData(); setIsStockInLeatherModalOpen(false); }} />)}
      {isStockOutGeneralModalOpen && (<StockOutGeneralModal shoeInventory={data.inventory} leatherInventory={data.inventory.leather} maklunMasters={data.maklunMasters} onClose={() => setIsStockOutGeneralModalOpen(false)} onStockRemoved={() => { reloadData(); setIsStockOutGeneralModalOpen(false); }} />)}
      {isSaleModalOpen && (<SaleModal inventory={data.inventory} onClose={() => setIsSaleModalOpen(false)} onStockSold={() => { reloadData(); setIsSaleModalOpen(false); }} />)}
      {isReturnLeatherModalOpen && (<ReturnLeatherModal leatherMasters={data.leatherMasters} onClose={() => setIsReturnLeatherModalOpen(false)} onStockReturned={() => { reloadData(); setIsReturnLeatherModalOpen(false); }} />)}
      {isEditShoeStockModalOpen && itemToEditShoe && (<EditShoeStockModal item={itemToEditShoe} onClose={() => { setIsEditShoeStockModalOpen(false); setItemToEditShoe(null); }} onStockUpdated={() => { reloadData(); setIsEditShoeStockModalOpen(false); setItemToEditShoe(null); }} />)}
      {isEditLeatherStockModalOpen && itemToEditLeather && (<EditLeatherStockModal item={itemToEditLeather} onClose={() => { setIsEditLeatherStockModalOpen(false); setItemToEditLeather(null); }} onStockUpdated={() => { reloadData(); setIsEditLeatherStockModalOpen(false); setItemToEditLeather(null); }} />)}
    </div>
  );
}
