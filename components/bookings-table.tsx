"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye } from 'lucide-react'
import { useState, useMemo } from "react"
import { BookingDetailSheet } from "./booking-detail-sheet"

type Booking = {
  id: string
  job_id: string
  client_name: string
  proposed_client_budget: number | null
  status: string
  created_at: string
  created_by_profile: { full_name: string | null } | null
  assigned_driver_id: string | null
  assigned_vehicle_id: string | null
  driver?: any
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
}

type BookingsTableProps = {
  bookings: Booking[]
  onUpdate?: () => void
}

export function BookingsTable({ bookings, onUpdate }: BookingsTableProps) {
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter
      const matchesSearch =
        searchQuery === "" ||
        booking.job_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.client_name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [bookings, statusFilter, searchQuery])

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Officer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.job_id}</TableCell>
                    <TableCell>{booking.client_name}</TableCell>
                    <TableCell>{formatCurrency(booking.proposed_client_budget)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(booking.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {booking.created_by_profile?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(booking)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedBooking && (
        <BookingDetailSheet
          booking={selectedBooking}
          open={!!selectedBooking}
          onOpenChange={(open) => !open && setSelectedBooking(null)}
          onUpdate={() => onUpdate?.()}
        />
      )}
    </>
  )
}
