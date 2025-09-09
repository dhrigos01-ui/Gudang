import { protect } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
// FIX: Import UserRole from local types definition instead of @prisma/client.
import { UserRole } from '../../../types';

export default protect(async (req, res) => {
    if (req.method === 'POST') {
        const { name } = req.body;
        if (!name?.trim()) {
            res.status(400).json({ message: "Jenis kulit tidak boleh kosong." });
            return;
        }
        try {
            const newMaster = await prisma.leatherMaster.create({ data: { name: name.trim() } });
            res.status(201).json(newMaster);
            return;
        } catch (error: any) {
            if (error.code === 'P2002') {
                res.status(409).json({ message: `Jenis kulit "${name}" sudah ada.` });
                return;
            }
            res.status(500).json({ message: 'Gagal menambahkan master kulit' });
            return;
        }
    }
}, ['POST'], UserRole.ADMIN);