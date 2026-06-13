import { SectionHeading } from "@/components/section-heading"
import { PROCESS_STEPS, BENEFITS } from "@/lib/data"
import {
  LayoutGrid,
  Wallet,
  Stamp,
  Boxes,
  MessageSquare,
  UserCheck,
} from "lucide-react"

const BENEFIT_ICONS = [LayoutGrid, Wallet, Stamp, Boxes, MessageSquare, UserCheck]

export function ProcessSection() {
  return (
    <section className="bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="A simple, inquiry-first journey"
          description="No checkout, no payment pressure. Share your needs and get a tailored quote."
          align="center"
        />

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {PROCESS_STEPS.map((step) => (
            <li key={step.step} className="relative rounded-xl border border-border bg-card p-5">
              <span className="font-heading text-3xl font-bold text-warm">{step.step}</span>
              <h3 className="mt-3 font-heading text-base font-semibold text-navy">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit, i) => {
            const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length]
            return (
              <div key={benefit.title} className="flex gap-4 rounded-xl bg-card p-6 border border-border">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-navy text-navy-foreground">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-heading text-base font-semibold text-navy">{benefit.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
