import { Suspense } from "react"
import DriverExpensesClient from "./driver-expenses-client"

export default function DriverExpensesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DriverExpensesClient />
    </Suspense>
  )
}
