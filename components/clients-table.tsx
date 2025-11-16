"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Mail, Phone, Star } from "lucide-react"
import { useState, useMemo } from "react"

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
  const [searchQuery, setSearchQuery] = useState("")

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

  return (
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
                      <Button variant="ghost" size="sm" onClick={() => onViewClient(client)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
