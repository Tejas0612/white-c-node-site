"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

type ExtractedProduct = {
  brand: string
  name: string
  category: string
  budget_band: string
  occasion: string
  recipient_type: string
  use_case: string
  industry: string
  material: string | null
  brandable_area: string | null
  packaging: string | null
  logistics_type: string | null
  delivery_window: string | null
  moq: string | null
  lead_time: string | null
  color_options: string | null
  tag_1: string
  tag_2: string | null
  tag_3: string | null
  tag_4: string | null
  tag_5: string | null
  description: string
  image_url?: string | null
  image_filename?: string | null
  source_brochure: string
  source_page: string
  source_position: string
  is_active: boolean
  is_featured: boolean
}

export default function BrochureImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [brand, setBrand] = useState("FUZO")
  const [brochureName, setBrochureName] = useState("FUZO Catalogue May 2026")
  const [startPage, setStartPage] = useState("2")
  const [endPage, setEndPage] = useState("5")
  const [products, setProducts] = useState<ExtractedProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function handleExtract() {
    if (!file) {
      setError("Please upload a brochure PDF first.")
      return
    }

    setLoading(true)
    setError("")
    setMessage("")
    setProducts([])

    const formData = new FormData()
    formData.append("file", file)
    formData.append("brand", brand)
    formData.append("brochureName", brochureName)
    formData.append("startPage", startPage)
    formData.append("endPage", endPage)

    try {
      const response = await fetch("/api/admin/brochure/extract", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.message || "Could not extract brochure.")
        return
      }

      setProducts(result.products || [])
      setMessage(`${result.products?.length || 0} products extracted.`)
    } catch {
      setError("Something went wrong while extracting brochure.")
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    if (products.length === 0) {
      setError("No products to import.")
      return
    }

    setImporting(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/admin/brochure/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ products }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.message || "Could not import products.")
        return
      }

      setMessage(`${result.count || products.length} products imported successfully.`)
    } catch {
      setError("Something went wrong while importing products.")
    } finally {
      setImporting(false)
    }
  }

  function updateProduct(index: number, field: keyof ExtractedProduct, value: string) {
    const updated = [...products]

    updated[index] = {
      ...updated[index],
      [field]: value,
    }

    setProducts(updated)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Admin Portal
          </p>

          <h1 className="mt-2 text-4xl font-bold">Brochure Import</h1>

          <p className="mt-3 max-w-3xl text-muted-foreground">
            Upload a brochure PDF, extract product data with images, review the rows,
            and import directly into the catalog.
          </p>

          <div className="mt-10 rounded-3xl border bg-card p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <input
                className="rounded-xl border bg-background p-4"
                placeholder="Brand e.g. FUZO"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
              />

              <input
                className="rounded-xl border bg-background p-4"
                placeholder="Brochure name"
                value={brochureName}
                onChange={(event) => setBrochureName(event.target.value)}
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <input
                type="file"
                accept="application/pdf"
                className="rounded-xl border bg-background p-4"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />

              <input
                className="rounded-xl border bg-background p-4"
                placeholder="Start page"
                value={startPage}
                onChange={(event) => setStartPage(event.target.value)}
              />

              <input
                className="rounded-xl border bg-background p-4"
                placeholder="End page"
                value={endPage}
                onChange={(event) => setEndPage(event.target.value)}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExtract}
                disabled={loading}
                className="rounded-xl bg-black px-6 py-4 font-semibold text-white transition hover:bg-black/90 disabled:opacity-60"
              >
                {loading ? "Extracting..." : "Extract Products"}
              </button>

              <button
                type="button"
                onClick={handleImport}
                disabled={importing || products.length === 0}
                className="rounded-xl border px-6 py-4 font-semibold hover:bg-muted disabled:opacity-60"
              >
                {importing ? "Importing..." : "Import Products"}
              </button>
            </div>

            {message && (
              <div className="mt-5 rounded-2xl border bg-green-50 p-5 text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                {error}
              </div>
            )}
          </div>

          {products.length > 0 && (
            <div className="mt-10 overflow-x-auto rounded-3xl border">
              <table className="w-full min-w-[1800px] border-collapse text-left">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-4">Page</th>
                    <th className="p-4">Pos</th>
                    <th className="p-4">Image</th>
                    <th className="p-4">Brand</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Budget</th>
                    <th className="p-4">Occasion</th>
                    <th className="p-4">Recipient</th>
                    <th className="p-4">Use Case</th>
                    <th className="p-4">Industry</th>
                    <th className="p-4">Material</th>
                    <th className="p-4">Tags</th>
                    <th className="p-4">Description</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product, index) => (
                    <tr key={`${product.source_page}-${product.source_position}`} className="border-t">
                      <td className="p-4">{product.source_page}</td>
                      <td className="p-4">{product.source_position}</td>

                      <td className="p-4">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">No image</span>
                        )}
                      </td>

                      <td className="p-4">{product.brand}</td>

                      <td className="p-4">
                        <input
                          className="w-48 rounded-lg border bg-background p-2"
                          value={product.name}
                          onChange={(event) =>
                            updateProduct(index, "name", event.target.value)
                          }
                        />
                      </td>

                      <td className="p-4">
                        <input
                          className="w-44 rounded-lg border bg-background p-2"
                          value={product.category}
                          onChange={(event) =>
                            updateProduct(index, "category", event.target.value)
                          }
                        />
                      </td>

                      <td className="p-4">
                        <input
                          className="w-36 rounded-lg border bg-background p-2"
                          value={product.budget_band}
                          onChange={(event) =>
                            updateProduct(index, "budget_band", event.target.value)
                          }
                        />
                      </td>

                      <td className="p-4">
                        <input
                          className="w-44 rounded-lg border bg-background p-2"
                          value={product.occasion}
                          onChange={(event) =>
                            updateProduct(index, "occasion", event.target.value)
                          }
                        />
                      </td>

                      <td className="p-4">
                        <input
                          className="w-44 rounded-lg border bg-background p-2"
                          value={product.recipient_type}
                          onChange={(event) =>
                            updateProduct(index, "recipient_type", event.target.value)
                          }
                        />
                      </td>

                      <td className="p-4">
                        <input
                          className="w-48 rounded-lg border bg-background p-2"
                          value={product.use_case}
                          onChange={(event) =>
                            updateProduct(index, "use_case", event.target.value)
                          }
                        />
                      </td>

                      <td className="p-4">
                        <input
                          className="w-36 rounded-lg border bg-background p-2"
                          value={product.industry}
                          onChange={(event) =>
                            updateProduct(index, "industry", event.target.value)
                          }
                        />
                      </td>

                      <td className="p-4">
                        <input
                          className="w-40 rounded-lg border bg-background p-2"
                          value={product.material || ""}
                          onChange={(event) =>
                            updateProduct(index, "material", event.target.value)
                          }
                        />
                      </td>

                      <td className="p-4">
                        <input
                          className="w-52 rounded-lg border bg-background p-2"
                          value={[product.tag_1, product.tag_2, product.tag_3]
                            .filter(Boolean)
                            .join(", ")}
                          readOnly
                        />
                      </td>

                      <td className="p-4">
                        <textarea
                          className="h-20 w-80 rounded-lg border bg-background p-2"
                          value={product.description}
                          onChange={(event) =>
                            updateProduct(index, "description", event.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}