"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { adjustDriverBalance } from "@/app/actions/driver-spending"
import { toast } from "sonner"

interface AdjustBalanceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    driverId: string
    driverName: string
    currentBalance: number
}

export default function AdjustBalanceDialog({
    open,
    onOpenChange,
    onSuccess,
    driverId,
    driverName,
    currentBalance
}: AdjustBalanceDialogProps) {
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState<"add" | "subtract">("add")
    const [formData, setFormData] = useState({
        amount: "",
        notes: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const amount = Number.parseFloat(formData.amount)
            const adjustedAmount = type === "add" ? amount : -amount

            const result = await adjustDriverBalance(
                driverId,
                adjustedAmount,
                formData.notes || `Manual balance ${type === "add" ? "addition" : "deduction"}`
            )

            if (result.success) {
                toast.success(`Balance adjusted for ${driverName}`)
                onOpenChange(false)
                setFormData({ amount: "", notes: "" })
                onSuccess?.()
            } else {
                toast.error(result.error || "Failed to adjust balance")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adjust Balance: {driverName}</DialogTitle>
                    <DialogDescription>
                        Current Balance: ₦{currentBalance.toLocaleString()}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Adjustment Type</Label>
                        <Select value={type} onValueChange={(v: any) => setType(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="add">Add to Balance (+)</SelectItem>
                                <SelectItem value="subtract">Subtract from Balance (-)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₦)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Why are you adjusting the balance?"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className={type === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
                            {loading ? "Adjusting..." : type === "add" ? "Add Funds" : "Subtract Funds"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
