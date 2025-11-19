-- Populate inventory with spare parts list
INSERT INTO inventory_parts (part_number, name, description, current_stock, reorder_level, unit_price, category_id) VALUES
('PART-001', 'Engine Oil', '5W-30 / 20W-50, All vehicles', 0, 10, 0, NULL),
('PART-002', 'Oil Filter', 'Standard / Heavy-duty, All vehicles', 0, 15, 0, NULL),
('PART-003', 'Air Filter', 'Various sizes, All vehicles', 0, 15, 0, NULL),
('PART-004', 'Fuel Filter', 'Inline / Cartridge, All vehicles', 0, 10, 0, NULL),
('PART-005', 'Spark Plug', 'NGK / Bosch, Cars & Motorbikes', 0, 20, 0, NULL),
('PART-006', 'Brake Pads', 'Front/Rear sets, Cars & Trucks', 0, 10, 0, NULL),
('PART-007', 'Brake Shoes', 'Rear drum type, Motorbikes', 0, 8, 0, NULL),
('PART-008', 'Clutch Plate', 'Standard/Heavy duty, Cars & Motorbikes', 0, 5, 0, NULL),
('PART-009', 'Gear Oil', '75W-90 / 80W-90, All vehicles', 0, 8, 0, NULL),
('PART-010', 'Battery', '12V (various capacities), All vehicles', 0, 5, 0, NULL),
('PART-011', 'Bulbs / Headlamps', 'H4, H7, LED, All vehicles', 0, 20, 0, NULL),
('PART-012', 'Fuses', 'Mini / Standard, All vehicles', 0, 50, 0, NULL),
('PART-013', 'Tyres', 'Standard / Tubeless, All vehicles', 0, 8, 0, NULL),
('PART-014', 'Tubes', 'Rear & Front, Motorbikes', 0, 10, 0, NULL),
('PART-015', 'Wiper Blades', '16–26 inches, Cars & Trucks', 0, 10, 0, NULL),
('PART-016', 'Radiator Coolant', 'Long life coolant, All vehicles', 0, 10, 0, NULL),
('PART-017', 'Belts (Fan/Timing)', 'Rubber belts, All vehicles', 0, 10, 0, NULL),
('PART-018', 'Shock Absorber', 'Front/Rear, All vehicles', 0, 8, 0, NULL),
('PART-019', 'Brake Fluid', 'DOT 3 / DOT 4, All vehicles', 0, 10, 0, NULL),
('PART-020', 'Chain & Sprocket Set', 'Standard/Heavy-duty, Motorbikes', 0, 5, 0, NULL)
ON CONFLICT (part_number) DO NOTHING;
