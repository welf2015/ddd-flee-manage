export type UserRole = "MD" | "ED" | "Accountant" | "Head of Operations" | "Staff"

export type BookingStatus = "Open" | "Review" | "Negotiation" | "Approved" | "Closed"

export type VehicleType = "Truck" | "Car" | "Bike"

export type VehicleStatus = "Active" | "In Maintenance" | "Inactive"

export type IncidentStatus = "Open" | "Resolved"

export type IncidentSeverity = "Low" | "Medium" | "High" | "Critical"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  vehicle_number: string
  vehicle_type: VehicleType
  make: string | null
  model: string | null
  year: number | null
  status: VehicleStatus
  last_service_date: string | null
  next_service_date: string | null
  created_at: string
  updated_at: string
}

export interface Driver {
  id: string
  full_name: string
  phone: string | null
  license_number: string
  license_expiry: string | null
  assigned_vehicle_id: string | null
  status: "Active" | "Inactive"
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  job_id: string
  client_id: string | null
  client_name: string
  client_contact: string | null
  request_details: string
  number_of_loads: number | null
  route: string | null
  timeline: string | null
  proposed_client_budget: number | null
  status: BookingStatus
  negotiation_notes: string | null
  created_by: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
}

export interface Incident {
  id: string
  incident_number: string
  vehicle_id: string
  driver_id: string | null
  incident_date: string
  description: string
  location: string | null
  severity: IncidentSeverity | null
  status: IncidentStatus
  resolution_notes: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface MaintenanceLog {
  id: string
  vehicle_id: string
  maintenance_type: string
  description: string | null
  cost: number | null
  service_date: string
  next_service_date: string | null
  performed_by: string | null
  created_at: string
}

export interface FuelLog {
  id: string
  vehicle_id: string
  driver_id: string | null
  quantity_liters: number
  cost: number
  odometer_reading: number | null
  fuel_date: string
  location: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "Booking" | "Approval" | "Negotiation" | "Incident" | "Maintenance" | "Other"
  related_id: string | null
  read: boolean
  created_at: string
}
