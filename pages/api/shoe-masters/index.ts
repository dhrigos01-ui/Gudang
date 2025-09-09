import { protect } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
// FIX: Import UserRole from local types definition instead of @prisma/client.
import { UserRole } from '../../../types';

export default protect(async (req, res) => {
    // GET logic is handled in /api/data/all.ts, but can be added here if needed
    if (req.method === 'POST') {
        const { shoeType, sizesStr } = req.body;
        if (!shoeType?.trim() || !sizesStr?.trim()) {
            res.status(400).json({ message: "Nama tipe sepatu dan ukuran tidak boleh kosong." });
            return;
        }
        
        // FIX: Add explicit types to sort function arguments to avoid potential type errors.
        const sizes = [...new Set(sizesStr.split(',').map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n) && n > 0))].sort((a, b) => (a as number) - (b as number));
        if (sizes.length === 0) {
            res.status(400).json({ message: "Harap masukkan setidaknya satu nomor ukuran yang valid." });
            return;
        }

        try {
            const newMaster = await prisma.shoeMaster.create({
                data: {
                    shoeType: shoeType.trim(),
                    sizes: sizes
                }
            });
            res.status(201).json(newMaster);
            return;
        } catch (error: any) {
            if (error.code === 'P2002') { // Unique constraint violation
                res.status(409).json({ message: `Tipe sepatu "${shoeType}" sudah ada.` });
                return;
            }
            console.error(error);
            res.status(500).json({ message: 'Gagal menambahkan master sepatu' });
            return;
        }
    }
}, ['POST'], UserRole.ADMIN);