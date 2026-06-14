"use client"

import { useState } from "react"
import Link from "next/link"
import Papa from "papaparse"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { supabase } from "@/lib/supabase"

type CsvRow = {
  brand?: string
  name?: string
  category?: string
  budget_band?: string
  occasion?: string
  recipient_type?: string
  use_case?: string
  industry?: string
  material?: string
  brandable_area?: string
  packaging?: string
  logistics_type?: string
  delivery_window?: string
  moq?: string
  lead_time?: string
  color_options?: string
  tags?: string
  description?: string
  image_url?: string
  is_active?: string
  is_featured?: string
}

type ProductImportRow = {
  sku: string
  brand: string | null
  name: string
  category: string
  budget_band: string
  occasion: string | null
  recipient_type: string | null
  use_case: string | null
  industry: string | null
  material: string | null
  brandable_area: string | null
  packaging: string | null
  logistics_type: string | null
  delivery_window: string | null
  moq: string | null
  lead_time: string | null
  color_options: string | null
  tags: string | null
  description: string | null
  image_url: string | null
  is_active: boolean
  is_featured: boolean
}

function cleanText(value: unknown) {
  const text = String(value || "").trim()
  return text.length > 0 ? text : null
}

function convertToBoolean(value: unknown, defaultValue: boolean) {
  if (typeof value === "boolean") return value
  if (!value) return defaultValue

  const cleaned = String(value).trim().toLowerCase()

  if (["true", "yes", "1", "active"].includes(cleaned)) return true
  if (["false", "no", "0", "inactive"].includes(cleaned)) return false

  return defaultValue
}

