import { WorkDriveClient } from "./workdrive-client"

export const metadata = {
  title: "WorkDrive | Document Management",
  description: "Manage and organize your company documents",
}

export default function WorkDrivePage() {
  return <WorkDriveClient />
}
