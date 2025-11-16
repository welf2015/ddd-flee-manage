"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Star,
  DollarSign,
  Package,
  MessageSquare,
  FileText,
  Plus,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

type ClientCRMPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: {
    id: string
    name: string
    contact_name: string
    phone: string
    email: string
    address: string | null
    created_at: string
  } | null
  bookings: Array<{
    id: string
    job_id: string
    status: string
    route: string
    created_at: string
    proposed_client_budget: number | null
  }>
  totalRevenue: number
}

export function ClientCRMPanel({ open, onOpenChange, client, bookings, totalRevenue }: ClientCRMPanelProps) {
  const [note, setNote] = useState("")

  if (!client) return null

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getFrequencyBadge = () => {
    const count = bookings.length
    if (count >= 5) return { label: "VIP Client", color: "bg-accent text-accent-foreground" }
    if (count >= 3) return { label: "Frequent Client", color: "bg-blue-500" }
    if (count >= 1) return { label: "Active Client", color: "bg-green-600" }
    return { label: "New Client", color: "bg-gray-500" }
  }

  const frequency = getFrequencyBadge()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-accent text-accent-foreground">{getInitials(client.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                <span>{client.name}</span>
                <Badge className={frequency.color}>
                  <Star className="h-3 w-3 mr-1" />
                  {frequency.label}
                </Badge>
              </div>
              <span className="text-sm font-normal text-muted-foreground">{client.contact_name}</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <Separator className="my-4" />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Avg/Job
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{bookings.length > 0 ? Math.round(totalRevenue / bookings.length).toLocaleString() : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${client.email}`} className="text-sm hover:underline">
                {client.email}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${client.phone}`} className="text-sm hover:underline">
                {client.phone}
              </a>
            </div>
            {client.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.address}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Client since {new Date(client.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Bookings, Notes, Activity */}
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-3 mt-4">
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No bookings yet</div>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">{booking.job_id}</div>
                        <div className="text-sm text-muted-foreground">{booking.route}</div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{new Date(booking.created_at).toLocaleDateString()}</span>
                      {booking.proposed_client_budget && (
                        <span className="font-medium">₦{booking.proposed_client_budget.toLocaleString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-3 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Add New Note
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Add notes about this client, preferences, special requirements..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </CardContent>
            </Card>
            <div className="text-center py-8 text-muted-foreground">
              No notes yet. Add your first note to track important information.
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-3 mt-4">
            <div className="space-y-3">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-start gap-3 text-sm">
                  <div className="rounded-full bg-accent/10 p-2">
                    <FileText className="h-3 w-3 text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Booking Created</div>
                    <div className="text-muted-foreground">
                      {booking.job_id} - {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
