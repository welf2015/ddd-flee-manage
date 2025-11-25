"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Truck,
  User,
  AlertCircle,
  CheckCircle2,
  Upload,
  X,
  MapPin,
  Clock,
  Wallet,
  Fuel,
  Ticket,
  Wallet,
  FileText,
  ArrowRight,
  Check,
  Eye,
  Download,
  Trash2,
} from "lucide-react"
import { AssignDriverDialog } from "./assign-driver-dialog"
import { UpdateJobStatusDialog } from "./update-job-status-dialog"
import { CloseJobDialog } from "./close-job-dialog"
import { RateDriverDialog } from "./rate-driver-dialog"
import { NegotiateBookingDialog } from "./negotiate-booking-dialog"
import { TripExpenseDialog } from "./trip-expense-dialog"
import { TripHoldDialog } from "./trip-hold-dialog"
import { UpdateJobDetailsDialog } from "./update-job-details-dialog"
import { AnimatedRoute } from "./booking/animated-route"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import useSWR from "swr"
import cn from "classnames"
import { formatRelativeTime } from "@/lib/utils"
import { useRouter } from "next/navigation"

const MAPBOX_TOKEN = "pk.eyJ1IjoiZGFtaWxvbGFqYW1lcyIsImEiOiJjbWk3bzRuZXUwMmx6MndyMWduZmcwNG9pIn0.lTWQddjYoQjt3w-CUEc81w"

type BookingDetailSheetProps = {
  booking: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
  isAdmin: boolean // New prop to identify admin users
}

