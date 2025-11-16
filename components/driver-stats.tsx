import { Card, CardContent } from "@/components/ui/card"
import { Users, UserCheck, Truck, Clock } from "lucide-react"

type DriverStatsProps = {
  total: number
  active: number
  onJob: number
  assigned: number
}

export function DriverStats({ total, active, onJob, assigned }: DriverStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Drivers</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available</p>
              <p className="text-2xl font-bold">{active}</p>
            </div>
            <UserCheck className="h-8 w-8 text-accent" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned</p>
              <p className="text-2xl font-bold">{assigned}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">On Job</p>
              <p className="text-2xl font-bold">{onJob}</p>
            </div>
            <Truck className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
