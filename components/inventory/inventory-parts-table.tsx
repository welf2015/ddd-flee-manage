"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

export function InventoryPartsTable() {
  const supabase = createClient()
  const [search, setSearch] = useState("")

  const { data: parts = [], isLoading } = useSWR(
    "inventory-parts",
    async () => {
      let query = supabase
        .from("inventory_parts")
        .select("*, category:inventory_categories(name), supplier:vendors(name)")
        .order("name", { ascending: true })

      if (search) {
        query = query.or(`name.ilike.%${search}%,part_number.ilike.%${search}%`)
      }

      const { data } = await query
      return data || []
    },
    { refreshInterval: 5000 },
  )

  const getStockStatus = (current: number, reorder: number) => {
    if (current <= 0) return { color: "bg-red-500/10 text-red-500", label: "Out of Stock" }
    if (current <= reorder) return { color: "bg-yellow-500/10 text-yellow-500", label: "Low Stock" }
    return { color: "bg-green-500/10 text-green-500", label: "In Stock" }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parts List</CardTitle>
        <CardDescription>Manage inventory and track stock levels</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search by name or part number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading parts...</div>
        ) : parts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No parts found</div>
        ) : (
          <div className="space-y-3">
            {parts.map((part: any) => {
              const status = getStockStatus(part.current_stock, part.reorder_level)
              return (
                <div
                  key={part.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{part.name}</p>
                      {part.category && (
                        <Badge variant="outline" className="text-xs">
                          {part.category.name}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="text-xs">Part #</p>
                        <p className="font-medium text-foreground">{part.part_number}</p>
                      </div>
                      <div>
                        <p className="text-xs">Stock Level</p>
                        <p className="font-medium text-foreground">{part.current_stock} units</p>
                      </div>
                      <div>
                        <p className="text-xs">Unit Price</p>
                        <p className="font-medium text-foreground">₦{part.unit_price || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs">Supplier</p>
                        <p className="font-medium text-foreground">{part.supplier?.name || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
