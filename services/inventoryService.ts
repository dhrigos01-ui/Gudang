import { AppData, InventoryItem, Shoe, Transaction, TransactionType, WarehouseCategory, ShoeMaster } from '../types';
import { WAREHOUSE_NAMES } from '../constants';

// Deklarasi global untuk sql.js
declare const initSqlJs: (config: { locateFile: (file: string) => string }) => Promise<any>;

const DB_KEY = 'shoeWarehouseDB_sqlite';
let db: any = null;

const createSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS shoe_masters (
      id TEXT PRIMARY KEY,
      shoe_type TEXT NOT NULL UNIQUE,
      sizes TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      shoe_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      warehouse TEXT NOT NULL,
      UNIQUE(shoe_type, size, warehouse)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      shoe_type TEXT NOT NULL,
      size INTEGER NOT NULL,
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

const arrayToObject = (arr: any[], keyField: string) =>
  arr.reduce((obj, item) => {
    obj[item[keyField]] = item;
    return obj;
  }, {});

export const getData = (): AppData => {
  if (!db) throw new Error("Database not initialized");

  const inventoryResult = db.exec("SELECT * FROM inventory");
  const transactionsResult = db.exec("SELECT * FROM transactions ORDER BY date DESC");
  const shoeMastersResult = db.exec("SELECT * FROM shoe_masters ORDER BY shoe_type");

  const appData: AppData = {
    inventory: {
      [WarehouseCategory.FINISHED_GOODS]: [],
      [WarehouseCategory.WIP]: [],
      [WarehouseCategory.NEARLY_FINISHED]: [],
    },
    transactions: [],
    shoeMasters: [],
  };

  if (inventoryResult.length > 0) {
    const items = inventoryResult[0].values.map((row: any[]) => {
      const columns = inventoryResult[0].columns;
      return {
        id: row[columns.indexOf('id')],
        shoeType: row[columns.indexOf('shoe_type')],
        size: row[columns.indexOf('size')],
        quantity: row[columns.indexOf('quantity')],
        warehouse: row[columns.indexOf('warehouse')],
      };
    });
    
    items.forEach((item: InventoryItem & { warehouse: WarehouseCategory }) => {
      if (appData.inventory[item.warehouse]) {
        appData.inventory[item.warehouse].push(item);
      }
    });
  }

  if (transactionsResult.length > 0) {
    appData.transactions = transactionsResult[0].values.map((row: any[]) => {
       const columns = transactionsResult[0].columns;
       return {
          id: row[columns.indexOf('id')],
          date: row[columns.indexOf('date')],
          type: row[columns.indexOf('type')],
          item: {
              shoeType: row[columns.indexOf('shoe_type')],
              size: row[columns.indexOf('size')],
          },
          quantity: row[columns.indexOf('quantity')],
          warehouse: row[columns.indexOf('warehouse')],
          source: row[columns.indexOf('source')],
          notes: row[columns.indexOf('notes')],
       }
    });
  }

  if (shoeMastersResult.length > 0) {
     appData.shoeMasters = shoeMastersResult[0].values.map((row: any[]) => {
       const columns = shoeMastersResult[0].columns;
       return {
         id: row[columns.indexOf('id')],
         shoeType: row[columns.indexOf('shoe_type')],
         sizes: JSON.parse(row[columns.indexOf('sizes')]),
       }
     });
  }

  return appData;
};

// --- CRUD Operations ---

export const addShoeMaster = (shoeType: string, sizesStr: string): void => {
  if (!shoeType.trim() || !sizesStr.trim()) throw new Error("Nama tipe sepatu dan ukuran tidak boleh kosong.");

  const sizes = [...new Set(sizesStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0))].sort((a,b) => a-b);
  if (sizes.length === 0) throw new Error("Harap masukkan setidaknya satu nomor ukuran yang valid.");

  try {
    db.run("INSERT INTO shoe_masters (id, shoe_type, sizes) VALUES (?, ?, ?)", [crypto.randomUUID(), shoeType.trim(), JSON.stringify(sizes)]);
    persistDB();
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) {
      throw new Error(`Tipe sepatu "${shoeType}" sudah ada.`);
    }
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
        if (e.message.includes('UNIQUE constraint failed')) {
            throw new Error(`Tipe sepatu "${shoeType}" sudah ada.`);
        }
        throw e;
    }
}

