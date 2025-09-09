import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { LeatherMaster, LeatherInventoryItem, User, UserRole } from '../types';
// FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
import * as api from '../lib/api';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface LeatherMasterPageProps {
  leatherMasters: LeatherMaster[];
  leatherInventory: LeatherInventoryItem[];
  onDataChanged: () => void;
  currentUser: User;
}

export const LeatherMasterPage: React.FC<LeatherMasterPageProps> = ({ leatherMasters, leatherInventory, onDataChanged, currentUser }) => {
  const [name, setName] = useState('');
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
    setName('');
    setEditingId(null);
    setError('');
  };

  const handleEditClick = (master: LeatherMaster) => {
    setEditingId(master.id);
    setName(master.name);
    setSuccess('');
    setError('');
    document.getElementById('newLeatherName')?.focus();
  };

  const handleDeleteClick = async (master: LeatherMaster) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus jenis kulit "${master.name}"?`)) {
      try {
        // FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
        await api.deleteLeatherMaster(master.id);
        setSuccess(`"${master.name}" berhasil dihapus.`);
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
        await api.updateLeatherMaster(editingId, name);
        setSuccess(`"${name}" berhasil diperbarui.`);
      } else {
        // FIX: The services/inventoryService.ts file is empty, using lib/api.ts instead for API calls.
        await api.addLeatherMaster(name);
        setSuccess(`"${name}" berhasil ditambahkan.`);
      }
      onDataChanged();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  };
  
  const isLeatherInUse = (id: string): boolean => {
      return leatherInventory.some(item => item.leatherMasterId === id);
  }

  return (
    <div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-6">Manajemen Master Data Kulit</h2>
        <Card>
            <div className="space-y-6">
                {isAdmin && (
                    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-slate-700 rounded-lg bg-slate-900/50">
                    <h4 className="text-md font-semibold text-white mb-2">{editingId ? 'Edit Jenis Kulit' : 'Tambah Jenis Kulit Baru'}</h4>
                    <div>
                        <label htmlFor="newLeatherName" className="block text-sm font-medium text-slate-300">Jenis Kulit</label>
                        <input 
                            type="text" 
                            id="newLeatherName" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" 
                            placeholder="Contoh: Kulit Sapi Nappa"
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
                <h4 className="text-md font-semibold text-white mb-2">Daftar Master Kulit</h4>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                    {leatherMasters.length > 0 ? (
                    leatherMasters.map(master => (
                        <div key={master.id} className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center">
                        <p className="font-semibold text-white">{master.name}</p>
                        {isAdmin && (
                            <div className="flex gap-2">
                                <button onClick={() => handleEditClick(master)} className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-600" title="Edit">
                                <PencilIcon className="h-5 w-5" />
                                </button>
                                <button 
                                onClick={() => handleDeleteClick(master)} 
                                className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-full hover:bg-slate-600 disabled:text-slate-600 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                disabled={isLeatherInUse(master.id)}
                                title={isLeatherInUse(master.id) ? "Tidak bisa dihapus karena stok masih ada" : "Hapus"}
                                >
                                <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                        </div>
                    ))
                    ) : (
                    <p className="text-slate-400 text-center py-4">Belum ada data master kulit.</p>
                    )}
                </div>
                </div>
            </div>
        </Card>
    </div>
  );
};