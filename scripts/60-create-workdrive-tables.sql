-- WorkDrive Document Management System
-- Create folders table
CREATE TABLE IF NOT EXISTS workdrive_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES workdrive_folders(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS workdrive_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  folder_id UUID REFERENCES workdrive_folders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- pdf, doc, docx
  file_size BIGINT, -- in bytes
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_workdrive_folders_parent ON workdrive_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_workdrive_documents_folder ON workdrive_documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_workdrive_folders_created_by ON workdrive_folders(created_by);
CREATE INDEX IF NOT EXISTS idx_workdrive_documents_uploaded_by ON workdrive_documents(uploaded_by);

-- Enable RLS
ALTER TABLE workdrive_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE workdrive_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for folders (all authenticated users can view, create, update, delete)
CREATE POLICY "Users can view all folders" ON workdrive_folders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create folders" ON workdrive_folders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update folders" ON workdrive_folders
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete folders" ON workdrive_folders
  FOR DELETE TO authenticated USING (true);

-- RLS policies for documents
CREATE POLICY "Users can view all documents" ON workdrive_documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create documents" ON workdrive_documents
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update documents" ON workdrive_documents
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete documents" ON workdrive_documents
  FOR DELETE TO authenticated USING (true);
