import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"
import { CATEGORIES } from "@/lib/data"
import { Gift, NotebookPen, Cpu, Shirt, Package, Leaf, ArrowRight } from "lucide-react"

const CATEGORY_META: Record<
  string,
  { icon: typeof Gift; blurb: string }
> = {
  Bottles: { icon: Gift, blurb: "Durable drinkware for everyday brand visibility." },
  Diaries: { icon: NotebookPen, blurb: "Refined desk essentials for clients and leaders." },
  "Tech Accessories": { icon: Cpu, blurb: "High-perceived-value gadgets for modern teams." },
  Apparel: { icon: Shirt, blurb: "Brandable merchandise for events and drives." },
  Hampers: { icon: Package, blurb: "Curated boxes for festive and milestone gifting." },
  "Eco-friendly Gifts": { icon: Leaf, blurb: "Sustainable picks that reflect your values." },
}

export function CategoriesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Explore by category"
        title="Curated gifting, organized by need"
        description="Discover curated gifting experiences designed around how your teams and clients actually use them."
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat]
          const Icon = meta.icon
          return (
            <Link
              key={cat}
              href={`/catalog?category=${encodeURIComponent(cat)}`}
              className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:border-foreground/20 hover:shadow-md"
            >
              <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-navy">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold text-navy">{cat}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                {meta.blurb}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                Explore
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
