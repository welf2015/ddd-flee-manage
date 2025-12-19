# Mobile API Documentation

## Base URL
- **Development**: `http://localhost:3000/api/mobile`
- **Production**: `https://your-domain.vercel.app/api/mobile`

## Authentication

All endpoints require authentication using Bearer token in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_ACCESS_TOKEN
\`\`\`

You can get the access token from Supabase auth after login.

---

## Endpoints

### 1. **List Bookings**

**GET** `/bookings/list`

Get list of bookings with filters.

**Query Parameters:**
- `status` (optional): Filter by status (Pending, Approved, In Progress, Completed, Cancelled)
- `start_date` (optional): Filter by start date (ISO format)
- `end_date` (optional): Filter by end date (ISO format)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
\`\`\`json
{
  "success": true,
  "bookings": [
    {
      "id": "uuid",
      "job_id": "JOB-2025-0001",
      "status": "Pending",
      "route": "Lagos → Abuja",
      "client": { ... },
      "driver": { ... },
      "vehicle": { ... },
      "waybills": [ ... ]
    }
  ],
  "total": 10
}
\`\`\`

---

### 2. **Get Booking Details**

**GET** `/bookings/[id]`

Get detailed information about a specific booking.

**Response:**
\`\`\`json
{
  "success": true,
  "booking": {
    "id": "uuid",
    "job_id": "JOB-2025-0001",
    "client": { ... },
    "driver": { ... },
    "vehicle": { ... },
    "waybills": [ ... ],
    "timeline": [ ... ],
    "expenses": [ ... ]
  }
}
\`\`\`

---

### 3. **Create Booking**

**POST** `/bookings/create`

Create a new booking.

**Request Body:**
\`\`\`json
{
  "client_id": "uuid (optional if providing client details)",
  "client_name": "John Doe",
  "client_contact": "+234...",
  "client_email": "john@example.com",
  "company_name": "ABC Company (optional)",
  "client_address": "123 Street, Lagos",
  "route": "Lagos → Abuja",
  "pickup_address": "123 Street, Lagos",
  "delivery_address": "456 Avenue, Abuja",
  "pickup_lat": 6.5244,
  "pickup_lng": 3.3792,
  "delivery_lat": 9.0765,
  "delivery_lng": 7.3986,
  "destination_contact_name": "Jane Smith",
  "destination_contact_phone": "+234...",
  "proposed_client_budget": 50000,
  "requires_waybill": true
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "booking": { ... },
  "message": "Booking created successfully"
}
\`\`\`

---

### 4. **Update Booking Status**

**PATCH** `/bookings/[id]/status`

Update the status of a booking.

**Request Body:**
\`\`\`json
{
  "status": "In Progress",
  "notes": "Driver en route (optional)"
}
\`\`\`

**Valid Statuses:**
- `Pending`
- `Negotiating`
- `Approved`
- `In Progress`
- `Completed`
- `Cancelled`

**Response:**
\`\`\`json
{
  "success": true,
  "booking": { ... },
  "message": "Status updated successfully"
}
\`\`\`

---

### 5. **Assign Driver & Vehicle**

**PATCH** `/bookings/[id]/assign`

Assign driver and/or vehicle to a booking.

**Request Body:**
\`\`\`json
{
  "driver_id": "uuid (optional)",
  "vehicle_id": "uuid (optional)"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "booking": { ... },
  "message": "Assignment successful"
}
\`\`\`

---

### 6. **Upload Document**

**POST** `/bookings/[id]/upload`

Upload waybill or fuel receipt.

**Request:** multipart/form-data
- `file`: File (image or PDF)
- `document_type`: "Waybill" or "Fuel Receipt"

**Example (JavaScript):**
\`\`\`javascript
const formData = new FormData()
formData.append('file', fileBlob, 'waybill.jpg')
formData.append('document_type', 'Waybill')

fetch(`/api/mobile/bookings/${bookingId}/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "file_url": "https://...",
  "message": "Waybill uploaded successfully"
}
\`\`\`

---

### 7. **Close Job**

**POST** `/bookings/[id]/close`

Mark a job as completed with documents.

**Request Body:**
\`\`\`json
{
  "waybill_url": "https://... (optional)",
  "fuel_receipt_url": "https://... (optional)",
  "incident_report": "Any incidents (optional)",
  "actual_cost": 48000
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "booking": { ... },
  "message": "Job closed successfully"
}
\`\`\`

---

### 8. **Delete Booking**

**DELETE** `/bookings/[id]/delete`

Delete a booking (admin only).

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Booking deleted successfully"
}
\`\`\`

---

### 9. **Get Resources**

**GET** `/resources`

Get drivers, vehicles, and clients for selection.

**Query Parameters:**
- `type` (optional): "drivers", "vehicles", or "clients". If not provided, returns all.

**Response (all):**
\`\`\`json
{
  "success": true,
  "drivers": [ ... ],
  "vehicles": [ ... ],
  "clients": [ ... ]
}
\`\`\`

**Response (specific type):**
\`\`\`json
{
  "success": true,
  "drivers": [
    {
      "id": "uuid",
      "full_name": "John Driver",
      "phone": "+234...",
      "status": "Active"
    }
  ]
}
\`\`\`

---

## Error Responses

All endpoints return errors in this format:

\`\`\`json
{
  "success": false,
  "error": "Error message here"
}
\`\`\`

**Common HTTP Status Codes:**
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## CORS

CORS is automatically handled by Vercel for all API routes. The mobile app can make requests from any origin.

---

## Testing Locally

1. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

2. API will be available at:
   \`\`\`
   http://localhost:3000/api/mobile
   \`\`\`

3. Get auth token from Supabase:
   \`\`\`javascript
   const { data } = await supabase.auth.signInWithPassword({
     email: 'user@example.com',
     password: 'password'
   })
   const token = data.session.access_token
   \`\`\`

4. Make requests:
   \`\`\`javascript
   fetch('http://localhost:3000/api/mobile/bookings/list', {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   })
   \`\`\`
