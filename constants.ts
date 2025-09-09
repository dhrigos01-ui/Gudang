
import { WarehouseCategory } from './types';

export const WAREHOUSE_NAMES: Record<WarehouseCategory, string> = {
  [WarehouseCategory.FINISHED_GOODS]: 'Gudang Stok Jadi',
  [WarehouseCategory.WIP]: 'Gudang Stok 1/2 Jadi',
  [WarehouseCategory.NEARLY_FINISHED]: 'Gudang Stok Hampir Jadi',
};
