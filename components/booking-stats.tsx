import { Card, CardContent } from "@/components/ui/card"
import { ClipboardCheck, Clock, TrendingUp, CheckCircle } from "lucide-react"

type BookingStatsProps = {
  total: number
  open: number
  inProgress: number
  closed: number
}

export function BookingStats({ total, open, inProgress, closed }: BookingStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{open}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{inProgress}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-accent" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{closed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-accent" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
