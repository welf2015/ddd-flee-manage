"use client"

import { Button } from "@/components/ui/button"
import { ClipboardList } from "lucide-react"
import { useState } from "react"
import { CollectionLogDialog } from "@/components/inventory/collection-log-dialog"

export function LogCollectionButton() {
  const [showCollectionLog, setShowCollectionLog] = useState(false)

  return (
    <>
      <Button onClick={() => setShowCollectionLog(true)} className="bg-accent hover:bg-accent/90">
        <ClipboardList className="h-4 w-4 mr-2" />
        Log Collection
      </Button>

      {showCollectionLog && (
        <CollectionLogDialog
          open={showCollectionLog}
          onOpenChange={setShowCollectionLog}
          onSuccess={() => {
            // Collection logs will auto-refresh via SWR
          }}
        />
      )}
    </>
  )
}
