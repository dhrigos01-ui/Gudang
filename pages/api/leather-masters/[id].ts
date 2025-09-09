import { protect } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
// FIX: Import UserRole from local types definition instead of @prisma/client.
import { UserRole } from '../../../types';

export default protect(async (req, res) => {
    const { id } = req.query;

    if (req.method === 'PUT') {
        const { name } = req.body;
        if (!name?.trim()) {
            res.status(400).json({ message: "Jenis kulit tidak boleh kosong." });
            return;
        }
        try {
            const updatedMaster = await prisma.leatherMaster.update({ where: { id: String(id) }, data: { name: name.trim() } });
            res.status(200).json(updatedMaster);
            return;
        } catch (error: any) {
            if (error.code === 'P2002') {
                res.status(409).json({ message: `Jenis kulit "${name}" sudah ada.` });
                return;
            }
            res.status(500).json({ message: 'Gagal memperbarui master kulit' });
            return;
        }
    }

    if (req.method === 'DELETE') {
        try {
            const inUse = await prisma.leatherInventory.findFirst({ where: { leatherMasterId: String(id) } });
            if (inUse) {
                res.status(400).json({ message: 'Tidak dapat menghapus master karena masih ada stok.' });
                return;
            }
            await prisma.leatherMaster.delete({ where: { id: String(id) } });
            res.status(204).end();
            return;
        } catch (error) {
            res.status(500).json({ message: 'Gagal menghapus master kulit' });
            return;
        }
    }
}, ['PUT', 'DELETE'], UserRole.ADMIN);