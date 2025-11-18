import { DashboardLayout } from "@/components/dashboard-layout"
import { FuelClient } from "./fuel-client"

export default function FuelPage() {
  return (
    <DashboardLayout>
      <FuelClient />
    </DashboardLayout>
  )
}
