"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { formatRelativeTime } from "@/lib/utils"
import { useState } from "react"

export function CollectionLogsTable() {
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState("")

  const { data: collections = [], mutate } = useSWR(
    "inventory-collections",
    async () => {
      const { data } = await supabase
        .from("inventory_collections")
        .select("*, created_by_profile:profiles!inventory_collections_created_by_fkey(full_name)")
        .order("collected_at", { ascending: false })

      return data || []
    },
    { refreshInterval: 10000 }
  )

  const filteredCollections = collections.filter(
    (collection: any) =>
      collection.collector_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.item_description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search by collector name, item name, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Collector Name</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Logged By</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCollections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {collections.length === 0
                      ? "No collection logs yet. Click 'Log Collection' to create one."
                      : "No collections match your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCollections.map((collection: any) => (
                  <TableRow key={collection.id}>
                    <TableCell>{formatRelativeTime(collection.collected_at)}</TableCell>
                    <TableCell className="font-medium">{collection.collector_name}</TableCell>
                    <TableCell>{collection.item_name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {collection.item_description || "-"}
                    </TableCell>
                    <TableCell className="text-center">{collection.quantity}</TableCell>
                    <TableCell>{collection.approved_by_name || "-"}</TableCell>
                    <TableCell>
                      {collection.created_by_profile?.full_name || "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{collection.notes || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

