"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Circle, Upload, X } from 'lucide-react'
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { toggleChecklistItem, completeOnboarding } from "@/app/actions/onboarding"
import { useToast } from "@/hooks/use-toast"

const fetcher = async (onboardingId: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("vehicle_onboarding")
    .select(`
      *,
      procurement:procurements(procurement_number, vendor:vendors(name)),
      assigned_to:profiles(full_name),
      progress:vehicle_onboarding_progress(
        *,
        checklist_item:onboarding_checklist_items(
          *,
          category:onboarding_categories(name)
        ),
        completed_by:profiles(full_name)
      )
    `)
    .eq("id", onboardingId)
    .single()

  if (error) throw error
  return data
}

interface OnboardingDetailSheetProps {
  onboardingId: string
  open: boolean
  onClose: () => void
}

export function OnboardingDetailSheet({ onboardingId, open, onClose }: OnboardingDetailSheetProps) {
  const { data: onboarding, mutate } = useSWR(
    onboardingId ? `onboarding-${onboardingId}` : null,
    () => fetcher(onboardingId),
    { refreshInterval: 3000 }
  )
  const [completing, setCompleting] = useState(false)
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

  if (!onboarding) {
    return null
  }

  // Group progress by category
  const groupedProgress = onboarding.progress?.reduce((acc: any, item: any) => {
    const categoryName = item.checklist_item?.category?.name || "Other"
    if (!acc[categoryName]) acc[categoryName] = []
    acc[categoryName].push(item)
    return acc
  }, {})

  const completedItems = onboarding.progress?.filter((p: any) => p.is_completed).length || 0
  const totalItems = onboarding.progress?.length || 0
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  const allCompleted = completedItems === totalItems && totalItems > 0

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full lg:w-3/4 overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-2xl">Vehicle Onboarding</SheetTitle>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Vehicle: <span className="font-medium text-foreground">{onboarding.vehicle_number || "TBD"}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Type: <span className="font-medium text-foreground">{onboarding.vehicle_type}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Make/Model: <span className="font-medium text-foreground">{onboarding.make} {onboarding.model} ({onboarding.year})</span>
                </p>
              </div>
            </div>
            <Badge variant={onboarding.status === "Completed" ? "default" : "secondary"}>
              {onboarding.status}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card className="bg-background/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Checklist by Category */}
          {Object.entries(groupedProgress || {}).map(([category, items]: [string, any]) => (
            <Card key={category} className="bg-background/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item: any) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleItem(item.id, item.is_completed)}
                        className="mt-1"
                      >
                        {item.is_completed ? (
                          <CheckCircle2 className="h-5 w-5 text-accent" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${item.is_completed ? "line-through text-muted-foreground" : ""}`}>
                            {item.checklist_item?.item_name}
                          </p>
                          {item.checklist_item?.is_required && (
                            <Badge variant="outline" className="text-xs">Required</Badge>
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
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            Note: {item.notes}
                          </p>
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
          ))}

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
      </SheetContent>
    </Sheet>
  )
}
