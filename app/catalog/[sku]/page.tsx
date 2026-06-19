import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AddToInquiryButton } from "@/components/inquiry/add-to-inquiry-button"
import { supabase } from "@/lib/supabase"

type ProductPageProps = {
  params: Promise<{
    sku: string
  }>
}

type Product = {
  id: string
  sku: string
  brand: string | null
  name: string
  category: string | null
  budget_band: string | null
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
  image_filename: string | null
  is_active: boolean
}

type ProductImage = {
  id: string
  product_sku: string
  image_url: string
  image_filename: string | null
  image_type: string | null
  sort_order: number | null
}

type ProductFeature = {
  id: string
  product_sku: string
  feature_text: string
  sort_order: number | null
}

function splitTags(tags: string | null) {
  if (!tags) return []

  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { sku } = await params

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("sku", sku)
    .eq("is_active", true)
    .single<Product>()

  if (productError || !product) {
    notFound()
  }

  const { data: images } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_sku", product.sku)
    .order("sort_order", { ascending: true })
    .returns<ProductImage[]>()

  const { data: features } = await supabase
    .from("product_features")
    .select("*")
    .eq("product_sku", product.sku)
    .order("sort_order", { ascending: true })
    .returns<ProductFeature[]>()

  const galleryImages =
    images && images.length > 0
      ? images
      : product.image_url
        ? [
            {
              id: "fallback-main-image",
              product_sku: product.sku,
              image_url: product.image_url,
              image_filename: product.image_filename,
              image_type: "main",
              sort_order: 1,
            },
          ]
        : []

  const tags = splitTags(product.tags)

  const specs = [
    { label: "Brand", value: product.brand },
    { label: "Category", value: product.category },
    { label: "Budget", value: product.budget_band },
    { label: "Occasion", value: product.occasion },
    { label: "Recipient", value: product.recipient_type },
    { label: "Use Case", value: product.use_case },
    { label: "Industry", value: product.industry },
    { label: "Material", value: product.material },
    { label: "Brandable Area", value: product.brandable_area },
    { label: "Packaging", value: product.packaging },
    { label: "MOQ", value: product.moq },
    { label: "Lead Time", value: product.lead_time },
    { label: "Delivery", value: product.delivery_window },
    { label: "Logistics", value: product.logistics_type },
    { label: "Colour Options", value: product.color_options },
  ].filter((item) => item.value)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/catalog"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            ← Back to catalog
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <section>
              <div className="overflow-hidden rounded-3xl border bg-white">
                {galleryImages[0]?.image_url ? (
                  <div className="relative aspect-[4/3] w-full bg-white">
                    <Image
                      src={galleryImages[0].image_url}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-contain p-6"
                      priority
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-muted text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>

              {galleryImages.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {galleryImages.slice(1).map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-square overflow-hidden rounded-2xl border bg-white"
                    >
                      <Image
                        src={image.image_url}
                        alt={product.name}
                        fill
                        sizes="160px"
                        className="object-contain p-3"
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="rounded-3xl border bg-card p-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {product.brand || "white-c"} · {product.category || "Product"}
                </p>

                <h1 className="mt-3 text-4xl font-bold tracking-tight">
                  {product.name}
                </h1>

                {product.description && (
                  <p className="mt-5 text-lg leading-8 text-muted-foreground">
                    {product.description}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-2">
                  {product.budget_band && (
                    <span className="rounded-full bg-muted px-4 py-2 text-sm font-medium">
                      {product.budget_band}
                    </span>
                  )}

                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-4 py-2 text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <AddToInquiryButton
                    product={{
                      id: product.id,
                      name: product.name,
                      brand: product.brand,
                      category: product.category,
                      budget_band: product.budget_band,
                      image_url: product.image_url,
                    }}
                  />

                  <Link
                    href="/inquiry"
                    className="rounded-xl border px-5 py-3 font-semibold hover:bg-muted"
                  >
                    Request Quote
                  </Link>
                </div>
              </div>

              {features && features.length > 0 && (
                <div className="mt-6 rounded-3xl border bg-card p-8">
                  <h2 className="text-2xl font-bold">Product Features</h2>

                  <ul className="mt-5 space-y-3">
                    {features.map((feature) => (
                      <li
                        key={feature.id}
                        className="flex gap-3 text-muted-foreground"
                      >
                        <span className="mt-1 h-2 w-2 rounded-full bg-foreground" />
                        <span>{feature.feature_text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {specs.length > 0 && (
                <div className="mt-6 rounded-3xl border bg-card p-8">
                  <h2 className="text-2xl font-bold">Specifications</h2>

                  <div className="mt-5 grid gap-3">
                    {specs.map((spec) => (
                      <div
                        key={spec.label}
                        className="grid grid-cols-[150px_1fr] gap-4 rounded-2xl bg-muted/60 p-4"
                      >
                        <span className="font-semibold">{spec.label}</span>
                        <span className="text-muted-foreground">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}