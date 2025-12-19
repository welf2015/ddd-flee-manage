# Fleet Management Mobile API Documentation

## Overview

This API provides mobile access to the Fleet Management System for both drivers and administrators using Expo React Native.

## Base URL

\`\`\`
https://your-domain.com/api/mobile
\`\`\`

## Authentication

All API endpoints require authentication using Supabase session tokens. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_SESSION_TOKEN
\`\`\`

## Endpoints

### Authentication

#### POST `/auth/login`

Login for drivers and administrators.

**Request Body:**
\`\`\`json
{
  "email": "driver@example.com",
  "password": "password123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "user": { "id": "...", "email": "..." },
  "session": { "access_token": "...", "refresh_token": "..." },
  "profile": { "full_name": "John Doe", "role": "Staff" },
  "role": "Staff"
}
\`\`\`

---

### Driver Endpoints

#### GET `/driver/profile`

Get driver profile, assigned vehicle, and inspection count.

**Response:**
\`\`\`json
{
  "profile": {
    "id": "...",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+234...",
    "role": "Staff"
  },
  "vehicle": {
    "id": "...",
    "fleet_number": "FLT-001",
    "make": "Toyota",
    "model": "Hiace",
    "year": 2023,
    "license_plate": "ABC-123XY"
  },
  "inspectionCount": 45
}
\`\`\`

#### POST `/driver/inspections`

Submit a vehicle inspection with photos.

**Request Body:**
\`\`\`json
{
  "vehicleId": "vehicle-uuid",
  "odometerReading": 45000,
  "checklist": {
    "tires_front_left": "OK",
    "tires_front_right": "OK",
    "brakes_front": "OK",
    "lights_headlights": "OK",
    "engine_oil_level": "OK",
    "coolant_level": "OK"
  },
  "photos": [
    {
      "url": "https://r2-bucket.com/photo1.jpg",
      "latitude": 6.5244,
      "longitude": 3.3792,
      "capturedAt": "2025-11-21T10:30:00Z"
    }
  ]
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "inspection": {
    "id": "...",
    "vehicle_id": "...",
    "inspection_date": "2025-11-21T10:30:00Z",
    "status": "Completed"
  }
}
\`\`\`

---

### Admin Endpoints

#### GET `/admin/bookings`

Get all new/pending bookings for approval.

**Response:**
\`\`\`json
{
  "bookings": [
    {
      "id": "...",
      "job_number": "JOB-2025-0001",
      "client": { "name": "Dangote Group" },
      "vehicle": { "fleet_number": "FLT-001" },
      "pickup_location": "Lagos",
      "dropoff_location": "Abuja",
      "status": "Pending",
      "created_at": "2025-11-21T09:00:00Z"
    }
  ]
}
\`\`\`

#### POST `/admin/approve-booking`

Approve or reject a booking.

**Request Body:**
\`\`\`json
{
  "bookingId": "booking-uuid",
  "action": "approve"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true
}
\`\`\`

#### GET `/admin/stats`

Get dashboard statistics.

**Response:**
\`\`\`json
{
  "totalVehicles": 50,
  "activeVehicles": 45,
  "totalBookings": 1234,
  "pendingBookings": 12,
  "totalRevenue": 150000000
}
\`\`\`

---

## Photo Upload with Watermark

### Camera Capture Flow

1. **Capture Photo**: Use Expo Camera API to take photos (not gallery upload)
2. **Get Location**: Use Expo Location API to get GPS coordinates
3. **Add Watermark**: Overlay date, time, and location on the image
4. **Upload to R2**: Send the watermarked image to `/api/r2-upload`

### Example Expo Code

\`\`\`typescript
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

async function captureWithWatermark() {
  // Get location
  const location = await Location.getCurrentPositionAsync({});
  
  // Capture photo
  const photo = await cameraRef.current.takePictureAsync();
  
  // Add watermark (you'll need a library like react-native-image-marker)
  const watermarkedPhoto = await addWatermark(photo.uri, {
    date: new Date().toLocaleString(),
    location: `${location.coords.latitude}, ${location.coords.longitude}`
  });
  
  // Upload to R2
  const formData = new FormData();
  formData.append('file', {
    uri: watermarkedPhoto,
    type: 'image/jpeg',
    name: 'inspection-photo.jpg'
  });
  formData.append('folder', 'inspection-photos');
  
  const response = await fetch('https://your-domain.com/api/r2-upload', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });
  
  const { url } = await response.json();
  return {
    url,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    capturedAt: new Date().toISOString()
  };
}
\`\`\`

---

## OneSignal Notifications

### Setup

1. Install OneSignal SDK in Expo app
2. Configure OneSignal App ID in your mobile app
3. Store OneSignal Player ID in user profile

### Notification Flow

\`\`\`
Backend Action → OneSignal API → Push Notification → Mobile App
\`\`\`

### Example Server-Side (Node.js)

\`\`\`typescript
async function sendNotification(userId: string, message: string) {
  // Get user's OneSignal player ID from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('onesignal_player_id')
    .eq('id', userId)
    .single();
    
  if (!profile?.onesignal_player_id) return;
  
  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      include_player_ids: [profile.onesignal_player_id],
      contents: { en: message },
      headings: { en: 'Fleet Management' }
    })
  });
}
\`\`\`

---

## Service Worker for CORS

For PWA functionality, create a service worker:

\`\`\`javascript
// public/sw.js
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request, {
        mode: 'cors',
        credentials: 'include'
      })
    );
  }
});
\`\`\`

Register in your app:

\`\`\`typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
\`\`\`

---

## Environment Variables Required

\`\`\`env
# R2 Storage
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-custom-domain.com (optional)

# OneSignal
ONESIGNAL_APP_ID=your-app-id
ONESIGNAL_REST_API_KEY=your-rest-api-key

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
\`\`\`

---

## Security Best Practices

1. **Always validate JWT tokens** on every API request
2. **Check user roles** before allowing admin operations
3. **Sanitize file uploads** to prevent malicious files
4. **Rate limit** inspection submissions to prevent abuse
5. **Validate GPS coordinates** to ensure they're within expected ranges

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User doesn't have permission for this action |
| 400 | Bad Request | Invalid request body or parameters |
| 500 | Server Error | Internal server error |

---

## Example Expo App Structure

\`\`\`
mobile-app/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── DriverDashboard.tsx
│   │   ├── InspectionScreen.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── BookingsScreen.tsx
│   ├── api/
│   │   └── client.ts
│   ├── components/
│   │   ├── Camera.tsx
│   │   └── Watermark.tsx
│   └── utils/
│       ├── auth.ts
│       ├── location.ts
│       └── notifications.ts
└── app.json
\`\`\`

---

## Support

For issues or questions, contact the development team or refer to:
- Supabase Docs: https://supabase.com/docs
- Expo Docs: https://docs.expo.dev
- OneSignal Docs: https://documentation.onesignal.com
