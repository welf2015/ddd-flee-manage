-- Add columns for car design photos and received_at timestamp
ALTER TABLE procurements 
ADD COLUMN IF NOT EXISTS car_design_photos text[],
ADD COLUMN IF NOT EXISTS received_at timestamp with time zone;
