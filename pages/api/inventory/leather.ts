import { protect } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
// FIX: Import enums from local types definition instead of @prisma/client.
import { UserRole, WarehouseCategory, TransactionType } from '../../../types';
import { PrismaClient } from '@prisma/client';

export default protect(async (req, res) => {
    const { operation, itemId, leatherMasterId, quantity, supplier, returneeName, notes, releasedTo, date } = req.body;

    try {
        await prisma.$transaction(async (tx: PrismaClient) => {
            const leatherMaster = await tx.leatherMaster.findUnique({ where: { id: leatherMasterId } });
            
            switch (operation) {
                case 'add':
                    if (!leatherMaster) throw new Error("Master kulit tidak ditemukan.");
                    const existingStock = await tx.leatherInventory.findUnique({
                        where: { leatherMasterId_supplier: { leatherMasterId, supplier } }
                    });
                    if (existingStock) {
                        await tx.leatherInventory.update({
                            where: { id: existingStock.id },
                            data: { quantity: { increment: quantity } }
                        });
                    } else {
                        await tx.leatherInventory.create({
                            data: { leatherMasterId, supplier, quantity }
                        });
                    }
                    await tx.transaction.create({
                        data: { type: TransactionType.IN, leatherName: leatherMaster.name, quantity, warehouse: WarehouseCategory.LEATHER, source: supplier, ...(date ? { date: new Date(date) } : {}) }
                    });
                    break;
                
                case 'return':
                    if (!leatherMaster) throw new Error("Master kulit tidak ditemukan.");
                    const supplierForReturn = 'Retur';
                    const existingReturnStock = await tx.leatherInventory.findUnique({
                        where: { leatherMasterId_supplier: { leatherMasterId, supplier: supplierForReturn } }
                    });

                    if (existingReturnStock) {
                         await tx.leatherInventory.update({
                            where: { id: existingReturnStock.id },
                            data: { quantity: { increment: quantity } }
                        });
                    } else {
                        await tx.leatherInventory.create({
                            data: { leatherMasterId, supplier: supplierForReturn, quantity }
                        });
                    }
                    const finalNotes = `Ket: ${notes}. Dikembalikan oleh: ${returneeName}.`;
                    await tx.transaction.create({
                        data: { type: TransactionType.IN, leatherName: leatherMaster.name, quantity, warehouse: WarehouseCategory.LEATHER, source: 'Retur', notes: finalNotes }
                    });
                    break;

                case 'remove':
                    const itemToRemove = await tx.leatherInventory.findUnique({ where: { id: itemId }, include: {leatherMaster: true}});
                    if (!itemToRemove) throw new Error("Stok kulit tidak ditemukan.");
                    if (itemToRemove.quantity < quantity) throw new Error("Stok kulit tidak mencukupi.");
                    
                    await tx.leatherInventory.update({
                        where: { id: itemId },
                        data: { quantity: { decrement: quantity } }
                    });
                    
                    const removeNotes = `Dikeluarkan ke: ${releasedTo}. Dari supplier: ${itemToRemove.supplier}.`;
                    await tx.transaction.create({
                        data: { type: TransactionType.OUT, leatherName: itemToRemove.leatherMaster.name, quantity, warehouse: WarehouseCategory.LEATHER, notes: removeNotes, ...(date ? { date: new Date(date) } : {}) }
                    });
                    break;

                default:
                     throw new Error("Operasi tidak valid.");
            }
             // Hapus item jika kuantitasnya 0
            await tx.leatherInventory.deleteMany({ where: { quantity: 0 }});
        });
        res.status(200).json({ message: 'Operasi stok kulit berhasil' });
    } catch (error) {
        console.error('Leather inventory operation failed:', error);
        res.status(500).json({ message: (error as Error).message || 'Operasi stok kulit gagal' });
    }
}, ['POST'], UserRole.ADMIN);