export const deleteShoeMaster = (id: string): void => {
    const masterRes = db.exec("SELECT shoe_type FROM shoe_masters WHERE id = ?", [id]);
    if (masterRes.length === 0) throw new Error("Master data tidak ditemukan.");
    const shoeTypeToDelete = masterRes[0].values[0][0];

    const inventoryRes = db.exec("SELECT 1 FROM inventory WHERE shoe_type = ? LIMIT 1", [shoeTypeToDelete]);
    if (inventoryRes.length > 0) {
        throw new Error(`Tidak dapat menghapus "${shoeTypeToDelete}" karena masih ada stok yang terdaftar dengan tipe ini.`);
    }

    db.run("DELETE FROM shoe_masters WHERE id = ?", [id]);
    persistDB();
}

const addTransaction = (type: TransactionType, shoe: Shoe, quantity: number, warehouse: WarehouseCategory, source?: string, notes?: string) => {
  db.run("INSERT INTO transactions (id, date, type, shoe_type, size, quantity, warehouse, source, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [crypto.randomUUID(), new Date().toISOString(), type, shoe.shoeType, shoe.size, quantity, warehouse, source || null, notes || null]);
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
    addTransaction(TransactionType.IN, shoe, quantity, warehouse, source);
    db.run("COMMIT");
    persistDB();
  } catch (e) {
    db.run("ROLLBACK");
    throw e;
  }
};

const modifyStock = (itemId: string, warehouse: WarehouseCategory, quantityChange: number, notes: string, type: TransactionType, source?: string): void => {
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

    addTransaction(type, { shoeType, size }, quantityChange, warehouse, source, notes);
    db.run("COMMIT");
    persistDB();
  } catch (e) {
    db.run("ROLLBACK");
    throw e;
  }
}

export const sellStock = (itemId: string, quantityToSell: number): void => {
  modifyStock(itemId, WarehouseCategory.FINISHED_GOODS, quantityToSell, 'Penjualan', TransactionType.OUT);
};

export const removeStock = (itemId: string, warehouse: WarehouseCategory, quantityToRemove: number, notes: string): void => {
  modifyStock(itemId, warehouse, quantityToRemove, notes, TransactionType.OUT);
};


export const transferStock = (itemId: string, quantityToTransfer: number, fromWarehouse: WarehouseCategory, toWarehouse: WarehouseCategory): void => {
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
    addTransaction(TransactionType.OUT, shoe, quantityToTransfer, fromWarehouse, undefined, `Transfer ke ${WAREHOUSE_NAMES[toWarehouse]}`);

    // 2. Increase stock in destination
    const destRes = db.exec("SELECT id, quantity FROM inventory WHERE shoe_type = ? AND size = ? AND warehouse = ?", [shoe.shoeType, shoe.size, toWarehouse]);
    if (destRes.length > 0) {
      const [destId, destQty] = destRes[0].values[0];
      db.run("UPDATE inventory SET quantity = ? WHERE id = ?", [destQty + quantityToTransfer, destId]);
    } else {
      db.run("INSERT INTO inventory (id, shoe_type, size, quantity, warehouse) VALUES (?, ?, ?, ?, ?)",
        [crypto.randomUUID(), shoe.shoeType, shoe.size, quantityToTransfer, toWarehouse]);
    }
    
    addTransaction(TransactionType.IN, shoe, quantityToTransfer, toWarehouse, undefined, `Transfer dari ${WAREHOUSE_NAMES[fromWarehouse]}`);

    db.run("COMMIT");
    persistDB();
  } catch (e) {
    db.run("ROLLBACK");
    throw e;
  }
};