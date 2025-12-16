-- Add DELETE policies for inventory tables

DROP POLICY IF EXISTS "Authenticated users can delete inventory_categories" ON inventory_categories;
CREATE POLICY "Authenticated users can delete inventory_categories"
ON inventory_categories FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete inventory_parts" ON inventory_parts;
CREATE POLICY "Authenticated users can delete inventory_parts"
ON inventory_parts FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete inventory_transactions" ON inventory_transactions;
CREATE POLICY "Authenticated users can delete inventory_transactions"
ON inventory_transactions FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete stock_adjustments" ON stock_adjustments;
CREATE POLICY "Authenticated users can delete stock_adjustments"
ON stock_adjustments FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete inventory_collections" ON inventory_collections;
CREATE POLICY "Authenticated users can delete inventory_collections"
ON inventory_collections FOR DELETE TO authenticated USING (true);
