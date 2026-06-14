import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DeleteProductButton } from "@/components/admin/delete-product-button"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

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

              <h1 className="mt-2 text-4xl font-bold">Manage Products</h1>

              <p className="mt-3 text-muted-foreground">
                Add, import, edit, delete, and manage products for the white-c catalog.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/products/import"
                className="rounded-xl border px-5 py-3 font-semibold hover:bg-muted"
              >
                Import CSV
              </Link>

              <Link
                href="/admin/products/new"
                className="rounded-xl bg-black px-5 py-3 font-semibold text-white"
              >
                Add Product
              </Link>
            </div>
          </div>

          {error && (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              {error.message}
            </div>
          )}

          <div className="mt-10 overflow-x-auto rounded-3xl border">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead className="bg-muted">
                <tr>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Budget</th>
                  <th className="p-4">MOQ</th>
                  <th className="p-4">Active</th>
                  <th className="p-4">Featured</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products && products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id} className="border-t">
                      <td className="p-4 text-muted-foreground">{product.sku || "-"}</td>
                      <td className="p-4 font-medium">{product.name}</td>
                      <td className="p-4 text-muted-foreground">{product.category}</td>
                      <td className="p-4 text-muted-foreground">{product.budget_band}</td>
                      <td className="p-4 text-muted-foreground">{product.moq || "-"}</td>
                      <td className="p-4">{product.is_active ? "Yes" : "No"}</td>
                      <td className="p-4">{product.is_featured ? "Yes" : "No"}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
                          >
                            Edit
                          </Link>

                          <DeleteProductButton productId={product.id} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-6 text-muted-foreground" colSpan={8}>
                      No products added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}