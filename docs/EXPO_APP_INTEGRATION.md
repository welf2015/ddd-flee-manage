# Vehicle Inspection Expo App - Database Integration Guide

## Overview
This document provides technical specifications for integrating the Expo mobile app with the Supabase backend for daily vehicle inspections.

## Database Connection

### Supabase Configuration
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Authentication

### Driver Login
Drivers log in using their email and password:

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: driverEmail,
  password: driverPassword
})

if (error) {
  console.error('Login error:', error.message)
  return
}

// Get driver profile
const { data: driver } = await supabase
  .from('drivers')
  .select('*')
  .eq('email', driverEmail)
  .single()
```

## Daily Inspection Flow

### 1. Check if Inspection Already Exists
Before starting a new inspection, check if one already exists for today:

```javascript
const today = new Date().toISOString().split('T')[0]

const { data: existingInspection } = await supabase
  .from('vehicle_inspections')
  .select('*')
  .eq('vehicle_id', vehicleId)
  .eq('inspection_date', today)
  .single()

if (existingInspection) {
  // Show existing inspection or allow editing
}
```

### 2. Create New Inspection
```javascript
const { data: inspection, error } = await supabase
  .from('vehicle_inspections')
  .insert({
    vehicle_id: vehicleId,
    driver_id: driverId,
    inspection_date: new Date().toISOString().split('T')[0],
    inspection_time: new Date().toTimeString().split(' ')[0],
    odometer_reading: odometerReading,
    
    // Checklist items (OK/Not OK/NA)
    body_condition: 'OK',
    body_condition_remarks: '',
    bumpers: 'OK',
    // ... all other fields
    
    created_by: userId,
    status: 'Pending'
  })
  .select()
  .single()
```

### 3. Upload Photos with Watermark

#### Photo Categories
- `body_front` - Front view of vehicle
- `body_rear` - Rear view
- `body_left` - Left side
- `body_right` - Right side
- `interior_dashboard` - Dashboard view
- `interior_seats` - Seats condition
- `interior_cargo` - Cargo area
- `engine_bay` - Engine compartment
- `tires_front_left` - Front left tire
- `tires_front_right` - Front right tire
- `tires_rear_left` - Rear left tire
- `tires_rear_right` - Rear right tire
- `damage_detail` - Close-up of any damage
- `other` - Other relevant photos

#### Watermarking Process
Before uploading, watermark the image with:
1. Current timestamp
2. GPS coordinates
3. Location address (if available)

```javascript
import * as Location from 'expo-location'
import * as ImageManipulator from 'expo-image-manipulator'

// Get location
const { status } = await Location.requestForegroundPermissionsAsync()
if (status !== 'granted') {
  alert('Permission to access location was denied')
  return
}

const location = await Location.getCurrentPositionAsync({})
const address = await Location.reverseGeocodeAsync({
  latitude: location.coords.latitude,
  longitude: location.coords.longitude
})

// Create watermark text
const watermarkText = `
${new Date().toLocaleString()}
Lat: ${location.coords.latitude.toFixed(6)}
Lng: ${location.coords.longitude.toFixed(6)}
${address[0]?.street || ''}, ${address[0]?.city || ''}
`

// Add watermark to image (use a library like react-native-canvas or similar)
// This is a simplified example - you'll need to implement actual watermarking
const watermarkedImage = await addWatermarkToImage(imageUri, watermarkText)

// Upload to R2/Blob
const formData = new FormData()
formData.append('file', {
  uri: watermarkedImage,
  type: 'image/jpeg',
  name: `inspection_${Date.now()}.jpg`
})

const uploadResponse = await fetch('YOUR_API_URL/api/r2-upload', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
})

const { url } = await uploadResponse.json()

// Save photo record
const { error: photoError } = await supabase
  .from('inspection_photos')
  .insert({
    inspection_id: inspection.id,
    photo_category: 'body_front',
    photo_url: url,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    location_address: `${address[0]?.street}, ${address[0]?.city}`,
    captured_at: new Date().toISOString()
  })
