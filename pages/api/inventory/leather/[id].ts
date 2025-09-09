import { protect } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';
// FIX: Import enums from local types definition instead of @prisma/client.
import { UserRole, TransactionType, WarehouseCategory } from '../../../../types';

export default protect(async (req, res) => {
    const { id } = req.query;

    if (req.method === 'PUT') {
        const { newQuantity } = req.body;
        if (newQuantity == null || newQuantity < 0) {
            res.status(400).json({ message: 'Jumlah baru tidak valid.' });
            return;
        }

        try {
            await prisma.$transaction(async (tx) => {
                const item = await tx.leatherInventory.findUnique({ where: { id: String(id) }, include: { leatherMaster: true } });
                if (!item) throw new Error("Stok kulit tidak ditemukan.");
                
                const quantityChange = newQuantity - item.quantity;
                if (quantityChange === 0) return;

                if (newQuantity === 0) {
                    await tx.leatherInventory.delete({ where: { id: String(id) } });
                } else {
                    await tx.leatherInventory.update({ where: { id: String(id) }, data: { quantity: newQuantity } });
                }

                await tx.transaction.create({
                    data: {
                        type: quantityChange > 0 ? TransactionType.IN : TransactionType.OUT,
                        leatherName: item.leatherMaster.name,
                        quantity: Math.abs(quantityChange),
                        warehouse: WarehouseCategory.LEATHER,
                        notes: `Penyesuaian Stok (Supplier: ${item.supplier})`
                    }
                });
            });
            res.status(200).json({ message: 'Kuantitas berhasil diperbarui.' });
            return;
        } catch (error) {
            res.status(500).json({ message: (error as Error).message || 'Gagal memperbarui kuantitas.' });
            return;
        }
    }

    if (req.method === 'DELETE') {
        try {
            await prisma.$transaction(async (tx) => {
                const item = await tx.leatherInventory.findUnique({ where: { id: String(id) }, include: { leatherMaster: true }});
                if (!item) throw new Error("Stok kulit tidak ditemukan.");

                await tx.leatherInventory.delete({ where: { id: String(id) }});

                await tx.transaction.create({
                    data: {
                        type: TransactionType.OUT,
                        leatherName: item.leatherMaster.name,
                        quantity: item.quantity,
                        warehouse: WarehouseCategory.LEATHER,
                        notes: `Penghapusan Stok (Supplier: ${item.supplier})`
                    }
                });
            });
            res.status(204).end();
            return;
        } catch (error) {
            res.status(500).json({ message: (error as Error).message || 'Gagal menghapus stok.' });
            return;
        }
    }

}, ['PUT', 'DELETE'], UserRole.ADMIN);