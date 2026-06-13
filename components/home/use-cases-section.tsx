import { SectionHeading } from "@/components/section-heading"
import { USE_CASES } from "@/lib/data"
import { UserPlus, Sparkles, Handshake, Ticket, Truck, HardHat } from "lucide-react"

const ICONS = [UserPlus, Sparkles, Handshake, Ticket, Truck, HardHat]

export function UseCasesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Gifting use cases"
        title="One platform for every gifting moment"
        description="From onboarding to festivals, we curate the right gift for the right audience at scale."
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {USE_CASES.map((useCase, i) => {
          const Icon = ICONS[i % ICONS.length]
          return (
            <div
              key={useCase.title}
              className="flex gap-4 rounded-xl border border-border bg-card p-6"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="font-heading text-base font-semibold text-navy">{useCase.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {useCase.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
