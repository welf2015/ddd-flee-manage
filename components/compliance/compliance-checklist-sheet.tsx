'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Printer } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils/time-format'

interface ComplianceChecklistSheetProps {
  vehicle: {
    id: string
    vehicle_number: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CHECKLIST_ITEMS = [
  { key: 'proof_of_ownership', label: 'Proof of Ownership', hasDates: true },
  { key: 'vehicle_insurance', label: 'Vehicle Insurance', hasDates: true },
  { key: 'vehicle_license', label: 'Vehicle License', hasDates: true },
  { key: 'customs_documents', label: 'Customs documents and Duty payments (Taxes/Levy)', hasDates: true },
  { key: 'number_plate', label: 'Number plate Number Allocation', hasDates: true },
  { key: 'road_worthiness', label: 'Road Worthiness Certificate', hasDates: true },
  { key: 'hackney_permit', label: 'Hackney/State Carriage Permit', hasDates: true },
  { key: 'cmr_registration', label: 'Central Motor Registry (e-CMR)', hasDates: true },
  { key: 'local_govt_permit', label: 'Local government permit', hasDates: true },
  { key: 'npa_registration', label: 'NPA Truck registration', hasDates: true },
  { key: 'heavy_duty_permit', label: 'Heavy Duty permit', hasDates: true },
  { key: 'tt_permit', label: 'T & T permit', hasDates: true },
  { key: 'commercial_parking', label: 'Commercial Parking permit', hasDates: true },
  { key: 'cdl_license', label: "Commercial Driver's License (CDL)", hasDates: true },
  { key: 'driver_license', label: "Driver's License", hasDates: true },
  { key: 'lasdri_card', label: 'Lagos State Driver\'s institute (LASDRI) Card', hasDates: true },
  { key: 'lasrra_card', label: 'LASRRA Card', hasDates: true },
  { key: 'medical_cert', label: 'Medical Certification', hasDates: true },
  { key: 'fire_extinguisher', label: 'Fire Extinguisher', hasDates: true },
  { key: 'reflective_triangles', label: 'Reflective Triangles', hasDates: false },
  { key: 'jumpstart_cables', label: 'Jumpstart cables', hasDates: false },
  { key: 'seatbelts', label: 'Seatbelts used', hasDates: false },
  { key: 'spare_tire', label: 'Spare tire present & in good condition', hasDates: false },
  { key: 'jack_spanner', label: 'Jack & Wheel Spanner', hasDates: false },
  { key: 'first_aid_kit', label: 'First Aid kit', hasDates: true },
  { key: 'phone_usage', label: 'Phone usage', hasDates: false },
  { key: 'speed_limit', label: 'Speed Limit Observed', hasDates: false },
  { key: 'pretrip_check', label: 'Pre-trip check done', hasDates: false },
  { key: 'posttrip_check', label: 'Post trip done', hasDates: false },
  { key: 'violations_logged', label: 'Violations Logged', hasDates: false },
]

export function ComplianceChecklistSheet({ vehicle, open, onOpenChange }: ComplianceChecklistSheetProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [checklistData, setChecklistData] = useState<any>({})
  const [userData, setUserData] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      loadChecklist()
      loadUserData()
    }
  }, [open, vehicle.id])

  const loadUserData = async () => {
    const { data } = await supabase.from('profiles').select('full_name').single()
    setUserData(data)
  }

  const loadChecklist = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('vehicle_compliance_checklist')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (data) setChecklistData(data)
    } catch (error: any) {
      console.error('[v0] Failed to load checklist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      
      const payload = {
        vehicle_id: vehicle.id,
        ...checklistData,
        last_updated_at: new Date().toISOString(),
        last_updated_by: user.user?.id,
      }

      const { error } = await supabase
        .from('vehicle_compliance_checklist')
        .upsert(payload, { onConflict: 'vehicle_id' })

      if (error) throw error

      toast({
        title: 'Checklist Saved',
        description: `Compliance checklist for ${vehicle.vehicle_number} has been updated.`,
      })

      onOpenChange(false)
    } catch (error: any) {
      console.error('[v0] Save checklist error:', error)
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save compliance checklist',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const calculateCompletion = () => {
    let completed = 0
    let total = CHECKLIST_ITEMS.length

    CHECKLIST_ITEMS.forEach((item) => {
      if (checklistData[item.key] === 'Yes') completed++
    })

    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  const updateField = (key: string, value: any) => {
    setChecklistData((prev: any) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-full md:w-[90%] lg:w-[85%] xl:w-[80%] overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  const completionPercentage = calculateCompletion()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-full md:w-[90%] lg:w-[85%] xl:w-[80%] overflow-y-auto">
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        <SheetHeader className="mb-6 no-print">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl">
              Compliance Checklist - {vehicle.vehicle_number}
            </SheetTitle>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </SheetHeader>

        <div className="mb-4 p-4 bg-muted/50 rounded-lg no-print">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Completion Status</span>
            <div className="flex items-center gap-2">
              <div className="font-mono text-lg">
                {Array.from({ length: 20 }, (_, i) => {
                  const filledBars = Math.round((completionPercentage / 100) * 20)
                  const color = completionPercentage >= 80 ? 'text-accent' : completionPercentage >= 50 ? 'text-yellow-500' : 'text-red-500'
                  return (
                    <span key={i} className={i < filledBars ? color : 'text-muted-foreground'}>
                      {i < filledBars ? '|' : '·'}
                    </span>
                  )
                })}
              </div>
              <span className="text-sm font-semibold">{completionPercentage}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 print-content">
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold">Vehicle Compliance Checklist</h1>
            <p className="text-lg">Vehicle: {vehicle.vehicle_number}</p>
            <p className="text-sm text-muted-foreground">Generated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="border-2 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-3 text-left font-semibold text-sm min-w-[250px]">
                      Compliance Item
                    </th>
                    <th className="border p-3 text-center font-semibold text-sm w-[120px]">
                      Valid & Verified
                    </th>
                    <th className="border p-3 text-left font-semibold text-sm min-w-[200px]">
                      Remarks
                    </th>
                    <th className="border p-3 text-center font-semibold text-sm w-[150px]">
                      Issue Date
                    </th>
                    <th className="border p-3 text-center font-semibold text-sm w-[150px]">
                      Expiring Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CHECKLIST_ITEMS.map((item) => (
                    <tr key={item.key} className="hover:bg-muted/30">
                      <td className="border p-3 text-sm">{item.label}</td>
                      <td className="border p-2">
                        <Select
                          value={checklistData[item.key] || ''}
                          onValueChange={(value) => updateField(item.key, value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                            <SelectItem value="NA">N/A</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border p-2">
                        <Textarea
                          value={checklistData[`${item.key}_remarks`] || ''}
                          onChange={(e) => updateField(`${item.key}_remarks`, e.target.value)}
                          placeholder="Add remarks..."
                          className="min-h-[36px] h-9 text-sm resize-none"
                          rows={1}
                        />
                      </td>
                      <td className="border p-2">
                        {item.hasDates && (
                          <Input
                            type="date"
                            value={checklistData[`${item.key}_issue_date`] || ''}
                            onChange={(e) => updateField(`${item.key}_issue_date`, e.target.value)}
                            className="h-9 text-sm"
                          />
                        )}
                      </td>
                      <td className="border p-2">
                        {item.hasDates && (
                          <Input
                            type="date"
                            value={checklistData[`${item.key}_expiry_date`] || ''}
                            onChange={(e) => updateField(`${item.key}_expiry_date`, e.target.value)}
                            className="h-9 text-sm"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {checklistData.last_updated_at && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg text-sm">
              <span className="text-muted-foreground">
                Last updated: {formatRelativeTime(new Date(checklistData.last_updated_at))}
              </span>
              {userData && (
                <span className="text-muted-foreground">
                  Updated by: {userData.full_name}
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t no-print">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Checklist'
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
