# Prepaid Expense Management System - Implementation Plan

## Overview
Create a comprehensive prepaid expense management system with three main categories:
1. **Fuel** - Prepaid accounts at fuel stations (Total Energies, Qoray charging for EV)
2. **Government Ticketing** - Prepaid account with Nigerian Ports Authority
3. **Driver Allowances** - Prepaid allowance pool for trip-based payments

---

## Database Schema

### 1. Expense Vendors Table
```sql
expense_vendors
- id (UUID)
- vendor_name (TEXT) - "Total Energies", "Qoray Charging", "Nigerian Ports Authority", "Driver Allowance Pool"
- vendor_type (TEXT) - "Fuel", "Ticketing", "Allowance"
- contact_person (TEXT)
- contact_phone (TEXT)
- location (TEXT)
- is_active (BOOLEAN)
- created_at, updated_at
```

### 2. Prepaid Accounts Table
```sql
prepaid_accounts
- id (UUID)
- vendor_id (UUID) → expense_vendors(id)
- account_name (TEXT) - e.g., "Total Energies - Main Account"
- current_balance (DECIMAL 12,2) DEFAULT 0
- total_deposited (DECIMAL 12,2) DEFAULT 0
- total_spent (DECIMAL 12,2) DEFAULT 0
- is_active (BOOLEAN)
- created_at, updated_at
```

### 3. Account Top-ups/Deposits Table
```sql
account_topups
- id (UUID)
- account_id (UUID) → prepaid_accounts(id)
- amount (DECIMAL 12,2)
- topup_date (TIMESTAMPTZ)
- receipt_number (TEXT)
- receipt_url (TEXT) - for document upload
- deposited_by (UUID) → profiles(id)
- notes (TEXT)
- created_at
```

### 4. Expense Transactions Table
```sql
expense_transactions
- id (UUID)
- account_id (UUID) → prepaid_accounts(id)
- booking_id (UUID) → bookings(id)
- driver_id (UUID) → drivers(id)
- vehicle_id (UUID) → vehicles(id)
- expense_type (TEXT) - "Fuel", "Ticketing", "Allowance"
- amount (DECIMAL 12,2)
- quantity (DECIMAL 10,2) - for fuel: liters/kWh
- unit (TEXT) - "Liters", "kWh", "N/A"
- transaction_date (TIMESTAMPTZ)
- notes (TEXT)
- created_by (UUID) → profiles(id)
- created_at
```

### 5. Update Existing Tables
- **fuel_logs**: Add `expense_transaction_id` (UUID) → expense_transactions(id) to link fuel logs to expense transactions
- **bookings**: Add columns for expense tracking:
  - `fuel_amount` (DECIMAL 12,2)
  - `ticketing_amount` (DECIMAL 12,2)
  - `allowance_amount` (DECIMAL 12,2)
  - `fuel_account_id` (UUID) → prepaid_accounts(id)
  - `ticketing_account_id` (UUID) → prepaid_accounts(id)

---

## UI Structure

### 1. New "Expenses" Section in Dashboard
**Route**: `/dashboard/expenses`

**Layout**:
```
Expenses Page
├── Header: "Expense Management" + "Add Top-up" button
├── Summary Cards:
│   ├── Total Fuel Balance
│   ├── Total Ticketing Balance
│   ├── Total Allowance Balance
│   └── Total Expenses This Week (weekly accounting)
└── Tabs:
    ├── Fuel Tab
    │   ├── Vendor: Total Energies (only - Qoray Charging is for EV manual logs)
    │   ├── Account Balance Display (shows negative if overdrawn)
    │   ├── Top-up History
    │   ├── Transaction History (with fuel log details)
    │   └── Add Top-up Button (enter total amount paid - clears negative)
    ├── Ticketing Tab
    │   ├── Nigerian Ports Authority Account
    │   ├── Balance Display (shows negative if overdrawn)
    │   ├── Top-up History
    │   ├── Transaction History
    │   └── Add Top-up Button (enter total amount paid - clears negative)
    └── Allowance Tab
        ├── Driver Allowance Pool
        ├── Balance Display (shows negative if overdrawn)
        ├── Top-up History
        ├── Transaction History (by driver/trip)
        └── Add Top-up Button (enter total amount paid - clears negative)
```

### 2. Enhanced Assign Driver Dialog
**Current**: Only shows driver selection

**Enhanced**:
```
Assign Driver Dialog
├── Driver Selection (existing)
├── Vehicle Display (existing)
└── NEW: Trip Expenses Section
    ├── Fuel Required
    │   ├── Vendor: Total Energies (fixed - only for trucks)
    │   ├── Amount (NGN)
    │   ├── Liters (manual entry - user enters manually)
    │   └── Show Account Balance (shows negative amount if overdrawn)
    ├── Government Ticketing
    │   ├── Amount (NGN)
    │   └── Show Account Balance (shows negative amount if overdrawn)
    └── Driver Allowance
        ├── Amount (NGN)
        └── Show Account Balance (shows negative amount if overdrawn)
```

**Validation**:
- Show current account balance (can be negative - prepaid allows overdraft)
- Display negative amount if balance is negative (e.g., "-₦500,000")
- No blocking - assignment allowed even with negative balance (prepaid system)

---

## Workflow

### 1. Initial Setup
1. Create expense vendors:
   - Total Energies (Fuel)
   - Qoray Charging (Fuel - EV)
   - Nigerian Ports Authority (Ticketing)
   - Driver Allowance Pool (Allowance)
2. Create prepaid accounts for each vendor
3. Add initial top-ups/deposits

