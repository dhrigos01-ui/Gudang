import { protect } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
// FIX: Import enums from local types definition instead of @prisma/client.
import { UserRole, WarehouseCategory, TransactionType } from '../../../types';
import { WAREHOUSE_NAMES } from '../../../constants';
import { PrismaClient } from '@prisma/client';

const transferFlow: Partial<Record<WarehouseCategory, WarehouseCategory>> = {
    [WarehouseCategory.WIP]: WarehouseCategory.NEARLY_FINISHED,
    [WarehouseCategory.NEARLY_FINISHED]: WarehouseCategory.FINISHED_GOODS,
};

export default protect(async (req, res) => {
    const { operation, itemId, shoe, quantity, warehouse, source, fromWarehouse, releasedTo, customerName, destination, date } = req.body;

    try {
        await prisma.$transaction(async (tx: PrismaClient) => {
            switch (operation) {
                case 'add':
                    const shoeMaster = await tx.shoeMaster.findUnique({ where: { shoeType: shoe.shoeType } });
                    if (!shoeMaster) throw new Error('Master sepatu tidak ditemukan.');
                    
                    const existingStock = await tx.inventory.findUnique({
                        where: { shoeMasterId_size_warehouse: { shoeMasterId: shoeMaster.id, size: shoe.size, warehouse: warehouse } }
                    });

                    if (existingStock) {
                        await tx.inventory.update({
                            where: { id: existingStock.id },
                            data: { quantity: { increment: quantity } }
                        });
                    } else {
                        await tx.inventory.create({
                            data: { shoeMasterId: shoeMaster.id, size: shoe.size, quantity: quantity, warehouse: warehouse }
                        });
                    }
                    await tx.transaction.create({
                        data: { type: TransactionType.IN, shoeType: shoe.shoeType, size: shoe.size, quantity: quantity, warehouse: warehouse, source: source, ...(date ? { date: new Date(date) } : {}) }
                    });
                    break;

                case 'sell':
                    const itemToSell = await tx.inventory.findFirst({ where: { id: itemId, warehouse: WarehouseCategory.FINISHED_GOODS }});
                    if (!itemToSell) throw new Error("Item tidak ditemukan.");
                    if (itemToSell.quantity < quantity) throw new Error("Stok tidak mencukupi.");
                    
                    const shoeMasterSell = await tx.shoeMaster.findUnique({ where: { id: itemToSell.shoeMasterId } });
                    if (!shoeMasterSell) throw new Error("Master sepatu terkait tidak ditemukan.");
                    
                    await tx.inventory.update({
                        where: { id: itemId },
                        data: { quantity: { decrement: quantity } }
                    });
                    await tx.transaction.create({
                        data: { type: TransactionType.OUT, shoeType: shoeMasterSell.shoeType, size: itemToSell.size, quantity: quantity, warehouse: WarehouseCategory.FINISHED_GOODS, notes: customerName ? `Penjualan ke: ${customerName}` : "Penjualan", ...(date ? { date: new Date(date) } : {}) }
                    });
                    break;
                
                case 'remove':
                    const itemToRemove = await tx.inventory.findUnique({ where: { id: itemId }});
                    if (!itemToRemove) throw new Error("Item tidak ditemukan.");
                    if (itemToRemove.quantity < quantity) throw new Error("Stok tidak mencukupi.");

                    const shoeMasterRemove = await tx.shoeMaster.findUnique({ where: { id: itemToRemove.shoeMasterId } });
                    if (!shoeMasterRemove) throw new Error("Master sepatu terkait tidak ditemukan.");

                    await tx.inventory.update({
                        where: { id: itemId },
                        data: { quantity: { decrement: quantity } }
                    });
                    await tx.transaction.create({
                        data: { type: TransactionType.OUT, shoeType: shoeMasterRemove.shoeType, size: itemToRemove.size, quantity: quantity, warehouse: itemToRemove.warehouse, notes: `Dikeluarkan ke: ${releasedTo}` }
                    });
                    break;

                case 'transfer':
                    const toWarehouse = transferFlow[fromWarehouse as keyof typeof transferFlow];
                    if (!toWarehouse) throw new Error("Alur transfer tidak valid.");

                    const itemToTransfer = await tx.inventory.findFirst({ where: { id: itemId, warehouse: fromWarehouse }});
                    if (!itemToTransfer) throw new Error("Item tidak ditemukan di gudang asal.");
                    if (itemToTransfer.quantity < quantity) throw new Error("Stok tidak mencukupi.");

                    const shoeMasterTransfer = await tx.shoeMaster.findUnique({ where: { id: itemToTransfer.shoeMasterId } });
                    if (!shoeMasterTransfer) throw new Error("Master sepatu terkait tidak ditemukan.");


                    // Decrease from source
                    await tx.inventory.update({
                        where: { id: itemToTransfer.id },
                        data: { quantity: { decrement: quantity } }
                    });
                    const outNotes = destination ? `Transfer ke ${WAREHOUSE_NAMES[toWarehouse]} - Tujuan: ${destination}` : `Transfer ke ${WAREHOUSE_NAMES[toWarehouse]}`;
                    await tx.transaction.create({
                        data: { type: TransactionType.OUT, shoeType: shoeMasterTransfer.shoeType, size: itemToTransfer.size, quantity: quantity, warehouse: fromWarehouse, notes: outNotes }
                    });

                    // Increase/create in destination
                    const destStock = await tx.inventory.findUnique({
                        where: { shoeMasterId_size_warehouse: { shoeMasterId: itemToTransfer.shoeMasterId, size: itemToTransfer.size, warehouse: toWarehouse } }
                    });
                    if (destStock) {
                        await tx.inventory.update({
                            where: { id: destStock.id },
                            data: { quantity: { increment: quantity } }
                        });
                    } else {
                        await tx.inventory.create({
                            data: { shoeMasterId: itemToTransfer.shoeMasterId, size: itemToTransfer.size, quantity: quantity, warehouse: toWarehouse }
                        });
                    }
                    const inNotes = destination ? `Transfer dari ${WAREHOUSE_NAMES[fromWarehouse as WarehouseCategory]} - Tujuan: ${destination}` : `Transfer dari ${WAREHOUSE_NAMES[fromWarehouse as WarehouseCategory]}`;
                    await tx.transaction.create({
                        data: { type: TransactionType.IN, shoeType: shoeMasterTransfer.shoeType, size: itemToTransfer.size, quantity: quantity, warehouse: toWarehouse, source: source, notes: inNotes }
                    });
                    break;
                
                default:
                    throw new Error("Operasi tidak valid.");
            }
            // Hapus item jika kuantitasnya 0
            await tx.inventory.deleteMany({ where: { quantity: 0 }});
        });

        res.status(200).json({ message: 'Operasi stok berhasil' });
    } catch (error) {
        console.error('Shoe inventory operation failed:', error);
        res.status(500).json({ message: (error as Error).message || 'Operasi stok gagal' });
    }
}, ['POST'], UserRole.ADMIN);