"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, AlertTriangle, Edit, Trash2, ClipboardList } from 'lucide-react'
import { InventorySpreadsheet } from "@/components/inventory/inventory-spreadsheet"
import { CollectionLogDialog } from "@/components/inventory/collection-log-dialog"
import { CollectionLogsTable } from "@/components/inventory/collection-logs-table"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function InventoryClient() {
  const [showAddPart, setShowAddPart] = useState(false)
  const [showCollectionLog, setShowCollectionLog] = useState(false)
  const [selectedPart, setSelectedPart] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  const { data: parts = [], mutate } = useSWR(
    "inventory-parts",
    async () => {
      const { data } = await supabase
        .from("inventory_parts")
        .select("*")
        .order("name", { ascending: true })

      return data || []
    },
    { refreshInterval: 10000 }
  )

  const lowStock = parts.filter((part: any) => part.current_stock <= part.reorder_level)
    .sort((a: any, b: any) => a.current_stock - b.current_stock)

  const stats = {
    totalParts: parts.length,
    lowStockCount: lowStock.length
  }

  const handleEdit = (part: any) => {
    setSelectedPart(part)
    setShowAddPart(true)
  }

  const handleDelete = async (partId: string) => {
    if (!confirm("Are you sure you want to delete this part?")) return

    const { error } = await supabase
      .from("inventory_parts")
      .delete()
      .eq("id", partId)

    if (error) {
      toast.error("Failed to delete part")
    } else {
      toast.success("Part deleted successfully")
      mutate()
    }
  }

  const handleCloseSheet = () => {
    setShowAddPart(false)
    setSelectedPart(null)
  }

  const filteredParts = parts.filter((part: any) =>
    part.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    part.part_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    part.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalParts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Parts in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.lowStockCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Below reorder level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦--</div>
            <p className="text-xs text-muted-foreground mt-1">Inventory value</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="collections">Collection Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Spare Parts Inventory List</CardTitle>
                  <CardDescription>Manage vehicle parts and supplies</CardDescription>
                </div>
                <Button onClick={() => setShowAddPart(true)} className="bg-accent hover:bg-accent/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Inventory
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search parts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="border rounded-lg overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">S/N</TableHead>
                      <TableHead>Part Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Applicable Vehicle Type</TableHead>
                      <TableHead>Description / Notes</TableHead>
                      <TableHead className="text-center">Current Qty</TableHead>
                      <TableHead className="text-center">Reorder Level</TableHead>
                      <TableHead>Supplier / Brand</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No parts found. Click "Add Inventory" to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredParts.map((part: any, index: number) => (
                        <TableRow key={part.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{part.name}</TableCell>
                          <TableCell>{part.category || '-'}</TableCell>
                          <TableCell>{part.applicable_vehicle_type || 'All'}</TableCell>
                          <TableCell>{part.description || '-'}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={part.current_stock <= part.reorder_level ? "destructive" : "secondary"}>
                              {part.current_stock}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{part.reorder_level}</TableCell>
                          <TableCell>{part.supplier_brand || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(part)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(part.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collections" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCollectionLog(true)} className="bg-accent hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" />
              Log Collection
            </Button>
          </div>
          <CollectionLogsTable />
        </TabsContent>
      </Tabs>

      {showAddPart && (
        <InventorySpreadsheet
          open={showAddPart}
          onOpenChange={handleCloseSheet}
          part={selectedPart}
          onSuccess={() => {
            mutate()
            handleCloseSheet()
          }}
        />
      )}

      {showCollectionLog && (
        <CollectionLogDialog
          open={showCollectionLog}
          onOpenChange={setShowCollectionLog}
          onSuccess={() => {
            // Collection logs will auto-refresh via SWR
          }}
        />
      )}
    </div>
  )
}
