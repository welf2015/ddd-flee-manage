"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, MapPin, Loader2 } from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import { createBooking } from "@/app/actions/bookings"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import useSWR from "swr"
import type mapboxgl from "mapbox-gl"
import Script from "next/script"

const MAPBOX_TOKEN = "pk.eyJ1IjoiZGFtaWxvbGFqYW1lcyIsImEiOiJjbWk3bzRuZXUwMmx6MndyMWduZmcwNG9pIn0.lTWQddjYoQjt3w-CUEc81w"

export function CreateBookingDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
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
  const [requiresWaybill, setRequiresWaybill] = useState(false)
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

  const router = useRouter()
  const supabase = createClient()

  const { data: driversWithRatings = [] } = useSWR(open ? "drivers-with-ratings" : null, async () => {
    const { data: drivers } = await supabase.from("drivers").select("*").eq("status", "Active").order("full_name")
    if (!drivers) return []

    const driversWithAvgRatings = await Promise.all(
      drivers.map(async (driver) => {
        const { data: ratings } = await supabase
          .from("bookings")
          .select("driver_rating, punctuality_rating, vehicle_condition_rating, communication_rating")
          .eq("assigned_driver_id", driver.id)
          .not("driver_rating", "is", null)

        if (!ratings || ratings.length === 0) {
          return { ...driver, avgRating: null, totalRatings: 0 }
        }

        const allRatings = ratings
          .flatMap((r) => [r.driver_rating, r.punctuality_rating, r.vehicle_condition_rating, r.communication_rating])
          .filter(Boolean)

        const avgRating =
          allRatings.length > 0
            ? (allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length).toFixed(1)
            : null

        return {
          ...driver,
          avgRating: avgRating ? Number.parseFloat(avgRating) : null,
          totalRatings: ratings.length,
        }
      }),
    )

    return driversWithAvgRatings.sort((a, b) => {
      if (a.avgRating && b.avgRating) return b.avgRating - a.avgRating
      if (a.avgRating) return -1
      if (b.avgRating) return 1
      return a.full_name.localeCompare(b.full_name)
    })
  })

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=address,poi,place`,
      )
      const data = await response.json()
      setSuggestions(data.features || [])
    } catch (error) {
      console.error("Error fetching Mapbox suggestions:", error)
      setSuggestions([])
    }
  }, [])

  useEffect(() => {
    if (activeInput) {
      const value = destinations[activeInput.index][activeInput.field]
      const timeoutId = setTimeout(() => fetchSuggestions(value), 300)
      return () => clearTimeout(timeoutId)
    }
  }, [activeInput, destinations, fetchSuggestions])

  const handleSelectSuggestion = (feature: any) => {
    if (!activeInput) return

    const { index, field } = activeInput
    const updated = [...destinations]
    updated[index][field] = feature.place_name

    const [lng, lat] = feature.center
    if (field === "from") {
      updated[index].fromLat = lat
      updated[index].fromLng = lng
    } else {
      updated[index].toLat = lat
      updated[index].toLng = lng
    }

    setDestinations(updated)
    setSuggestions([])
    setActiveInput(null)
  }

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!address) return null

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`,
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center
        return { lat, lng }
      }
      return null
    } catch (error) {
      console.error("Error geocoding address:", error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const updatedDestinations = await Promise.all(
      destinations.map(async (dest) => {
        const updated = { ...dest }

        // Geocode 'from' address if no coordinates
        if (dest.from && (!dest.fromLat || !dest.fromLng)) {
          const coords = await geocodeAddress(dest.from)
          if (coords) {
            updated.fromLat = coords.lat
            updated.fromLng = coords.lng
          }
        }

        // Geocode 'to' address if no coordinates
        if (dest.to && (!dest.toLat || !dest.toLng)) {
          const coords = await geocodeAddress(dest.to)
          if (coords) {
            updated.toLat = coords.lat
            updated.toLng = coords.lng
          }
        }

        return updated
      }),
    )

    setDestinations(updatedDestinations)

    const formData = new FormData(e.currentTarget)

    const route = updatedDestinations.map((d) => `${d.from} → ${d.to}`).join(", ")
    formData.set("route", route)
    formData.set("requires_waybill", requiresWaybill.toString())

    if (updatedDestinations[0].fromLat && updatedDestinations[0].fromLng) {
      formData.set("pickup_lat", updatedDestinations[0].fromLat.toString())
      formData.set("pickup_lng", updatedDestinations[0].fromLng.toString())
      formData.set("pickup_address", updatedDestinations[0].from)
    }

    const lastDest = updatedDestinations[updatedDestinations.length - 1]
    if (lastDest.toLat && lastDest.toLng) {
      formData.set("delivery_lat", lastDest.toLat.toString())
      formData.set("delivery_lng", lastDest.toLng.toString())
      formData.set("delivery_address", lastDest.to)
    }

    try {
      const result = await createBooking(formData)

      if (result.success) {
        toast.success("Booking created successfully")
        setOpen(false)
        router.refresh()
        ;(e.target as HTMLFormElement).reset()
        setDestinations([{ from: "", to: "", fromLat: null, fromLng: null, toLat: null, toLng: null }])
        setRequiresWaybill(false)
        setClientSearchTerm("")
      } else {
        toast.error(result.error || "Failed to create booking")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const addDestination = () => {
    setDestinations([...destinations, { from: "", to: "", fromLat: null, fromLng: null, toLat: null, toLng: null }])
  }

  const removeDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index))
  }

  const updateDestination = (index: number, field: "from" | "to", value: string) => {
    const updated = [...destinations]
    updated[index][field] = value
    setDestinations(updated)
    setActiveInput({ index, field })
  }

  const selectClient = (client: any) => {
    const form = document.querySelector("form") as HTMLFormElement
    if (form) {
      ;(form.querySelector('[name="company_name"]') as HTMLInputElement).value = client.company_name || ""
      ;(form.querySelector('[name="client_name"]') as HTMLInputElement).value = client.name || ""
      ;(form.querySelector('[name="client_contact"]') as HTMLInputElement).value = client.phone || ""
      ;(form.querySelector('[name="client_email"]') as HTMLInputElement).value = client.email || ""
      ;(form.querySelector('[name="client_address"]') as HTMLInputElement).value = client.address || ""
    }
    setClientSearchTerm(client.company_name || client.name)
    setShowClientSuggestions(false)
  }

  useEffect(() => {
    if (!open || !mapContainer.current || !mapboxLoaded) return

    const initializeMap = async () => {
      try {
        const mapboxgl = window.mapboxgl

        if (!mapboxgl) {
          console.error("Mapbox GL JS not loaded")
          setMapError("Map library not loaded")
          return
        }

        mapboxgl.accessToken = MAPBOX_TOKEN

        if (!mapboxgl.workerUrl) {
          const workerUrl = "https://api.mapbox.com/mapbox-gl-js/v3.16.0/mapbox-gl-csp-worker.js"
          try {
            const response = await fetch(workerUrl)
            if (!response.ok) throw new Error("Failed to fetch worker")
            const workerScript = await response.text()
            const blob = new Blob([workerScript], { type: "application/javascript" })
            mapboxgl.workerUrl = window.URL.createObjectURL(blob)
          } catch (error) {
            console.error("Error loading Mapbox worker:", error)
            mapboxgl.workerUrl = workerUrl
          }
        }

        if (!map.current) {
          try {
            map.current = new mapboxgl.Map({
              container: mapContainer.current!,
              style: "mapbox://styles/mapbox/streets-v12",
              center: [3.3792, 6.5244], // Default to Lagos, Nigeria
              zoom: 10,
            })

            map.current.on("error", (e) => {
              console.error("Mapbox error:", e)
              setMapError(`Map error: ${e.error.message}`)
            })
          } catch (err: any) {
            console.error("Error creating map instance:", err)
            setMapError(err.message)
            return
          }
        }

        const currentMap = map.current

        markers.current.forEach((marker) => marker.remove())
        markers.current = []

        const coordinates: [number, number][] = []

        destinations.forEach((dest) => {
          if (dest.fromLng && dest.fromLat) {
            const el = document.createElement("div")
            el.className = "w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg"
            const marker = new mapboxgl.Marker(el).setLngLat([dest.fromLng, dest.fromLat]).addTo(currentMap)
            markers.current.push(marker)
            coordinates.push([dest.fromLng, dest.fromLat])
          }
          if (dest.toLng && dest.toLat) {
            const el = document.createElement("div")
            el.className = "w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg"
            const marker = new mapboxgl.Marker(el).setLngLat([dest.toLng, dest.toLat]).addTo(currentMap)
            markers.current.push(marker)
            coordinates.push([dest.toLng, dest.toLat])
          }
        })

        if (coordinates.length > 0) {
          const bounds = new mapboxgl.LngLatBounds()
          coordinates.forEach((coord) => bounds.extend(coord as [number, number]))
          currentMap.fitBounds(bounds, { padding: 50 })

          if (currentMap.getSource("route")) {
            ;(currentMap.getSource("route") as mapboxgl.GeoJSONSource).setData({
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: coordinates,
              },
            })
          } else {
            if (currentMap.isStyleLoaded()) {
              addRouteLayer(currentMap, coordinates)
            } else {
              currentMap.on("load", () => addRouteLayer(currentMap, coordinates))
            }
          }
        }
      } catch (error: any) {
        console.error("Error initializing map:", error)
        setMapError(error.message)
      }
    }

    const addRouteLayer = (map: mapboxgl.Map, coordinates: [number, number][]) => {
      if (map.getSource("route")) return

      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
        },
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

  return (
    <>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.16.0/mapbox-gl.css" rel="stylesheet" />
      <Script
        src="https://api.mapbox.com/mapbox-gl-js/v3.16.0/mapbox-gl.js"
        onLoad={() => setMapboxLoaded(true)}
        onError={() => setMapError("Failed to load Mapbox script")}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-accent hover:bg-accent/90">
            <Plus className="mr-2 h-4 w-4" />
            Create Booking
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-md bg-background/95">
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDescription>Add a new truck booking request to the system</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="text-sm text-muted-foreground">Job ID will be automatically generated</div>

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
                <Input id="client_name" name="client_name" placeholder="Contact person name" required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="client_address">Client/Company Address</Label>
                <Input id="client_address" name="client_address" placeholder="Full address" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="client_contact">Client Phone</Label>
                  <Input id="client_contact" name="client_contact" placeholder="Phone number" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="client_email">Client Email</Label>
                  <Input id="client_email" name="client_email" type="email" placeholder="Email (optional)" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                <div className="col-span-2">
                  <Label className="text-base font-semibold">Destination Contact</Label>
                  <p className="text-sm text-muted-foreground">Person to contact at delivery location</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="destination_contact_name">Contact Name</Label>
                  <Input id="destination_contact_name" name="destination_contact_name" placeholder="Recipient name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="destination_contact_phone">Contact Phone</Label>
                  <Input
                    id="destination_contact_phone"
                    name="destination_contact_phone"
                    placeholder="Recipient phone"
                  />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="number_of_loads">Number of Loads</Label>
                  <Input id="number_of_loads" name="number_of_loads" type="number" placeholder="1" required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="proposed_client_budget">Proposed Budget (₦)</Label>
                  <Input
                    id="proposed_client_budget"
                    name="proposed_client_budget"
                    type="number"
                    placeholder="500000"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="timeline">Timeline</Label>
                <Select name="timeline" required>
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
                <Label htmlFor="request_details">Request Details</Label>
                <Textarea
                  id="request_details"
                  name="request_details"
                  placeholder="Describe the cargo, special requirements, etc."
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires_waybill"
                  checked={requiresWaybill}
                  onCheckedChange={(checked) => setRequiresWaybill(checked as boolean)}
                />
                <label
                  htmlFor="requires_waybill"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  This job requires waybill documentation
                </label>
              </div>

              <input type="hidden" name="status" value="Open" />

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
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90">
                {loading ? "Creating..." : "Create Booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
