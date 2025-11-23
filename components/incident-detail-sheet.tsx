"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import {
  AlertCircle,
  Calendar,
  MapPin,
  User,
  Truck,
  FileText,
  ImageIcon,
  X,
  Wrench,
  Shield,
  Wallet,
} from "lucide-react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

interface IncidentDetailSheetProps {
  incidentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IncidentDetailSheet({ incidentId, open, onOpenChange }: IncidentDetailSheetProps) {
  const supabase = createClient()

  const { data: incident } = useSWR(
    open ? `incident-${incidentId}` : null,
    async () => {
      const { data } = await supabase.from("incidents").select("*").eq("id", incidentId).single()

      if (data && data.vehicle_id) {
        const { data: vehicle } = await supabase.from("vehicles").select("*").eq("id", data.vehicle_id).single()
        data.vehicle = vehicle
      }

      if (data && data.driver_id) {
        const { data: driver } = await supabase.from("drivers").select("*").eq("id", data.driver_id).single()
        data.driver = driver
      }

      if (data && data.resolved_by) {
        const { data: resolver } = await supabase.from("profiles").select("*").eq("id", data.resolved_by).single()
        data.resolver = resolver
      }

      return data
    },
    { refreshInterval: 5000 },
  )

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "High":
        return "bg-accent/10 text-accent border-accent/20"
      case "Medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "Low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "Resolved":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-full md:w-1/2 lg:w-1/2 xl:w-1/2 p-0 bg-background overflow-y-auto"
      >
        <div className="h-full flex flex-col">
          <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10 space-y-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <SheetTitle className="text-2xl">{incident?.incident_number}</SheetTitle>
                <p className="text-sm text-muted-foreground">Incident Details & Information</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 pt-2">
              <Badge variant="outline" className={getSeverityColor(incident?.severity || "")}>
                {incident?.severity}
              </Badge>
              <Badge variant="outline" className={getStatusColor(incident?.status || "")}>
                {incident?.status}
              </Badge>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-muted/50 px-6">
                <TabsTrigger value="details" className="rounded-none">
                  Details
                </TabsTrigger>
                <TabsTrigger value="parties" className="rounded-none">
                  Parties
                </TabsTrigger>
                <TabsTrigger value="resolution" className="rounded-none">
                  Resolution
                </TabsTrigger>
              </TabsList>

              <div className="px-6 pb-6">
                <TabsContent value="details" className="space-y-4 mt-4">
                  {incident?.photo_url && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ImageIcon className="h-5 w-5 text-accent" />
                          Incident Photos {/* Changed from "Photo" to "Photos" */}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted/30">
                          <img
                            src={incident.photo_url || "/placeholder.svg"}
                            alt="Incident photo"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                              const parent = e.currentTarget.parentElement
                              if (parent) {
                                parent.innerHTML =
                                  '<div class="flex flex-col items-center justify-center h-full text-muted-foreground gap-2"><svg class="h-12 w-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-sm">Failed to load image</p></div>'
                              }
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-accent" />
                        Incident Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground text-xs">Description</Label>
                        <p className="font-medium mt-1">{incident?.description}</p>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground text-xs">Date & Time</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-accent" />
                            <span className="text-sm font-medium">
                              {incident?.incident_date ? new Date(incident.incident_date).toLocaleString() : "N/A"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Location</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="h-4 w-4 text-accent" />
                            <span className="text-sm font-medium">{incident?.location || "Not specified"}</span>
                          </div>
                        </div>
                      </div>
                      {incident?.total_amount_spent && (
                        <>
                          <Separator />
                          <div>
                            <Label className="text-muted-foreground text-xs">Total Cost of Damages</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Wallet className="h-4 w-4 text-red-500" /> {/* Changed from DollarSign to Wallet */}
                              <span className="font-semibold text-lg text-red-600">
                                {formatCurrency(incident.total_amount_spent)}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Vehicle Information */}
                  {incident?.vehicle && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Truck className="h-5 w-5 text-accent" />
                          Vehicle Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground text-xs">Vehicle Number</Label>
                            <p className="font-semibold text-lg mt-1">{incident.vehicle.vehicle_number}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Type</Label>
                            <p className="text-sm mt-1">{incident.vehicle.vehicle_type}</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <Label className="text-muted-foreground text-xs">Make</Label>
                            <p className="mt-1">{incident.vehicle.make}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Model</Label>
                            <p className="mt-1">{incident.vehicle.model}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Year</Label>
                            <p className="mt-1">{incident.vehicle.year}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Driver Information */}
                  {incident?.driver && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5 text-accent" />
                          Driver Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground text-xs">Name</Label>
                            <p className="font-semibold mt-1">{incident.driver.full_name}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Phone</Label>
                            <p className="text-sm mt-1">{incident.driver.phone}</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-muted-foreground text-xs">License Number</Label>
                            <p className="mt-1">{incident.driver.license_number}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Emergency Contact</Label>
                            <p className="mt-1">
                              {incident.driver.emergency_contact_name} ({incident.driver.emergency_contact_phone})
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="parties" className="space-y-4 mt-4">
                  {(incident?.third_parties_involved || incident?.witnesses) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5 text-accent" />
                          Third Parties & Witnesses
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {incident.third_parties_involved && (
                          <div>
                            <Label className="text-muted-foreground text-xs">Third Parties Involved</Label>
                            <p className="text-sm mt-2 bg-muted/50 p-3 rounded-lg">{incident.third_parties_involved}</p>
                          </div>
                        )}
                        {incident.witnesses && (
                          <>
                            {incident.third_parties_involved && <Separator />}
                            <div>
                              <Label className="text-muted-foreground text-xs">Witnesses</Label>
                              <p className="text-sm mt-2 bg-muted/50 p-3 rounded-lg">{incident.witnesses}</p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {(incident?.immediate_action_taken ||
                    incident?.police_contacted ||
                    incident?.tow_service_contacted) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-accent" />
                          Immediate Action & Response
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {incident.immediate_action_taken && (
                          <div>
                            <Label className="text-muted-foreground text-xs">Immediate Action Taken</Label>
                            <p className="text-sm mt-2 bg-muted/50 p-3 rounded-lg">{incident.immediate_action_taken}</p>
                          </div>
                        )}
                        {(incident.police_contacted || incident.tow_service_contacted) && (
                          <>
                            {incident.immediate_action_taken && <Separator />}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {incident.police_contacted && (
                                <div>
                                  <Label className="text-muted-foreground text-xs">Police Contacted</Label>
                                  <p className="mt-1 font-medium text-green-600">Yes</p>
                                </div>
                              )}
                              {incident.tow_service_contacted && (
                                <div>
                                  <Label className="text-muted-foreground text-xs">Tow Service</Label>
                                  <p className="mt-1 font-medium text-green-600">
                                    Yes {incident.vehicle_towed_to && `- ${incident.vehicle_towed_to}`}
                                  </p>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {incident?.insurance_claim_filed && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Shield className="h-5 w-5 text-accent" />
                          Insurance Claims
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground text-xs">Claim Filed</Label>
                            <p className="mt-1 font-medium text-green-600">Yes</p>
                          </div>
                          {incident.insurance_reference && (
                            <div>
                              <Label className="text-muted-foreground text-xs">Reference Number</Label>
                              <p className="mt-1 font-medium">{incident.insurance_reference}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="resolution" className="space-y-4 mt-4">
                  {(incident?.repairs_authorized_by ||
                    incident?.workshop_name ||
                    incident?.downtime !== undefined ||
                    incident?.date_returned_to_service) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Wrench className="h-5 w-5 text-accent" />
                          Repairs & Workshop
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {incident.repairs_authorized_by && (
                            <div>
                              <Label className="text-muted-foreground text-xs">Authorized By</Label>
                              <p className="font-medium mt-1">{incident.repairs_authorized_by}</p>
                            </div>
                          )}
                          <div>
                            <Label className="text-muted-foreground text-xs">Any Downtime?</Label>
                            <p className="mt-1 font-medium">
                              {incident.downtime ? (
                                <span className="text-red-600">Yes</span>
                              ) : (
                                <span className="text-green-600">No</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {(incident.workshop_name || incident.date_returned_to_service) && (
                          <>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {incident.workshop_name && (
                                <div>
                                  <Label className="text-muted-foreground text-xs">Workshop Name</Label>
                                  <p className="mt-1">{incident.workshop_name}</p>
                                </div>
                              )}
                              {incident.date_returned_to_service && (
                                <div>
                                  <Label className="text-muted-foreground text-xs">Return to Service Date</Label>
                                  <p className="mt-1">
                                    {new Date(incident.date_returned_to_service).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {incident?.additional_remarks && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5 text-accent" />
                          Additional Remarks
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">{incident.additional_remarks}</p>
                      </CardContent>
                    </Card>
                  )}

                  {incident?.resolved_by_name && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5 text-accent" />
                          Resolved By
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-semibold">{incident.resolved_by_name}</p>
                            <p className="text-xs text-muted-foreground">Incident Handler</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
