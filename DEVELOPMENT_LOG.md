# Development Log

This document tracks all development activities, changes, and important information for the Fleet Management System project.

## Project Overview

**Project Name:** Fleet Management System (DDD-Fleet-Manage)  
**Tech Stack:** Next.js 14, React 19, TypeScript, Supabase, Tailwind CSS, Radix UI  
**Database:** PostgreSQL (via Supabase)  
**Storage:** Cloudflare R2, Vercel Blob  
**Architecture:** Server Actions, RLS (Row Level Security), Component-based UI

---

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Development Guidelines](#development-guidelines)
- [Database Schema](#database-schema)
- [Environment Setup](#environment-setup)
- [Change Log](#change-log)

---

## Project Structure

```
ddd-flee-manage/
├── app/                          # Next.js App Router
│   ├── actions/                  # Server Actions (data mutations)
│   │   ├── access-control.ts    # Role-based access control
│   │   ├── activity-log.ts      # System activity logging
│   │   ├── bookings.ts          # Booking management
│   │   ├── clients.ts           # Client management
│   │   ├── drivers.ts           # Driver management
│   │   ├── incidents.ts         # Incident reporting
│   │   ├── inspections.ts       # Vehicle inspections
│   │   ├── maintenance.ts       # Maintenance scheduling
│   │   ├── onboarding.ts        # Vehicle onboarding
│   │   ├── procurement.ts       # Vehicle procurement
│   │   ├── staff.ts             # Staff directory
│   │   └── vehicles.ts          # Vehicle management
│   ├── api/                      # API Routes
│   │   ├── mobile/              # Mobile app API endpoints
│   │   ├── r2-upload/           # Cloudflare R2 upload
│   │   └── upload/              # File upload handler
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # Main dashboard pages
│   └── shared/                   # Shared/public pages
├── components/                    # React components
│   ├── ui/                      # Reusable UI components (Radix UI)
│   ├── compliance/              # Compliance components
│   ├── drivers/                 # Driver-related components
│   ├── fuel/                    # Fuel management components
│   ├── incidents/               # Incident components
│   ├── inventory/               # Inventory components
│   ├── maintenance/             # Maintenance components
│   ├── onboarding/              # Onboarding components
│   ├── procurement/             # Procurement components
│   ├── reports/                 # Reporting components
│   └── sales/                   # Sales components
├── lib/                          # Utility libraries
│   ├── supabase/                # Supabase client configurations
│   ├── contexts/                # React contexts
│   ├── types/                   # TypeScript types
│   └── utils/                   # Utility functions
├── scripts/                      # Database migration scripts
└── public/                       # Static assets
```

---

## Development Guidelines

### 🎯 Core Principles

1. **Follow Existing Patterns**: Always check existing code before implementing new features
2. **Server Actions First**: Use Server Actions (`"use server"`) for all data mutations
3. **Type Safety**: Use TypeScript strictly - no `any` types unless absolutely necessary
4. **RLS Policies**: All database tables have Row Level Security enabled
5. **Component Reusability**: Use existing UI components from `components/ui/`
6. **Consistent Error Handling**: Return `{ success: boolean, error?: string, data?: any }` from server actions

### 📝 Code Patterns

#### Server Actions Pattern
```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createEntity(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }
  
  // ... implementation
  
  revalidatePath("/dashboard/path")
  return { success: true, data }
}
```

#### Component Pattern
- Use Radix UI components from `components/ui/`
- Follow existing dialog/sheet patterns
- Use `react-hook-form` with `zod` for form validation
- Use `date-fns` for date formatting

#### Database Access
- Always use `createClient()` from `@/lib/supabase/server` for server-side
- Use `createClient()` from `@/lib/supabase/client` for client-side
- Never bypass RLS policies
- Use transactions for multi-table operations

### 🔒 Authentication & Authorization

- All routes are protected by middleware
- User roles: `MD`, `ED`, `Accountant`, `Head of Operations`, `Staff`
- Access control managed via `page_permissions` and `role_permissions` tables
- Check `app/actions/access-control.ts` for permission utilities

### 🗄️ Database Migrations

- All migrations are in `scripts/` directory
- Numbered sequentially (01-, 02-, etc.)
- Run migrations in order
- Never modify existing migrations - create new ones for changes

---

## Database Schema

### Core Tables

#### Profiles (Users)
- Extends Supabase `auth.users`
- Fields: `id`, `email`, `full_name`, `role`
- Roles: MD, ED, Accountant, Head of Operations, Staff

#### Vehicles
- Core fleet management
- Types: Truck, Car, Bike
- Status: Active, In Maintenance, Inactive

#### Drivers
- Driver information and assignments
- Links to vehicles via `assigned_vehicle_id`

#### Bookings
- Job/workflow management
- Status: Open, Review, Negotiation, Approved, Closed
- Auto-generated `job_id` via RPC function

#### Clients
- Customer/client information
- Links to bookings

### Feature Modules

#### Procurement
- `vendors` - Vendor information
- `clearing_agents` - Customs clearing agents
- `procurements` - Procurement orders
- `procurement_documents` - Document attachments
- `procurement_timeline` - Status tracking

#### Inventory
- `inventory_categories` - Part categories
- `inventory_parts` - Parts/spare parts
- `inventory_transactions` - Stock movements
- `stock_adjustments` - Manual adjustments

#### Maintenance
- `maintenance_logs` - Service history
- `maintenance_schedules` - Scheduled maintenance
- `maintenance_checklist` - Maintenance tasks

#### Onboarding
- `vehicle_onboarding` - New vehicle onboarding
- `onboarding_checklist_items` - Checklist items
- `vehicle_onboarding_progress` - Progress tracking

#### Compliance & Inspections
- `compliance_checklist` - Compliance requirements
- `vehicle_inspections` - Daily inspections
- `inspection_photos` - Inspection photos

#### Incidents
- `incidents` - Incident reports
- `incident_photos` - Photo attachments

#### Fuel Management
- `fuel_logs` - Fuel consumption tracking
- `fuel_stations` - Station information
- `fuel_deposits` - Fuel deposits

#### Activity & Access
- `system_activity_log` - System-wide activity tracking
- `page_permissions` - Page access definitions
- `role_permissions` - Role-based permissions

### Key Relationships

- `bookings` → `clients` (many-to-one)
- `bookings` → `vehicles` (many-to-one)
- `bookings` → `drivers` (many-to-one)
- `procurements` → `vehicles` (one-to-one, after arrival)
- `vehicle_onboarding` → `procurements` (one-to-one)
- `inventory_transactions` → `bookings`/`incidents` (polymorphic)

---

## Environment Setup

### Required Environment Variables

All environment variables are stored in `.env.local` (not committed to git).

#### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_URL` - Server-side Supabase URL
- `SUPABASE_ANON_KEY` - Server-side anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin operations)
- `SUPABASE_JWT_SECRET` - JWT secret for token validation

#### PostgreSQL
- `POSTGRES_DATABASE` - Database name
- `POSTGRES_HOST` - Database host
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_URL` - Connection string (pooled)
- `POSTGRES_URL_NON_POOLING` - Direct connection string
- `POSTGRES_PRISMA_URL` - Prisma-compatible connection string

#### Cloudflare R2
- `R2_ACCOUNT_ID` - R2 account ID
- `R2_ACCESS_KEY_ID` - Access key ID
- `R2_SECRET_ACCESS_KEY` - Secret access key
- `R2_BUCKET_NAME` - Bucket name
- `R2_PUBLIC_URL` - Public CDN URL
- `R2_UPLOAD_WORKER_URL` - Upload worker endpoint
- `R2_AUTH_KEY` - Worker authentication key

#### Vercel Blob
- `BLOB_READ_WRITE_TOKEN` - Blob storage token

### Setup Instructions

1. Clone the repository
2. Copy `.env.local` (or create from provided values)
3. Install dependencies: `pnpm install`
4. Run database migrations in order (from `scripts/` directory)
5. Start development server: `pnpm dev`

---

## Change Log

### 2024-11-23 - Environment Configuration Setup

#### Changes Made
- ✅ Pulled latest updates from remote repository
  - Updated 7 files: booking components, driver dialogs, procurement forms, trip expense dialog
  - Fast-forward merge from commit `97557e9` to `5028bda`
  
- ✅ Created `.env.local` file with all required environment variables
  - Configured Supabase credentials (public and server-side)
  - Configured PostgreSQL connection strings (pooled and non-pooled)
  - Configured Cloudflare R2 storage credentials
  - Configured Vercel Blob storage token
  - Note: `R2_ACCOUNT_ID` and `R2_AUTH_KEY` left empty (values were hidden in source)

#### Files Modified
- `.env.local` (created, not committed - in .gitignore)

#### Database Context Reviewed
- Reviewed all 35+ migration scripts to understand full schema
- Key modules identified:
  - Core fleet management (vehicles, drivers, bookings, clients)
  - Procurement workflow (vendors, clearing agents, procurement orders)
  - Inventory management (parts, transactions, stock adjustments)
  - Maintenance scheduling and logs
  - Vehicle onboarding process
  - Compliance and inspections
  - Incident reporting
  - Fuel management
  - Access control and activity logging

#### Project Architecture Understood
- Next.js 14 with App Router
- Server Actions pattern for data mutations
- Supabase for backend (PostgreSQL + Auth + Storage)
- Radix UI components for consistent UI
- Row Level Security (RLS) for data access control
- TypeScript with strict typing
- Component-based architecture with reusable UI components

#### Next Steps for Developers
1. Ensure `.env.local` is properly configured before starting development
2. Review this log before making changes
3. Follow existing patterns in `app/actions/` for new server actions
4. Use components from `components/ui/` for UI consistency
5. Check `scripts/` directory for database schema reference
6. Always test with proper authentication and role-based access

#### Important Notes
- ⚠️ Never commit `.env.local` or any `.env*` files
- ⚠️ Always pull latest changes before starting work
- ⚠️ Follow existing code patterns - don't introduce new patterns without team discussion
- ⚠️ All database changes must go through migration scripts
- ⚠️ Test RLS policies when adding new features

### 2024-11-23 - Procurement Form Section Reordering

#### Changes Made
- ✅ Fixed section order in `PostDealForm` component for "Deal Closed" status
  - **Before**: "Shipping & Tracking Information" appeared first, then "Upload Required Documents (Before Payment)"
  - **After**: "Upload Required Documents (Before Payment)" now appears first, followed by "Shipping & Tracking Information"
  - This matches the actual workflow where documents must be uploaded before shipping information

- ✅ Separated procurement workflow into two distinct stages
  - **Stage 1 - "Deal Closed"**: Shows ONLY first document upload section (MTC, Proforma Invoice, COC, Final Invoice, Receipt) with "Submit Documents & Mark as Paid" button
  - **Stage 2 - "Paid"**: Shows ONLY `PostDealForm` with shipping documents (Bill of Lading, Packing List, Commercial Invoice) and Shipping & Tracking Information
  - **Before**: Both sections were showing simultaneously when "Deal Closed"
  - **After**: Each stage shows only its relevant section, following the correct workflow sequence

#### Files Modified
- `components/procurement/post-deal-form.tsx`
  - Reordered sections in the "Deal Closed" status form
  - Moved document upload section above shipping information section
  - Maintained all existing functionality and validation

- `components/procurement/procurement-detail-sheet.tsx`
  - Removed `PostDealForm` from "Deal Closed" status - now shows only first document upload section
  - "Deal Closed" status: Shows document upload (MTC, Proforma, COC, Final Invoice, Receipt) → "Submit Documents & Mark as Paid"
  - "Paid" status: Shows `PostDealForm` (Bill of Lading, Packing List, Commercial Invoice, Shipping & Tracking)
  - Maintained existing "Payment Pending" status functionality

#### Technical Details
- Changed the visual order of sections within the same form component
- Added document upload UI to "Deal Closed" status (previously only in "Payment Pending")
- No changes to data structure or API calls
- All form validation and submission logic remains unchanged
- Visual separation maintained with spacing and dividers

- ✅ Fixed status transition after saving shipping details
  - **Before**: Saving shipping details set status to "Payment Pending" (incorrect)
  - **After**: Saving shipping details sets status to "In Transit" (correct)
  - Updated button text: "Save Shipping Details & Mark as In Transit"
  - Updated toast message to reflect correct status
  - **Workflow**: "Paid" → Save Shipping Details → "In Transit" → Mark as Arrived → "Arrived" → Assign Clearing Agent → "Clearing"

#### Files Modified (Status Transition Fix)
- `app/actions/procurement.ts`
  - Changed status update from "Payment Pending" to "In Transit" when shipping details are saved
- `components/procurement/post-deal-form.tsx`
  - Updated button text to "Save Shipping Details & Mark as In Transit"
  - Updated success toast message

- ✅ Fixed upload functionality and document display
  - **Upload Method Fix**: Changed from POST with FormData to PUT with file body (matches worker.js implementation)
  - **Document View**: Added "View" button alongside "Download" button for PDF documents
  - **Clearing Documents**: Verified clearing has 3 document uploads (Customs Duty Receipt, Release Order, TDO)
  - **Received By Field**: Confirmed "Received By (From Clearing Agent)" field exists in clearing form
  - **Document Storage**: All documents are saved to `procurement_documents` table and displayed in Documents tab
  - **Worker Configuration**: Upload uses Cloudflare R2 Worker with proper CORS and authentication

- ✅ Reorganized procurement document uploads by stage
  - **Deal Closed Stage**: Now includes 7 documents
    - Manufacturer's Test Certificate (MTC)
    - Proforma Invoice *
    - Certificate of Conformity (COC)
    - Form M (NEW)
    - SONCAP (NEW)
    - NADDC (NEW)
    - Invoice
    - **Removed**: Receipt (moved to Paid stage), Final Invoice (renamed to Invoice)
  - **Paid Stage**: Now includes 4 documents
    - Bill of Lading *
    - Packing List *
    - Commercial Invoice (Final) *
    - Receipt * (moved from Deal Closed)
  - **Database**: No migration needed - `document_type` is TEXT field, new types can be used directly

#### Files Modified (Upload & Document Display Fix)
- `components/procurement/procurement-detail-sheet.tsx`
  - Fixed upload method to use PUT with Bearer token (matches worker.js)
  - Added View button for documents (opens in new tab)
  - Fixed function call signatures (negotiateProcurement, addShippingInfo)
  - Documents displayed in Documents tab with View and Download options

#### Files Modified (Document Reorganization)
- `components/procurement/procurement-detail-sheet.tsx`
  - Added state variables for Form M, SONCAP, NADDC
  - Removed Receipt from Deal Closed stage
  - Updated Deal Closed stage to show 7 documents (MTC, Proforma, COC, Form M, SONCAP, NADDC, Invoice)
  - Updated upload handler to include new document types
  - Removed Receipt from Payment Pending section
- `components/procurement/post-deal-form.tsx`
  - Added Receipt upload field to Paid stage
  - Receipt now appears alongside Bill of Lading, Packing List, Commercial Invoice

#### Upload Workflow Confirmation
1. **Deal Closed Stage**: Documents uploaded via worker → saved to `procurement_documents` table
2. **Paid Stage**: Shipping documents (Bill of Lading, Packing List, Commercial Invoice) uploaded via worker
3. **Clearing Stage**: Clearing documents (Customs Duty Receipt, Release Order, TDO) uploaded via worker
4. **All Documents**: Displayed in Documents tab with View (open in new tab) and Download options
5. **Received By**: When clearing is completed, "Received By (From Clearing Agent)" field captures who received the vehicle

#### Worker.js Implementation
- Uses Cloudflare R2 Worker for file uploads
- Supports PUT method with Bearer token authentication
- CORS enabled for cross-origin requests
- Files stored in organized folders: `procurement-documents/{procurementId}/`
- Returns public URL for document access

---

## Collaboration Guidelines

### Before Starting Work
1. Pull latest changes: `git pull origin main`
2. Read this development log
3. Review related code in the codebase
4. Check existing patterns for similar features

### Making Changes
1. Create feature branch: `git checkout -b feature/your-feature-name`
2. Follow existing code patterns
3. Write clear commit messages
4. Test thoroughly before committing

### Committing Changes
1. Stage changes: `git add .`
2. Commit with clear message: `git commit -m "feat: description of change"`
3. Push to remote: `git push origin feature/your-feature-name`
4. Update this log with your changes

### Commit Message Format
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `chore:` - Maintenance tasks

### After Completing Work
1. Update this `DEVELOPMENT_LOG.md` with your changes
2. Create pull request with clear description
3. Reference related issues/tickets
4. Ensure all tests pass

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Radix UI Components](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Questions or Issues?

If you encounter any issues or have questions:
1. Check this log first
2. Review existing code patterns
3. Check database migrations for schema questions
4. Consult with the team before making architectural changes

---

**Last Updated:** 2024-11-23 (Procurement Form Fix)  
**Maintained By:** Development Team

