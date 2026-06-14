import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function CatalogPage() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Corporate Gift Catalog
              </p>

              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                Browse gifts by budget, category, and use case.
              </h1>

              <p className="mt-5 text-lg text-muted-foreground">
                Explore curated corporate gifting ideas without public pricing. Select items, share your requirement, and get a custom quote.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {[
                "Under ₹250",
                "₹250–₹500",
                "₹500–₹1000",
                "₹1000+",
                "Drinkware",
                "Diaries",
                "Tech Accessories",
                "Hampers",
              ].map((filter) => (
                <span
                  key={filter}
                  className="rounded-full border px-4 py-2 text-sm text-muted-foreground"
                >
                  {filter}
                </span>
              ))}
            </div>

            {error && (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                {error.message}
              </div>
            )}

            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products && products.length > 0 ? (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-3xl border bg-card p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="mb-5 flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-muted">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Product Image
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {product.category}
                      </p>

                      <h2 className="text-xl font-semibold">{product.name}</h2>

                      <p className="text-sm text-muted-foreground">
                        {product.occasion || "Suitable for corporate gifting"}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-3">
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                          {product.budget_band}
                        </span>

                        {product.moq && (
                          <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                            {product.moq}
                          </span>
                        )}

                        {product.lead_time && (
                          <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                            {product.lead_time}
                          </span>
                        )}
                      </div>

                      {product.branding_available && (
                        <p className="pt-2 text-sm text-muted-foreground">
                          {product.branding_available}
                        </p>
                      )}

                      {product.description && (
                        <p className="pt-2 text-sm text-muted-foreground">
                          {product.description}
                        </p>
                      )}

                      <div className="flex gap-3 pt-5">
                        <Link href="/inquiry">
                          <Button>Add to Inquiry</Button>
                        </Link>

                        <Link href="/inquiry">
                          <Button variant="outline">Request Quote</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-3xl border bg-muted p-10 text-center">
                  <h2 className="text-2xl font-semibold">No products found</h2>
                  <p className="mt-2 text-muted-foreground">
                    Add active products from the admin portal to show them here.
                  </p>
                  <Link href="/admin/products/new">
                    <Button className="mt-6">Add Product</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}