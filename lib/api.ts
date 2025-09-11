import { AppData, InventoryItem, LeatherInventoryItem, ShoeMaster, MaklunMaster, LeatherMaster, User, WarehouseCategory, Shoe } from '../types';

const API_BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        // Coba baca error JSON, jika kosong fallback ke status text
        const text = await response.text().catch(() => '');
        try {
            const errorData = text ? JSON.parse(text) : null;
            throw new Error((errorData && errorData.message) || `Error: ${response.status}`);
        } catch {
            throw new Error(text || `Error: ${response.status}`);
        }
    }
    // Untuk 204 No Content atau body kosong, kembalikan objek kosong agar tidak melempar error JSON
    const contentLength = response.headers.get('content-length');
    if (response.status === 204 || contentLength === '0') {
        return {} as any;
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        // Jika bukan JSON, kembalikan teks mentah
        const text = await response.text();
        return { message: text } as any;
    }
    // Normal JSON response
    const text = await response.text();
    if (!text) return {} as any;
    return JSON.parse(text);
};

export const login = async (username: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
};

export const refreshToken = async (): Promise<{ token: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleResponse(response);
};

export const getData = async (): Promise<AppData> => {
    const response = await fetch(`${API_BASE_URL}/data/all`, { headers: getAuthHeaders() });
    return handleResponse(response);
};

// --- Shoe Master ---
export const addShoeMaster = (shoeType: string, sizesStr: string) => fetch(`${API_BASE_URL}/shoe-masters`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ shoeType, sizesStr }) }).then(handleResponse);
export const updateShoeMaster = (id: string, shoeType: string, sizesStr: string) => fetch(`${API_BASE_URL}/shoe-masters/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ shoeType, sizesStr }) }).then(handleResponse);
export const deleteShoeMaster = (id: string) => fetch(`${API_BASE_URL}/shoe-masters/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);

// --- Maklun Master ---
export const addMaklunMaster = (name: string) => fetch(`${API_BASE_URL}/maklun-masters`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ name }) }).then(handleResponse);
export const updateMaklunMaster = (id: string, name: string) => fetch(`${API_BASE_URL}/maklun-masters/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ name }) }).then(handleResponse);
export const deleteMaklunMaster = (id: string) => fetch(`${API_BASE_URL}/maklun-masters/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);

// --- Leather Master ---
export const addLeatherMaster = (name: string) => fetch(`${API_BASE_URL}/leather-masters`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ name }) }).then(handleResponse);
export const updateLeatherMaster = (id: string, name: string) => fetch(`${API_BASE_URL}/leather-masters/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ name }) }).then(handleResponse);
export const deleteLeatherMaster = (id: string) => fetch(`${API_BASE_URL}/leather-masters/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);

// --- Inventory Operations ---
export const addStock = (shoe: Shoe, quantity: number, warehouse: WarehouseCategory, source: string, date?: string) => fetch(`${API_BASE_URL}/inventory/shoe`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ shoe, quantity, warehouse, source, date, operation: 'add' }) }).then(handleResponse);
export const addLeatherStock = (leatherMasterId: string, quantity: number, supplier: string, date?: string) => fetch(`${API_BASE_URL}/inventory/leather`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ leatherMasterId, quantity, supplier, date, operation: 'add' }) }).then(handleResponse);
export const returnLeatherStock = (leatherMasterId: string, quantity: number, returneeName: string, notes: string) => fetch(`${API_BASE_URL}/inventory/leather`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ leatherMasterId, quantity, returneeName, notes, operation: 'return' }) }).then(handleResponse);

export const sellStock = (itemId: string, quantityToSell: number, customerName?: string, date?: string) => fetch(`${API_BASE_URL}/inventory/shoe`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ itemId, quantity: quantityToSell, customerName, date, operation: 'sell' }) }).then(handleResponse);
export const removeStock = (itemId: string, quantityToRemove: number, releasedTo: string) => fetch(`${API_BASE_URL}/inventory/shoe`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ itemId, quantity: quantityToRemove, releasedTo, operation: 'remove' }) }).then(handleResponse);
export const removeLeatherStock = (itemId: string, quantityToRemove: number, releasedTo: string, date?: string) => fetch(`${API_BASE_URL}/inventory/leather`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ itemId, quantity: quantityToRemove, releasedTo, date, operation: 'remove' }) }).then(handleResponse);

export const transferStock = (itemId: string, quantityToTransfer: number, fromWarehouse: WarehouseCategory, source: string, destination?: string, date?: string) => fetch(`${API_BASE_URL}/inventory/shoe`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ itemId, quantity: quantityToTransfer, fromWarehouse, source, destination, date, operation: 'transfer' }) }).then(handleResponse);

export const updateShoeStockQuantity = (itemId: string, newQuantity: number) => fetch(`${API_BASE_URL}/inventory/shoe/${itemId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ newQuantity }) }).then(handleResponse);
export const deleteShoeStock = (itemId: string) => fetch(`${API_BASE_URL}/inventory/shoe/${itemId}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);

export const updateLeatherStockQuantity = (itemId: string, newQuantity: number) => fetch(`${API_BASE_URL}/inventory/leather/${itemId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ newQuantity }) }).then(handleResponse);
export const deleteLeatherStockByItemId = (itemId: string) => fetch(`${API_BASE_URL}/inventory/leather/${itemId}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);
