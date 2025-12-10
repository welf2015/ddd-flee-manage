"use client"

import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Edit, Trash2 } from "lucide-react"
import { useState } from "react"
import { EditVendorDialog } from "./edit-vendor-dialog"
import { deleteVendor } from "@/app/actions/vendors"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

function getCountryFlag(countryName: string): string {
  const flagMap: Record<string, string> = {
    Nigeria: "🇳🇬",
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    Germany: "🇩🇪",
    Japan: "🇯🇵",
    China: "🇨🇳",
    France: "🇫🇷",
    Italy: "🇮🇹",
    "South Korea": "🇰🇷",
    India: "🇮🇳",
    UAE: "🇦🇪",
    "South Africa": "🇿🇦",
    Ghana: "🇬🇭",
    Kenya: "🇰🇪",
    Brazil: "🇧🇷",
    Canada: "🇨🇦",
    Australia: "🇦🇺",
  }
  return flagMap[countryName] || "🌍"
}

export function VendorsTable() {
  const supabase = createClient()
  const [editVendorId, setEditVendorId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  const {
    data: vendors = [],
    isLoading,
    mutate,
  } = useSWR(
    "vendors",
    async () => {
      const { data } = await supabase.from("vendors").select("*").order("created_at", { ascending: false })

      return data || []
    },
    { refreshInterval: 5000 },
  )

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    setDeletingId(deleteConfirm.id)
    const result = await deleteVendor(deleteConfirm.id)

    if (result.success) {
      toast.success("Vendor deleted successfully")
      mutate()
    } else {
      toast.error(result.error || "Failed to delete vendor")
    }
    setDeletingId(null)
    setDeleteConfirm(null)
  }

  return (
    <>
      {isLoading ? (
        <div className="text-center py-8">Loading vendors...</div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No vendors added yet</div>
      ) : (
        <div className="space-y-4">
          {vendors.map((vendor: any) => (
            <div key={vendor.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
              <div className="flex-1">
                <p className="font-semibold flex items-center gap-2">
                  {vendor.country && <span className="text-2xl">{getCountryFlag(vendor.country)}</span>}
                  {vendor.name}
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mt-2">
                  <div>
                    <p className="text-xs">Contact</p>
                    <p>{vendor.contact_name}</p>
                  </div>
                  <div>
                    <p className="text-xs">Email</p>
                    <p>{vendor.email}</p>
                  </div>
                  <div>
                    <p className="text-xs">Phone</p>
                    <p>{vendor.phone}</p>
                  </div>
                </div>
                {(vendor.city || vendor.country) && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {[vendor.city, vendor.country].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <Button variant="outline" size="icon" onClick={() => setEditVendorId(vendor.id)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDeleteConfirm({ id: vendor.id, name: vendor.name })}
                  disabled={deletingId === vendor.id}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <EditVendorDialog
        open={!!editVendorId}
        onOpenChange={(open) => !open && setEditVendorId(null)}
        vendorId={editVendorId}
        onVendorUpdated={mutate}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Vendor"
        description={`Are you sure you want to delete ${deleteConfirm?.name}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  )
}
