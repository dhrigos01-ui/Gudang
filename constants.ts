
import { WarehouseCategory } from './types';

export const WAREHOUSE_NAMES: Record<WarehouseCategory, string> = {
  [WarehouseCategory.FINISHED_GOODS]: 'Stok Gudang',
  [WarehouseCategory.WIP]: 'Gudang Stok Upper',
  [WarehouseCategory.NEARLY_FINISHED]: 'Gudang Stok Molding',
  [WarehouseCategory.FINISHING]: 'Data Finishing',
  [WarehouseCategory.LEATHER]: 'Stok Kulit',
};