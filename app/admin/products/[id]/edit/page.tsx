"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { supabase } from "@/lib/supabase"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState("")
  const [product, setProduct] = useState<any>(null)

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single()

      if (error) {
        setError(error.message)
      } else {
        setProduct(data)
      }

      setPageLoading(false)
    }

    if (productId) fetchProduct()
  }, [productId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)

    setLoading(true)
    setError("")

    const payload = {
      name: formData.get("name"),
      category: formData.get("category"),
      budget_band: formData.get("budget_band"),
      occasion: formData.get("occasion"),
      recipient_type: formData.get("recipient_type"),
      material: formData.get("material"),
      moq: formData.get("moq"),
      branding_available: formData.get("branding_available"),
      lead_time: formData.get("lead_time"),
      description: formData.get("description"),
      image_url: formData.get("image_url"),
      is_active: formData.get("is_active") === "on",
      is_featured: formData.get("is_featured") === "on",
    }

    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", productId)

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push("/admin/products")
    router.refresh()
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <p>Loading product...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <p className="text-red-600">Product not found.</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Admin Portal
          </p>

          <h1 className="mt-2 text-4xl font-bold">Edit Product</h1>

          <p className="mt-3 text-muted-foreground">
            Update this product in the white-c catalog.
          </p>

          <form className="mt-10 grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <input
                name="name"
                defaultValue={product.name || ""}
                className="rounded-xl border bg-background p-4"
                placeholder="Product name"
                required
              />

              <input
                name="category"
                defaultValue={product.category || ""}
                className="rounded-xl border bg-background p-4"
                placeholder="Category e.g. Drinkware, Apparel"
                required
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <select
                name="budget_band"
                defaultValue={product.budget_band || ""}
                className="rounded-xl border bg-background p-4"
                required
              >
                <option value="">Select budget band</option>
                <option>Under ₹250</option>
                <option>₹250–₹500</option>
                <option>₹500–₹1000</option>
                <option>₹1000+</option>
              </select>

              <input
                name="moq"
                defaultValue={product.moq || ""}
                className="rounded-xl border bg-background p-4"
                placeholder="MOQ e.g. 100 units"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <input
                name="occasion"
                defaultValue={product.occasion || ""}
                className="rounded-xl border bg-background p-4"
                placeholder="Occasion e.g. Diwali, onboarding"
              />

              <input
                name="recipient_type"
                defaultValue={product.recipient_type || ""}
                className="rounded-xl border bg-background p-4"
                placeholder="Recipient type e.g. employees, clients"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <input
                name="material"
                defaultValue={product.material || ""}
                className="rounded-xl border bg-background p-4"
                placeholder="Material e.g. steel, cotton, paper"
              />

              <input
                name="lead_time"
                defaultValue={product.lead_time || ""}
                className="rounded-xl border bg-background p-4"
                placeholder="Lead time e.g. 7–12 days"
              />
            </div>

            <input
              name="branding_available"
              defaultValue={product.branding_available || ""}
              className="rounded-xl border bg-background p-4"
              placeholder="Branding option e.g. logo printing available"
            />

            <input
              name="image_url"
              defaultValue={product.image_url || ""}
              className="rounded-xl border bg-background p-4"
              placeholder="Image URL for now"
            />

            <textarea
              name="description"
              defaultValue={product.description || ""}
              className="min-h-36 rounded-xl border bg-background p-4"
              placeholder="Short product description"
            />

            <div className="flex flex-wrap gap-6 rounded-2xl border p-5">
              <label className="flex items-center gap-2">
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked={product.is_active}
                />
                <span>Active</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  name="is_featured"
                  type="checkbox"
                  defaultChecked={product.is_featured}
                />
                <span>Featured</span>
              </label>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-fit rounded-xl bg-black px-6 py-4 text-base font-semibold text-white transition hover:bg-black/90 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}