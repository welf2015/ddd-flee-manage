"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Mail, Phone, Star, Edit, Trash2 } from "lucide-react"
import { useState, useMemo } from "react"
import { CreateClientDialog } from "@/components/create-client-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { deleteClient } from "@/app/actions/clients"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Client = {
  id: string
  name: string
  contact_name: string
  phone: string
  email: string
  address: string | null
  created_at: string
}

type ClientsTableProps = {
  clients: Client[]
  clientBookings: Map<string, number>
  onViewClient: (client: Client) => void
}

export function ClientsTable({ clients, clientBookings, onViewClient }: ClientsTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        searchQuery === "" ||
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [clients, searchQuery])

  const getClientFrequency = (clientId: string) => {
    const count = clientBookings.get(clientId) || 0
    if (count >= 5) return { label: "VIP Client", color: "bg-accent text-accent-foreground" }
    if (count >= 3) return { label: "Frequent", color: "bg-blue-500" }
    if (count >= 1) return { label: "Active", color: "bg-green-600" }
    return null
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return

    setIsDeleting(true)
    const result = await deleteClient(deleteConfirm.id)

    if (result.success) {
      toast.success("Client deleted successfully")
      setDeleteConfirm(null)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to delete client", {
        duration: 5000,
      })
    }
    setIsDeleting(false)
  }

  const handleEditSuccess = () => {
    router.refresh()
  }

  return (
    <>
    <Card className="bg-background/50 backdrop-blur">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Clients</CardTitle>
          <Input
            placeholder="Search clients..."
            className="sm:w-[250px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredClients.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {clients.length === 0
              ? "No clients yet. Add your first client to get started."
              : "No clients match your search."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => {
                const frequency = getClientFrequency(client.id)
                return (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {client.name}
                        {frequency && (
                          <Badge className={`${frequency.color} flex items-center gap-1`}>
                            <Star className="h-3 w-3" />
                            {frequency.label}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{client.contact_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {client.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {client.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onViewClient(client)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditClient(client)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm({ id: client.id, name: client.name })}
                          disabled={isDeleting}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    <CreateClientDialog
      open={!!editClient}
      onOpenChange={(open) => !open && setEditClient(null)}
      client={editClient}
      onSuccess={handleEditSuccess}
    />

    <ConfirmDialog
      open={!!deleteConfirm}
      onOpenChange={(open) => !open && setDeleteConfirm(null)}
      title="Delete Client"
      description={`Are you sure you want to delete ${deleteConfirm?.name}? This action cannot be undone.`}
      onConfirm={handleDelete}
      confirmText="Delete"
      cancelText="Cancel"
      variant="destructive"
    />
  </>
  )
}
