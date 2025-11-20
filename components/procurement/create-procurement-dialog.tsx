"use client"
import { CreateProcurementForm } from "./create-procurement-form"

type CreateProcurementDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProcurementDialog({ open, onOpenChange }: CreateProcurementDialogProps) {
  return <CreateProcurementForm open={open} onOpenChange={onOpenChange} />
}
