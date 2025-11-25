"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

type TripExpense = {
  cost_type: string
  amount: string
  description: string
  receipt_url?: string
}

type TripExpenseDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  bookingId: string
  onSuccess: () => void
  embedded?: boolean
}

export function TripExpenseDialog({
  open,
  onOpenChange,
  bookingId,
  onSuccess,
  embedded = false,
}: TripExpenseDialogProps) {
  const [expenses, setExpenses] = useState<TripExpense[]>([{ cost_type: "Fuel", amount: "", description: "" }])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const { data: existingExpenses = [] } = useSWR(
    `trip-expenses-${bookingId}`,
    async () => {
      const { data } = await supabase
        .from("job_costs")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false })
      return data || []
    },
    { refreshInterval: 5000 },
  )

  const addExpense = () => {
    setExpenses([...expenses, { cost_type: "Fuel", amount: "", description: "" }])
  }

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index))
  }

  const updateExpense = (index: number, field: keyof TripExpense, value: string) => {
    const updated = [...expenses]
    updated[index] = { ...updated[index], [field]: value }
    setExpenses(updated)
  }

  const uploadReceipt = async (index: number, file: File) => {
    setUploading(true)
    try {
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}&folder=receipts/${bookingId}&contentType=${encodeURIComponent(file.type)}`,
      )

      if (!response.ok) {
        throw new Error("Upload service not configured")
      }

      const config = await response.json()

      let publicUrl = ""
      if (config.workerUrl) {
        const workerUrl = new URL(config.workerUrl)
        workerUrl.searchParams.set("filename", file.name)
        workerUrl.searchParams.set("folder", `receipts/${bookingId}`)

        const uploadResponse = await fetch(workerUrl.toString(), {
          method: "PUT",
          body: file,
          headers: {
            "X-Auth-Key": config.authKey,
            "Content-Type": file.type,
          },
        })

        if (!uploadResponse.ok) throw new Error("Upload failed")

        const result = await uploadResponse.json()
        publicUrl = result.url
      }

      updateExpense(index, "receipt_url", publicUrl)
      toast.success("Receipt uploaded")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload receipt")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const { logTripExpenses } = await import("@/app/actions/bookings")

      for (const expense of expenses) {
        if (!expense.amount || Number.parseFloat(expense.amount) <= 0) {
          toast.error("Please enter valid amounts for all expenses")
          setSaving(false)
          return
        }
      }

      const result = await logTripExpenses(bookingId, expenses)

      if (result.success) {
        toast.success("Trip expenses logged successfully")
        onSuccess()
        if (!embedded && onOpenChange) {
          onOpenChange(false)
        }
      } else {
        toast.error(result.error || "Failed to log expenses")
      }
    } catch (error) {
      console.error("Error logging expenses:", error)
      toast.error("Failed to log expenses")
    } finally {
      setSaving(false)
    }
  }

  const content = (
    <div className="space-y-4">
      {existingExpenses && existingExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Previously Logged Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {existingExpenses.map((expense: any) => (
                <div key={expense.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <div>
                    <p className="font-medium text-sm">{expense.cost_type}</p>
                    {expense.description && <p className="text-xs text-muted-foreground">{expense.description}</p>}
                  </div>
                  <span className="font-semibold">₦{expense.amount.toLocaleString()}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center font-bold">
                <span>Total</span>
                <span>
                  ₦{existingExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {expenses.map((expense, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Expense {index + 1}</h4>
            {expenses.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => removeExpense(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Expense Type</Label>
              <Select value={expense.cost_type} onValueChange={(value) => updateExpense(index, "cost_type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fuel">Fuel</SelectItem>
                  <SelectItem value="Toll">Toll</SelectItem>
                  <SelectItem value="Parking">Parking</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Bribe">Bribe/Unofficial Fee</SelectItem>
                  <SelectItem value="Food">Food & Accommodation</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={expense.amount}
                onChange={(e) => updateExpense(index, "amount", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Details about this expense..."
              value={expense.description}
              onChange={(e) => updateExpense(index, "description", e.target.value)}
            />
          </div>

          <div>
            <Label>Receipt (Optional)</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id={`receipt-${index}`}
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    uploadReceipt(index, e.target.files[0])
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => document.getElementById(`receipt-${index}`)?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {expense.receipt_url ? "Change Receipt" : "Upload Receipt"}
              </Button>
              {expense.receipt_url && (
                <a
                  href={expense.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  View Receipt
                </a>
              )}
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addExpense} className="w-full bg-transparent">
        <Plus className="h-4 w-4 mr-2" />
        Add Another Expense
      </Button>

      <div className="flex gap-2 pt-4">
        {!embedded && onOpenChange && (
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={saving} className="flex-1">
          {saving ? "Saving..." : "Log Expenses"}
        </Button>
      </div>
    </div>
  )

  if (embedded) {
    return content
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Trip Expenses</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
