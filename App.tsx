import React, { useState, useEffect, useCallback } from 'react';
import type { AppData, InventoryItem, Page, LeatherInventoryItem } from './types';
import { WarehouseCategory } from './types';
import * as inventoryService from './services/inventoryService';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { WarehouseView } from './components/WarehouseView';
import { TransactionHistory } from './components/TransactionHistory';
import { StockInModal } from './components/StockInModal';
import { StockOutModal } from './components/StockOutModal';
import { StockOutGeneralModal } from './components/StockOutGeneralModal';
import { ShoeMasterPage } from './components/ShoeMasterPage';
import { TransferStockModal } from './components/TransferStockModal';
import { MaklunMasterPage } from './components/MaklunMasterPage';
import { LeatherMasterPage } from './components/LeatherMasterPage';
import { StockInLeatherModal } from './components/StockInLeatherModal';
import { LeatherWarehouseView } from './components/LeatherWarehouseView';
import { ReturnLeatherModal } from './components/ReturnLeatherModal';
import { EditShoeStockModal } from './components/EditShoeStockModal';
import { EditLeatherStockModal } from './components/EditLeatherStockModal';


const LoadingScreen: React.FC = () => (
  <div className="fixed inset-0 bg-slate-900 flex flex-col justify-center items-center z-50">
      <svg className="animate-spin h-10 w-10 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-lg text-slate-300">Mempersiapkan Database...</p>
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


export default function App() {
  const [data, setData] = useState<AppData>(initialAppData);
  const [page, setPage] = useState<Page>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isStockOutGeneralModalOpen, setIsStockOutGeneralModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isStockInLeatherModalOpen, setIsStockInLeatherModalOpen] = useState(false);
  const [isReturnLeatherModalOpen, setIsReturnLeatherModalOpen] = useState(false);
  const [itemToSell, setItemToSell] = useState<InventoryItem | null>(null);

  // States for editing stock
  const [isEditShoeStockModalOpen, setIsEditShoeStockModalOpen] = useState(false);
  const [itemToEditShoe, setItemToEditShoe] = useState<InventoryItem | null>(null);
  const [isEditLeatherStockModalOpen, setIsEditLeatherStockModalOpen] = useState(false);
  const [itemToEditLeather, setItemToEditLeather] = useState<LeatherInventoryItem | null>(null);


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

  const handleEditShoeStockRequest = (item: InventoryItem) => {
    setItemToEditShoe(item);
    setIsEditShoeStockModalOpen(true);
  };

  const handleDeleteShoeStockRequest = (item: InventoryItem) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus stok ${item.shoeType} No. ${item.size} (${item.quantity} unit) secara permanen? Aksi ini tidak dapat dibatalkan.`)) {
        try {
            inventoryService.deleteShoeStock(item.id);
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

  const handleDeleteLeatherStockRequest = (item: LeatherInventoryItem) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus stok ${item.name} dari supplier ${item.supplier} (${item.quantity} kaki) secara permanen? Aksi ini tidak dapat dibatalkan.`)) {
        try {
            inventoryService.deleteLeatherStockByItemId(item.id);
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
    switch (page) {
      case 'dashboard':
        return <Dashboard inventory={data.inventory} setPage={setPage} />;
      case 'transactions':
        return <TransactionHistory transactions={data.transactions} />;
      case 'master_shoe':
        return <ShoeMasterPage shoeMasters={data.shoeMasters} inventory={data.inventory} onDataChanged={reloadData} />;
      case 'master_leather':
        return <LeatherMasterPage leatherMasters={data.leatherMasters} leatherInventory={data.inventory.leather} onDataChanged={reloadData} />;
      case 'master_maklun':
        return <MaklunMasterPage maklunMasters={data.maklunMasters} transactions={data.transactions} onDataChanged={reloadData} />;
      case WarehouseCategory.LEATHER:
        return <LeatherWarehouseView 
                 items={data.inventory[WarehouseCategory.LEATHER]} 
                 onEditRequest={handleEditLeatherStockRequest}
                 onDeleteRequest={handleDeleteLeatherStockRequest}
               />;
      default:
        const warehouseCat = page as Exclude<WarehouseCategory, WarehouseCategory.LEATHER>;
        return <WarehouseView 
                 category={warehouseCat} 
                 items={data.inventory[warehouseCat]} 
                 onSellRequest={handleSellRequest}
                 onEditRequest={handleEditShoeStockRequest}
                 onDeleteRequest={handleDeleteShoeStockRequest}
               />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Sidebar 
        activePage={page} 
        setPage={setPage} 
        onAddStock={() => setIsStockInModalOpen(true)}
        onAddLeather={() => setIsStockInLeatherModalOpen(true)}
        onRemoveStock={() => setIsStockOutGeneralModalOpen(true)}
        onOpenTransfer={() => setIsTransferModalOpen(true)}
        onReturnLeather={() => setIsReturnLeatherModalOpen(true)}
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {renderPage()}
      </main>

      {isStockInModalOpen && (
        <StockInModal
          shoeMasters={data.shoeMasters}
          maklunMasters={data.maklunMasters}
          onClose={() => setIsStockInModalOpen(false)}
          onStockAdded={() => {
            reloadData();
            setIsStockInModalOpen(false);
          }}
        />
      )}
      
      {isStockInLeatherModalOpen && (
        <StockInLeatherModal
          leatherMasters={data.leatherMasters}
          onClose={() => setIsStockInLeatherModalOpen(false)}
          onStockAdded={() => {
            reloadData();
            setIsStockInLeatherModalOpen(false);
          }}
        />
      )}
      
      {isStockOutGeneralModalOpen && (
        <StockOutGeneralModal
          shoeInventory={data.inventory}
          leatherInventory={data.inventory.leather}
          maklunMasters={data.maklunMasters}
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

      {isTransferModalOpen && (
        <TransferStockModal
          inventory={data.inventory}
          maklunMasters={data.maklunMasters}
          onClose={() => setIsTransferModalOpen(false)}
          onStockTransferred={() => {
            reloadData();
            setIsTransferModalOpen(false);
          }}
        />
      )}

      {isReturnLeatherModalOpen && (
        <ReturnLeatherModal
            leatherMasters={data.leatherMasters}
            onClose={() => setIsReturnLeatherModalOpen(false)}
            onStockReturned={() => {
                reloadData();
                setIsReturnLeatherModalOpen(false);
            }}
        />
      )}

      {isEditShoeStockModalOpen && itemToEditShoe && (
        <EditShoeStockModal
          item={itemToEditShoe}
          onClose={() => {
            setIsEditShoeStockModalOpen(false);
            setItemToEditShoe(null);
          }}
          onStockUpdated={() => {
            reloadData();
            setIsEditShoeStockModalOpen(false);
            setItemToEditShoe(null);
          }}
        />
      )}

      {isEditLeatherStockModalOpen && itemToEditLeather && (
        <EditLeatherStockModal
          item={itemToEditLeather}
          onClose={() => {
            setIsEditLeatherStockModalOpen(false);
            setItemToEditLeather(null);
          }}
          onStockUpdated={() => {
            reloadData();
            setIsEditLeatherStockModalOpen(false);
            setItemToEditLeather(null);
          }}
        />
      )}
    </div>
  );
}