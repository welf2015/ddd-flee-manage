"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, MapPin, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateBooking } from "@/app/actions/bookings"
import { createClient } from "@/lib/supabase/client"
import Script from "next/script"
import type mapboxgl from "mapbox-gl"
import { useRouter } from "next/navigation"
import type { SearchResult } from "@/types/search-result"

const MAPBOX_TOKEN = "pk.eyJ1IjoiZGFtaWxvbGFqYW1lcyIsImEiOiJjbWk3bzRuZXUwMmx6MndyMWduZmcwNG9pIn0.lTWQddjYoQjt3w-CUEc81w"

type UpdateJobDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: any
}

export function UpdateJobDetailsDialog({ open, onOpenChange, booking }: UpdateJobDetailsDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clientSuggestions, setClientSuggestions] = useState<any[]>([])
  const [showClientSuggestions, setShowClientSuggestions] = useState(false)
  const [clientSearchTerm, setClientSearchTerm] = useState("")

  // Mapbox state
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [mapboxLoaded, setMapboxLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [activeInput, setActiveInput] = useState<{ index: number; field: "from" | "to" } | null>(null)
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  const [destinations, setDestinations] = useState([
    {
      from: "",
      to: "",
      fromLat: null as number | null,
      fromLng: null as number | null,
      toLat: null as number | null,
      toLng: null as number | null,
    },
  ])

  const [formData, setFormData] = useState({
    company_name: booking.company_name || "",
    client_name: booking.client_name || "",
    pickup_location: booking.pickup_location || "",
    dropoff_location: booking.dropoff_location || "",
    request_details: booking.request_details || "",
    route: booking.route || "",
    timeline: booking.timeline || "24-48 hours",
    number_of_loads: booking.number_of_loads?.toString() || "1",
    budget: booking.proposed_client_budget?.toString() || "",
    job_date: booking.job_date ? new Date(booking.job_date).toISOString().split("T")[0] : "",
  })

  const supabase = createClient()

  useEffect(() => {
    if (!open) return

    const searchClients = async () => {
      if (clientSearchTerm.length < 2) {
        setClientSuggestions([])
        setShowClientSuggestions(false)
        return
      }

      const { data } = await supabase
        .from("clients")
        .select("*")
        .or(`company_name.ilike.%${clientSearchTerm}%,name.ilike.%${clientSearchTerm}%`)
        .limit(5)

      if (data) {
        setClientSuggestions(data)
        setShowClientSuggestions(data.length > 0)
      }
    }

    const timeoutId = setTimeout(searchClients, 300)
    return () => clearTimeout(timeoutId)
  }, [clientSearchTerm, open, supabase])

  useEffect(() => {
    if (booking && open) {
      // Parse route into destinations
      const routeParts = booking.route?.split("→").map((s: string) => s.trim()) || []
      const initialDestinations = []

      if (routeParts.length >= 2) {
        for (let i = 0; i < routeParts.length - 1; i++) {
          initialDestinations.push({
            from: routeParts[i] || "",
            to: routeParts[i + 1] || "",
            fromLat: booking.pickup_lat || null,
            fromLng: booking.pickup_lng || null,
            toLat: booking.delivery_lat || null,
            toLng: booking.delivery_lng || null,
          })
        }
      } else {
        initialDestinations.push({
          from: booking.pickup_address || "",
          to: booking.delivery_address || "",
          fromLat: booking.pickup_lat || null,
          fromLng: booking.pickup_lng || null,
          toLat: booking.delivery_lat || null,
          toLng: booking.delivery_lng || null,
        })
      }

      setDestinations(
        initialDestinations.length > 0
          ? initialDestinations
          : [
            {
              from: "",
              to: "",
              fromLat: null,
              fromLng: null,
              toLat: null,
              toLng: null,
            },
          ],
      )

      setFormData({
        company_name: booking.company_name || "",
        client_name: booking.client_name || "",
        pickup_location: booking.pickup_location || "",
        dropoff_location: booking.dropoff_location || "",
        request_details: booking.request_details || "",
        route: booking.route || "",
        timeline: booking.timeline || "24-48 hours",
        number_of_loads: booking.number_of_loads?.toString() || "1",
        budget: booking.proposed_client_budget?.toString() || "",
        job_date: booking.job_date ? new Date(booking.job_date).toISOString().split("T")[0] : "",
      })

      setClientSearchTerm(booking.company_name || booking.client_name || "")
    }
  }, [booking, open])

  const selectClient = (client: any) => {
    setFormData({
      ...formData,
      ...formData,
      company_name: client.company_name || client.name || "",
      client_name: client.name || "",
      // client_address and client_contact are not in formData state
    })
    setClientSearchTerm(client.company_name || client.name || "")
    setShowClientSuggestions(false)
  }

  const updateDestination = (index: number, field: "from" | "to", value: string) => {
    const updated = [...destinations]
    updated[index] = { ...updated[index], [field]: value }
    setDestinations(updated)

    // Update route string
    const routeString = updated
      .filter((d) => d.from || d.to)
      .map((d) => `${d.from} → ${d.to}`)
      .join(" → ")
    setFormData({ ...formData, route: routeString })
  }

  const addDestination = () => {
    setDestinations([
      ...destinations,
      {
        from: "",
        to: "",
        fromLat: null,
        fromLng: null,
        toLat: null,
        toLng: null,
      },
    ])
  }

  const removeDestination = (index: number) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter((_, i) => i !== index))
    }
  }

  const searchPlaces = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=NG&limit=5`,
      )
      const data = await response.json()
      setSuggestions(data.features || [])
    } catch (error) {
      console.error("Error searching places:", error)
      setSuggestions([])
    }
  }

  const handleSelectSuggestion = (suggestion: any) => {
    if (!activeInput) return

    const [lng, lat] = suggestion.center
    const placeName = suggestion.place_name

    const updated = [...destinations]
    const index = activeInput.index
    const field = activeInput.field

    updated[index] = {
      ...updated[index],
      [field]: placeName,
      [`${field}Lat`]: lat,
      [`${field}Lng`]: lng,
    }

    setDestinations(updated)
    setSuggestions([])
    setActiveInput(null)

    // Update pickup/delivery addresses for first destination
    if (index === 0) {
      if (field === "from") {
        setFormData({
          ...formData,
          pickup_location: placeName,
        })
      } else {
        setFormData({
          ...formData,
          dropoff_location: placeName,
        })
      }
    }
  }

  useEffect(() => {
    if (activeInput) {
      const value = destinations[activeInput.index][activeInput.field]
      searchPlaces(value)
    }
  }, [activeInput, destinations])

  // Mapbox initialization
  useEffect(() => {
    if (!open || !mapboxLoaded || !mapContainer.current) return

    const initializeMap = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default
        mapboxgl.accessToken = MAPBOX_TOKEN

        if (map.current) {
          map.current.remove()
        }

        const coordinates: [number, number][] = []
        destinations.forEach((dest) => {
          if (dest.fromLat && dest.fromLng) {
            coordinates.push([dest.fromLng, dest.fromLat])
          }
          if (dest.toLat && dest.toLng) {
            coordinates.push([dest.toLng, dest.toLat])
          }
        })

        const center: [number, number] = coordinates.length > 0 ? coordinates[0] : [3.3792, 6.5244] // Default to Lagos

        const currentMap = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center,
          zoom: coordinates.length > 0 ? 10 : 6,
        })

        map.current = currentMap

        currentMap.on("load", () => {
          // Clear existing markers
          markers.current.forEach((marker) => marker.remove())
          markers.current = []

          // Add markers for each coordinate
          coordinates.forEach((coord, index) => {
            const marker = new mapboxgl.Marker({
              color: index === 0 ? "#3b82f6" : index === coordinates.length - 1 ? "#ef4444" : "#10b981",
            })
              .setLngLat(coord)
              .addTo(currentMap)

            markers.current.push(marker)
          })

          // Draw route line if we have coordinates
          if (coordinates.length >= 2) {
            const lineGeometry = {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates,
              },
            }
            if (currentMap.getSource("route")) {
              ; (currentMap.getSource("route") as mapboxgl.GeoJSONSource).setData(lineGeometry)
            } else {
              if (currentMap.isStyleLoaded()) {
                addRouteLayer(currentMap, lineGeometry)
              } else {
                currentMap.on("load", () => addRouteLayer(currentMap, lineGeometry))
              }
            }
          }
        })
      } catch (error: any) {
        console.error("Error initializing map:", error)
        setMapError(error.message)
      }
    }

    const addRouteLayer = (map: mapboxgl.Map, routeGeometry: any) => {
      if (map.getSource("route")) return

      map.addSource("route", {
        type: "geojson",
        data: routeGeometry,
      })
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 4,
        },
      })
    }

    initializeMap()
  }, [open, destinations, mapboxLoaded])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      console.log("[v0] 📝 Starting job update submission")

      // Ensure route is constructed from destinations
      const routeString = destinations
        .filter((d) => d.from || d.to)
        .map((d) => `${d.from} → ${d.to}`)
        .join(" → ")

      console.log("[v0] Route constructed:", routeString)

      // Update pickup/dropoff addresses from first/last destination
      const firstDest = destinations[0]
      const lastDest = destinations[destinations.length - 1]

      const finalPickupLocation = firstDest?.from || formData.pickup_location
      const finalDropoffLocation = lastDest?.to || formData.dropoff_location
      const finalPickupLat = firstDest?.fromLat || booking.pickup_lat
      const finalPickupLng = firstDest?.fromLng || booking.pickup_lng
      const finalDropoffLat = lastDest?.toLat || booking.delivery_lat
      const finalDropoffLng = lastDest?.toLng || booking.delivery_lng

      const form = new FormData()
      form.append("company_name", formData.company_name)
      form.append("client_name", formData.client_name)
      form.append("pickup_location", finalPickupLocation)
      form.append("dropoff_location", finalDropoffLocation)
      if (finalPickupLat !== null) form.append("pickup_lat", finalPickupLat.toString())
      if (finalPickupLng !== null) form.append("pickup_lng", finalPickupLng.toString())
      if (finalDropoffLat !== null) form.append("dropoff_lat", finalDropoffLat.toString())
      if (finalDropoffLng !== null) form.append("dropoff_lng", finalDropoffLng.toString())
      form.append("request_details", formData.request_details)
      form.append("route", routeString || formData.route)
      form.append("timeline", formData.timeline)
      form.append("number_of_loads", formData.number_of_loads)
      form.append("number_of_loads", formData.number_of_loads)
      form.append("budget", formData.budget)
      form.append("job_date", formData.job_date)

      console.log("[v0] 📝 Form data prepared:", {
        route: routeString || formData.route,
        pickup: finalPickupLocation,
        delivery: finalDropoffLocation,
        coordinates: {
          pickup: { lat: finalPickupLat, lng: finalPickupLng },
          delivery: { lat: finalDropoffLat, lng: finalDropoffLng },
        },
        company: formData.company_name,
        client: formData.client_name,
        budget: formData.budget,
      })

      console.log("[v0] Calling updateBooking with bookingId:", booking.id)
      const result = await updateBooking(booking.id, form)
      console.log("[v0] updateBooking result:", result)

      if (result.success) {
        toast.success("Job details updated successfully")
        router.push("/bookings")
        onOpenChange(false)
      } else {
        console.error("[v0] Update failed:", result.error)
        toast.error(result.error || "Failed to update job details")
      }
    } catch (error) {
      console.error("[v0] Error updating job details:", error)
      toast.error("An error occurred while updating job details")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.16.0/mapbox-gl.css" rel="stylesheet" />
      <Script
        src="https://api.mapbox.com/mapbox-gl-js/v3.16.0/mapbox-gl.js"
        onLoad={() => setMapboxLoaded(true)}
        onError={() => setMapError("Failed to load Mapbox script")}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-md bg-background/95">
          <DialogHeader>
            <DialogTitle>Update Job Details</DialogTitle>
            <DialogDescription>Update booking information and route details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2 relative">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  placeholder="Company name (optional)"
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  autoComplete="off"
                />
                {showClientSuggestions && clientSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                    {clientSuggestions.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => selectClient(client)}
                        className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{client.company_name || client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  name="client_name"
                  placeholder="Contact person name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pickup_location">Pickup Location</Label>
                <Input
                  id="pickup_location"
                  name="pickup_location"
                  placeholder="Full address"
                  value={formData.pickup_location}
                  onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dropoff_location">Dropoff Location</Label>
                <Input
                  id="dropoff_location"
                  name="dropoff_location"
                  placeholder="Full address"
                  value={formData.dropoff_location}
                  onChange={(e) => setFormData({ ...formData, dropoff_location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="request_details">Request Details</Label>
                  <Textarea
                    id="request_details"
                    name="request_details"
                    placeholder="Describe the cargo, special requirements, etc."
                    rows={4}
                    value={formData.request_details}
                    onChange={(e) => setFormData({ ...formData, request_details: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <Select
                    value={formData.timeline}
                    onValueChange={(value) => setFormData({ ...formData, timeline: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4 hours">4 Hours</SelectItem>
                      <SelectItem value="5 hours">5 Hours</SelectItem>
                      <SelectItem value="8 hours">8 Hours</SelectItem>
                      <SelectItem value="1 day">1 Day</SelectItem>
                      <SelectItem value="2 days">2 Days</SelectItem>
                      <SelectItem value="3 days">3 Days</SelectItem>
                      <SelectItem value="4 days">4 Days</SelectItem>
                      <SelectItem value="5 days">5 Days</SelectItem>
                      <SelectItem value="1 week">1 Week</SelectItem>
                      <SelectItem value="2 weeks">2 Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="number_of_loads">Number of Loads</Label>
                  <Input
                    id="number_of_loads"
                    name="number_of_loads"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={formData.number_of_loads}
                    onChange={(e) => setFormData({ ...formData, number_of_loads: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="job_date">Job Date</Label>
                  <Input
                    id="job_date"
                    name="job_date"
                    type="date"
                    value={formData.job_date}
                    onChange={(e) => setFormData({ ...formData, job_date: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Effective date for reports</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="budget">Budget (₦)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 500000"
                    value={formData.budget || ""}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Total budget for this job</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Route (Stops)</Label>
                {destinations.map((dest, index) => (
                  <div key={index} className="flex gap-2 items-center relative">
                    <div className="flex-1 relative">
                      <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        onFocus={() => setActiveInput({ index, field: "from" })}
                        placeholder="From (start typing address...)"
                        value={dest.from}
                        onChange={(e) => updateDestination(index, "from", e.target.value)}
                        className="pl-8"
                        required
                        autoComplete="off"
                      />
                      {activeInput?.index === index && activeInput?.field === "from" && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 bg-background border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                          {suggestions.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                              onClick={() => handleSelectSuggestion(suggestion)}
                            >
                              {suggestion.place_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex-1 relative">
                      <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        onFocus={() => setActiveInput({ index, field: "to" })}
                        placeholder="To (start typing address...)"
                        value={dest.to}
                        onChange={(e) => updateDestination(index, "to", e.target.value)}
                        className="pl-8"
                        required
                        autoComplete="off"
                      />
                      {activeInput?.index === index && activeInput?.field === "to" && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 bg-background border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                          {suggestions.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                              onClick={() => handleSelectSuggestion(suggestion)}
                            >
                              {suggestion.place_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {destinations.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeDestination(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDestination}
                  className="w-fit bg-transparent"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Add Stop
                </Button>
                {destinations.length > 0 && destinations[0].from && (
                  <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted/50 rounded-md">
                    <p className="font-medium mb-1">Route Preview:</p>
                    <p>
                      {destinations[0].from}
                      {destinations
                        .slice(1)
                        .map((d, i) => d.from && ` → ${d.from}`)
                        .join("")}
                      {destinations[destinations.length - 1].to && ` → ${destinations[destinations.length - 1].to}`}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 h-64 w-full rounded-md border overflow-hidden relative bg-muted">
                {!mapboxLoaded && !mapError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Loading map...</span>
                    </div>
                  </div>
                )}
                {mapError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 z-10 p-4 text-center">
                    <div className="text-sm text-destructive">
                      <p className="font-semibold">Map failed to load</p>
                      <p className="text-xs mt-1">{mapError}</p>
                    </div>
                  </div>
                )}
                <div ref={mapContainer} className="w-full h-full" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-accent hover:bg-accent/90">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
