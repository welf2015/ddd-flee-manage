import { Card, CardContent } from "@/components/ui/card"
import { Building2, Star, TrendingUp } from "lucide-react"

type ClientStatsProps = {
  total: number
  topClients: number
  newThisMonth: number
}

export function ClientStats({ total, topClients, newThisMonth }: ClientStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Top Clients</p>
              <p className="text-2xl font-bold">{topClients}</p>
            </div>
            <Star className="h-8 w-8 text-accent" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">New This Month</p>
              <p className="text-2xl font-bold">{newThisMonth}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
