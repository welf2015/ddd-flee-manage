// Spreadsheet utility functions for cell references and formulas

export interface CellData {
  id: string
  value: string | number
  formula: string
}

export interface RowData {
  id: string
  cells: CellData[]
}

// Convert column index to letter (0 -> A, 1 -> B, etc.)
export function getColumnLetter(index: number): string {
  let letter = ""
  while (index >= 0) {
    letter = String.fromCharCode(65 + (index % 26)) + letter
    index = Math.floor(index / 26) - 1
  }
  return letter
}

// Convert cell ID (e.g., "1-1") to reference (e.g., "A1")
export function getCellReference(cellId: string): string {
  const [row, col] = cellId.split("-").map((num) => Number.parseInt(num) - 1)
  return `${getColumnLetter(col)}${row + 1}`
}

// Convert cell reference (e.g., "A1") to ID (e.g., "1-1")
export function getCellId(reference: string): string {
  const match = reference.match(/^([A-Z]+)(\d+)$/)
  if (!match) return "1-1"

  const col = match[1]
  const row = Number.parseInt(match[2])

  let colIndex = 0
  for (let i = 0; i < col.length; i++) {
    colIndex = colIndex * 26 + (col.charCodeAt(i) - 64)
  }

  return `${row}-${colIndex}`
}

// Evaluate a formula or return the value
export function evaluateFormula(formula: string, getCellValue: (ref: string) => string | number): string | number {
  if (!formula) return ""

  // If it starts with =, it's a formula
  if (formula.toString().startsWith("=")) {
    try {
      const expression = formula.substring(1)
      // Replace cell references with their values
      const evaluated = expression.replace(/[A-Z]+\d+/g, (ref) => {
        const value = getCellValue(ref)
        return typeof value === "number" ? value.toString() : `"${value}"`
      })

      // Evaluate the expression
      return eval(evaluated)
    } catch (error) {
      return "#ERROR!"
    }
  }

  return formula
}
