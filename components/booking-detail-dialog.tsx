"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Clock,
  DollarSign,
  FileText,
  MapPin,
  Truck,
  User,
  AlertCircle,
  CheckCircle2,
  Upload,
  Eye,
  Download,
  Wallet,
} from "lucide-react"
import { AssignDriverDialog } from "./assign-driver-dialog"
import { UpdateJobStatusDialog } from "./update-job-status-dialog"
import { CloseJobDialog } from "./close-job-dialog"
import { RateDriverDialog } from "./rate-driver-dialog"
import { NegotiateBookingDialog } from "./negotiate-booking-dialog"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import useSWR from "swr"
import { uploadWaybill } from "@/app/actions/bookings" // Added import
import { formatRelativeTime } from "@/lib/utils"

type BookingDetailDialogProps = {
  booking: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function BookingDetailDialog({ booking, open, onOpenChange, onUpdate }: BookingDetailDialogProps) {
  const [showAssignDriver, setShowAssignDriver] = useState(false)
  const [showUpdateStatus, setShowUpdateStatus] = useState(false)
  const [showCloseJob, setShowCloseJob] = useState(false)
  const [showRateDriver, setShowRateDriver] = useState(false)
  const [showNegotiate, setShowNegotiate] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [isUploading, setIsUploading] = useState(false) // Added upload state
  const [workerUrl, setWorkerUrl] = useState("") // Added worker config state
  const [authKey, setAuthKey] = useState("") // Added worker config state
  const [userRole, setUserRole] = useState<string>("") // Added userRole state
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      const fetchConfig = async () => {
        try {
          const res = await fetch("/api/upload")
          if (res.ok) {
            const data = await res.json()
            setWorkerUrl(data.workerUrl)
            setAuthKey(data.authKey)
          }
        } catch (error) {
          console.error("Failed to fetch upload config", error)
        }
      }
      fetchConfig()
    }
  }, [open])

  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        setUserRole(profile?.role || "")
      }
    }
    fetchUserRole()
  }, [])

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

  // Use current booking data if available, fallback to props booking
  const displayBooking = currentBooking || booking

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true)
    const { updateBookingStatus } = await import("@/app/actions/bookings")

    // Optimistic update
    if (currentBooking) {
      mutateBooking(
        {
          ...currentBooking,
          status: newStatus,
        },
        false,
      )
    }

    const result = await updateBookingStatus(booking.id, newStatus)

    if (result.success) {
      // Revalidate to get fresh data
      await mutateBooking()
      onUpdate()
      const { toast } = await import("sonner")
      toast.success(`Status updated to ${newStatus}`)
    } else {
      // Revert optimistic update on error
      await mutateBooking()
      const { toast } = await import("sonner")
      toast.error(result.error || "Failed to update status")
    }
    setUpdatingStatus(false)
  }

  const handleMarkAsPaid = async () => {
    setUpdatingStatus(true)
    const { markBookingAsPaid } = await import("@/app/actions/bookings")

    // Optimistic update
    if (currentBooking) {
      mutateBooking(
        {
          ...currentBooking,
          payment_status: "Paid",
        },
        false,
      )
    }

    const result = await markBookingAsPaid(booking.id)

    if (result.success) {
      // Revalidate to get fresh data
      await mutateBooking()
      onUpdate()
      const { toast } = await import("sonner")
      toast.success("Payment marked as paid")
    } else {
      // Revert optimistic update on error
      await mutateBooking()
      const { toast } = await import("sonner")
      toast.error(result.error || "Failed to mark payment as paid")
    }
    setUpdatingStatus(false)
  }

  const handleWaybillUpload = async (file: File) => {
    setIsUploading(true)
    const { toast } = await import("sonner")

    try {
      if (!workerUrl || !authKey) {
        throw new Error("Upload service not available")
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", `waybills/${booking.id}`)

      const uploadRes = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "X-Auth-Key": authKey,
        },
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error("Failed to upload waybill to storage")
      }

      const { url } = await uploadRes.json()

      const result = await uploadWaybill(booking.id, url)

      if (result.success) {
        toast.success("Waybill uploaded successfully")
        await mutateBooking()
      } else {
        throw new Error(result.error || "Failed to save waybill record")
      }
    } catch (error: any) {
      console.error("Waybill upload error:", error)
      toast.error(error.message || "Waybill upload failed")
    } finally {
      setIsUploading(false)
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
  const canApprove = ["Open", "Negotiation"].includes(displayBooking.status) && (userRole === "MD" || userRole === "ED")
  const canNegotiate =
    (displayBooking.status === "Open" || displayBooking.status === "Negotiation") &&
    (userRole === "MD" ||
      userRole === "ED" ||
      userRole === "Head of Operations" ||
      userRole === "Operations and Fleet Officer")
  const canMarkAsPaid =
    displayBooking.status === "Completed" &&
    displayBooking.payment_status === "Unpaid" &&
    (userRole === "Accountant" || userRole === "MD" || userRole === "ED")

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] bg-background/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">{displayBooking.job_id}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Job Details & Management</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusColor(displayBooking.status)}>
                  {displayBooking.status}
                </Badge>
                {displayBooking.status === "Completed" && (
                  <Badge
                    variant="outline"
                    className={
                      displayBooking.payment_status === "Paid"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                    }
                  >
                    {displayBooking.payment_status === "Paid" ? "Paid" : "Payment Pending"}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 flex-wrap">
              {canNegotiate && (
                <Button
                  onClick={() => setShowNegotiate(true)}
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent/10"
                >
                  Negotiate
                </Button>
              )}
              {canApprove && !canNegotiate && (
                <Button
                  onClick={() => handleStatusChange("Approved")}
                  disabled={updatingStatus}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updatingStatus ? "Approving..." : "Approve Booking"}
                </Button>
              )}
              {canAssignDriver && (
                <Button onClick={() => setShowAssignDriver(true)} className="bg-green-600 hover:bg-green-700">
                  <Truck className="h-4 w-4 mr-2" />
                  Assign Driver
                </Button>
              )}
              {canUpdateStatus && (
                <Button onClick={() => setShowUpdateStatus(true)} variant="outline">
                  Update Status
                </Button>
              )}
              {canCloseJob && (
                <Button onClick={() => setShowCloseJob(true)} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Close Job
                </Button>
              )}
              {canMarkAsPaid && (
                <Button
                  onClick={handleMarkAsPaid}
                  disabled={updatingStatus}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="driver">Driver & Vehicle</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4 pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Client Information</CardTitle>
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
                          <span className="font-semibold">{formatCurrency(displayBooking.proposed_client_budget)}</span>
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

              <TabsContent value="driver" className="space-y-4 mt-4 pr-4">
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
                            <p className="mt-1">{displayBooking.driver?.license_number}</p>
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
                              <p className="mt-1">{displayBooking.driver.emergency_contact_name}</p>
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
                        Rate Driver Performance
                      </Button>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No driver assigned yet</p>
                      {canAssignDriver && (
                        <Button
                          onClick={() => setShowAssignDriver(true)}
                          className="mt-4 bg-green-600 hover:bg-green-700"
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          Assign Driver
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4 mt-4 pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Job Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                        <Badge className={`mt-1 ${getStatusColor(displayBooking.status)}`}>
                          {displayBooking.status}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Created</label>
                        <p className="mt-1 text-sm">{formatRelativeTime(displayBooking.created_at)}</p>
                      </div>
                      {displayBooking.started_at && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Started</label>
                          <p className="mt-1 text-sm">{formatRelativeTime(displayBooking.started_at)}</p>
                        </div>
                      )}
                    </div>

                    {["Assigned", "In Progress"].includes(displayBooking.status) && (
                      <div className="flex gap-2 pt-2">
                        {displayBooking.status === "Assigned" && (
                          <Button size="sm" onClick={() => handleStatusChange("In Progress")} disabled={updatingStatus}>
                            Mark In Progress
                          </Button>
                        )}
                        {displayBooking.status === "In Progress" && (
                          <Button size="sm" onClick={() => handleStatusChange("In Transit")} disabled={updatingStatus}>
                            Mark In Transit
                          </Button>
                        )}
                      </div>
                    )}

                    {displayBooking.status === "In Transit" && displayBooking.requires_waybill && (
                      <div className="pt-3 border-t space-y-2">
                        <Label>Upload Waybill</Label>
                        <div className="border-2 border-dashed rounded-lg p-3 hover:bg-muted/50 transition-colors">
                          <input
                            type="file"
                            id="waybill"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleWaybillUpload(e.target.files[0])
                              }
                            }}
                            className="hidden"
                          />
                          <label htmlFor="waybill" className="flex flex-col items-center gap-2 cursor-pointer">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground mt-2">
                              {isUploading ? "Uploading..." : "Click to upload waybill"}
                            </span>
                          </label>
                        </div>
                        {waybills.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium">Uploaded waybills:</p>
                            <div className="space-y-2">
                              {waybills.map((w: any) => (
                                <div
                                  key={w.id}
                                  className="flex items-center justify-between p-2 border rounded-md text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <a
                                      href={w.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:underline"
                                    >
                                      View Document
                                    </a>
                                  </div>
                                  <span className="text-muted-foreground text-xs">
                                    {formatRelativeTime(w.uploaded_at)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Activity timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Activity Log</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {timeline.length > 0 ? (
                      timeline.map((event) => (
                        <div key={event.id} className="flex gap-3 pb-3 border-b last:border-0">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{event.action_type}</p>
                            {event.notes && <p className="text-xs text-muted-foreground mt-1">{event.notes}</p>}
                            <p className="text-xs text-muted-foreground mt-1">
                              By {event.action_by?.full_name || "System"} • {formatRelativeTime(event.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-4 pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Job Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {waybills && waybills.length > 0 ? (
                      <div className="space-y-3">
                        {waybills.map((waybill: any) => (
                          <div
                            key={waybill.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {waybill.file_name || "Waybill Document"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Uploaded {formatRelativeTime(waybill.uploaded_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {waybill.file_url && (
                                <>
                                  <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
                                    <a href={waybill.file_url} target="_blank" rel="noopener noreferrer">
                                      <Eye className="h-4 w-4" />
                                    </a>
                                  </Button>
                                  <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
                                    <a href={waybill.file_url} target="_blank" rel="noopener noreferrer" download>
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No documents uploaded yet</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </DialogContent>
      </Dialog>

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