### 2. Adding Top-ups
1. Navigate to Expenses → Select Tab (Fuel/Ticketing/Allowance)
2. Click "Add Top-up"
3. Select vendor/account
4. Enter **total amount paid** (this is the cumulative amount, not additional)
   - Example: If account is at -₦500k and you pay ₦1M, enter ₦1M
   - System calculates: new balance = current balance + top-up amount
   - If current is -₦500k and you enter ₦1M, new balance = ₦500k
5. Upload receipt (optional)
6. Add receipt number
7. Save → Updates account balance automatically (clears negative if sufficient)

### 3. Assigning Driver with Expenses
1. Open booking → Click "Assign Driver"
2. Select driver (existing flow)
3. **NEW**: Fill expense fields:
   - Fuel: Enter amount and liters (manual entry)
   - Ticketing: Enter amount
   - Allowance: Enter amount
4. System displays:
   - Current account balances (can show negative amounts)
   - No blocking - allows assignment even with negative balance
5. Click "Assign Driver & Log Expenses"
6. System automatically:
   - Assigns driver to booking
   - Creates expense transactions
   - Deducts from prepaid accounts (can go negative)
   - **Auto-creates fuel log entry** (for fuel expenses - no manual logging needed)
   - Links fuel log to expense transaction

### 4. Transaction History
- View all transactions by type (Fuel/Ticketing/Allowance)
- Filter by date range, vendor, driver, vehicle
- See balance before/after each transaction
- Link to booking details
- Link to fuel log (for fuel transactions)

---

## Key Features

### 1. Automatic Fuel Logging
When fuel expense is added during driver assignment:
- **Automatically create fuel_log entry** (no manual logging needed):
  - vehicle_id, driver_id, booking_id
  - quantity (liters - entered manually by user)
  - cost (amount entered)
  - station_name (Total Energies - from vendor)
  - fuel_type (from vehicle type)
  - logged_at (current timestamp)
- Link fuel_log to expense_transaction via expense_transaction_id
- This replaces manual fuel logging for trip-based fuel expenses

### 2. Balance Tracking
- Real-time balance updates via database triggers
- Balance history tracking (before/after each transaction)
- **Negative balance display** - shows "-₦500,000" format when overdrawn
- **Top-up clears negative** - when adding top-up, enter total amount paid
  - System: new_balance = current_balance + topup_amount
  - Example: -₦500k + ₦1M = ₦500k
- Negative balance allowed (prepaid system allows overdraft)

### 3. Multi-Vendor Support
- **Fuel**: Total Energies only (for trucks/booking system)
- **EV Charging**: Qoray Charging (manual logs only - not in booking system)
- Each vendor can have multiple accounts
- Easy to add new vendors in future

### 4. Reporting
- Expense summary by type
- Top-up vs spending analysis
- Driver expense history
- Vehicle fuel consumption tracking
- Monthly/yearly expense reports

---

## Database Triggers

### 1. Update Account Balance on Top-up
```sql
CREATE TRIGGER update_account_balance_on_topup
AFTER INSERT ON account_topups
FOR EACH ROW
EXECUTE FUNCTION update_account_balance();
```

### 2. Update Account Balance on Transaction
```sql
CREATE TRIGGER update_account_balance_on_transaction
AFTER INSERT ON expense_transactions
FOR EACH ROW
EXECUTE FUNCTION deduct_account_balance();
```

### 3. Auto-create Fuel Log on Fuel Transaction
```sql
CREATE TRIGGER auto_create_fuel_log
AFTER INSERT ON expense_transactions
FOR EACH ROW
WHEN (NEW.expense_type = 'Fuel')
EXECUTE FUNCTION create_fuel_log_from_transaction();
```

---

## API/Server Actions

### 1. Expense Management Actions
- `createExpenseVendor()` - Create new vendor
- `createPrepaidAccount()` - Create new account
- `addAccountTopup()` - Add top-up/deposit
- `createExpenseTransaction()` - Create expense transaction
- `getAccountBalance()` - Get current balance
- `getExpenseHistory()` - Get transaction history

### 2. Booking Actions (Enhanced)
- `assignDriverWithExpenses()` - Assign driver and log expenses
- Update existing `assignDriverToBooking()` to support expenses

---

## Migration Strategy

1. **Phase 1**: Database Schema
   - Create new tables (expense_vendors, prepaid_accounts, account_topups, expense_transactions)
   - Add columns to bookings and fuel_logs
   - Create triggers and functions

2. **Phase 2**: UI - Expense Management
   - Create expenses page with tabs
   - Vendor management
   - Account management
   - Top-up interface
   - Transaction history

3. **Phase 3**: Integration - Driver Assignment
   - Enhance assign driver dialog
   - Add expense fields
   - Implement validation
   - Auto-logging functionality

4. **Phase 4**: Reporting & Analytics
   - Expense summaries
   - Balance tracking
   - Reports

---

## Confirmed Requirements ✅

1. **Accounting Period**: Weekly (not monthly) - "Total Expenses This Week"
2. **Top-up System**: Enter total amount paid (clears negative balances)
   - Formula: new_balance = current_balance + topup_amount
   - Example: -₦500k + ₦1M = ₦500k
3. **Fuel Vendor**: Total Energies only (for trucks/booking system)
   - Qoray Charging is for EV manual logs only (not in booking system)
4. **Fuel Liters**: Manual entry (user enters liters when entering amount)
5. **Balance Display**: Show negative amounts (e.g., "-₦500,000")
   - No blocking - assignment allowed even with negative balance
6. **Auto Fuel Logging**: ✅ Confirmed - automatically create fuel log when driver assigned with fuel expense

---

## Next Steps

1. **Confirm this plan** with you
2. **Answer the questions above**
3. **Create database migration**
4. **Build UI components**
5. **Integrate with driver assignment**
6. **Test and deploy**
