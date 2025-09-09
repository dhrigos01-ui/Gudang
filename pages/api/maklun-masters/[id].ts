import { protect } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
// FIX: Import UserRole from local types definition instead of @prisma/client.
import { UserRole } from '../../../types';

export default protect(async (req, res) => {
    const { id } = req.query;

    if (req.method === 'PUT') {
        const { name } = req.body;
        if (!name?.trim()) {
            res.status(400).json({ message: "Nama sumber Maklun tidak boleh kosong." });
            return;
        }
        try {
            const updatedMaster = await prisma.maklunMaster.update({ where: { id: String(id) }, data: { name: name.trim() } });
            res.status(200).json(updatedMaster);
            return;
        } catch (error: any) {
            if (error.code === 'P2002') {
                res.status(409).json({ message: `Nama sumber "${name}" sudah ada.` });
                return;
            }
            res.status(500).json({ message: 'Gagal memperbarui master maklun' });
            return;
        }
    }

    if (req.method === 'DELETE') {
        try {
            const nameToDelete = await prisma.maklunMaster.findUnique({ where: { id: String(id) }});
            if (!nameToDelete) {
                res.status(404).json({ message: "Master tidak ditemukan." });
                return;
            }

            const inUse = await prisma.transaction.findFirst({
                where: { OR: [
                    { source: nameToDelete.name },
                    { notes: { contains: `Dikeluarkan ke: ${nameToDelete.name}` } }
                ]}
            });
            if (inUse) {
                res.status(400).json({ message: `Tidak dapat menghapus "${nameToDelete.name}" karena sudah pernah digunakan dalam transaksi.` });
                return;
            }
            await prisma.maklunMaster.delete({ where: { id: String(id) } });
            res.status(204).end();
            return;
        } catch (error) {
            res.status(500).json({ message: 'Gagal menghapus master maklun' });
            return;
        }
    }
}, ['PUT', 'DELETE'], UserRole.ADMIN);