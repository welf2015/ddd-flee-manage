"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export function ClearingAgentsTable() {
  const supabase = createClient()

  const { data: agents = [], isLoading } = useSWR(
    "clearing-agents",
    async () => {
      const { data } = await supabase.from("clearing_agents").select("*").order("created_at", { ascending: false })

      return data || []
    },
    { refreshInterval: 5000 },
  )

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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
