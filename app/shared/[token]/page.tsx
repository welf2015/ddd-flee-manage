"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Lock, Download } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import type { BudgetItem, Department, Company } from "@/lib/types"

export default function SharedBudgetPage() {
  const params = useParams()
  const token = params.token as string

  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [year, setYear] = useState<number>(0)

  const verifyPassword = async () => {
    if (!password) {
      toast.error("Please enter the password")
      return
    }

    setIsVerifying(true)
    const supabase = createClient()

    try {
      // Get shared budget info
      const { data: sharedBudget, error } = await supabase
        .from("01-budgeting-shared_budgets")
        .select("*")
        .eq("share_token", token)
        .single()

      if (error || !sharedBudget) {
        toast.error("Invalid or expired share link")
        return
      }

      // Verify password (simple base64 comparison - use bcrypt in production)
      const passwordHash = btoa(password)
      if (passwordHash !== sharedBudget.password_hash) {
        toast.error("Incorrect password")
        return
      }

      // Load company info
      const { data: companyData } = await supabase
        .from("01-budgeting-companies")
        .select("*")
        .eq("id", sharedBudget.company_id)
        .single()

      // Load departments
      const { data: deptData } = await supabase
        .from("01-budgeting-departments")
        .select("*")
        .eq("company_id", sharedBudget.company_id)

      // Load budget items for the year
      const { data: budgetData } = await supabase
        .from("01-budgeting-budget_items")
        .select("*")
        .eq("company_id", sharedBudget.company_id)
        .gte("created_at", `${sharedBudget.year}-01-01`)
        .lt("created_at", `${sharedBudget.year + 1}-01-01`)
        .order("created_at", { ascending: false })

      if (companyData) setCompany(companyData)
      if (deptData) setDepartments(deptData)
      if (budgetData) setBudgetItems(budgetData)
      setYear(sharedBudget.year)
      setIsAuthenticated(true)
      toast.success("Access granted!")
    } catch (error) {
      console.error("Error verifying password:", error)
      toast.error("Failed to verify password")
    } finally {
      setIsVerifying(false)
    }
  }

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return "Uncategorized"
    const dept = departments.find((d) => d.id === deptId)
    return dept?.name || "Uncategorized"
  }

  const calculateDepartmentTotals = () => {
    const departmentMap = new Map<string, BudgetItem[]>()

    budgetItems.forEach((item) => {
      const deptId = item.department_id || "uncategorized"
      if (!departmentMap.has(deptId)) {
        departmentMap.set(deptId, [])
      }
      departmentMap.get(deptId)!.push(item)
    })

    const departmentTotals = Array.from(departmentMap.entries()).map(([deptId, items]) => {
      const monthlyTotal = items
        .filter((item) => item.billing_frequency === "Monthly")
        .reduce((sum, item) => sum + Number(item.cost_local), 0)

      const yearlyTotal = items
        .filter((item) => item.billing_frequency === "Yearly")
        .reduce((sum, item) => sum + Number(item.cost_local), 0)

      const perUseTotal = items
        .filter((item) => item.billing_frequency === "Per-Use")
        .reduce((sum, item) => sum + Number(item.cost_local), 0)

      const totalCost = monthlyTotal + yearlyTotal + perUseTotal
      const totalUsd = items.reduce((sum, item) => sum + (Number(item.cost_usd) || 0), 0)

      return {
        departmentId: deptId,
        departmentName: getDepartmentName(deptId),
        itemCount: items.length,
        monthlyTotal,
        yearlyTotal,
        perUseTotal,
        totalCost,
        totalUsd,
      }
    })

    return departmentTotals.sort((a, b) => b.totalCost - a.totalCost)
  }

  const handleExport = () => {
    if (!company) return

    const departmentTotals = calculateDepartmentTotals()
    const exportData = departmentTotals.map((dept) => ({
      Department: dept.departmentName,
      "Item Count": dept.itemCount,
      "Monthly Total (₦)": dept.monthlyTotal,
      "Yearly Total (₦)": dept.yearlyTotal,
      "Per-Use Total (₦)": dept.perUseTotal,
      "Total Cost (₦)": dept.totalCost,
      "Total Cost ($)": dept.totalUsd || "",
    }))

    const wb = XLSX.utils.book_new()
    const wsData: any[][] = [
      [`${company.name} - Budget Report`],
      [`Year: ${year}`],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [],
      [
        "Department",
        "Item Count",
        "Monthly Total (₦)",
        "Yearly Total (₦)",
        "Per-Use Total (₦)",
        "Total Cost (₦)",
        "Total Cost ($)",
      ],
      ...exportData.map((row) => [
        row.Department,
        row["Item Count"],
        row["Monthly Total (₦)"],
        row["Yearly Total (₦)"],
        row["Per-Use Total (₦)"],
        row["Total Cost (₦)"],
        row["Total Cost ($)"],
      ]),
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
    ]

    XLSX.utils.book_append_sheet(wb, ws, `Budget ${year}`)
    XLSX.writeFile(wb, `${company.name}_Budget_${year}.xlsx`)
    toast.success("Budget exported!")
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Protected Budget</CardTitle>
            <CardDescription>Enter the password to view this shared budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") verifyPassword()
                  }}
                />
              </div>
              <Button onClick={verifyPassword} disabled={isVerifying} className="w-full">
                {isVerifying ? "Verifying..." : "Access Budget"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const departmentTotals = calculateDepartmentTotals()
  const overallTotal = departmentTotals.reduce((sum, dept) => sum + dept.totalCost, 0)

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {company?.name} - Budget {year}
            </h1>
            <p className="text-muted-foreground">Shared budget view</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Departments</CardDescription>
              <CardTitle className="text-3xl">{departmentTotals.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Items</CardDescription>
              <CardTitle className="text-3xl">{budgetItems.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Budget</CardDescription>
              <CardTitle className="text-3xl">₦{overallTotal.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Budget by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Monthly (₦)</TableHead>
                    <TableHead className="text-right">Yearly (₦)</TableHead>
                    <TableHead className="text-right">Per-Use (₦)</TableHead>
                    <TableHead className="text-right">Total (₦)</TableHead>
                    <TableHead className="text-right">Total ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentTotals.map((dept) => (
                    <TableRow key={dept.departmentId}>
                      <TableCell className="font-medium">{dept.departmentName}</TableCell>
                      <TableCell className="text-center">{dept.itemCount}</TableCell>
                      <TableCell className="text-right">₦{dept.monthlyTotal.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₦{dept.yearlyTotal.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₦{dept.perUseTotal.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">₦{dept.totalCost.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {dept.totalUsd > 0 ? `$${dept.totalUsd.toLocaleString()}` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