export function BookingDetailSheet({ booking, open, onOpenChange, onUpdate, isAdmin }: BookingDetailSheetProps) {
  const [showAssignDriver, setShowAssignDriver] = useState(false)
  const [showUpdateStatus, setShowUpdateStatus] = useState(false)
  const [showCloseJob, setShowCloseJob] = useState(false)
  const [showRateDriver, setShowRateDriver] = useState(false)
  const [showNegotiate, setShowNegotiate] = useState(false)
  const [showTripExpenses, setShowTripExpenses] = useState(false)
  const [showTripHold, setShowTripHold] = useState(false)
  const [showUpdateJobDetails, setShowUpdateJobDetails] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [userRole, setUserRole] = useState<string>("")
  const [viewingDocument, setViewingDocument] = useState<{ url: string; name: string; type: string } | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const [openSheet, setOpen] = useState(open) // State to control sheet visibility

  useEffect(() => {
    setUserRole(localStorage.getItem("userRole") || "") // Get role from localStorage on mount
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        setUserRole(profile?.role || "")
        localStorage.setItem("userRole", profile?.role || "") // Store role in localStorage
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

  const { data: waybills = [], mutate: mutateWaybills } = useSWR(
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

  // Fetch expense transactions for this booking
  const { data: expenseTransactions = [] } = useSWR(
    open && booking?.id ? `expense-transactions-${booking.id}` : null,
    async () => {
      const { getExpenseTransactions } = await import("@/app/actions/expenses")
      const { data } = await getExpenseTransactions({ bookingId: booking.id })
      return data || []
    },
  )

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

  const handleDocumentUpload = async (file: File, documentType: "Waybill" | "Fuel Receipt") => {
    try {
      const folder = documentType === "Waybill" ? "waybills" : "fuel-receipts"
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}&folder=${folder}/${booking.id}&contentType=${encodeURIComponent(file.type)}`,
      )

      if (!response.ok) throw new Error("Failed to get upload config")
      const config = await response.json()

      let publicUrl = ""
      if (config.workerUrl) {
        const workerUrl = new URL(config.workerUrl)
        workerUrl.searchParams.set("filename", file.name)
        workerUrl.searchParams.set("folder", `${folder}/${booking.id}`)

        const uploadResponse = await fetch(workerUrl.toString(), {
          method: "PUT",
          body: file,
          headers: {
            "X-Auth-Key": config.authKey,
            "Content-Type": file.type,
          },
        })

        if (!uploadResponse.ok) throw new Error("Worker upload failed")
        const result = await uploadResponse.json()
        publicUrl = result.url
      }

      // Save to Supabase table
      const { error } = await supabase.from("waybill_uploads").insert({
        booking_id: booking.id,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        document_type: documentType,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      })

      if (error) throw error

      // Invalidate both booking and waybills cache
      await mutateBooking()
      await mutateWaybills()
      const { toast } = await import("sonner")
      toast.success(`${documentType} uploaded successfully`)
    } catch (error) {
      console.error("Upload error:", error)
      const { toast } = await import("sonner")
      toast.error(`${documentType} upload failed`)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!canDeleteDocuments) {
      const { toast } = await import("sonner")
      toast.error("Only MD/ED can delete documents")
      return
    }

    try {
      const { error } = await supabase.from("waybill_uploads").delete().eq("id", documentId)

      if (error) throw error

      // Invalidate both booking and waybills cache
      await mutateBooking()
      await mutateWaybills()
      const { toast } = await import("sonner")
      toast.success("Document deleted successfully")
    } catch (error) {
      console.error("Delete error:", error)
      const { toast } = await import("sonner")
      toast.error("Failed to delete document")
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
      case "On Hold":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
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
    displayBooking.assigned_driver_id &&
    ["Assigned", "In Progress", "In Transit", "On Hold"].includes(displayBooking.status)
  const canCloseJob = displayBooking.status === "In Transit"
  const canRateDriver = displayBooking.status === "Closed" && displayBooking.assigned_driver_id
  const canApprove = ["Open", "Negotiation"].includes(displayBooking.status) && (userRole === "MD" || userRole === "ED")
  const canNegotiate =
    (displayBooking.status === "Open" || displayBooking.status === "Negotiation") &&
    (userRole === "MD" ||
      userRole === "ED" ||
      userRole === "Head of Operations" ||
      userRole === "Operations and Fleet Officer")
  const canDelete = userRole === "MD" || userRole === "ED"
  const canDisapprove = displayBooking.status === "Open" && (userRole === "MD" || userRole === "ED")
  const canMarkAsPaid =
    displayBooking.status === "Completed" &&
    displayBooking.payment_status === "Unpaid" &&
    (userRole === "Accountant" || userRole === "MD" || userRole === "ED")
  const canUpdateJobDetails = userRole !== "Accountant" && (userRole === "MD" || userRole === "ED" || userRole === "Head of Operations" || userRole === "Operations and Fleet Officer")
  const canDeleteDocuments = userRole === "MD" || userRole === "ED"

  const handleApproveBooking = async () => {
    setUpdatingStatus(true)
    const { updateBookingStatus } = await import("@/app/actions/bookings")

    // Optimistic update
    if (currentBooking) {
      mutateBooking(
        {
          ...currentBooking,
          status: "Approved",
        },
        false,
      )
    }

    const result = await updateBookingStatus(booking.id, "Approved")

    if (result.success) {
      // Revalidate to get fresh data
      await mutateBooking()
      onUpdate()
      const { toast } = await import("sonner")
      toast.success("Booking approved successfully")
    } else {
      // Revert optimistic update on error
      await mutateBooking()
      const { toast } = await import("sonner")
      toast.error(result.error || "Failed to approve booking")
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

  const handleDisapproveBooking = async () => {
    if (!confirm("Disapprove this booking? The requester will be notified.")) {
      return
    }

    setUpdatingStatus(true)
    const { updateBookingStatus } = await import("@/app/actions/bookings")
    const result = await updateBookingStatus(booking.id, "Closed")

    if (result.success) {
      await mutateBooking()
      onUpdate()
      const { toast } = await import("sonner")
      toast.success("Booking disapproved")
    } else {
      const { toast } = await import("sonner")
      toast.error(result.error || "Failed to disapprove booking")
    }

    setUpdatingStatus(false)
  }

  const handleDeleteBooking = async () => {
    console.log("🗑️ [Delete Booking] handleDeleteBooking called", {
      bookingId: booking.id,
      jobId: displayBooking.job_id,
      userRole,
      canDelete,
    })

    setUpdatingStatus(true)
    
    try {
      console.log("🗑️ [Delete Booking] Importing deleteBooking action...")
      const { deleteBooking } = await import("@/app/actions/bookings")
      
      console.log("🗑️ [Delete Booking] Calling deleteBooking with bookingId:", booking.id)
      const result = await deleteBooking(booking.id)
      
      console.log("🗑️ [Delete Booking] Result received:", result)

      const { toast } = await import("sonner")

      if (result.success) {
        console.log("🗑️ [Delete Booking] Success! Closing sheet and updating...")
        toast.success("Booking deleted successfully")
        setOpen(false) // Close the sheet after deletion
        onOpenChange(false) // Also call parent's onOpenChange
        onUpdate() // Call parent update callback
        router.refresh() // Force page refresh to reload bookings from server
      } else {
        console.error("🗑️ [Delete Booking] Failed:", result.error)
        toast.error(result.error || "Failed to delete booking")
      }
    } catch (error) {
      console.error("🗑️ [Delete Booking] Exception caught:", error)
      const { toast } = await import("sonner")
      toast.error("An error occurred while deleting the booking")
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <>
      <Sheet
        open={openSheet}
        onOpenChange={(isOpen) => {
          onOpenChange(isOpen)
          setOpen(isOpen)
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:w-full md:w-1/2 lg:w-1/2 xl:w-1/2 p-0 bg-background overflow-y-auto"
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10 space-y-0">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <SheetTitle className="text-2xl">{displayBooking.job_id}</SheetTitle>
                  <p className="text-sm text-muted-foreground">Job Details & Management</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`w-fit ${getStatusColor(displayBooking.status)}`}>
                  {displayBooking.status}
                </Badge>
                {displayBooking.status === "Completed" && (
                  <Badge
                    variant="outline"
                    className={`w-fit ${
                      displayBooking.payment_status === "Paid"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                    }`}
                  >
                    {displayBooking.payment_status === "Paid" ? "Paid" : "Payment Pending"}
                  </Badge>
                )}
              </div>
            </SheetHeader>

            {/* Action Buttons */}
            <div className="px-6 py-3 border-b flex gap-2 flex-wrap bg-muted/30">
              {console.log("[v0] Rendering action buttons:", {
                status: displayBooking.status,
                isAdmin,
                canNegotiate,
                canApprove,
                canAssignDriver,
              })}

              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => console.log("🗑️ [Delete Button] Delete button clicked, opening dialog...")}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete Job
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete booking</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove {displayBooking.job_id}. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel 
                        disabled={updatingStatus}
                        onClick={() => console.log("🗑️ [Delete Dialog] Cancel clicked")}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={(e) => {
                          console.log("🗑️ [Delete Dialog] Delete action clicked", {
                            event: e,
                            bookingId: booking.id,
                            updatingStatus,
                          })
                          e.preventDefault()
                          handleDeleteBooking()
                        }}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {canDisapprove && (
                <Button onClick={handleDisapproveBooking} variant="outline" size="sm" disabled={updatingStatus}>
                  <X className="h-3 w-3 mr-1" />
                  Disapprove
                </Button>
              )}

              {canApprove && (
                <Button
                  onClick={handleApproveBooking}
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={updatingStatus}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Approve
                </Button>
              )}

              {canNegotiate && (
                <Button
                  onClick={() => setShowNegotiate(true)}
                  variant="default"
                  size="sm"
                  className="bg-accent hover:bg-accent/90 text-white"
                >
                  {displayBooking.status === "Negotiation" ? "Continue Negotiation" : "Start Negotiation"}
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
              {["In Transit", "On Hold"].includes(displayBooking.status) && (
                <>
                  <Button onClick={() => setShowTripHold(true)} variant="outline" size="sm">
                    Report Hold-Up
                  </Button>
                </>
              )}
              {canUpdateJobDetails && (
                <Button onClick={() => setShowUpdateJobDetails(true)} variant="outline" size="sm">
                  Update Job Details
                </Button>
              )}
              {canMarkAsPaid && (
                <Button
                  onClick={handleMarkAsPaid}
                  disabled={updatingStatus}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-sm"
                >
                  <Wallet className="h-3 w-3 mr-1" />
                  Mark as Paid
                </Button>
              )}
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <Tabs defaultValue="details" className="w-full">
                <TabsList
                  className={cn(
                    "grid w-full rounded-none border-b bg-muted/50 px-6",
                    ["Completed", "Closed"].includes(displayBooking.status) ? "grid-cols-6" : "grid-cols-5",
                  )}
                >
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
                  <TabsTrigger value="expenses" className="rounded-none">
                    Expenses
                  </TabsTrigger>
                  {["Completed", "Closed"].includes(displayBooking.status) && (
                    <TabsTrigger value="feedback" className="rounded-none">
                      Feedback
                    </TabsTrigger>
                  )}
                </TabsList>

                <div className="px-6 pb-6">
                  <TabsContent value="details" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5 text-accent" />
                          Client Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground text-xs">Client Name</Label>
                            <p className="font-semibold text-lg mt-1">
                              {displayBooking.client?.name || displayBooking.client_name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Contact</Label>
                            <p className="text-sm mt-1">
                              {displayBooking.client?.contact || displayBooking.client?.phone || displayBooking.client_contact || "N/A"}
                            </p>
                          </div>
                        </div>
                        {(displayBooking.client || displayBooking.client_email || displayBooking.client_address) && (
                          <>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              {(displayBooking.client?.email || displayBooking.client_email) && (
                                <div>
                                  <Label className="text-muted-foreground text-xs">Email</Label>
                                  <p className="mt-1">{displayBooking.client?.email || displayBooking.client_email}</p>
                                </div>
                              )}
                              {(displayBooking.client?.phone || displayBooking.client_contact) && (
                                <div>
                                  <Label className="text-muted-foreground text-xs">Phone</Label>
                                  <p className="mt-1">{displayBooking.client?.phone || displayBooking.client_contact}</p>
                                </div>
                              )}
                              {(displayBooking.client?.address || displayBooking.client_address) && (
                                <div>
                                  <Label className="text-muted-foreground text-xs">Address</Label>
                                  <p className="mt-1">{displayBooking.client?.address || displayBooking.client_address}</p>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                        {(displayBooking.destination_contact_name || displayBooking.destination_contact_phone) && (
                          <>
                            <Separator />
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Destination Contact</Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                {displayBooking.destination_contact_name && (
                                  <div>
                                    <Label className="text-muted-foreground text-xs">Contact Name</Label>
                                    <p className="mt-1 font-medium">{displayBooking.destination_contact_name}</p>
                                  </div>
                                )}
                                {displayBooking.destination_contact_phone && (
                                  <div>
                                    <Label className="text-muted-foreground text-xs">Contact Phone</Label>
                                    <p className="mt-1">{displayBooking.destination_contact_phone}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {displayBooking.route && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-accent" />
                            Route Map
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Animated Route Display */}
                          {displayBooking.status === "In Transit" || displayBooking.status === "On Hold" ? (
                            <AnimatedRoute
                              route={displayBooking.route}
                              status={displayBooking.status}
                              startedAt={displayBooking.started_at}
                              timeline={displayBooking.timeline}
                              isOnHold={displayBooking.status === "On Hold"}
                            />
                          ) : (
                            /* Static Route Display for non-transit statuses */
                            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2 flex-1">
                                <div className="flex flex-col items-center">
                                  <MapPin className="h-5 w-5 text-green-500" />
                                  <span className="text-xs text-muted-foreground mt-1">From</span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {displayBooking.route.split("→")[0]?.trim() || "Origin"}
                                  </p>
                                </div>
                              </div>
                              <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                              <div className="flex items-center gap-2 flex-1">
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {displayBooking.route.split("→")[1]?.trim() || "Destination"}
                                  </p>
                                </div>
                                <div className="flex flex-col items-center">
                                  <MapPin className="h-5 w-5 text-red-500" />
                                  <span className="text-xs text-muted-foreground mt-1">To</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Embedded Map */}
                          <div className="w-full h-64 rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center relative">
                            {displayBooking.pickup_lat &&
                            displayBooking.pickup_lng &&
                            displayBooking.delivery_lat &&
                            displayBooking.delivery_lng ? (
                              <img
                                src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s-a+22c55e(${displayBooking.pickup_lng},${displayBooking.pickup_lat}),pin-s-b+ef4444(${displayBooking.delivery_lng},${displayBooking.delivery_lat}),path-5+22c55e-0.6(${displayBooking.pickup_lng},${displayBooking.pickup_lat}|${displayBooking.delivery_lng},${displayBooking.delivery_lat})/auto/600x300?padding=40&access_token=${MAPBOX_TOKEN}`}
                                alt="Route Map"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center text-muted-foreground space-y-2">
                                <MapPin className="h-12 w-12 mx-auto opacity-50" />
                                <p className="text-sm">Map preview unavailable</p>
                                <p className="text-xs text-muted-foreground/70">Coordinates missing for this booking</p>
                              </div>
                            )}
                            <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm text-[10px] px-1.5 py-0.5 rounded text-muted-foreground">
                              © Mapbox
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5 text-accent" />
                          Job Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Request Details</Label>
                          <p className="mt-2 text-base leading-relaxed">{displayBooking.request_details}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {displayBooking.timeline && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Timeline</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-4 w-4 text-accent" />
                                <span className="text-sm font-medium">{displayBooking.timeline}</span>
                              </div>
                            </div>
                          )}
                          {displayBooking.number_of_loads && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Number of Loads</Label>
                              <p className="mt-1 font-medium">{displayBooking.number_of_loads}</p>
                            </div>
                          )}
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Proposed Budget</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Wallet className="h-4 w-4 text-green-500" />
                              <span className="font-semibold text-lg text-green-600">
                                {formatCurrency(displayBooking.proposed_client_budget)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {displayBooking.negotiation_notes && (
                          <>
                            <Separator />
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Negotiation Notes</Label>
                              <p className="mt-2 text-sm bg-muted/50 p-3 rounded-lg">
                                {displayBooking.negotiation_notes}
                              </p>
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
                                <Label className="text-sm font-medium text-muted-foreground">License Number</Label>
                                <p className="mt-1 text-sm">{displayBooking.driver?.license_number}</p>
                              </div>
                              {displayBooking.driver?.address && (
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                                  <p className="mt-1 text-sm">{displayBooking.driver.address}</p>
                                </div>
                              )}
                            </div>
                            {displayBooking.driver?.emergency_contact_name && (
                              <>
                                <Separator />
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">Emergency Contact</Label>
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
                                <Label className="text-muted-foreground">Type</Label>
                                <p className="font-medium">{displayBooking.vehicle?.vehicle_type}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Make & Model</Label>
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
                          <div className="space-y-4 border-t pt-3">
                            <div className="space-y-2">
                              <Label>Waybill *</Label>
                              <div className="border-2 border-dashed rounded p-3 hover:bg-muted/50">
                                <input
                                  type="file"
                                  id="waybill"
                                  accept=".pdf,.jpg,.png"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleDocumentUpload(e.target.files[0], "Waybill")
                                      // Reset input to allow re-uploading the same file
                                      e.target.value = ""
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label
                                  htmlFor="waybill"
                                  className="flex flex-col items-center gap-2 cursor-pointer text-sm"
                                >
                                  <Upload className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {waybills.some((w: any) => w.document_type === "Waybill")
                                      ? "Replace waybill"
                                      : "Upload waybill"}
                                  </span>
                                </label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Fuel Receipt *</Label>
                              <div className="border-2 border-dashed rounded p-3 hover:bg-muted/50">
                                <input
                                  type="file"
                                  id="fuel-receipt"
                                  accept=".pdf,.jpg,.png"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleDocumentUpload(e.target.files[0], "Fuel Receipt")
                                      // Reset input to allow re-uploading the same file
                                      e.target.value = ""
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label
                                  htmlFor="fuel-receipt"
                                  className="flex flex-col items-center gap-2 cursor-pointer text-sm"
                                >
                                  <Upload className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {waybills.some((w: any) => w.document_type === "Fuel Receipt")
                                      ? "Replace fuel receipt"
                                      : "Upload fuel receipt"}
                                  </span>
                                </label>
                              </div>
                            </div>
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
                                  By {event.action_by?.full_name || "System"} • {formatRelativeTime(event.created_at)}
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
                        {waybills && waybills.length > 0 ? (
                          <div className="space-y-3">
                            {waybills.map((doc: any) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium truncate">
                                        {doc.file_name || `${doc.document_type || "Document"}`}
                                      </p>
                                      {doc.document_type && (
                                        <Badge variant="outline" className="text-xs">
                                          {doc.document_type}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Uploaded {formatRelativeTime(doc.uploaded_at)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {doc.file_url && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-shrink-0"
                                        onClick={() => {
                                          setViewingDocument({
                                            url: doc.file_url,
                                            name: doc.file_name || "Document",
                                            type: doc.file_type || "",
                                          })
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-shrink-0"
                                        onClick={() => {
                                          const proxyUrl = `/api/waybill?url=${encodeURIComponent(doc.file_url)}&bookingId=${booking.id}`
                                          const link = document.createElement("a")
                                          link.href = proxyUrl
                                          link.download = doc.file_name || "document"
                                          link.click()
                                        }}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                      {canDeleteDocuments && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="flex-shrink-0 text-destructive hover:text-destructive"
                                          onClick={() => handleDeleteDocument(doc.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {["Completed", "Closed"].includes(displayBooking.status) && (
                    <TabsContent value="feedback" className="space-y-4 mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Driver Feedback & Ratings</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Call the customer to collect feedback about the driver's performance
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {displayBooking.driver_rating ? (
                            <>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Driver Behavior</Label>
                                <div className="flex items-center gap-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                      key={star}
                                      className={cn(
                                        "h-6 w-6",
                                        star <= (displayBooking.driver_rating || 0)
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "fill-gray-200 text-gray-200",
                                      )}
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                  ))}
                                  <span className="ml-2 text-sm font-semibold">{displayBooking.driver_rating}/5</span>
                                </div>
                              </div>

                              <Separator />

                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Punctuality</Label>
                                  <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <svg
                                        key={star}
                                        className={cn(
                                          "h-5 w-5",
                                          star <= (displayBooking.punctuality_rating || 0)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-gray-200 text-gray-200",
                                        )}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                      </svg>
                                    ))}
                                    <span className="ml-2 text-sm">{displayBooking.punctuality_rating || 0}/5</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Vehicle Condition</Label>
                                  <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <svg
                                        key={star}
                                        className={cn(
                                          "h-5 w-5",
                                          star <= (displayBooking.vehicle_condition_rating || 0)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-gray-200 text-gray-200",
                                        )}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                      </svg>
                                    ))}
                                    <span className="ml-2 text-sm">
                                      {displayBooking.vehicle_condition_rating || 0}/5
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Communication</Label>
                                  <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <svg
                                        key={star}
                                        className={cn(
                                          "h-5 w-5",
                                          star <= (displayBooking.communication_rating || 0)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-gray-200 text-gray-200",
                                        )}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                      </svg>
                                    ))}
                                    <span className="ml-2 text-sm">{displayBooking.communication_rating || 0}/5</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Rating</Label>
                                  <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <svg
                                        key={star}
                                        className={cn(
                                          "h-5 w-5",
                                          star <= (displayBooking.driver_rating || 0)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-gray-200 text-gray-200",
                                        )}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                      </svg>
                                    ))}
                                    <span className="ml-2 text-sm">{displayBooking.driver_rating || 0}/5</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Vehicle Condition</Label>
                                  <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <svg
                                        key={star}
                                        className={cn(
                                          "h-5 w-5",
                                          star <= (displayBooking.vehicle_condition_rating || 0)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-gray-200 text-gray-200",
                                        )}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                      </svg>
                                    ))}
                                    <span className="ml-2 text-sm">
                                      {displayBooking.vehicle_condition_rating || 0}/5
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Communication</Label>
                                  <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <svg
                                        key={star}
                                        className={cn(
                                          "h-5 w-5",
                                          star <= (displayBooking.communication_rating || 0)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-gray-200 text-gray-200",
                                        )}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                      </svg>
                                    ))}
                                    <span className="ml-2 text-sm">{displayBooking.communication_rating || 0}/5</span>
                                  </div>
                                </div>
                              </div>

                              {displayBooking.driver_feedback && (
                                <>
                                  <Separator />
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                      Additional Comments
                                    </Label>
                                    <div className="bg-muted/50 p-4 rounded-lg">
                                      <p className="text-sm leading-relaxed">{displayBooking.driver_feedback}</p>
                                    </div>
                                  </div>
                                </>
                              )}

                              <div className="text-xs text-muted-foreground mt-4">
                                <p>
                                  This feedback is attached to the driver's profile and contributes to their overall
                                  rating.
                                </p>
                              </div>

                              <Button onClick={() => setShowRateDriver(true)} variant="outline" className="w-full">
                                Edit Feedback
                              </Button>
                            </>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground mb-4">
                                Call the customer to collect feedback about the driver's performance, then submit the
                                ratings below.
                              </p>
                              <Button onClick={() => setShowRateDriver(true)} className="bg-accent hover:bg-accent/90">
                                Submit Driver Feedback
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
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
            onOpenChange(false) // Close the detail sheet as well
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

      {showTripExpenses && (
        <TripExpenseDialog
          open={showTripExpenses}
          onOpenChange={setShowTripExpenses}
          bookingId={displayBooking.id}
          onSuccess={() => {
            mutateBooking()
            onUpdate()
          }}
        />
      )}

      {showTripHold && (
        <TripHoldDialog
          open={showTripHold}
          onOpenChange={setShowTripHold}
          bookingId={displayBooking.id}
          onSuccess={() => {
            mutateBooking()
            onUpdate()
          }}
        />
      )}

      {showUpdateJobDetails && (
        <UpdateJobDetailsDialog
          open={showUpdateJobDetails}
          onOpenChange={setShowUpdateJobDetails}
          booking={displayBooking}
          onSuccess={() => {
            mutateBooking()
            onUpdate()
          }}
        />
      )}

      {viewingDocument && (
        <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>{viewingDocument.name}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center w-full h-[70vh] overflow-auto bg-muted/50 rounded-lg p-4">
              {viewingDocument.type?.startsWith("image/") ? (
                <img
                  src={`/api/waybill?url=${encodeURIComponent(viewingDocument.url)}&bookingId=${booking.id}`}
                  alt={viewingDocument.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <iframe
                  src={`/api/waybill?url=${encodeURIComponent(viewingDocument.url)}&bookingId=${booking.id}`}
                  className="w-full h-full border-0"
                  title={viewingDocument.name}
                />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  const proxyUrl = `/api/waybill?url=${encodeURIComponent(viewingDocument.url)}&bookingId=${booking.id}`
                  const link = document.createElement("a")
                  link.href = proxyUrl
                  link.download = viewingDocument.name
                  link.click()
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={() => setViewingDocument(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
