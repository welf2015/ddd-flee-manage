"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface WorkDriveFolder {
  id: string
  name: string
  parent_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface WorkDriveDocument {
  id: string
  name: string
  folder_id: string | null
  file_url: string
  file_type: string
  file_size: number | null
  uploaded_by: string
  created_at: string
  updated_at: string
}

// Get all folders (optionally filtered by parent)
export async function getFolders(parentId?: string | null) {
  const supabase = await createClient()

  let query = supabase.from("workdrive_folders").select("*").order("name", { ascending: true })

  if (parentId === null || parentId === undefined) {
    query = query.is("parent_id", null)
  } else {
    query = query.eq("parent_id", parentId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching folders:", error)
    return []
  }

  return data as WorkDriveFolder[]
}

// Get folder by ID with breadcrumb path
export async function getFolderWithPath(folderId: string) {
  const supabase = await createClient()

  const { data: folder, error } = await supabase.from("workdrive_folders").select("*").eq("id", folderId).single()

  if (error) {
    console.error("Error fetching folder:", error)
    return null
  }

  // Build breadcrumb path
  const path: WorkDriveFolder[] = [folder]
  let currentFolder = folder

  while (currentFolder.parent_id) {
    const { data: parentFolder } = await supabase
      .from("workdrive_folders")
      .select("*")
      .eq("id", currentFolder.parent_id)
      .single()

    if (parentFolder) {
      path.unshift(parentFolder)
      currentFolder = parentFolder
    } else {
      break
    }
  }

  return { folder, path }
}

// Get documents in a folder
export async function getDocuments(folderId?: string | null) {
  const supabase = await createClient()

  let query = supabase.from("workdrive_documents").select("*").order("name", { ascending: true })

  if (folderId === null || folderId === undefined) {
    query = query.is("folder_id", null)
  } else {
    query = query.eq("folder_id", folderId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching documents:", error)
    return []
  }

  return data as WorkDriveDocument[]
}

// Create a new folder
export async function createFolder(name: string, parentId?: string | null) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("workdrive_folders")
    .insert({
      name,
      parent_id: parentId || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating folder:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/workdrive")
  return { success: true, folder: data }
}

// Rename a folder
export async function renameFolder(folderId: string, newName: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("workdrive_folders")
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq("id", folderId)

  if (error) {
    console.error("Error renaming folder:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/workdrive")
  return { success: true }
}

// Delete a folder (and all its contents due to CASCADE)
export async function deleteFolder(folderId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("workdrive_folders").delete().eq("id", folderId)

  if (error) {
    console.error("Error deleting folder:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/workdrive")
  return { success: true }
}

// Upload a document
export async function uploadDocument(
  name: string,
  fileUrl: string,
  fileType: string,
  fileSize: number,
  folderId?: string | null,
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("workdrive_documents")
    .insert({
      name,
      folder_id: folderId || null,
      file_url: fileUrl,
      file_type: fileType,
      file_size: fileSize,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("Error uploading document:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/workdrive")
  return { success: true, document: data }
}

// Rename a document
export async function renameDocument(documentId: string, newName: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("workdrive_documents")
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq("id", documentId)

  if (error) {
    console.error("Error renaming document:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/workdrive")
  return { success: true }
}

// Delete a document
export async function deleteDocument(documentId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("workdrive_documents").delete().eq("id", documentId)

  if (error) {
    console.error("Error deleting document:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/workdrive")
  return { success: true }
}

// Move document to a different folder
export async function moveDocument(documentId: string, targetFolderId: string | null) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("workdrive_documents")
    .update({ folder_id: targetFolderId, updated_at: new Date().toISOString() })
    .eq("id", documentId)

  if (error) {
    console.error("Error moving document:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/workdrive")
  return { success: true }
}

// Move folder to a different parent
export async function moveFolder(folderId: string, targetParentId: string | null) {
  const supabase = await createClient()

  // Prevent moving folder into itself or its descendants
  if (targetParentId) {
    const { data: targetFolder } = await supabase
      .from("workdrive_folders")
      .select("*")
      .eq("id", targetParentId)
      .single()

    if (targetFolder) {
      let currentParent = targetFolder
      while (currentParent.parent_id) {
        if (currentParent.parent_id === folderId) {
          return { success: false, error: "Cannot move folder into its own descendant" }
        }
        const { data: parent } = await supabase
          .from("workdrive_folders")
          .select("*")
          .eq("id", currentParent.parent_id)
          .single()
        if (!parent) break
        currentParent = parent
      }
    }
  }

  const { error } = await supabase
    .from("workdrive_folders")
    .update({ parent_id: targetParentId, updated_at: new Date().toISOString() })
    .eq("id", folderId)

  if (error) {
    console.error("Error moving folder:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/workdrive")
  return { success: true }
}
