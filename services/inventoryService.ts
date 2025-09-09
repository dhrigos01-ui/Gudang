import { AppData, InventoryItem, Shoe, Transaction, TransactionType, WarehouseCategory, ShoeMaster, MaklunMaster, LeatherMaster, LeatherInventoryItem } from '../types';
import { WAREHOUSE_NAMES } from '../constants';

// Deklarasi global untuk sql.js
declare const initSqlJs: (config: { locateFile: (file: string) => string }) => Promise<any>;

const DB_KEY = 'shoeWarehouseDB_sqlite_v3'; // Version bump for new schema
let db: any = null;

const createSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS shoe_masters (
      id TEXT PRIMARY KEY,
      shoe_type TEXT NOT NULL UNIQUE,
      sizes TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS maklun_masters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS leather_masters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      shoe_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      warehouse TEXT NOT NULL,
      UNIQUE(shoe_type, size, warehouse)
    );

    CREATE TABLE IF NOT EXISTS inventory_leather (
      id TEXT PRIMARY KEY,
      leather_master_id TEXT NOT NULL,
      supplier TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      UNIQUE(leather_master_id, supplier),
      FOREIGN KEY (leather_master_id) REFERENCES leather_masters(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      -- For shoes
      shoe_type TEXT,
      size INTEGER,
      -- For leather
      leather_name TEXT,
      -- Common
      quantity INTEGER NOT NULL,
      warehouse TEXT NOT NULL,
      source TEXT,
      notes TEXT
    );
  `);
};

export const initDB = async (): Promise<void> => {
  try {
    const SQL = await initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });

    const savedDb = localStorage.getItem(DB_KEY);
    if (savedDb) {
      const dbArray = savedDb.split(',').map(Number);
      db = new SQL.Database(new Uint8Array(dbArray));
    } else {
      db = new SQL.Database();
      createSchema();
      persistDB();
    }
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize database", err);
  }
};

const persistDB = () => {
  try {
    const data = db.export();
    localStorage.setItem(DB_KEY, data.toString());
  } catch (error) {
    console.error("Failed to save database to localStorage", error);
  }
};

export const getData = (): AppData => {
  if (!db) throw new Error("Database not initialized");

  const inventoryResult = db.exec("SELECT * FROM inventory");
  const leatherInventoryResult = db.exec("SELECT il.id, il.quantity, il.supplier, lm.id as leather_master_id, lm.name FROM inventory_leather il JOIN leather_masters lm ON il.leather_master_id = lm.id");
  const transactionsResult = db.exec("SELECT * FROM transactions ORDER BY date DESC");
  const shoeMastersResult = db.exec("SELECT * FROM shoe_masters ORDER BY shoe_type");
  const maklunMastersResult = db.exec("SELECT * FROM maklun_masters ORDER BY name");
  const leatherMastersResult = db.exec("SELECT * FROM leather_masters ORDER BY name");

  const appData: AppData = {
    inventory: {
      [WarehouseCategory.FINISHED_GOODS]: [],
      [WarehouseCategory.WIP]: [],
      [WarehouseCategory.NEARLY_FINISHED]: [],
      [WarehouseCategory.LEATHER]: [],
    },
    transactions: [],
    shoeMasters: [],
    maklunMasters: [],
    leatherMasters: [],
  };

  if (inventoryResult.length > 0) {
    const items = inventoryResult[0].values.map((row: any[]) => ({ id: row[0], shoeType: row[1], size: row[2], quantity: row[3], warehouse: row[4] }));
    items.forEach((item: InventoryItem & { warehouse: WarehouseCategory }) => {
      if (appData.inventory[item.warehouse]) {
        (appData.inventory[item.warehouse] as InventoryItem[]).push(item);
      }
    });
  }

  if (leatherInventoryResult.length > 0) {
    appData.inventory[WarehouseCategory.LEATHER] = leatherInventoryResult[0].values.map((row: any[]) => ({
      id: row[0],
      quantity: row[1],
      supplier: row[2],
      leatherMasterId: row[3],
      name: row[4],
    }));
  }

  if (transactionsResult.length > 0) {
    appData.transactions = transactionsResult[0].values.map((row: any[]) => {
       const columns = transactionsResult[0].columns;
       const isShoe = !!row[columns.indexOf('shoe_type')];
       return {
          id: row[columns.indexOf('id')],
          date: row[columns.indexOf('date')],
          type: row[columns.indexOf('type')],
          item: isShoe
            ? { shoeType: row[columns.indexOf('shoe_type')], size: row[columns.indexOf('size')] }
            : { name: row[columns.indexOf('leather_name')] },
          quantity: row[columns.indexOf('quantity')],
          warehouse: row[columns.indexOf('warehouse')],
          source: row[columns.indexOf('source')],
          notes: row[columns.indexOf('notes')],
       }
    });
  }

  if (shoeMastersResult.length > 0) {
     appData.shoeMasters = shoeMastersResult[0].values.map((row: any[]) => ({ id: row[0], shoeType: row[1], sizes: JSON.parse(row[2]) }));
  }

  if (maklunMastersResult.length > 0) {
     appData.maklunMasters = maklunMastersResult[0].values.map((row: any[]) => ({ id: row[0], name: row[1] }));
  }

  if (leatherMastersResult.length > 0) {
     appData.leatherMasters = leatherMastersResult[0].values.map((row: any[]) => ({ id: row[0], name: row[1] }));
  }

  return appData;
};


// --- CRUD Operations ---

// --- Shoe Master ---
export const addShoeMaster = (shoeType: string, sizesStr: string): void => {
  if (!shoeType.trim() || !sizesStr.trim()) throw new Error("Nama tipe sepatu dan ukuran tidak boleh kosong.");
  const sizes = [...new Set(sizesStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0))].sort((a,b) => a-b);
  if (sizes.length === 0) throw new Error("Harap masukkan setidaknya satu nomor ukuran yang valid.");
  try {
    db.run("INSERT INTO shoe_masters (id, shoe_type, sizes) VALUES (?, ?, ?)", [crypto.randomUUID(), shoeType.trim(), JSON.stringify(sizes)]);
    persistDB();
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) throw new Error(`Tipe sepatu "${shoeType}" sudah ada.`);
    throw e;
  }
};

export const updateShoeMaster = (id: string, shoeType: string, sizesStr: string): void => {
    if (!shoeType.trim() || !sizesStr.trim()) throw new Error("Nama tipe sepatu dan ukuran tidak boleh kosong.");
    const sizes = [...new Set(sizesStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0))].sort((a,b) => a-b);
    if (sizes.length === 0) throw new Error("Harap masukkan setidaknya satu nomor ukuran yang valid.");
    try {
        db.run("UPDATE shoe_masters SET shoe_type = ?, sizes = ? WHERE id = ?", [shoeType.trim(), JSON.stringify(sizes), id]);
        persistDB();
    } catch (e) {
        if (e.message.includes('UNIQUE constraint failed')) throw new Error(`Tipe sepatu "${shoeType}" sudah ada.`);
        throw e;
    }
}

export const deleteShoeMaster = (id: string): void => {
    const masterRes = db.exec("SELECT shoe_type FROM shoe_masters WHERE id = ?", [id]);
    if (masterRes.length === 0) throw new Error("Master data tidak ditemukan.");
    const shoeTypeToDelete = masterRes[0].values[0][0];
    const inventoryRes = db.exec("SELECT 1 FROM inventory WHERE shoe_type = ? LIMIT 1", [shoeTypeToDelete]);
    if (inventoryRes.length > 0) throw new Error(`Tidak dapat menghapus "${shoeTypeToDelete}" karena masih ada stok yang terdaftar.`);
    db.run("DELETE FROM shoe_masters WHERE id = ?", [id]);
    persistDB();
}

// --- Maklun Master ---
export const addMaklunMaster = (name: string): void => {
  if (!name.trim()) throw new Error("Nama sumber Maklun tidak boleh kosong.");
  try {
    db.run("INSERT INTO maklun_masters (id, name) VALUES (?, ?)", [crypto.randomUUID(), name.trim()]);
    persistDB();
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) throw new Error(`Nama sumber "${name}" sudah ada.`);
    throw e;
  }
};

export const updateMaklunMaster = (id: string, name: string): void => {
  if (!name.trim()) throw new Error("Nama sumber Maklun tidak boleh kosong.");
  try {
    db.run("UPDATE maklun_masters SET name = ? WHERE id = ?", [name.trim(), id]);
    persistDB();
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) throw new Error(`Nama sumber "${name}" sudah ada.`);
    throw e;
  }
};

export const deleteMaklunMaster = (id: string): void => {
  const masterRes = db.exec("SELECT name FROM maklun_masters WHERE id = ?", [id]);
  if (masterRes.length === 0) throw new Error("Master data tidak ditemukan.");
  const nameToDelete = masterRes[0].values[0][0];
  // Check both source and notes for maklun usage
  const transactionRes = db.exec("SELECT 1 FROM transactions WHERE source = ? OR notes LIKE ? LIMIT 1", [nameToDelete, `%Dikeluarkan ke: ${nameToDelete}%`]);
  if (transactionRes.length > 0) throw new Error(`Tidak dapat menghapus "${nameToDelete}" karena sudah pernah digunakan dalam transaksi.`);
  db.run("DELETE FROM maklun_masters WHERE id = ?", [id]);
  persistDB();
};

// --- Leather Master ---
export const addLeatherMaster = (name: string): void => {
  if (!name.trim()) throw new Error("Jenis kulit tidak boleh kosong.");
  try {
    db.run("INSERT INTO leather_masters (id, name) VALUES (?, ?)", [crypto.randomUUID(), name.trim()]);
    persistDB();
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) throw new Error(`Jenis kulit "${name}" sudah ada.`);
    throw e;
  }
};

export const updateLeatherMaster = (id: string, name: string): void => {
  if (!name.trim()) throw new Error("Jenis kulit tidak boleh kosong.");
  try {
    db.run("UPDATE leather_masters SET name = ? WHERE id = ?", [name.trim(), id]);
    persistDB();
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) throw new Error(`Jenis kulit "${name}" sudah ada.`);
    throw e;
  }
};

export const deleteLeatherMaster = (id: string): void => {
  const masterRes = db.exec("SELECT name FROM leather_masters WHERE id = ?", [id]);
  if (masterRes.length === 0) throw new Error("Master data tidak ditemukan.");
  const nameToDelete = masterRes[0].values[0][0];
  const inventoryRes = db.exec("SELECT 1 FROM inventory_leather WHERE leather_master_id = ? LIMIT 1", [id]);
  if (inventoryRes.length > 0) throw new Error(`Tidak dapat menghapus "${nameToDelete}" karena masih ada stok.`);
  db.run("DELETE FROM leather_masters WHERE id = ?", [id]);
  persistDB();
};


// --- Inventory and Transactions ---
const addShoeTransaction = (type: TransactionType, shoe: Shoe, quantity: number, warehouse: WarehouseCategory, source?: string, notes?: string) => {
  db.run("INSERT INTO transactions (id, date, type, shoe_type, size, quantity, warehouse, source, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [crypto.randomUUID(), new Date().toISOString(), type, shoe.shoeType, shoe.size, quantity, warehouse, source || null, notes || null]);
};

const addLeatherTransaction = (type: TransactionType, leather: { name: string }, quantity: number, source?: string, notes?: string) => {
  db.run("INSERT INTO transactions (id, date, type, leather_name, quantity, warehouse, source, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [crypto.randomUUID(), new Date().toISOString(), type, leather.name, quantity, WarehouseCategory.LEATHER, source || null, notes || null]);
};

export const addStock = (shoe: Shoe, quantity: number, warehouse: WarehouseCategory, source?: string): void => {
  db.run("BEGIN TRANSACTION");
  try {
    const res = db.exec("SELECT id, quantity FROM inventory WHERE shoe_type = ? AND size = ? AND warehouse = ?", [shoe.shoeType, shoe.size, warehouse]);
    if (res.length > 0) {
      const existingId = res[0].values[0][0];
      const existingQty = res[0].values[0][1];
      db.run("UPDATE inventory SET quantity = ? WHERE id = ?", [existingQty + quantity, existingId]);
    } else {
      db.run("INSERT INTO inventory (id, shoe_type, size, quantity, warehouse) VALUES (?, ?, ?, ?, ?)",
        [crypto.randomUUID(), shoe.shoeType, shoe.size, quantity, warehouse]);
    }
    addShoeTransaction(TransactionType.IN, shoe, quantity, warehouse, source);
    db.run("COMMIT");
    persistDB();
  } catch (e) {
    db.run("ROLLBACK");
    throw e;
  }
};

export const addLeatherStock = (leatherMaster: LeatherMaster, quantity: number, supplier: string): void => {
  db.run("BEGIN TRANSACTION");
  try {
    const res = db.exec("SELECT id, quantity FROM inventory_leather WHERE leather_master_id = ? AND supplier = ?", [leatherMaster.id, supplier]);
    if (res.length > 0) {
      const [existingId, existingQty] = res[0].values[0];
      db.run("UPDATE inventory_leather SET quantity = ? WHERE id = ?", [existingQty + quantity, existingId]);
    } else {
      db.run("INSERT INTO inventory_leather (id, leather_master_id, supplier, quantity) VALUES (?, ?, ?, ?)",
        [crypto.randomUUID(), leatherMaster.id, supplier, quantity]);
    }
    addLeatherTransaction(TransactionType.IN, { name: leatherMaster.name }, quantity, supplier);
    db.run("COMMIT");
    persistDB();
  } catch (e) {
    db.run("ROLLBACK");
    throw e;
  }
};

export const returnLeatherStock = (leatherMaster: LeatherMaster, quantity: number, returneeName: string, notes: string): void => {
    const supplierForReturn = 'Retur';
    db.run("BEGIN TRANSACTION");
    try {
        const res = db.exec("SELECT id, quantity FROM inventory_leather WHERE leather_master_id = ? AND supplier = ?", [leatherMaster.id, supplierForReturn]);
        if (res.length > 0) {
            const [existingId, existingQty] = res[0].values[0];
            db.run("UPDATE inventory_leather SET quantity = ? WHERE id = ?", [existingQty + quantity, existingId]);
        } else {
            db.run("INSERT INTO inventory_leather (id, leather_master_id, supplier, quantity) VALUES (?, ?, ?, ?)",
                [crypto.randomUUID(), leatherMaster.id, supplierForReturn, quantity]);
        }
        const finalNotes = `Ket: ${notes}. Dikembalikan oleh: ${returneeName}.`;
        addLeatherTransaction(TransactionType.IN, { name: leatherMaster.name }, quantity, 'Retur', finalNotes);
        db.run("COMMIT");
        persistDB();
    } catch (e) {
        db.run("ROLLBACK");
        throw e;
    }
};

const modifyShoeStock = (itemId: string, warehouse: WarehouseCategory, quantityChange: number, notes: string, type: TransactionType, source?: string): void => {
  db.run("BEGIN TRANSACTION");
  try {
    const res = db.exec("SELECT shoe_type, size, quantity FROM inventory WHERE id = ? AND warehouse = ?", [itemId, warehouse]);
    if (res.length === 0) throw new Error("Item tidak ditemukan di gudang yang dipilih.");

    const [shoeType, size, currentQty] = res[0].values[0];
    const newQty = currentQty - quantityChange;
    if (newQty < 0) throw new Error("Stok tidak mencukupi.");

    if (newQty === 0) {
      db.run("DELETE FROM inventory WHERE id = ?", [itemId]);
    } else {
      db.run("UPDATE inventory SET quantity = ? WHERE id = ?", [newQty, itemId]);
    }

    addShoeTransaction(type, { shoeType, size }, quantityChange, warehouse, source, notes);
    db.run("COMMIT");
    persistDB();
  } catch (e) {
    db.run("ROLLBACK");
    throw e;
  }
}

export const removeLeatherStock = (item: LeatherInventoryItem, quantityToRemove: number, releasedTo: string): void => {
  db.run("BEGIN TRANSACTION");
  try {
    const newQty = item.quantity - quantityToRemove;
    if (newQty < 0) throw new Error("Stok kulit tidak mencukupi.");

    if (newQty === 0) {
      db.run("DELETE FROM inventory_leather WHERE id = ?", [item.id]);
    } else {
      db.run("UPDATE inventory_leather SET quantity = ? WHERE id = ?", [newQty, item.id]);
    }
    
    const notes = `Dikeluarkan ke: ${releasedTo}. Dari supplier: ${item.supplier}.`;
    addLeatherTransaction(TransactionType.OUT, { name: item.name }, quantityToRemove, undefined, notes);
    db.run("COMMIT");
    persistDB();
  } catch (e) {
    db.run("ROLLBACK");
    throw e;
  }
};

export const sellStock = (itemId: string, quantityToSell: number): void => {
  modifyShoeStock(itemId, WarehouseCategory.FINISHED_GOODS, quantityToSell, 'Penjualan', TransactionType.OUT);
};

export const removeStock = (itemId: string, warehouse: WarehouseCategory, quantityToRemove: number, releasedTo: string): void => {
  const notes = `Dikeluarkan ke: ${releasedTo}`;
  modifyShoeStock(itemId, warehouse, quantityToRemove, notes, TransactionType.OUT);
};


export const transferStock = (itemId: string, quantityToTransfer: number, fromWarehouse: WarehouseCategory, toWarehouse: WarehouseCategory, source: string): void => {
  db.run("BEGIN TRANSACTION");
  try {
    // 1. Get item info and decrease stock from source
    const res = db.exec("SELECT shoe_type, size, quantity FROM inventory WHERE id = ? AND warehouse = ?", [itemId, fromWarehouse]);
    if (res.length === 0) throw new Error("Item tidak ditemukan di gudang asal.");

    const [shoeType, size, currentQty] = res[0].values[0];
    const newQty = currentQty - quantityToTransfer;
    if (newQty < 0) throw new Error("Stok di gudang asal tidak mencukupi.");

    if (newQty === 0) {
      db.run("DELETE FROM inventory WHERE id = ?", [itemId]);
    } else {
      db.run("UPDATE inventory SET quantity = ? WHERE id = ?", [newQty, itemId]);
    }

    const shoe: Shoe = { shoeType, size };
    addShoeTransaction(TransactionType.OUT, shoe, quantityToTransfer, fromWarehouse, undefined, `Transfer ke ${WAREHOUSE_NAMES[toWarehouse]}`);

    // 2. Increase stock in destination
    const destRes = db.exec("SELECT id, quantity FROM inventory WHERE shoe_type = ? AND size = ? AND warehouse = ?", [shoe.shoeType, shoe.size, toWarehouse]);
    if (destRes.length > 0) {
      const [destId, destQty] = destRes[0].values[0];
      db.run("UPDATE inventory SET quantity = ? WHERE id = ?", [destQty + quantityToTransfer, destId]);
    } else {
      db.run("INSERT INTO inventory (id, shoe_type, size, quantity, warehouse) VALUES (?, ?, ?, ?, ?)",
        [crypto.randomUUID(), shoe.shoeType, shoe.size, quantityToTransfer, toWarehouse]);
    }
    
    addShoeTransaction(TransactionType.IN, shoe, quantityToTransfer, toWarehouse, source, `Transfer dari ${WAREHOUSE_NAMES[fromWarehouse]}`);

    db.run("COMMIT");
    persistDB();
  } catch (e) {
    db.run("ROLLBACK");
    throw e;
  }
};

export const updateShoeStockQuantity = (itemId: string, newQuantity: number): void => {
    if (newQuantity < 0) throw new Error("Jumlah baru tidak boleh negatif.");

    db.run("BEGIN TRANSACTION");
    try {
        const res = db.exec("SELECT shoe_type, size, quantity, warehouse FROM inventory WHERE id = ?", [itemId]);
        if (res.length === 0) throw new Error("Item stok tidak ditemukan.");
        
        const [shoeType, size, oldQuantity, warehouse] = res[0].values[0];
        const quantityChange = newQuantity - oldQuantity;

        if (quantityChange === 0) {
            db.run("ROLLBACK");
            return;
        }

        if (newQuantity === 0) {
            db.run("DELETE FROM inventory WHERE id = ?", [itemId]);
        } else {
            db.run("UPDATE inventory SET quantity = ? WHERE id = ?", [newQuantity, itemId]);
        }

        const transactionType = quantityChange > 0 ? TransactionType.IN : TransactionType.OUT;
        addShoeTransaction(transactionType, { shoeType, size }, Math.abs(quantityChange), warehouse, undefined, "Penyesuaian Stok");
        
        db.run("COMMIT");
        persistDB();
    } catch (e) {
        db.run("ROLLBACK");
        throw e;
    }
};

export const deleteShoeStock = (itemId: string): void => {
    db.run("BEGIN TRANSACTION");
    try {
        const res = db.exec("SELECT shoe_type, size, quantity, warehouse FROM inventory WHERE id = ?", [itemId]);
        if (res.length === 0) throw new Error("Item stok tidak ditemukan.");
        
        const [shoeType, size, quantity, warehouse] = res[0].values[0];
        
        db.run("DELETE FROM inventory WHERE id = ?", [itemId]);
        
        addShoeTransaction(TransactionType.OUT, { shoeType, size }, quantity, warehouse, undefined, "Penghapusan Stok");
        
        db.run("COMMIT");
        persistDB();
    } catch (e) {
        db.run("ROLLBACK");
        throw e;
    }
};

export const updateLeatherStockQuantity = (itemId: string, newQuantity: number): void => {
    if (newQuantity < 0) throw new Error("Jumlah baru tidak boleh negatif.");

    db.run("BEGIN TRANSACTION");
    try {
        const res = db.exec("SELECT quantity, leather_master_id, supplier FROM inventory_leather WHERE id = ?", [itemId]);
        if (res.length === 0) throw new Error("Stok kulit tidak ditemukan.");
        
        const [oldQuantity, leatherMasterId, supplier] = res[0].values[0];
        const masterRes = db.exec("SELECT name FROM leather_masters WHERE id = ?", [leatherMasterId]);
        if (masterRes.length === 0) throw new Error("Master kulit tidak ditemukan.");
        const leatherName = masterRes[0].values[0][0];

        const quantityChange = newQuantity - oldQuantity;
        if (quantityChange === 0) {
            db.run("ROLLBACK");
            return;
        }

        if (newQuantity === 0) {
            db.run("DELETE FROM inventory_leather WHERE id = ?", [itemId]);
        } else {
            db.run("UPDATE inventory_leather SET quantity = ? WHERE id = ?", [newQuantity, itemId]);
        }

        const transactionType = quantityChange > 0 ? TransactionType.IN : TransactionType.OUT;
        addLeatherTransaction(transactionType, { name: leatherName }, Math.abs(quantityChange), undefined, `Penyesuaian Stok (Supplier: ${supplier})`);

        db.run("COMMIT");
        persistDB();
    } catch (e) {
        db.run("ROLLBACK");
        throw e;
    }
};

export const deleteLeatherStockByItemId = (itemId: string): void => {
    db.run("BEGIN TRANSACTION");
    try {
        const res = db.exec("SELECT quantity, leather_master_id, supplier FROM inventory_leather WHERE id = ?", [itemId]);
        if (res.length === 0) throw new Error("Stok kulit tidak ditemukan.");
        
        const [quantity, leatherMasterId, supplier] = res[0].values[0];
        const masterRes = db.exec("SELECT name FROM leather_masters WHERE id = ?", [leatherMasterId]);
        if (masterRes.length === 0) throw new Error("Master kulit tidak ditemukan.");
        const leatherName = masterRes[0].values[0][0];

        db.run("DELETE FROM inventory_leather WHERE id = ?", [itemId]);

        addLeatherTransaction(TransactionType.OUT, { name: leatherName }, quantity, undefined, `Penghapusan Stok (Supplier: ${supplier})`);

        db.run("COMMIT");
        persistDB();
    } catch (e) {
        db.run("ROLLBACK");
        throw e;
    }
};