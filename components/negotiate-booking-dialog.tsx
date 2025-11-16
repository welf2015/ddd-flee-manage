"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { DollarSign, User, Clock } from "lucide-react"

type NegotiateBookingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: any
  onSuccess: () => void
}

export function NegotiateBookingDialog({ open, onOpenChange, booking, onSuccess }: NegotiateBookingDialogProps) {
  const [amount, setAmount] = useState("")
  const [comments, setComments] = useState("")
  const [loading, setLoading] = useState(false)
  const [threads, setThreads] = useState<any[]>([])
  const [loadingThreads, setLoadingThreads] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (open && booking) {
      fetchNegotiationThreads()
    }
  }, [open, booking])

  const fetchNegotiationThreads = async () => {
    setLoadingThreads(true)
    const { data } = await supabase
      .from("negotiation_threads")
      .select("*, proposed_by:profiles!proposed_by(full_name), counter_by:profiles!counter_by(full_name)")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false })

    setThreads(data || [])
    setLoadingThreads(false)
  }

  const handleNegotiate = async (isCounter: boolean) => {
    if (!amount) {
      toast.error("Please enter an amount")
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (isCounter) {
        // Counter negotiation
        const { error } = await supabase
          .from("negotiation_threads")
          .update({
            counter_amount: Number.parseFloat(amount),
            counter_comments: comments,
            counter_by: user?.id,
            status: "Countered",
            updated_at: new Date().toISOString(),
          })
          .eq("id", threads[0]?.id)

        if (error) throw error
      } else {
        // New negotiation proposal
        const { error } = await supabase.from("negotiation_threads").insert({
          booking_id: booking.id,
          proposed_amount: Number.parseFloat(amount),
          comments,
          proposed_by: user?.id,
          status: "Proposed",
        })

        if (error) throw error
      }

      // Update booking status to Negotiation
      await supabase
        .from("bookings")
        .update({ status: "Negotiation", negotiation_status: "Pending" })
        .eq("id", booking.id)

      toast.success(isCounter ? "Counter proposal sent" : "Negotiation started")
      setAmount("")
      setComments("")
      fetchNegotiationThreads()
      onSuccess()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptNegotiation = async (threadId: string) => {
    setLoading(true)

    try {
      const { error } = await supabase.from("negotiation_threads").update({ status: "Accepted" }).eq("id", threadId)

      if (error) throw error

      await supabase
        .from("bookings")
        .update({ status: "Approved", negotiation_status: "Accepted" })
        .eq("id", booking.id)

      toast.success("Negotiation accepted - booking approved")
      onSuccess()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Negotiation Thread - {booking.job_id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Negotiation History */}
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {loadingThreads ? (
              <p className="text-sm text-muted-foreground">Loading negotiation history...</p>
            ) : threads.length > 0 ? (
              threads.map((thread) => (
                <Card key={thread.id} className="border-l-4 border-l-accent">
                  <CardContent className="pt-4 space-y-3">
                    {/* Initial Proposal */}
                    {thread.proposed_amount && (
                      <div className="space-y-2 pb-3 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-accent" />
                            <span className="text-sm font-medium">{thread.proposed_by?.full_name || "System"}</span>
                          </div>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                            Proposed
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="font-semibold">₦{Number(thread.proposed_amount).toLocaleString()}</span>
                        </div>
                        {thread.comments && <p className="text-sm text-muted-foreground">{thread.comments}</p>}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(thread.created_at).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* Counter Proposal */}
                    {thread.counter_amount && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium">
                              {thread.counter_by?.full_name || "System"} - Countered
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              thread.status === "Accepted"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-orange-500/10 text-orange-500"
                            }
                          >
                            {thread.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="font-semibold">₦{Number(thread.counter_amount).toLocaleString()}</span>
                        </div>
                        {thread.counter_comments && (
                          <p className="text-sm text-muted-foreground">{thread.counter_comments}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(thread.updated_at).toLocaleString()}
                        </div>

                        {/* Accept Button */}
                        {thread.status !== "Accepted" && (
                          <Button
                            size="sm"
                            onClick={() => handleAcceptNegotiation(thread.id)}
                            disabled={loading}
                            className="mt-2 bg-green-600 hover:bg-green-700 w-full"
                          >
                            {loading ? "Accepting..." : "Accept This Offer"}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No negotiation history yet</p>
            )}
          </div>

          {/* New Negotiation Input */}
          {!threads.some((t) => t.status === "Accepted") && (
            <Card className="border-accent/30">
              <CardHeader>
                <CardTitle className="text-base">
                  {threads.length > 0 && !threads[0]?.counter_amount
                    ? "Counter Proposal"
                    : threads.length > 0 && threads[0]?.counter_amount && threads[0]?.status !== "Accepted"
                      ? "Your Response"
                      : "Start Negotiation"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Proposed Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount in NGN"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Comments</Label>
                  <Textarea
                    placeholder="Add your comments or reasoning..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={() => handleNegotiate(threads.length > 0 && !threads[0]?.counter_amount ? true : false)}
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  {loading
                    ? "Sending..."
                    : threads.length > 0 && !threads[0]?.counter_amount
                      ? "Send Counter Proposal"
                      : threads.length > 0 && threads[0]?.counter_amount && threads[0]?.status !== "Accepted"
                        ? "Send Response"
                        : "Start Negotiation"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
