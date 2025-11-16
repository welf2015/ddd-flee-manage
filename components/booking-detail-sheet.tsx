"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Truck, User, AlertCircle, CheckCircle2, Upload, X, MapPin, Clock, DollarSign, FileText } from "lucide-react"
import { AssignDriverDialog } from "./assign-driver-dialog"
import { UpdateJobStatusDialog } from "./update-job-status-dialog"
import { CloseJobDialog } from "./close-job-dialog"
import { RateDriverDialog } from "./rate-driver-dialog"
import { NegotiateBookingDialog } from "./negotiate-booking-dialog"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import useSWR from "swr"

type BookingDetailSheetProps = {
  booking: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function BookingDetailSheet({ booking, open, onOpenChange, onUpdate }: BookingDetailSheetProps) {
  const [showAssignDriver, setShowAssignDriver] = useState(false)
  const [showUpdateStatus, setShowUpdateStatus] = useState(false)
  const [showCloseJob, setShowCloseJob] = useState(false)
  const [showRateDriver, setShowRateDriver] = useState(false)
  const [showNegotiate, setShowNegotiate] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const supabase = createClient()

  const { data: currentBooking, mutate: mutateBooking } = useSWR(
    open && booking?.id ? `booking-${booking.id}` : null,
    async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*, driver:drivers(*), vehicle:vehicles(*), client:clients(*)")
        .eq("id", booking.id)
        .single()
      return data
    },
    { refreshInterval: 1000, revalidateOnFocus: true },
  )

  const { data: timeline = [] } = useSWR(
    open && booking?.id ? `timeline-${booking.id}` : null,
    async () => {
      const { data } = await supabase
        .from("job_timeline")
        .select("*, action_by:profiles!action_by(full_name)")
        .eq("booking_id", booking.id)
        .order("created_at", { ascending: false })
      return data || []
    },
    { refreshInterval: 1000, revalidateOnFocus: true },
  )

  const { data: waybills = [] } = useSWR(
    open && booking?.id ? `waybills-${booking.id}` : null,
    async () => {
      const { data } = await supabase
        .from("waybill_uploads")
        .select("*")
        .eq("booking_id", booking.id)
        .order("uploaded_at", { ascending: false })
      return data || []
    },
    { refreshInterval: 2000 },
  )

  const displayBooking = currentBooking || booking

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true)
    const { updateBookingStatus } = await import("@/app/actions/bookings")
    const result = await updateBookingStatus(booking.id, newStatus)

    if (result.success) {
      await mutateBooking()
      onUpdate()
      const { toast } = await import("sonner")
      toast.success(`Status updated to ${newStatus}`)
    } else {
      const { toast } = await import("sonner")
      toast.error(result.error || "Failed to update status")
    }
    setUpdatingStatus(false)
  }

  const handleWaybillUpload = async (file: File) => {
    const { data, error } = await supabase.storage.from("waybills").upload(`${booking.id}-${Date.now()}`, file)
    if (error) {
      const { toast } = await import("sonner")
      toast.error("Waybill upload failed")
    } else {
      await mutateBooking()
    }
  }

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
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount)
  }

  const canAssignDriver = displayBooking.status === "Approved" && !displayBooking.assigned_driver_id
  const canUpdateStatus =
    displayBooking.assigned_driver_id && ["Assigned", "In Progress", "In Transit"].includes(displayBooking.status)
  const canCloseJob = displayBooking.status === "In Transit"
  const canRateDriver = displayBooking.status === "Closed" && displayBooking.assigned_driver_id
  const canApprove = ["Open", "Negotiation"].includes(displayBooking.status)
  const canNegotiate = displayBooking.status === "Open"

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:w-full lg:w-3/4 p-0 bg-background">
          <div className="h-full flex flex-col">
            {/* Header */}
            <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10 space-y-0">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <SheetTitle className="text-2xl">{displayBooking.job_id}</SheetTitle>
                  <p className="text-sm text-muted-foreground">Job Details & Management</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Badge variant="outline" className={`w-fit ${getStatusColor(displayBooking.status)}`}>
                {displayBooking.status}
              </Badge>
            </SheetHeader>

            {/* Action Buttons */}
            <div className="px-6 py-3 border-b flex gap-2 flex-wrap">
              {canNegotiate && (
                <Button
                  onClick={() => setShowNegotiate(true)}
                  variant="outline"
                  size="sm"
                  className="border-accent text-accent hover:bg-accent/10"
                >
                  Negotiate
                </Button>
              )}
              {canApprove && !canNegotiate && (
                <Button
                  onClick={() => handleStatusChange("Approved")}
                  disabled={updatingStatus}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-sm"
                >
                  {updatingStatus ? "Approving..." : "Approve"}
                </Button>
              )}
              {canAssignDriver && (
                <Button
                  onClick={() => setShowAssignDriver(true)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-sm"
                >
                  <Truck className="h-3 w-3 mr-1" />
                  Assign Driver
                </Button>
              )}
              {canUpdateStatus && (
                <Button onClick={() => setShowUpdateStatus(true)} variant="outline" size="sm">
                  Update Status
                </Button>
              )}
              {canCloseJob && (
                <Button
                  onClick={() => setShowCloseJob(true)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-sm"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Close Job
                </Button>
              )}
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4 rounded-none border-b bg-muted/50 px-6">
                  <TabsTrigger value="details" className="rounded-none">
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="driver" className="rounded-none">
                    Driver
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="rounded-none">
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="docs" className="rounded-none">
                    Docs
                  </TabsTrigger>
                </TabsList>

                <div className="px-6">
                  <TabsContent value="details" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Client Info</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{displayBooking.client?.name}</span>
                        </div>
                        {displayBooking.client?.contact && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>{displayBooking.client.contact}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Job Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Request Details</label>
                          <p className="mt-1">{displayBooking.request_details}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Route</label>
                            <div className="flex items-start gap-2 mt-1">
                              <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                              <span className="text-sm">{displayBooking.route || "Not specified"}</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Timeline</label>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{displayBooking.timeline || "Not specified"}</span>
                            </div>
                          </div>
                          {displayBooking.number_of_loads && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Number of Loads</label>
                              <p className="mt-1">{displayBooking.number_of_loads}</p>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Proposed Budget</label>
                            <div className="flex items-center gap-2 mt-1">
                              <DollarSign className="h-4 w-4 text-green-500" />
                              <span className="font-semibold">
                                {formatCurrency(displayBooking.proposed_client_budget)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {displayBooking.negotiation_notes && (
                          <>
                            <Separator />
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Negotiation Notes</label>
                              <p className="mt-1 text-sm">{displayBooking.negotiation_notes}</p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="driver" className="space-y-4 mt-4">
                    {displayBooking.assigned_driver_id ? (
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Assigned Driver</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-4">
                              {displayBooking.driver?.photo_url ? (
                                <img
                                  src={displayBooking.driver.photo_url || "/placeholder.svg"}
                                  alt={displayBooking.driver.full_name}
                                  className="h-16 w-16 rounded-full object-cover border-2 border-accent"
                                />
                              ) : (
                                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center border-2 border-accent">
                                  <User className="h-8 w-8 text-accent" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-lg">
                                  {displayBooking.driver?.full_name || "Unknown Driver"}
                                </p>
                                <p className="text-sm text-muted-foreground">{displayBooking.driver?.phone}</p>
                                <Badge variant="outline" className="mt-1 bg-blue-500/10 text-blue-500">
                                  {displayBooking.driver?.status || "Active"}
                                </Badge>
                              </div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">License Number</label>
                                <p className="mt-1 text-sm">{displayBooking.driver?.license_number}</p>
                              </div>
                              {displayBooking.driver?.address && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                                  <p className="mt-1 text-sm">{displayBooking.driver.address}</p>
                                </div>
                              )}
                            </div>
                            {displayBooking.driver?.emergency_contact_name && (
                              <>
                                <Separator />
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                                  <p className="mt-1 text-sm">{displayBooking.driver.emergency_contact_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {displayBooking.driver.emergency_contact_phone}
                                  </p>
                                  {displayBooking.driver.emergency_contact_relationship && (
                                    <p className="text-xs text-muted-foreground">
                                      ({displayBooking.driver.emergency_contact_relationship})
                                    </p>
                                  )}
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Assigned Vehicle</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Truck className="h-5 w-5 text-green-500" />
                              <span className="font-medium">
                                {displayBooking.vehicle?.vehicle_number || "Unknown Vehicle"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <label className="text-muted-foreground">Type</label>
                                <p className="font-medium">{displayBooking.vehicle?.vehicle_type}</p>
                              </div>
                              <div>
                                <label className="text-muted-foreground">Make & Model</label>
                                <p className="font-medium">
                                  {displayBooking.vehicle?.make} {displayBooking.vehicle?.model}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {canRateDriver && (
                          <Button onClick={() => setShowRateDriver(true)} className="w-full">
                            Rate Driver
                          </Button>
                        )}
                      </>
                    ) : (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No driver assigned</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Status & Timeline</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {["Assigned", "In Progress"].includes(displayBooking.status) && (
                          <div className="flex gap-2">
                            {displayBooking.status === "Assigned" && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange("In Progress")}
                                disabled={updatingStatus}
                              >
                                Mark In Progress
                              </Button>
                            )}
                            {displayBooking.status === "In Progress" && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange("In Transit")}
                                disabled={updatingStatus}
                              >
                                Mark In Transit
                              </Button>
                            )}
                          </div>
                        )}

                        {displayBooking.status === "In Transit" && displayBooking.requires_waybill && (
                          <div className="space-y-2 border-t pt-3">
                            <Label>Waybill</Label>
                            <div className="border-2 border-dashed rounded p-3 hover:bg-muted/50">
                              <input
                                type="file"
                                id="waybill"
                                accept=".pdf,.jpg,.png"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleWaybillUpload(e.target.files[0])
                                  }
                                }}
                                className="hidden"
                              />
                              <label
                                htmlFor="waybill"
                                className="flex flex-col items-center gap-2 cursor-pointer text-sm"
                              >
                                <Upload className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Upload waybill</span>
                              </label>
                            </div>
                            {waybills.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-medium">Uploaded waybills:</p>
                                {waybills.map((w) => (
                                  <a
                                    key={w.id}
                                    href={w.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-accent hover:underline block"
                                  >
                                    {new Date(w.uploaded_at).toLocaleString()}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Activity</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                        {timeline.length > 0 ? (
                          timeline.map((event: any) => (
                            <div key={event.id} className="flex gap-2 pb-2 border-b text-sm last:border-0">
                              <div className="flex-1">
                                <p className="font-medium text-xs">{event.action_type}</p>
                                {event.notes && <p className="text-xs mt-1">{event.notes}</p>}
                                <p className="text-xs text-muted-foreground">
                                  By {event.action_by?.full_name || "System"} •{" "}
                                  {new Date(event.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No activity yet</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="docs" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Documents</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Document management coming soon</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {showNegotiate && (
        <NegotiateBookingDialog
          open={showNegotiate}
          onOpenChange={setShowNegotiate}
          booking={displayBooking}
          onSuccess={() => {
            onUpdate()
            setShowNegotiate(false)
            mutateBooking()
          }}
        />
      )}

      {showAssignDriver && (
        <AssignDriverDialog
          open={showAssignDriver}
          onOpenChange={setShowAssignDriver}
          bookingId={displayBooking.id}
          onSuccess={() => {
            onUpdate()
            setShowAssignDriver(false)
            mutateBooking()
          }}
        />
      )}

      {showUpdateStatus && (
        <UpdateJobStatusDialog
          open={showUpdateStatus}
          onOpenChange={setShowUpdateStatus}
          booking={displayBooking}
          onSuccess={() => {
            onUpdate()
            setShowUpdateStatus(false)
            mutateBooking()
          }}
        />
      )}

      {showCloseJob && (
        <CloseJobDialog
          open={showCloseJob}
          onOpenChange={setShowCloseJob}
          booking={displayBooking}
          onSuccess={() => {
            onUpdate()
            setShowCloseJob(false)
            onOpenChange(false)
            mutateBooking()
          }}
        />
      )}

      {showRateDriver && (
        <RateDriverDialog
          open={showRateDriver}
          onOpenChange={setShowRateDriver}
          booking={displayBooking}
          onSuccess={() => {
            onUpdate()
            setShowRateDriver(false)
            mutateBooking()
          }}
        />
      )}
    </>
  )
}
