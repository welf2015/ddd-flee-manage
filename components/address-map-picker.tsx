"use client"

import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search } from 'lucide-react'
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix default marker icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

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

  const searchAddress = async (query: string, isPickup: boolean) => {
    if (!query.trim()) return

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
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
      }
    } catch (error) {
      console.error("Geocoding error:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
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
            <button
              type="button"
              onClick={() => searchAddress(pickupSearch, true)}
              className="px-3 py-2 border rounded-md hover:bg-muted"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div>
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
            <button
              type="button"
              onClick={() => searchAddress(deliverySearch, false)}
              className="px-3 py-2 border rounded-md hover:bg-muted"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-96 rounded-lg overflow-hidden border">
        <MapContainer
          center={pickupCoords || [9.082, 8.6753]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {pickupCoords && (
            <Marker position={pickupCoords} icon={greenIcon}>
              <Popup>Pickup: {pickupAddress}</Popup>
            </Marker>
          )}

          {deliveryCoords && (
            <Marker position={deliveryCoords} icon={redIcon}>
              <Popup>Delivery: {deliveryAddress}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  )
}
