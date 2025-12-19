# Deployment Checklist - Delete/Edit Features & Bug Fixes

## SQL Migrations to Run

Run these SQL scripts in your Supabase SQL Editor in the following order:

### 1. Delete Policies for All Tables
**File:** `scripts/add-all-delete-policies.sql`
**Purpose:** Adds DELETE policies for vehicles, drivers, clients, incidents, and vehicle_onboarding tables
**Required for:** Delete functionality across all pages

### 2. Delete Policy for Maintenance Logs
**File:** `scripts/add-maintenance-logs-delete-policy.sql`
**Purpose:** Adds DELETE policy specifically for maintenance_logs table
**Required for:** Deleting maintenance logs

## Changes Made

### 1. Vehicle Edit/Delete Functionality
- **Changed:** Replaced EditVehicleDialog with AddVehicleDialog throughout the codebase
- **Files Modified:**
  - app/dashboard/vehicle-management/vehicles/vehicles-client.tsx
  - components/vehicles-table.tsx
  - components/vehicle-detail-dialog.tsx
- **Result:** Vehicle edit now uses the simple Add Vehicle dialog (basic vehicle info only), NOT the Document Expiry Dates form

### 2. Driver Edit/Delete Functionality
- **Files Modified:**
  - components/create-driver-dialog.tsx - Now supports both create and edit modes
  - components/driver-detail-dialog.tsx - Added edit and delete buttons
  - app/actions/drivers.ts - Added updateDriver and deleteDriver functions

### 3. Client Edit/Delete Functionality
- **Files Modified:**
  - components/create-client-dialog.tsx - Now supports both create and edit modes
  - components/clients-table.tsx - Added inline edit and delete buttons
  - app/actions/clients.ts - Added updateClient and deleteClient functions

### 4. Maintenance Total Cost Fixed
- **Files Modified:**
  - components/maintenance/maintenance-stats.tsx
- **Bug Fixed:** Total cost now includes BOTH maintenance schedules AND maintenance logs

### 5. Maintenance Logs Status Display
- **Files Modified:**
  - components/maintenance/unified-maintenance-table.tsx
- **Changed:** Logs now show "Completed" badge instead of "-"

### 6. Maintenance View Details
- **Files Modified:**
  - components/maintenance/unified-maintenance-table.tsx
- **Bug Fixed:** Eye icon now shows details for both schedules and logs

### 7. Incident Date & Time Selection
- **Files Modified:**
  - components/incidents/create-incident-dialog.tsx
- **Bug Fixed:** Users can now select the actual incident date and time (was hardcoded to current date/time)

### 8. Onboarding Accessories Fix for Trucks/Bikes
- **Files Modified:**
  - components/onboarding/onboarding-table.tsx
  - components/onboarding/onboarding-detail-sheet.tsx
  - app/actions/onboarding.ts
- **Bug Fixed:** Trucks and Bikes can now reach 100% completion without completing Accessories items
- **How it Works:**
  - **Cars:** All items including Accessories count toward 100% completion
  - **Trucks & Bikes:** Accessories items excluded from percentage calculation
  - Accessories still visible but don't prevent completion

## Validation Steps for Team

### Vehicles
- [ ] Edit a vehicle - should show simple form (NOT Document Expiry Dates)
- [ ] Delete a vehicle - should work without errors

### Drivers
- [ ] Edit a driver - should pre-fill current data
- [ ] Delete a driver - should work without errors

### Clients
- [ ] Edit a client - should pre-fill current data
- [ ] Delete a client - should work without errors

### Maintenance
- [ ] Check Total Cost stat - should include both schedules and logs
- [ ] View a maintenance log - eye icon should show details
- [ ] Delete a maintenance log - should work without errors

### Incidents
- [ ] Log a new incident with a past date and time
- [ ] Verify the incident saves with the selected date/time

### Onboarding
- [ ] Create onboarding for a Truck, complete all EXCEPT Accessories
- [ ] Verify completion shows 100%
- [ ] Test a Car - should require Accessories for 100%

### 3. Delete Policy for Inventory Tables
**File:** `scripts/add-inventory-delete-policies.sql`
**Purpose:** Adds DELETE policies for all inventory-related tables
**Required for:** Deleting inventory items, categories, transactions, adjustments, and collections

\`\`\`sql
-- This script adds DELETE policies for:
- inventory_categories
- inventory_parts
- inventory_transactions
- stock_adjustments
- inventory_collections
\`\`\`

---

## Updated Changes

### 9. ✅ Inventory Delete Functionality
- **New SQL Script:** scripts/add-inventory-delete-policies.sql
- **Tables Updated:** All inventory tables now support delete operations
- **Team Impact:** Can now delete inventory items without errors

### 10. ✅ Onboarding Accessories - COMPLETELY HIDDEN for Trucks/Bikes
- **Changed:** Accessories category is now COMPLETELY HIDDEN (not displayed at all) for Trucks and Bikes
- **How it Works:**
  - **Cars:** See all categories including Accessories
  - **Trucks & Bikes:** Accessories section does NOT appear in the checklist at all
- **Items Hidden for Trucks/Bikes:**
  - Car Charger
  - Phone Stand
  - Car Mat
  - Box of Tissue
- **Team Impact:** Cleaner onboarding experience for Trucks and Bikes - no confusion about car-specific items


### 11. ✅ Incident Auto-Populate Driver from Vehicle
- **Files Modified:** components/create-incident-dialog.tsx
- **Feature Added:** When selecting a vehicle in incident form, the assigned driver automatically populates
- **How it Works:**
  - Select a vehicle in the incident form
  - If that vehicle has an assigned driver, the driver field auto-fills
  - User sees a success toast: "Driver [Name] auto-populated"
  - If vehicle has no assigned driver, driver field is cleared
- **Team Impact:** Faster incident reporting, less manual data entry, fewer errors
