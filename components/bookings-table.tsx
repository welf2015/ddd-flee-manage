"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { BookingDetailSheet } from "./booking-detail-sheet"
import { createClient } from "@/lib/supabase/client"
import { formatRelativeTime } from "@/lib/utils"
import { useRouter } from "next/navigation"

type Booking = {
  id: string
  job_id: string
  client_name: string
  proposed_client_budget: number | null
  status: string
  payment_status?: string | null
  created_at: string
  created_by_profile: { full_name: string | null } | null
  assigned_driver_id: string | null
  assigned_vehicle_id: string | null
  driver?: { full_name: string | null } | null
  vehicle?: any
  started_at?: string | null
  completed_at?: string | null
  expected_completion?: string
  requires_waybill?: boolean
  route?: string
  timeline?: string
  number_of_loads?: number
  request_details?: string
  negotiation_notes?: string
  fuel_amount?: number | null
  ticketing_amount?: number | null
  allowance_amount?: number | null
}

type BookingsTableProps = {
  bookings: Booking[]
  onUpdate?: () => void
}

export function BookingsTable({ bookings, onUpdate }: BookingsTableProps) {
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUserRole = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        setIsAdmin(profile?.role === "MD" || profile?.role === "ED")
        console.log("[v0] User role check:", {
          role: profile?.role,
          isAdmin: profile?.role === "MD" || profile?.role === "ED",
        })
      }
    }

    checkUserRole()
  }, [])

  const filteredBookings = useMemo(() => {
    return freshBookings.filter((booking) => {
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter
      const matchesSearch =
        searchQuery === "" ||
        booking.job_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.client_name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [freshBookings, statusFilter, searchQuery])
  
  // Auto-refresh bookings periodically and on focus
  useEffect(() => {
    const interval = setInterval(() => {
      mutateBookings()
    }, 5000) // Refresh every 5 seconds
    
    return () => clearInterval(interval)
  }, [mutateBookings])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "Negotiation":
        return "bg-accent/10 text-accent border-accent/20"
      case "Approved":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "Assigned":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "In Progress":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "In Transit":
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
      case "Completed":
        return "bg-green-600/10 text-green-600 border-green-600/20"
      case "Closed":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">All Bookings</h2>
          <Badge variant="secondary" className="rounded-full">
            {filteredBookings.length}
          </Badge>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Search bookings..."
            className="sm:w-[250px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Negotiation">Negotiation</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Assigned">Assigned</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="In Transit">In Transit</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-0">
          {filteredBookings.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {bookings.length === 0
                ? "No bookings yet. Create your first booking to get started."
                : "No bookings match your filters."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="text-xs">Job ID</TableHead>
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs">Budget</TableHead>
                    <TableHead className="text-xs">Driver</TableHead>
                    <TableHead className="text-xs">Total Expense</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Officer</TableHead>
                    <TableHead className="text-right text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => {
                    const totalExpense = 
                      (booking.fuel_amount || 0) + 
                      (booking.ticketing_amount || 0) + 
                      (booking.allowance_amount || 0)
                    
                    return (
                      <TableRow key={booking.id} className="text-xs">
                        <TableCell className="font-medium text-xs">{booking.job_id}</TableCell>
                        <TableCell className="text-xs">{booking.client_name}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(booking.proposed_client_budget)}</TableCell>
                        <TableCell className="text-xs">
                          {booking.driver?.full_name || (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {totalExpense > 0 ? formatCurrency(totalExpense) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1 flex-wrap">
                            <Badge variant="outline" className={`text-xs ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </Badge>
                            {booking.status === "Completed" && booking.payment_status && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  booking.payment_status === "Paid"
                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                    : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                }`}
                              >
                                {booking.payment_status === "Paid" ? "Paid" : "Pending"}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{formatRelativeTime(booking.created_at)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {booking.created_by_profile?.full_name || "Unknown"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedBooking(booking)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedBooking && (
        <BookingDetailSheet
          booking={selectedBooking}
          open={!!selectedBooking}
          onOpenChange={(open) => !open && setSelectedBooking(null)}
          onUpdate={() => {
            router.refresh() // Force server-side refresh to get latest bookings
            onUpdate?.() // Call parent callback
          }}
          isAdmin={isAdmin}
        />
      )}
    </>
  )
}
