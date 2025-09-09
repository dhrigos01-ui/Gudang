-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "WarehouseCategory" AS ENUM ('finished_goods', 'wip', 'nearly_finished', 'leather');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('IN', 'OUT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoeMaster" (
    "id" TEXT NOT NULL,
    "shoe_type" TEXT NOT NULL,
    "sizes" INTEGER[],

    CONSTRAINT "ShoeMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaklunMaster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MaklunMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeatherMaster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "LeatherMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "shoe_master_id" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "warehouse" "WarehouseCategory" NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeatherInventory" (
    "id" TEXT NOT NULL,
    "leather_master_id" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LeatherInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "TransactionType" NOT NULL,
    "shoe_type" TEXT,
    "size" INTEGER,
    "leather_name" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "warehouse" "WarehouseCategory" NOT NULL,
    "source" TEXT,
    "notes" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ShoeMaster_shoe_type_key" ON "ShoeMaster"("shoe_type");

-- CreateIndex
CREATE UNIQUE INDEX "MaklunMaster_name_key" ON "MaklunMaster"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LeatherMaster_name_key" ON "LeatherMaster"("name");

-- CreateIndex
CREATE INDEX "Inventory_shoe_master_id_idx" ON "Inventory"("shoe_master_id");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_shoe_master_id_size_warehouse_key" ON "Inventory"("shoe_master_id", "size", "warehouse");

-- CreateIndex
CREATE INDEX "LeatherInventory_leather_master_id_idx" ON "LeatherInventory"("leather_master_id");

-- CreateIndex
CREATE UNIQUE INDEX "LeatherInventory_leather_master_id_supplier_key" ON "LeatherInventory"("leather_master_id", "supplier");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_shoe_master_id_fkey" FOREIGN KEY ("shoe_master_id") REFERENCES "ShoeMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeatherInventory" ADD CONSTRAINT "LeatherInventory_leather_master_id_fkey" FOREIGN KEY ("leather_master_id") REFERENCES "LeatherMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