function createSku(row: CsvRow) {
  const rawSku = [
    row.name,
    row.category,
    row.budget_band,
    row.material,
    row.brand,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join("-")

  return rawSku
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function ImportProductsPage() {
  const [rows, setRows] = useState<ProductImportRow[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    setMessage("")
    setError("")
    setRows([])

    if (!file) return

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleanedRows: ProductImportRow[] = results.data
          .filter(
            (row) =>
                row.name &&
                row.category &&
                row.budget_band &&
                row.occasion &&
                row.recipient_type &&
                row.use_case &&
                row.industry &&
                row.tags
            )
          .map((row) => ({
            sku: createSku(row),
            brand: cleanText(row.brand),
            name: String(row.name || "").trim(),
            category: String(row.category || "").trim(),
            budget_band: String(row.budget_band || "").trim(),
            occasion: cleanText(row.occasion),
            recipient_type: cleanText(row.recipient_type),
            use_case: cleanText(row.use_case),
            industry: cleanText(row.industry),
            material: cleanText(row.material),
            brandable_area: cleanText(row.brandable_area),
            packaging: cleanText(row.packaging),
            logistics_type: cleanText(row.logistics_type),
            delivery_window: cleanText(row.delivery_window),
            moq: cleanText(row.moq),
            lead_time: cleanText(row.lead_time),
            color_options: cleanText(row.color_options),
            tags: cleanText(row.tags),
            description: cleanText(row.description),
            image_url: cleanText(row.image_url),
            is_active: convertToBoolean(row.is_active, true),
            is_featured: convertToBoolean(row.is_featured, false),
          }))
          .filter((row) => row.sku)

        setRows(cleanedRows)

        if (cleanedRows.length === 0) {
          setError(
            "No valid rows found. Make sure name, category, budget_band, occasion, recipient_type, use_case, industry, and tags columns are present."
          )
        }
      },
      error: (err) => {
        setError(err.message)
      },
    })
  }

  async function handleImport() {
    if (rows.length === 0) {
      setError("Please upload a valid CSV first.")
      return
    }

    setLoading(true)
    setError("")
    setMessage("")

    const { error } = await supabase
      .from("products")
      .upsert(rows, { onConflict: "sku" })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage(`${rows.length} products imported/updated successfully.`)
    setRows([])
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Admin Portal
              </p>

              <h1 className="mt-2 text-4xl font-bold">Import Products</h1>

              <p className="mt-3 text-muted-foreground">
                Upload a CSV exported from Google Sheets to bulk add or update products in the white-c catalog.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/templates/white-c-google-sheet-product-import-fields-template.xlsx"
                download
                className="rounded-xl border px-5 py-3 font-semibold hover:bg-muted"
              >
                Download Template
              </a>

              <Link
                href="/admin/products"
                className="rounded-xl border px-5 py-3 font-semibold hover:bg-muted"
              >
                Back to Products
              </Link>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border bg-card p-6">
            <h2 className="text-2xl font-semibold">CSV format</h2>

            <p className="mt-3 text-muted-foreground">
              Download the Excel template, open it in Google Sheets, fill products, then export as CSV and upload here.
            </p>

            <div className="mt-5 overflow-x-auto rounded-2xl bg-muted p-4 text-sm">
              <code>
                brand, name, category, budget_band, occasion, recipient_type,
                use_case, industry, material, brandable_area, packaging,
                logistics_type, delivery_window, moq, lead_time, color_options,
                tags, description, image_url, is_active, is_featured
              </code>
            </div>

            <div className="mt-5 rounded-2xl border bg-muted/40 p-5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How import works:</p>

              <p className="mt-2">
                SKU is generated automatically using name, category, budget band,
                material, and brand. If the generated SKU already exists, that
                product will be updated. If it is new, a new product will be created.
              </p>

              <p className="mt-2">
                Required fields: name, category, budget_band, and material.
              </p>
            </div>

            <div className="mt-8 grid gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="rounded-xl border bg-background p-4"
              />

              {rows.length > 0 && (
                <div className="rounded-2xl border bg-secondary p-5">
                  <p className="font-semibold">{rows.length} valid products found.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review the preview below, then click Import Products.
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-2xl border bg-green-50 p-5 text-green-700">
                  {message}
                </div>
              )}

              <button
                type="button"
                onClick={handleImport}
                disabled={loading || rows.length === 0}
                className="w-fit rounded-xl bg-black px-6 py-4 text-base font-semibold text-white transition hover:bg-black/90 disabled:opacity-60"
              >
                {loading ? "Importing..." : "Import Products"}
              </button>
            </div>
          </div>

          {rows.length > 0 && (
            <div className="mt-10 overflow-x-auto rounded-3xl border">
              <table className="w-full min-w-[1500px] border-collapse text-left">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-4">Auto SKU</th>
                    <th className="p-4">Brand</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Budget</th>
                    <th className="p-4">Occasion</th>
                    <th className="p-4">Recipient</th>
                    <th className="p-4">Use Case</th>
                    <th className="p-4">Industry</th>
                    <th className="p-4">Material</th>
                    <th className="p-4">MOQ</th>
                    <th className="p-4">Lead Time</th>
                    <th className="p-4">Tags</th>
                    <th className="p-4">Active</th>
                    <th className="p-4">Featured</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.slice(0, 20).map((row, index) => (
                    <tr key={`${row.sku}-${index}`} className="border-t">
                      <td className="max-w-[220px] truncate p-4 text-muted-foreground">
                        {row.sku}
                      </td>
                      <td className="p-4 text-muted-foreground">{row.brand || "-"}</td>
                      <td className="p-4 font-medium">{row.name}</td>
                      <td className="p-4 text-muted-foreground">{row.category}</td>
                      <td className="p-4 text-muted-foreground">{row.budget_band}</td>
                      <td className="p-4 text-muted-foreground">{row.occasion || "-"}</td>
                      <td className="p-4 text-muted-foreground">{row.recipient_type || "-"}</td>
                      <td className="p-4 text-muted-foreground">{row.use_case || "-"}</td>
                      <td className="p-4 text-muted-foreground">{row.industry || "-"}</td>
                      <td className="p-4 text-muted-foreground">{row.material || "-"}</td>
                      <td className="p-4 text-muted-foreground">{row.moq || "-"}</td>
                      <td className="p-4 text-muted-foreground">{row.lead_time || "-"}</td>
                      <td className="max-w-[180px] truncate p-4 text-muted-foreground">
                        {row.tags || "-"}
                      </td>
                      <td className="p-4">{row.is_active ? "Yes" : "No"}</td>
                      <td className="p-4">{row.is_featured ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {rows.length > 20 && (
                <div className="border-t p-4 text-sm text-muted-foreground">
                  Showing first 20 rows only. All {rows.length} rows will be imported or updated.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}