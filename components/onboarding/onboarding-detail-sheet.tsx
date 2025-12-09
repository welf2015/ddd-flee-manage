"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle, Loader2, Pencil } from "lucide-react"
import useSWR from "swr"
import { useState } from "react"
import { toggleChecklistItem, completeOnboarding, getOnboardingDetails } from "@/app/actions/onboarding"
import { useToast } from "@/hooks/use-toast"
import { EditOnboardingDialog } from "./edit-onboarding-dialog"

const fetcher = async (onboardingId: string) => {
  const result = await getOnboardingDetails(onboardingId)
  if (!result.success) throw new Error(result.error)
  return result.data
}

interface OnboardingDetailSheetProps {
  onboardingId: string
  open: boolean
  onClose: () => void
}

export function OnboardingDetailSheet({ onboardingId, open, onClose }: OnboardingDetailSheetProps) {
  const {
    data: onboarding,
    mutate,
    isLoading,
    error,
  } = useSWR(open && onboardingId ? `onboarding-${onboardingId}` : null, () => fetcher(onboardingId))

  const [completing, setCompleting] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { toast } = useToast()

  const handleToggleItem = async (progressId: string, isCompleted: boolean) => {
    const result = await toggleChecklistItem(progressId, !isCompleted)
    if (result.success) {
      mutate()
      toast({
        title: "Updated",
        description: "Checklist item updated successfully",
      })
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    const result = await completeOnboarding(onboardingId)
    if (result.success) {
      mutate()
      toast({
        title: "Success",
        description: "Vehicle onboarding completed and added to fleet",
      })
      onClose()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setCompleting(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full lg:w-3/4 overflow-y-auto">
          {error ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-destructive">
                <p className="text-lg font-medium">Error loading details</p>
                <p className="text-sm text-center max-w-xs">{error.message || "Please try again later"}</p>
                <Button variant="outline" onClick={() => mutate()}>
                  Retry
                </Button>
              </div>
            </div>
          ) : !onboarding ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading details...</p>
              </div>
            </div>
          ) : (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <SheetTitle className="text-2xl">Vehicle Onboarding</SheetTitle>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Vehicle:{" "}
                        <span className="font-medium text-foreground">{onboarding.vehicle_number || "TBD"}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Type: <span className="font-medium text-foreground">{onboarding.vehicle_type}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Make/Model:{" "}
                        <span className="font-medium text-foreground">
                          {onboarding.make} {onboarding.model} ({onboarding.year})
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Badge variant={onboarding.status === "Completed" ? "default" : "secondary"}>
                      {onboarding.status}
                    </Badge>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6">
                {/* Vehicle & Procurement Details Card */}
                <Card className="bg-background/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-base">Vehicle Origin & Procurement</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Supplied By (Vendor)</p>
                      <p className="text-sm font-medium">{onboarding.procurement?.vendor?.name || "N/A"}</p>
                      {(onboarding.procurement?.vendor?.email || onboarding.procurement?.vendor?.phone) && (
                        <p className="text-xs text-muted-foreground">
                          {[onboarding.procurement.vendor.email, onboarding.procurement.vendor.phone]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Cleared By (Agent)</p>
                      <p className="text-sm font-medium">{onboarding.procurement?.clearing_agent?.name || "N/A"}</p>
                      {(onboarding.procurement?.clearing_agent?.email ||
                        onboarding.procurement?.clearing_agent?.phone) && (
                        <p className="text-xs text-muted-foreground">
                          {[onboarding.procurement.clearing_agent.email, onboarding.procurement.clearing_agent.phone]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Received From Agent</p>
                      <p className="text-sm font-medium">{onboarding.procurement?.received_by || "Pending"}</p>
                      {onboarding.procurement?.received_at && (
                        <p className="text-xs text-muted-foreground">
                          Date: {new Date(onboarding.procurement.received_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Procurement Ref</p>
                      <p className="text-sm font-medium">{onboarding.procurement?.procurement_number || "N/A"}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Progress Overview */}
                <Card className="bg-background/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-base">Overall Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      const completedItems = onboarding.progress?.filter((p: any) => p.is_completed).length || 0
                      const totalItems = onboarding.progress?.length || 0
                      const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
                      const allCompleted = completedItems === totalItems && totalItems > 0

                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {completedItems} of {totalItems} items completed
                            </span>
                            <span className="text-sm font-medium">{completionPercentage}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-accent h-2 rounded-full transition-all"
                              style={{ width: `${completionPercentage}%` }}
                            />
                          </div>
                          {allCompleted && onboarding.status !== "Completed" && (
                            <Button
                              onClick={handleComplete}
                              disabled={completing}
                              className="w-full bg-accent hover:bg-accent/90"
                            >
                              {completing ? "Completing..." : "Complete Onboarding & Add to Fleet"}
                            </Button>
                          )}
                        </>
                      )
                    })()}
                  </CardContent>
                </Card>

                {/* Checklist by Category */}
                {(() => {
                  const groupedProgress = onboarding.progress?.reduce((acc: any, item: any) => {
                    const categoryName = item.checklist_item?.category?.name || "Other"
                    if (!acc[categoryName]) acc[categoryName] = []
                    acc[categoryName].push(item)
                    return acc
                  }, {})

                  return Object.entries(groupedProgress || {}).map(([category, items]: [string, any]) => (
                    <Card key={category} className="bg-background/50 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="text-base">{category}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {items.map((item: any) => (
                          <div key={item.id} className="space-y-2">
                            <div className="flex items-start gap-3">
                              <button onClick={() => handleToggleItem(item.id, item.is_completed)} className="mt-1">
                                {item.is_completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-accent" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p
                                    className={`text-sm font-medium ${item.is_completed ? "line-through text-muted-foreground" : ""}`}
                                  >
                                    {item.checklist_item?.item_name}
                                  </p>
                                  {item.checklist_item?.is_required && (
                                    <Badge variant="outline" className="text-xs">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                {item.checklist_item?.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {item.checklist_item.description}
                                  </p>
                                )}
                                {item.is_completed && item.completed_at && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Completed by {item.completed_by?.full_name} on{" "}
                                    {new Date(item.completed_at).toLocaleDateString()}
                                  </p>
                                )}
                                {item.notes && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">Note: {item.notes}</p>
                                )}
                                {item.document_url && (
                                  <a
                                    href={item.document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-accent hover:underline mt-1 inline-block"
                                  >
                                    View Document
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))
                })()}

                {onboarding.notes && (
                  <Card className="bg-background/50 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-base">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{onboarding.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {onboarding && (
        <EditOnboardingDialog
          onboarding={onboarding}
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSuccess={() => mutate()}
        />
      )}
    </>
  )
}
