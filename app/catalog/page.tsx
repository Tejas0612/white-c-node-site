import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const products = [
  {
    name: "Stainless Steel Bottle",
    category: "Drinkware",
    budget: "₹250–₹500",
    occasion: "Employee gifting, events",
    branding: "Logo printing available",
    moq: "MOQ: 100 units",
  },
  {
    name: "Premium Diary and Pen Set",
    category: "Stationery",
    budget: "₹250–₹500",
    occasion: "Client gifting, onboarding",
    branding: "Logo embossing available",
    moq: "MOQ: 100 units",
  },
  {
    name: "Tech Organizer Pouch",
    category: "Tech Accessories",
    budget: "₹500–₹1000",
    occasion: "Corporate teams, travel kits",
    branding: "Custom tag available",
    moq: "MOQ: 100 units",
  },
  {
    name: "Custom Logo T-Shirt",
    category: "Apparel",
    budget: "₹250–₹500",
    occasion: "Events, campaigns, teams",
    branding: "Logo print available",
    moq: "MOQ: 200 units",
  },
  {
    name: "Eco-friendly Welcome Kit",
    category: "Eco-friendly Gifts",
    budget: "₹500–₹1000",
    occasion: "Employee onboarding",
    branding: "Custom packaging available",
    moq: "MOQ: 100 kits",
  },
  {
    name: "Festive Hamper Box",
    category: "Hampers",
    budget: "₹1000+",
    occasion: "Diwali, client appreciation",
    branding: "Branded sleeve available",
    moq: "MOQ: 50 boxes",
  },
]

export default function CatalogPage() {
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
              {["Under ₹250", "₹250–₹500", "₹500–₹1000", "₹1000+", "Bottles", "Diaries", "Tech", "Hampers"].map((filter) => (
                <span key={filter} className="rounded-full border px-4 py-2 text-sm text-muted-foreground">
                  {filter}
                </span>
              ))}
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div key={product.name} className="rounded-3xl border bg-card p-5 shadow-sm transition hover:shadow-md">
                  <div className="mb-5 flex h-48 items-center justify-center rounded-2xl bg-muted">
                    <span className="text-sm text-muted-foreground">Product Image</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{product.category}</p>
                    <h2 className="text-xl font-semibold">{product.name}</h2>
                    <p className="text-sm text-muted-foreground">{product.occasion}</p>

                    <div className="flex flex-wrap gap-2 pt-3">
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs">{product.budget}</span>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs">{product.moq}</span>
                    </div>

                    <p className="pt-2 text-sm text-muted-foreground">{product.branding}</p>

                    <div className="flex gap-3 pt-5">
                      <Link href="/inquiry">
                        <Button>Add to Inquiry</Button>
                      </Link>
                      <Link href="/inquiry">
                        <Button variant="outline">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}