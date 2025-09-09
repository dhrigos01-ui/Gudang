import { protect } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
// FIX: Import UserRole from local types definition instead of @prisma/client.
import { UserRole } from '../../../types';

export default protect(async (req, res) => {
    const { id } = req.query;

    if (req.method === 'PUT') {
        const { shoeType, sizesStr } = req.body;
        if (!shoeType?.trim() || !sizesStr?.trim()) {
            res.status(400).json({ message: "Nama tipe sepatu dan ukuran tidak boleh kosong." });
            return;
        }
        // FIX: Add explicit types to sort function arguments to avoid potential type errors.
        const sizes = [...new Set(sizesStr.split(',').map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n) && n > 0))].sort((a: number,b: number) => a-b);
        if (sizes.length === 0) {
            res.status(400).json({ message: "Harap masukkan setidaknya satu nomor ukuran yang valid." });
            return;
        }

        try {
            const updatedMaster = await prisma.shoeMaster.update({
                where: { id: String(id) },
                data: { shoeType: shoeType.trim(), sizes }
            });
            res.status(200).json(updatedMaster);
            return;
        } catch (error: any) {
            if (error.code === 'P2002') {
                res.status(409).json({ message: `Tipe sepatu "${shoeType}" sudah ada.` });
                return;
            }
            res.status(500).json({ message: 'Gagal memperbarui master sepatu' });
            return;
        }
    }

    if (req.method === 'DELETE') {
        try {
            // Check if it's in use
            const inUse = await prisma.inventory.findFirst({
                where: { shoeMasterId: String(id) }
            });
            if (inUse) {
                res.status(400).json({ message: 'Tidak dapat menghapus master karena masih ada stok yang terdaftar.' });
                return;
            }
            await prisma.shoeMaster.delete({ where: { id: String(id) } });
            res.status(204).end();
            return;
        } catch (error) {
            res.status(500).json({ message: 'Gagal menghapus master sepatu' });
            return;
        }
    }

}, ['PUT', 'DELETE'], UserRole.ADMIN);