import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { ShoeMaster, AppData, User, UserRole } from '../types';
// FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
import * as api from '../lib/api';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ShoeMasterPageProps {
  shoeMasters: ShoeMaster[];
  inventory: AppData['inventory'];
  onDataChanged: () => void;
  currentUser: User;
}

export const ShoeMasterPage: React.FC<ShoeMasterPageProps> = ({ shoeMasters, inventory, onDataChanged, currentUser }) => {
  const [shoeType, setShoeType] = useState('');
  const [sizes, setSizes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const isAdmin = currentUser.role === UserRole.ADMIN;

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const resetForm = () => {
    setShoeType('');
    setSizes('');
    setEditingId(null);
    setError('');
  };

  const handleEditClick = (master: ShoeMaster) => {
    setEditingId(master.id);
    setShoeType(master.shoeType);
    setSizes(master.sizes.join(', '));
    setSuccess('');
    setError('');
    document.getElementById('newShoeType')?.focus();
  };

  const handleDeleteClick = async (master: ShoeMaster) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus tipe sepatu "${master.shoeType}"?`)) {
      try {
        // FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
        await api.deleteShoeMaster(master.id);
        setSuccess(`"${master.shoeType}" berhasil dihapus.`);
        onDataChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        // FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
        await api.updateShoeMaster(editingId, shoeType, sizes);
        setSuccess(`"${shoeType}" berhasil diperbarui.`);
      } else {
        // FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
        await api.addShoeMaster(shoeType, sizes);
        setSuccess(`"${shoeType}" berhasil ditambahkan.`);
      }
      onDataChanged();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };
  
  const isShoeTypeInUse = (shoeType: string): boolean => {
      return Object.values(inventory).flat().some(item => 'shoeType' in item && item.shoeType === shoeType);
  }

  return (
    <div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-6">Manajemen Master Data Sepatu</h2>
        <Card>
            <div className="space-y-6">
                {isAdmin && (
                    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-slate-700 rounded-lg bg-slate-900/50">
                    <h4 className="text-md font-semibold text-white mb-2">{editingId ? 'Edit Tipe Sepatu' : 'Tambah Tipe Sepatu Baru'}</h4>
                    <div>
                        <label htmlFor="newShoeType" className="block text-sm font-medium text-slate-300">Nama Tipe Sepatu</label>
                        <input 
                        type="text" 
                        id="newShoeType" 
                        value={shoeType} 
                        onChange={(e) => setShoeType(e.target.value)} 
                        className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" 
                        placeholder="Contoh: Running Pro Max"
                        required 
                        />
                    </div>
                    <div>
                        <label htmlFor="newSizes" className="block text-sm font-medium text-slate-300">Ukuran Tersedia (pisahkan dengan koma)</label>
                        <input 
                        type="text" 
                        id="newSizes" 
                        value={sizes} 
                        onChange={(e) => setSizes(e.target.value)} 
                        className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="Contoh: 39, 40, 41, 42, 43" 
                        required 
                        />
                    </div>
                    
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    {success && <p className="text-green-400 text-sm">{success}</p>}

                    <div className="flex justify-end gap-2">
                        {editingId && (
                        <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md">
                            Batal Edit
                        </button>
                        )}
                        <button type="submit" className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 rounded-md min-w-[150px]">
                            {editingId ? 'Update Master' : <><PlusIcon className="h-5 w-5" /> Tambah Master</>}
                        </button>
                    </div>
                    </form>
                )}

                <div>
                <h4 className="text-md font-semibold text-white mb-2">Daftar Master Sepatu</h4>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                    {shoeMasters.length > 0 ? (
                    shoeMasters.map(master => (
                        <div key={master.id} className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-white">{master.shoeType}</p>
                            <p className="text-sm text-slate-400">Ukuran: {master.sizes.join(', ')}</p>
                        </div>
                        {isAdmin && (
                            <div className="flex gap-2">
                                <button onClick={() => handleEditClick(master)} className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-600" title="Edit">
                                <PencilIcon className="h-5 w-5" />
                                </button>
                                <button 
                                onClick={() => handleDeleteClick(master)} 
                                className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-full hover:bg-slate-600 disabled:text-slate-600 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                disabled={isShoeTypeInUse(master.shoeType)}
                                title={isShoeTypeInUse(master.shoeType) ? "Tidak bisa dihapus karena stok masih ada" : "Hapus"}
                                >
                                <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                        </div>
                    ))
                    ) : (
                    <p className="text-slate-400 text-center py-4">Belum ada data master.</p>
                    )}
                </div>
                </div>
            </div>
        </Card>
    </div>
  );
};