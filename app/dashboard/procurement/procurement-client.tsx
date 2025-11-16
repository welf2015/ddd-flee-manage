"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ProcurementsTable } from "@/components/procurement/procurements-table"
import { VendorsTable } from "@/components/procurement/vendors-table"
import { ClearingAgentsTable } from "@/components/procurement/clearing-agents-table"
import { CreateProcurementDialog } from "@/components/procurement/create-procurement-dialog"
import { CreateVendorDialog } from "@/components/procurement/create-vendor-dialog"
import { CreateClearingAgentDialog } from "@/components/procurement/create-clearing-agent-dialog"

export function ProcurementClient() {
  const [showCreateProcurement, setShowCreateProcurement] = useState(false)
  const [showCreateVendor, setShowCreateVendor] = useState(false)
  const [showCreateAgent, setShowCreateAgent] = useState(false)

  return (
    <Tabs defaultValue="procurements" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="procurements">Procurements</TabsTrigger>
        <TabsTrigger value="vendors">Vendors</TabsTrigger>
        <TabsTrigger value="agents">Clearing Agents</TabsTrigger>
      </TabsList>

      <TabsContent value="procurements" className="space-y-4 mt-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Procurement Orders</h2>
            <p className="text-sm text-muted-foreground">
              Track vehicle procurement from negotiation to fleet addition
            </p>
          </div>
          <Button onClick={() => setShowCreateProcurement(true)} className="bg-accent hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" />
            New Procurement
          </Button>
        </div>

        <ProcurementsTable />

        {showCreateProcurement && (
          <CreateProcurementDialog open={showCreateProcurement} onOpenChange={setShowCreateProcurement} />
        )}
      </TabsContent>

      <TabsContent value="vendors" className="space-y-4 mt-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Vendors</h2>
            <p className="text-sm text-muted-foreground">Manage vehicle suppliers and negotiate prices</p>
          </div>
          <Button onClick={() => setShowCreateVendor(true)} className="bg-accent hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>

        <VendorsTable />

        {showCreateVendor && <CreateVendorDialog open={showCreateVendor} onOpenChange={setShowCreateVendor} />}
      </TabsContent>

      <TabsContent value="agents" className="space-y-4 mt-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Clearing Agents</h2>
            <p className="text-sm text-muted-foreground">Manage port clearing agents for vehicle imports</p>
          </div>
          <Button onClick={() => setShowCreateAgent(true)} className="bg-accent hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Agent
          </Button>
        </div>

        <ClearingAgentsTable />

        {showCreateAgent && <CreateClearingAgentDialog open={showCreateAgent} onOpenChange={setShowCreateAgent} />}
      </TabsContent>
    </Tabs>
  )
}
