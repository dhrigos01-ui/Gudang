
-- Non-destructive migration to add a new enum value 'finishing'
-- Keeps existing data intact

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'WarehouseCategory'
      AND e.enumlabel = 'finishing'
  ) THEN
    ALTER TYPE "WarehouseCategory" ADD VALUE 'finishing';
  END IF;
END$$;


