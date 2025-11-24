export const SYSTEM_ROLES = [
  "MD",
  "ED",
  "Head of Operations",
  "Operations and Fleet Officer",
  "Accountant",
  "Staff",
] as const

export type SystemRole = (typeof SYSTEM_ROLES)[number]

export type SettingsTabKey = "profile" | "drivers" | "staff" | "access-control" | "notifications"

export const SETTINGS_TAB_ACCESS: Record<SettingsTabKey, SystemRole[]> = {
  profile: SYSTEM_ROLES,
  drivers: ["MD", "ED", "Head of Operations", "Operations and Fleet Officer"],
  staff: ["MD", "ED", "Head of Operations", "Operations and Fleet Officer", "Accountant"],
  "access-control": ["MD", "ED", "Head of Operations"],
  notifications: ["MD", "ED", "Head of Operations", "Operations and Fleet Officer", "Accountant", "Staff"],
}

export const ROLE_SETTINGS_SUMMARY: Array<{
  role: SystemRole
  highlights: string[]
}> = [
  {
    role: "MD",
    highlights: [
      "Full visibility across all settings tabs",
      "Can invite or deactivate users and change any role",
      "Receives negotiation, payment, and analytics notifications by default",
    ],
  },
  {
    role: "ED",
    highlights: [
      "Full visibility across all settings tabs",
      "Can approve negotiations and manage access control",
      "Shares leadership notifications with MD",
    ],
  },
  {
    role: "Head of Operations",
    highlights: [
      "Manages drivers, staff records, and role permissions",
      "Receives incident + operational alerts",
      "Cannot create or edit leadership roles",
    ],
  },
  {
    role: "Operations and Fleet Officer",
    highlights: [
      "Focuses on day-to-day driver + staff coordination",
      "Read-only access to access-control matrix",
      "Receives operational notifications but not finance approvals",
    ],
  },
  {
    role: "Accountant",
    highlights: [
      "Access to staff directory and notification preferences",
      "Can mark bookings as paid and top up prepaid accounts elsewhere in the app",
      "No access to driver management or access-control tabs",
    ],
  },
  {
    role: "Staff",
    highlights: [
      "Profile + notification preferences only",
      "No access to driver, staff, or access-control management",
    ],
  },
]
