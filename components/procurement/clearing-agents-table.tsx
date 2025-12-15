"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Edit, Trash2 } from "lucide-react"
import { useState } from "react"
import { deleteClearingAgent } from "@/app/actions/clearing-agents"
import { toast } from "sonner"
import { EditClearingAgentDialog } from "./edit-clearing-agent-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export function ClearingAgentsTable() {
  const supabase = createClient()
  const [editAgentId, setEditAgentId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  const {
    data: agents = [],
    isLoading,
    mutate,
  } = useSWR(
    "clearing-agents",
    async () => {
      const { data } = await supabase.from("clearing_agents").select("*").order("created_at", { ascending: false })

      return data || []
    },
    { refreshInterval: 5000 },
  )

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    setDeletingId(deleteConfirm.id)
    const result = await deleteClearingAgent(deleteConfirm.id)

    if (result.success) {
      toast.success("Clearing agent deleted successfully")
      mutate(undefined, { revalidate: true })
    } else {
      toast.error(result.error || "Failed to delete clearing agent")
    }
    setDeletingId(null)
    setDeleteConfirm(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clearing Agents</CardTitle>
        <CardDescription>Port clearing agents for vehicle imports</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading agents...</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No clearing agents added yet</div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent: any) => (
              <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex-1">
                  <p className="font-semibold">{agent.name}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mt-2">
                    <div>
                      <p className="text-xs">Contact</p>
                      <p>{agent.contact_name}</p>
                    </div>
                    <div>
                      <p className="text-xs">License</p>
                      <p>{agent.license_number}</p>
                    </div>
                    <div>
                      <p className="text-xs">Phone</p>
                      <p>{agent.phone}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="icon" onClick={() => setEditAgentId(agent.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteConfirm({ id: agent.id, name: agent.name })}
                    disabled={deletingId === agent.id}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <EditClearingAgentDialog
        open={!!editAgentId}
        onOpenChange={(open) => !open && setEditAgentId(null)}
        agentId={editAgentId}
        onAgentUpdated={() => mutate(undefined, { revalidate: true })}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Clearing Agent"
        description={`Are you sure you want to delete ${deleteConfirm?.name}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </Card>
  )
}
