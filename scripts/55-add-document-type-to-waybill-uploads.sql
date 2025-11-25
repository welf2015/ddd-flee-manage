-- Add document_type to waybill_uploads to distinguish between waybill and fuel receipt

ALTER TABLE waybill_uploads
ADD COLUMN IF NOT EXISTS document_type TEXT CHECK (document_type IN ('Waybill', 'Fuel Receipt')) DEFAULT 'Waybill';

-- Add file_name column if it doesn't exist (for better display)
ALTER TABLE waybill_uploads
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Add file_type column if it doesn't exist
ALTER TABLE waybill_uploads
ADD COLUMN IF NOT EXISTS file_type TEXT;

