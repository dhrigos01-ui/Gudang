export enum WarehouseCategory {
  FINISHED_GOODS = 'finished_goods',
  WIP = 'wip',
  NEARLY_FINISHED = 'nearly_finished',
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
  item: Shoe;
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

export interface AppData {
  inventory: Record<WarehouseCategory, InventoryItem[]>;
  transactions: Transaction[];
  shoeMasters: ShoeMaster[];
}

export type Page = WarehouseCategory | 'dashboard' | 'transactions';