```

## Inspection Checklist Structure

### All Fields Follow This Pattern:
```javascript
{
  field_name: 'OK' | 'Not OK' | 'NA',
  field_name_remarks: 'Optional text remarks'
}
```

### Categories and Fields:

#### Handbook & SOPs
- `handbook_sops_available`

#### Exterior Inspection
- `body_condition`
- `bumpers`
- `mirrors`
- `windshield`
- `windows`
- `wipers`
- `headlights`
- `brake_lights`
- `horn`
- `license_plate`
- `doors_locks`

#### Tires and Wheels
- `tire_tread_depth`
- `tire_pressure`
- `tire_wear`
- `wheel_nuts`
- `spare_tire`
- `jack_tools`

#### Engine & Under the Hood
- `coolant`
- `brake_fluid`
- `power_steering_fluid`
- `transmission_fluid`
- `battery`
- `belts_hoses`
- `air_filter`

#### Braking System
- `service_brake`
- `parking_brake`
- `brake_pedal_pressure`
- `brake_warning_light`

#### Exhaust and Emission
- `exhaust_pipe`
- `noise_level`
- `emission_compliance`

#### Electrical & Controls
- `dashboard_lights`
- `gauges`
- `interior_lights`
- `ignition`
- `power_windows_locks`

#### Interior Condition
- `seats`
- `seatbelts`
- `dashboard`
- `ac_heating`
- `cabin_lights`
- `fire_extinguisher`
- `first_aid_kit`
- `reflective_triangle`
- `cleanliness`

#### Road Test / Functional Checks
- `acceleration`
- `gear_shifts`
- `steering`
- `braking`
- `noises_vibrations`
- `warning_indicators`

#### Comments & Corrective Actions
- `defects_noted` (TEXT)
- `recommended_repairs` (TEXT)
- `inspector_remarks` (TEXT)

## Example Complete Inspection Submission

```javascript
const submitInspection = async () => {
  try {
    // 1. Create inspection record
    const { data: inspection, error: inspectionError } = await supabase
      .from('vehicle_inspections')
      .insert({
        vehicle_id: selectedVehicle.id,
        driver_id: currentDriver.id,
        inspection_date: new Date().toISOString().split('T')[0],
        inspection_time: new Date().toTimeString().split(' ')[0],
        odometer_reading: formData.odometerReading,
        
        // All checklist items
        handbook_sops_available: formData.handbook_sops_available,
        handbook_sops_remarks: formData.handbook_sops_remarks,
        body_condition: formData.body_condition,
        body_condition_remarks: formData.body_condition_remarks,
        // ... all other fields
        
        defects_noted: formData.defects_noted,
        recommended_repairs: formData.recommended_repairs,
        inspector_remarks: formData.inspector_remarks,
        
        created_by: currentUser.id,
        status: 'Pending'
      })
      .select()
      .single()
    
    if (inspectionError) throw inspectionError
    
    // 2. Upload all photos
    for (const photo of photos) {
      const watermarkedPhoto = await watermarkPhoto(photo)
      const uploadedUrl = await uploadToR2(watermarkedPhoto)
      
      await supabase
        .from('inspection_photos')
        .insert({
          inspection_id: inspection.id,
          photo_category: photo.category,
          photo_url: uploadedUrl,
          latitude: photo.location.latitude,
          longitude: photo.location.longitude,
          location_address: photo.location.address,
          captured_at: photo.timestamp
        })
    }
    
    alert('Inspection submitted successfully!')
  } catch (error) {
    console.error('Submission error:', error)
    alert('Failed to submit inspection')
  }
}
```

## Required Photos
Drivers MUST upload photos for:
1. Body condition (front, rear, left, right) - 4 photos minimum
2. Any damage or defects noted

## Offline Support (Optional)
Consider implementing offline storage using AsyncStorage or SQLite, then sync when connection is available.

## Security Notes
- All API calls require authentication
- Row Level Security (RLS) is enabled on all tables
- Drivers can only create/edit their own inspections
- Admins can view and approve all inspections

## Testing
Use Supabase Studio to:
1. View inspection records in real-time
2. Check photo uploads
3. Verify watermark data is saved correctly
4. Test RLS policies

## Support
For questions or issues, contact the backend team.
