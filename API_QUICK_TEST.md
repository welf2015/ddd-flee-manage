# Quick API Test with curl

## 1. Get Your Auth Token

**Option A - From Web App:**
1. Login to http://localhost:3000
2. Open browser console (F12)
3. Run: `localStorage.getItem('sb-<project-id>-auth-token')`
4. Or check Network tab > any request > Authorization header

**Option B - Direct Login:**
\`\`\`bash
curl -X POST https://<your-project>.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: <your-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "your-password"
  }'
\`\`\`

Copy the `access_token` from response.

---

## 2. Set Token Variable

\`\`\`bash
export TOKEN="your_access_token_here"
\`\`\`

---

## 3. Test Endpoints

### Get Resources (Drivers, Vehicles, Clients)
\`\`\`bash
curl -X GET "http://localhost:3000/api/mobile/resources" \
  -H "Authorization: Bearer $TOKEN" | jq
\`\`\`

### List All Bookings
\`\`\`bash
curl -X GET "http://localhost:3000/api/mobile/bookings/list" \
  -H "Authorization: Bearer $TOKEN" | jq
\`\`\`

### List Pending Bookings
\`\`\`bash
curl -X GET "http://localhost:3000/api/mobile/bookings/list?status=Pending" \
  -H "Authorization: Bearer $TOKEN" | jq
\`\`\`

### Create Booking
\`\`\`bash
curl -X POST "http://localhost:3000/api/mobile/bookings/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Test Client",
    "client_contact": "+2348012345678",
    "route": "Lagos → Abuja",
    "pickup_address": "Victoria Island",
    "delivery_address": "Wuse 2",
    "proposed_client_budget": 50000,
    "requires_waybill": true
  }' | jq
\`\`\`

### Update Status (use booking ID from above)
\`\`\`bash
curl -X PATCH "http://localhost:3000/api/mobile/bookings/BOOKING_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Progress",
    "notes": "Driver en route"
  }' | jq
\`\`\`

### Get Booking Details
\`\`\`bash
curl -X GET "http://localhost:3000/api/mobile/bookings/BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
\`\`\`

### Close Job
\`\`\`bash
curl -X POST "http://localhost:3000/api/mobile/bookings/BOOKING_ID/close" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actual_cost": 48000,
    "incident_report": "Completed successfully"
  }' | jq
\`\`\`

---

## 4. Test File Upload

\`\`\`bash
curl -X POST "http://localhost:3000/api/mobile/bookings/BOOKING_ID/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "document_type=Waybill" | jq
\`\`\`

---

## Role-Based Access

APIs check user roles automatically:
- **MD/ED/Admin** - Full access (delete, approve, etc.)
- **Manager** - Can view and update
- **Driver** - Can view assigned bookings
- **All** - Can create bookings, view own data

The API returns `403 Forbidden` if user lacks permissions.
