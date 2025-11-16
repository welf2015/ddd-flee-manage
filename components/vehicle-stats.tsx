import { Card, CardContent } from "@/components/ui/card"
import { Truck, Wrench, CheckCircle } from "lucide-react"

type VehicleStatsProps = {
  total: number
  active: number
  maintenance: number
  inactive: number
}

export function VehicleStats({ total, active, maintenance, inactive }: VehicleStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Vehicles</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <Truck className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-accent" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Maintenance</p>
              <p className="text-2xl font-bold">{maintenance}</p>
            </div>
            <Wrench className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Inactive</p>
              <p className="text-2xl font-bold">{inactive}</p>
            </div>
            <Truck className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
