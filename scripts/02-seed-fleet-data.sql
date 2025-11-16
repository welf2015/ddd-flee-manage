-- Seed data for Fleet Management System

-- Insert sample clients
INSERT INTO public.clients (name, contact_name, phone, email, address) VALUES
('ABC Logistics', 'John Doe', '+234-800-1234', 'john@abclogistics.com', '123 Lagos Street, Lagos'),
('XYZ Trading Co', 'Jane Smith', '+234-800-5678', 'jane@xyztrading.com', '456 Abuja Road, Abuja'),
('Prime Distributors', 'Michael Johnson', '+234-800-9012', 'michael@primedist.com', '789 Port Harcourt Ave, PH');

-- Insert sample vehicles
INSERT INTO public.vehicles (vehicle_number, vehicle_type, make, model, year, status) VALUES
('TRK-001', 'Truck', 'Mercedes-Benz', 'Actros', 2020, 'Active'),
('TRK-002', 'Truck', 'Volvo', 'FH16', 2021, 'Active'),
('TRK-003', 'Truck', 'MAN', 'TGX', 2019, 'In Maintenance'),
('CAR-001', 'Car', 'Toyota', 'Camry', 2022, 'Active'),
('CAR-002', 'Car', 'Honda', 'Accord', 2021, 'Active'),
('BIKE-001', 'Bike', 'Yamaha', 'YBR 125', 2023, 'Active'),
('BIKE-002', 'Bike', 'Honda', 'CB125', 2023, 'Active');

-- Insert sample drivers
INSERT INTO public.drivers (full_name, phone, license_number, license_expiry, status) VALUES
('Ahmed Ibrahim', '+234-801-1111', 'DL-123456', '2025-12-31', 'Active'),
('Chidi Okafor', '+234-802-2222', 'DL-234567', '2026-06-30', 'Active'),
('Fatima Bello', '+234-803-3333', 'DL-345678', '2025-09-15', 'Active'),
('Emeka Nwankwo', '+234-804-4444', 'DL-456789', '2026-03-20', 'Active');

-- Note: Bookings, incidents, and other data will be created through the UI
