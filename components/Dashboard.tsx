
import React from 'react';
import type { AppData, Page, WarehouseCategory } from '../types';
import { WAREHOUSE_NAMES } from '../constants';
import { Card } from './Card';
import { BoxIcon } from './icons/BoxIcon';

interface DashboardProps {
  inventory: AppData['inventory'];
  setPage: (page: Page) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ inventory, setPage }) => {
  
  const warehouseKeys = Object.keys(inventory) as WarehouseCategory[];

  const getTotalStock = (category: WarehouseCategory): number => {
    // Sum quantities; for leather, avoid FP tails
    const total = inventory[category].reduce((sum, item) => sum + item.quantity, 0);
    return category === 'leather' ? Math.floor(total * 100) / 100 : total;
  };
  
  const getUnitLabel = (category: WarehouseCategory): string => {
      return category === 'leather' ? 'Total Kaki' : 'Total Unit';
  }

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-white mb-6">Dashboard Inventaris</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {warehouseKeys.map((key) => (
          <Card 
            key={key} 
            className="cursor-pointer hover:border-cyan-400 transition-colors duration-300" 
            onClick={() => setPage(key)}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{WAREHOUSE_NAMES[key]}</h3>
              <BoxIcon className="h-8 w-8 text-cyan-400" />
            </div>
            <p className="mt-4 text-4xl font-bold text-white">{key === 'leather' ? getTotalStock(key).toFixed(2) : getTotalStock(key)}</p>
            <p className="text-slate-400">{getUnitLabel(key)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};