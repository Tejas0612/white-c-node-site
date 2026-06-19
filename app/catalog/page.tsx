import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { AddToInquiryButton } from "@/components/inquiry/add-to-inquiry-button"

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
                Explore curated corporate gifting ideas without public pricing.
                Select items, share your requirement, and get a custom quote.
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

            <div className="mt-14 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products && products.length > 0 ? (
                products.map((product) => {
                  const productHref = `/catalog/${product.sku}`

                  return (
                    <article
                      key={product.id}
                      className="flex h-full min-h-[640px] flex-col rounded-3xl border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <Link href={productHref} className="block">
                        <div className="flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-white">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-contain p-3"
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Product Image
                            </span>
                          )}
                        </div>
                      </Link>

                      <div className="flex flex-1 flex-col pt-6">
                        <p className="min-h-[24px] text-sm font-medium text-muted-foreground">
                          {product.category || "Corporate Gift"}
                        </p>

                        <Link href={productHref} className="mt-3 block">
                          <h2 className="line-clamp-2 min-h-[64px] text-2xl font-semibold leading-tight transition hover:text-muted-foreground">
                            {product.name}
                          </h2>
                        </Link>

                        <p className="mt-3 min-h-[28px] text-base text-muted-foreground">
                          {product.occasion || "Suitable for corporate gifting"}
                        </p>

                        <div className="mt-5 flex min-h-[32px] flex-wrap gap-2">
                          {product.budget_band && (
                            <span className="rounded-full bg-secondary px-3 py-1 text-sm">
                              {product.budget_band}
                            </span>
                          )}

                          {product.moq && (
                            <span className="rounded-full bg-secondary px-3 py-1 text-sm">
                              {product.moq}
                            </span>
                          )}

                          {product.lead_time && (
                            <span className="rounded-full bg-secondary px-3 py-1 text-sm">
                              {product.lead_time}
                            </span>
                          )}
                        </div>

                        {product.branding_available && (
                          <p className="mt-4 line-clamp-1 text-sm text-muted-foreground">
                            {product.branding_available}
                          </p>
                        )}

                        <p className="mt-5 line-clamp-3 min-h-[78px] text-base leading-7 text-muted-foreground">
                          {product.description ||
                            "Explore this product for corporate gifting, employee engagement, and client appreciation requirements."}
                        </p>

                        <div className="mt-auto grid grid-cols-1 gap-3 pt-6 sm:grid-cols-3">
                          <Link href={productHref} className="w-full">
                            <Button
                              variant="outline"
                              className="h-11 w-full rounded-xl px-3 text-sm font-semibold"
                            >
                              View Details
                            </Button>
                          </Link>

                          <AddToInquiryButton
                            className="h-11 w-full rounded-xl px-3 text-sm font-semibold"
                            product={{
                              id: product.id,
                              name: product.name,
                              brand: product.brand,
                              category: product.category,
                              budget_band: product.budget_band,
                              image_url: product.image_url,
                            }}
                          />

                          <Link href="/inquiry" className="w-full">
                            <Button
                              variant="outline"
                              className="h-11 w-full rounded-xl px-3 text-sm font-semibold"
                            >
                              Quote
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                })
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