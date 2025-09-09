export enum WarehouseCategory {
  FINISHED_GOODS = 'finished_goods',
  WIP = 'wip',
  NEARLY_FINISHED = 'nearly_finished',
  LEATHER = 'leather',
}

export interface Shoe {
  shoeType: string;
  size: number;
}

export interface InventoryItem extends Shoe {
  id: string;
  quantity: number;
}

export enum TransactionType {
  IN = 'IN',
  OUT = 'OUT',
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  item: Shoe | { name: string };
  quantity: number;
  warehouse: WarehouseCategory;
  source?: string; // Untuk stok masuk eksternal
  notes?: string; // Untuk stok keluar non-penjualan atau keterangan lain
}

export interface ShoeMaster {
  id: string;
  shoeType: string;
  sizes: number[];
}

export interface MaklunMaster {
  id: string;
  name: string;
}

export interface LeatherMaster {
    id: string;
    name: string;
}

export interface LeatherInventoryItem {
    id: string;
    leatherMasterId: string;
    name: string;
    quantity: number;
    supplier: string;
}

export interface AppData {
  inventory: {
    [WarehouseCategory.FINISHED_GOODS]: InventoryItem[];
    [WarehouseCategory.WIP]: InventoryItem[];
    [WarehouseCategory.NEARLY_FINISHED]: InventoryItem[];
    [WarehouseCategory.LEATHER]: LeatherInventoryItem[];
  };
  transactions: Transaction[];
  shoeMasters: ShoeMaster[];
  maklunMasters: MaklunMaster[];
  leatherMasters: LeatherMaster[];
}

export type Page = WarehouseCategory | 'dashboard' | 'transactions' | 'master_shoe' | 'master_leather' | 'master_maklun';