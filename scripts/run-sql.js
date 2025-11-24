const { Client } = require("pg")
const fs = require("fs")
const path = require("path")

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    throw new Error("Usage: node scripts/run-sql.js <path-to-sql-file>")
  }

  if (!process.env.POSTGRES_URL_NON_POOLING) {
    throw new Error("POSTGRES_URL_NON_POOLING environment variable is required")
  }

  const sql = fs.readFileSync(path.resolve(filePath), "utf8")
  const client = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING })
  await client.connect()
  await client.query(sql)
  await client.end()
  console.log(`Executed SQL from ${filePath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

