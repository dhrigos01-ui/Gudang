import React, { useState, useEffect, useCallback } from 'react';
import type { AppData, InventoryItem, Page, WarehouseCategory } from './types';
import { WAREHOUSE_NAMES } from './constants';
import * as inventoryService from './services/inventoryService';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { WarehouseView } from './components/WarehouseView';
import { TransactionHistory } from './components/TransactionHistory';
import { StockInModal } from './components/StockInModal';
import { StockOutModal } from './components/StockOutModal';
import { StockOutGeneralModal } from './components/StockOutGeneralModal';
import { ShoeMasterModal } from './components/ShoeMasterModal';
import { TransferStockModal } from './components/TransferStockModal';

const LoadingScreen: React.FC = () => (
  <div className="fixed inset-0 bg-slate-900 flex flex-col justify-center items-center z-50">
      <svg className="animate-spin h-10 w-10 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-lg text-slate-300">Mempersiapkan Database...</p>
  </div>
);


export default function App() {
  const [data, setData] = useState<AppData>({ inventory: { finished_goods: [], wip: [], nearly_finished: [] }, transactions: [], shoeMasters: [] });
  const [page, setPage] = useState<Page>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isStockOutGeneralModalOpen, setIsStockOutGeneralModalOpen] = useState(false);
  const [isShoeMasterModalOpen, setIsShoeMasterModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [itemToSell, setItemToSell] = useState<InventoryItem | null>(null);

  const reloadData = useCallback(() => {
    try {
        const freshData = inventoryService.getData();
        setData(freshData);
    } catch(e) {
        console.error("Failed to reload data:", e);
        // Bisa ditambahkan state untuk error UI
    }
  }, []);

  useEffect(() => {
    inventoryService.initDB().then(() => {
      reloadData();
      setIsLoading(false);
    });
  }, [reloadData]);

  const handleSellRequest = (item: InventoryItem) => {
    setItemToSell(item);
    setIsStockOutModalOpen(true);
  };
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard inventory={data.inventory} setPage={setPage} />;
      case 'transactions':
        return <TransactionHistory transactions={data.transactions} />;
      default:
        const warehouseCat = page as WarehouseCategory;
        return <WarehouseView 
                 category={warehouseCat} 
                 items={data.inventory[warehouseCat]} 
                 onSellRequest={handleSellRequest}
               />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Header 
        activePage={page} 
        setPage={setPage} 
        onAddStock={() => setIsStockInModalOpen(true)}
        onRemoveStock={() => setIsStockOutGeneralModalOpen(true)}
        onOpenMasterData={() => setIsShoeMasterModalOpen(true)}
        onOpenTransfer={() => setIsTransferModalOpen(true)}
      />
      <main className="p-4 sm:p-6 lg:p-8">
        {renderPage()}
      </main>

      {isStockInModalOpen && (
        <StockInModal
          shoeMasters={data.shoeMasters}
          onClose={() => setIsStockInModalOpen(false)}
          onStockAdded={() => {
            reloadData();
            setIsStockInModalOpen(false);
          }}
        />
      )}
      
      {isStockOutGeneralModalOpen && (
        <StockOutGeneralModal
          inventory={data.inventory}
          onClose={() => setIsStockOutGeneralModalOpen(false)}
          onStockRemoved={() => {
            reloadData();
            setIsStockOutGeneralModalOpen(false);
          }}
        />
      )}

      {isStockOutModalOpen && itemToSell && (
        <StockOutModal
          item={itemToSell}
          onClose={() => {
            setIsStockOutModalOpen(false);
            setItemToSell(null);
          }}
          onStockSold={() => {
            reloadData();
            setIsStockOutModalOpen(false);
            setItemToSell(null);
          }}
        />
      )}

      {isShoeMasterModalOpen && (
        <ShoeMasterModal
          inventory={data.inventory}
          shoeMasters={data.shoeMasters}
          onClose={() => setIsShoeMasterModalOpen(false)}
          onDataChanged={() => {
            reloadData();
            // Tidak menutup modal agar pengguna bisa menambah/edit data lain
          }}
        />
      )}

      {isTransferModalOpen && (
        <TransferStockModal
          inventory={data.inventory}
          onClose={() => setIsTransferModalOpen(false)}
          onStockTransferred={() => {
            reloadData();
            setIsTransferModalOpen(false);
          }}
        />
      )}
    </div>
  );
}