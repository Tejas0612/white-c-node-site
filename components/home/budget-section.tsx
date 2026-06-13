import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"
import { BUDGET_CARDS } from "@/lib/data"
import { ArrowRight } from "lucide-react"

export function BudgetSection() {
  return (
    <section className="bg-navy text-navy-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-warm">
            Explore by budget
          </p>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Gifting that fits your procurement spend
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-navy-foreground/70 text-pretty">
            Pick a budget band and we&apos;ll curate options that maximize impact per unit.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BUDGET_CARDS.map((card) => (
            <Link
              key={card.band}
              href={`/giftmatch?budget=${encodeURIComponent(card.band)}`}
              className="group flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
            >
              <div>
                <p className="font-heading text-2xl font-bold">{card.band}</p>
                <p className="mt-2 text-sm leading-relaxed text-navy-foreground/70">
                  {card.tagline}
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-warm">
                See suggestions
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
