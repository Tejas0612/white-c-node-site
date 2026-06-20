import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { AddToInquiryButton } from "@/components/inquiry/add-to-inquiry-button"

export const dynamic = "force-dynamic"

type CatalogPageProps = {
  searchParams?: Promise<{
    budget?: string | string[]
    category?: string | string[]
    use_case?: string | string[]
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
  branding_available?: string | null
  is_active: boolean
}

const budgetFilters = [
  "Under ₹250",
  "₹250–₹500",
  "₹500–₹1000",
  "₹1000–₹2000",
  "₹2000–₹3000",
  "₹3000+",
]

const categoryFilters = [
  "Home & Living",
  "Tech Accessories",
  "Desk Accessories",
  "Travel Accessories",
  "Lifestyle",
  "Bags",
  "Drinkware",
  "Stationery",
  "Wellness",
]

const useCaseFilters = [
  "Employee gifting",
  "Client gifting",
  "Premium gifting",
  "Event gifting",
  "Bulk gifting",
]

function toArray(value: string | string[] | undefined) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function createFilterHref({
  budgets,
  categories,
  useCases,
}: {
  budgets: string[]
  categories: string[]
  useCases: string[]
}) {
  const params = new URLSearchParams()

  budgets.forEach((budget) => params.append("budget", budget))
  categories.forEach((category) => params.append("category", category))
  useCases.forEach((useCase) => params.append("use_case", useCase))

  const query = params.toString()

  return query ? `/catalog?${query}` : "/catalog"
}

function toggleValue(values: string[], value: string) {
  if (values.includes(value)) {
    return values.filter((item) => item !== value)
  }

  return [...values, value]
}

function normalizeText(value: unknown) {
  return String(value || "").toLowerCase().trim()
}

function productMatchesCategory(product: Product, selectedCategory: string) {
  const category = normalizeText(product.category)
  const name = normalizeText(product.name)
  const description = normalizeText(product.description)
  const tags = normalizeText(product.tags)
  const useCase = normalizeText(product.use_case)

  const combinedText = `${category} ${name} ${description} ${tags} ${useCase}`

  const selected = normalizeText(selectedCategory)

  if (selected === "desk accessories") {
    return (
      category.includes("desk") ||
      combinedText.includes("desk") ||
      combinedText.includes("lamp") ||
      combinedText.includes("pen stand") ||
      combinedText.includes("mobile stand") ||
      combinedText.includes("stationery") ||
      combinedText.includes("organizer") ||
      combinedText.includes("organiser") ||
      combinedText.includes("clock")
    )
  }

  if (selected === "tech accessories") {
    return (
      category.includes("tech") ||
      category.includes("gadgets") ||
      combinedText.includes("charger") ||
      combinedText.includes("charging") ||
      combinedText.includes("adapter") ||
      combinedText.includes("usb") ||
      combinedText.includes("power bank") ||
      combinedText.includes("wireless")
    )
  }

  if (selected === "home & living") {
    return (
      category.includes("home") ||
      combinedText.includes("lamp") ||
      combinedText.includes("kettle") ||
      combinedText.includes("clock") ||
      combinedText.includes("home")
    )
  }

  if (selected === "travel accessories") {
    return (
      category.includes("travel") ||
      combinedText.includes("travel") ||
      combinedText.includes("adapter") ||
      combinedText.includes("backpack") ||
      combinedText.includes("bag")
    )
  }

  if (selected === "bags") {
    return (
      category.includes("bag") ||
      combinedText.includes("backpack") ||
      combinedText.includes("laptop bag") ||
      combinedText.includes("travel bag")
    )
  }

  if (selected === "drinkware") {
    return (
      category.includes("drinkware") ||
      combinedText.includes("bottle") ||
      combinedText.includes("mug") ||
      combinedText.includes("tumbler") ||
      combinedText.includes("kettle")
    )
  }

  if (selected === "stationery") {
    return (
      category.includes("stationery") ||
      combinedText.includes("diary") ||
      combinedText.includes("notebook") ||
      combinedText.includes("pen")
    )
  }

  if (selected === "wellness") {
    return (
      category.includes("wellness") ||
      combinedText.includes("massager") ||
      combinedText.includes("pillow") ||
      combinedText.includes("health") ||
      combinedText.includes("therapy")
    )
  }

  return category === selected
}

function productMatchesBudget(product: Product, selectedBudget: string) {
  const productBudget = normalizeText(product.budget_band)
  const selected = normalizeText(selectedBudget)

  return productBudget === selected
}

function productMatchesUseCase(product: Product, selectedUseCase: string) {
  const productUseCase = normalizeText(product.use_case)
  const occasion = normalizeText(product.occasion)
  const description = normalizeText(product.description)
  const tags = normalizeText(product.tags)

  const combinedText = `${productUseCase} ${occasion} ${description} ${tags}`
  const selected = normalizeText(selectedUseCase)

  if (productUseCase === selected) return true

  if (selected === "employee gifting") {
    return (
      combinedText.includes("employee") ||
      combinedText.includes("onboarding") ||
      combinedText.includes("team")
    )
  }

  if (selected === "client gifting") {
    return (
      combinedText.includes("client") ||
      combinedText.includes("customer") ||
      combinedText.includes("appreciation")
    )
  }

  if (selected === "premium gifting") {
    return (
      combinedText.includes("premium") ||
      combinedText.includes("leadership") ||
      combinedText.includes("executive")
    )
  }

  if (selected === "event gifting") {
    return (
      combinedText.includes("event") ||
      combinedText.includes("conference") ||
      combinedText.includes("giveaway")
    )
  }

  if (selected === "bulk gifting") {
    return (
      combinedText.includes("bulk") ||
      combinedText.includes("large team") ||
      combinedText.includes("mass")
    )
  }

  return false
}

function filterProducts({
  products,
  selectedBudgets,
  selectedCategories,
  selectedUseCases,
}: {
  products: Product[]
  selectedBudgets: string[]
  selectedCategories: string[]
  selectedUseCases: string[]
}) {
  return products.filter((product) => {
    const budgetMatch =
      selectedBudgets.length === 0 ||
      selectedBudgets.some((budget) => productMatchesBudget(product, budget))

    const categoryMatch =
      selectedCategories.length === 0 ||
      selectedCategories.some((category) =>
        productMatchesCategory(product, category)
      )

    const useCaseMatch =
      selectedUseCases.length === 0 ||
      selectedUseCases.some((useCase) =>
        productMatchesUseCase(product, useCase)
      )

    return budgetMatch && categoryMatch && useCaseMatch
  })
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string
  href: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          : "rounded-full border px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
      }
    >
      {label}
    </Link>
  )
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolvedSearchParams = await searchParams

  const selectedBudgets = toArray(resolvedSearchParams?.budget)
  const selectedCategories = toArray(resolvedSearchParams?.category)
  const selectedUseCases = toArray(resolvedSearchParams?.use_case)

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .returns<Product[]>()

  const allProducts = data || []

  const products = filterProducts({
    products: allProducts,
    selectedBudgets,
    selectedCategories,
    selectedUseCases,
  })

  const hasActiveFilters =
    selectedBudgets.length > 0 ||
    selectedCategories.length > 0 ||
    selectedUseCases.length > 0

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

            <div className="mt-10 space-y-6">
              <div>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Budget
                  </h2>

                  {hasActiveFilters && (
                    <Link
                      href="/catalog"
                      className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Clear filters
                    </Link>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {budgetFilters.map((budget) => (
                    <FilterChip
                      key={budget}
                      label={budget}
                      active={selectedBudgets.includes(budget)}
                      href={createFilterHref({
                        budgets: toggleValue(selectedBudgets, budget),
                        categories: selectedCategories,
                        useCases: selectedUseCases,
                      })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Category
                </h2>

                <div className="flex flex-wrap gap-3">
                  {categoryFilters.map((category) => (
                    <FilterChip
                      key={category}
                      label={category}
                      active={selectedCategories.includes(category)}
                      href={createFilterHref({
                        budgets: selectedBudgets,
                        categories: toggleValue(selectedCategories, category),
                        useCases: selectedUseCases,
                      })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Use Case
                </h2>

                <div className="flex flex-wrap gap-3">
                  {useCaseFilters.map((useCase) => (
                    <FilterChip
                      key={useCase}
                      label={useCase}
                      active={selectedUseCases.includes(useCase)}
                      href={createFilterHref({
                        budgets: selectedBudgets,
                        categories: selectedCategories,
                        useCases: toggleValue(selectedUseCases, useCase),
                      })}
                    />
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                {error.message}
              </div>
            )}

            <div className="mt-10 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {products.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {allProducts.length}
                </span>{" "}
                products
              </p>

              {hasActiveFilters && (
                <div className="hidden flex-wrap gap-2 md:flex">
                  {[...selectedBudgets, ...selectedCategories, ...selectedUseCases].map(
                    (filter) => (
                      <span
                        key={filter}
                        className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                      >
                        {filter}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.length > 0 ? (
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
                    No products match the selected filters.
                  </p>

                  <Link href="/catalog">
                    <Button className="mt-6">Clear Filters</Button>
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