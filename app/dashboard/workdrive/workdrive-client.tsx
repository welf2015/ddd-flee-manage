"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Folder,
  FileText,
  Upload,
  Plus,
  MoreVertical,
  Trash2,
  Pencil,
  Download,
  Eye,
  ChevronRight,
  Home,
  Loader2,
  FileIcon,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import {
  getFolders,
  getDocuments,
  createFolder,
  deleteFolder,
  renameFolder,
  uploadDocument,
  deleteDocument,
  renameDocument,
  getFolderWithPath,
  type WorkDriveFolder,
  type WorkDriveDocument,
} from "@/app/actions/workdrive"

export function WorkDriveClient() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folders, setFolders] = useState<WorkDriveFolder[]>([])
  const [documents, setDocuments] = useState<WorkDriveDocument[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<WorkDriveFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; type: "folder" | "document" } | null>(
    null,
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: "folder" | "document" } | null>(
    null,
  )
  const [previewDocument, setPreviewDocument] = useState<WorkDriveDocument | null>(null)

  // Load folder contents
  const loadContents = async () => {
    setLoading(true)
    try {
      const [foldersData, documentsData] = await Promise.all([
        getFolders(currentFolderId),
        getDocuments(currentFolderId),
      ])
      setFolders(foldersData)
      setDocuments(documentsData)

      // Load breadcrumbs
      if (currentFolderId) {
        const folderData = await getFolderWithPath(currentFolderId)
        if (folderData) {
          setBreadcrumbs(folderData.path)
        }
      } else {
        setBreadcrumbs([])
      }
    } catch (error) {
      console.error("Error loading contents:", error)
      toast.error("Failed to load contents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContents()
  }, [currentFolderId])

  // Navigate to folder
  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId)
  }

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name")
      return
    }

    const result = await createFolder(newFolderName.trim(), currentFolderId)
    if (result.success) {
      toast.success("Folder created successfully")
      setCreateFolderOpen(false)
      setNewFolderName("")
      loadContents()
    } else {
      toast.error(result.error || "Failed to create folder")
    }
  }

  // Rename item
  const handleRename = async () => {
    if (!renameTarget || !renameTarget.name.trim()) {
      toast.error("Please enter a name")
      return
    }

    const result =
      renameTarget.type === "folder"
        ? await renameFolder(renameTarget.id, renameTarget.name.trim())
        : await renameDocument(renameTarget.id, renameTarget.name.trim())

    if (result.success) {
      toast.success(`${renameTarget.type === "folder" ? "Folder" : "Document"} renamed successfully`)
      setRenameDialogOpen(false)
      setRenameTarget(null)
      loadContents()
    } else {
      toast.error(result.error || "Failed to rename")
    }
  }

  // Delete item
  const handleDelete = async () => {
    if (!deleteTarget) return

    const result =
      deleteTarget.type === "folder" ? await deleteFolder(deleteTarget.id) : await deleteDocument(deleteTarget.id)

    if (result.success) {
      toast.success(`${deleteTarget.type === "folder" ? "Folder" : "Document"} deleted successfully`)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      loadContents()
    } else {
      toast.error(result.error || "Failed to delete")
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF and Word documents are allowed")
      return
    }

    setUploading(true)

    try {
      // Get upload config
      const configRes = await fetch("/api/upload")
      if (!configRes.ok) {
        throw new Error("Upload service not configured")
      }

      const { workerUrl, authKey } = await configRes.json()
      if (!workerUrl || !authKey) {
        throw new Error("Worker URL or Auth Key not configured")
      }

      // Upload to R2
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "workdrive")

      const response = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "X-Auth-Key": authKey,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Upload failed: ${errorText}`)
      }

      const { url } = await response.json()

      // Determine file type
      let fileType = "pdf"
      if (file.type === "application/msword") {
        fileType = "doc"
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        fileType = "docx"
      }

      // Save document to database
      const result = await uploadDocument(file.name, url, fileType, file.size, currentFolderId)

      if (result.success) {
        toast.success("Document uploaded successfully")
        loadContents()
      } else {
        toast.error(result.error || "Failed to save document")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(`Failed to upload: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ""
    }
  }

  // Format file size
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="h-8 w-8 text-red-500" />
      case "doc":
      case "docx":
        return <FileIcon className="h-8 w-8 text-blue-500" />
      default:
        return <FileText className="h-8 w-8 text-muted-foreground" />
    }
  }

  // Filter items based on search
  const filteredFolders = folders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredDocuments = documents.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WorkDrive</h1>
          <p className="text-muted-foreground">Manage and organize your company documents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCreateFolderOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <Button className="relative" disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </Button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => navigateToFolder(null)}>
          <Home className="h-4 w-4" />
        </Button>
        {breadcrumbs.map((folder, index) => (
          <div key={folder.id} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => navigateToFolder(folder.id)}>
              {folder.name}
            </Button>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search files and folders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentFolderId ? breadcrumbs[breadcrumbs.length - 1]?.name || "Folder" : "All Files"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFolders.length === 0 && filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Folder className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No files or folders</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No items match your search" : "Create a folder or upload a document to get started"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Folders */}
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="group relative flex flex-col items-center p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                  onDoubleClick={() => navigateToFolder(folder.id)}
                >
                  <Folder className="h-12 w-12 text-yellow-500 mb-2" />
                  <span className="text-sm font-medium text-center truncate w-full">{folder.name}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigateToFolder(folder.id)}>
                        <Folder className="mr-2 h-4 w-4" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setRenameTarget({ id: folder.id, name: folder.name, type: "folder" })
                          setRenameDialogOpen(true)
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setDeleteTarget({ id: folder.id, name: folder.name, type: "folder" })
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              {/* Documents */}
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="group relative flex flex-col items-center p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                  onDoubleClick={() => setPreviewDocument(doc)}
                >
                  {getFileIcon(doc.file_type)}
                  <span className="text-sm font-medium text-center truncate w-full mt-2">{doc.name}</span>
                  <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewDocument(doc)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={doc.file_url} download={doc.name} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setRenameTarget({ id: doc.id, name: doc.name, type: "document" })
                          setRenameDialogOpen(true)
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setDeleteTarget({ id: doc.id, name: doc.name, type: "document" })
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Enter a name for the new folder</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {renameTarget?.type === "folder" ? "Folder" : "Document"}</DialogTitle>
            <DialogDescription>Enter a new name</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="New name"
            value={renameTarget?.name || ""}
            onChange={(e) => setRenameTarget((prev) => (prev ? { ...prev, name: e.target.value } : null))}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.type === "folder" ? "Folder" : "Document"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"?
              {deleteTarget?.type === "folder" && " This will also delete all contents inside the folder."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewDocument?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {previewDocument?.file_type === "pdf" ? (
              <iframe
                src={previewDocument.file_url}
                className="w-full h-[70vh] rounded-lg border"
                title={previewDocument.name}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                {getFileIcon(previewDocument?.file_type || "")}
                <p className="mt-4 text-muted-foreground">Preview not available for this file type</p>
                <Button asChild className="mt-4">
                  <a
                    href={previewDocument?.file_url}
                    download={previewDocument?.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download to view
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
