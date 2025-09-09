import { protect } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { AppData, WarehouseCategory, InventoryItem, LeatherInventoryItem } from '../../../types';
import { Transaction, Inventory, LeatherInventory } from '@prisma/client';

export default protect(async (req, res) => {
    try {
        const shoeInventory = await prisma.inventory.findMany({
            include: { shoeMaster: { select: { shoeType: true } } }
        });
        const leatherInventory = await prisma.leatherInventory.findMany({
            include: { leatherMaster: { select: { name: true } } }
        });
        const transactions = await prisma.transaction.findMany({
            orderBy: { date: 'desc' }
        });
        const shoeMasters = await prisma.shoeMaster.findMany({
             orderBy: { shoeType: 'asc' }
        });
        const maklunMasters = await prisma.maklunMaster.findMany({
             orderBy: { name: 'asc' }
        });
        const leatherMasters = await prisma.leatherMaster.findMany({
             orderBy: { name: 'asc' }
        });

        const appData: AppData = {
            inventory: {
                [WarehouseCategory.FINISHED_GOODS]: [],
                [WarehouseCategory.WIP]: [],
                [WarehouseCategory.NEARLY_FINISHED]: [],
                [WarehouseCategory.LEATHER]: [],
            },
            transactions: transactions.map((tx: Transaction) => ({
                ...tx,
                date: tx.date.toISOString(),
                item: tx.shoeType ? { shoeType: tx.shoeType, size: tx.size } : { name: tx.leatherName },
            })),
            shoeMasters,
            maklunMasters,
            leatherMasters
        };
        
        shoeInventory.forEach((item: Inventory & { shoeMaster: { shoeType: string } }) => {
            const invItem: InventoryItem = {
                id: item.id,
                shoeType: item.shoeMaster.shoeType,
                size: item.size,
                quantity: item.quantity
            };
            (appData.inventory[item.warehouse as Exclude<WarehouseCategory, 'leather'>] as InventoryItem[]).push(invItem);
        });

        appData.inventory[WarehouseCategory.LEATHER] = leatherInventory.map((item: LeatherInventory & { leatherMaster: { name: string } }) => ({
            id: item.id,
            leatherMasterId: item.leatherMasterId,
            name: item.leatherMaster.name,
            quantity: item.quantity,
            supplier: item.supplier
        }));

        res.status(200).json(appData);
    } catch (error) {
        console.error('Failed to fetch all data:', error);
        res.status(500).json({ message: 'Failed to fetch all data', error: error instanceof Error ? error.message : 'Unknown error' });
    }
}, ['GET']);
