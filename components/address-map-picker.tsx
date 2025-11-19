"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Search, MapPin } from 'lucide-react'

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
)

type AddressMapPickerProps = {
  pickupAddress: string
  deliveryAddress: string
  onPickupSelect: (address: string, lat: number, lng: number) => void
  onDeliverySelect: (address: string, lat: number, lng: number) => void
}

export function AddressMapPicker({
  pickupAddress,
  deliveryAddress,
  onPickupSelect,
  onDeliverySelect,
}: AddressMapPickerProps) {
  const [pickupSearch, setPickupSearch] = useState(pickupAddress)
  const [deliverySearch, setDeliverySearch] = useState(deliveryAddress)
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null)
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null)
  const [searching, setSearching] = useState(false)

  const searchAddress = async (query: string, isPickup: boolean) => {
    if (!query.trim()) return

    setSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ng&limit=1`,
      )
      const data = await response.json()

      if (data[0]) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        const displayName = data[0].display_name

        if (isPickup) {
          setPickupCoords([lat, lng])
          onPickupSelect(displayName, lat, lng)
        } else {
          setDeliveryCoords([lat, lng])
          onDeliverySelect(displayName, lat, lng)
        }
      } else {
        const { toast } = await import("sonner")
        toast.error("Address not found. Please try a different search term.")
      }
    } catch (error) {
      console.error("[v0] Geocoding error:", error)
      const { toast } = await import("sonner")
      toast.error("Failed to search address. Please try again.")
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Pickup Address</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter pickup location..."
              value={pickupSearch}
              onChange={(e) => setPickupSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchAddress(pickupSearch, true)
                }
              }}
            />
            <Button
              type="button"
              onClick={() => searchAddress(pickupSearch, true)}
              size="icon"
              variant="outline"
              disabled={searching}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {pickupCoords && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 text-green-500" />
              Location found on map
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Delivery Address</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter delivery location..."
              value={deliverySearch}
              onChange={(e) => setDeliverySearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchAddress(deliverySearch, false)
                }
              }}
            />
            <Button
              type="button"
              onClick={() => searchAddress(deliverySearch, false)}
              size="icon"
              variant="outline"
              disabled={searching}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {deliveryCoords && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 text-red-500" />
              Location found on map
            </p>
          )}
        </div>
      </div>

      <div className="h-96 rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-2 p-4">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            Type addresses above and click search to see them on the map
          </p>
          <p className="text-xs text-muted-foreground">
            Using OpenStreetMap (Free API - No key required)
          </p>
          {pickupCoords && deliveryCoords && (
            <div className="mt-4 text-xs space-y-1">
              <p className="flex items-center justify-center gap-1 text-green-600">
                <MapPin className="h-3 w-3" />
                Pickup: {pickupCoords[0].toFixed(4)}, {pickupCoords[1].toFixed(4)}
              </p>
              <p className="flex items-center justify-center gap-1 text-red-600">
                <MapPin className="h-3 w-3" />
                Delivery: {deliveryCoords[0].toFixed(4)}, {deliveryCoords[1].toFixed(4)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
