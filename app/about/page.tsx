import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const steps = [
  "Share requirement",
  "Get curated suggestions",
  "Review branding options",
  "Confirm bulk quote",
  "Dispatch and delivery support",
]

const benefits = [
  {
    title: "Budget-first discovery",
    text: "Find suitable gifting ideas by budget band without exposing exact product prices publicly.",
  },
  {
    title: "AI-assisted recommendations",
    text: "Match gifts to recipient type, occasion, quantity, and business use case.",
  },
  {
    title: "Corporate-focused catalog",
    text: "Built for employee gifting, client gifting, events, festive campaigns, and onboarding kits.",
  },
  {
    title: "Branding support",
    text: "Explore logo printing, embossing, sleeves, stickers, packaging, and custom mockups.",
  },
  {
    title: "Inquiry-first journey",
    text: "No cart, no checkout. Just curated options and human-assisted quote support.",
  },
  {
    title: "Bulk quote support",
    text: "Final quotes are prepared based on quantity, timeline, branding, and logistics requirements.",
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Why WhiteC
              </p>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                Corporate gifting made smarter, faster, and more personalized.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground">
                WhiteC helps companies choose gifts based on budget, audience, occasion, quantity, branding needs, and delivery timelines.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/inquiry">
                  <Button size="lg">Start Your Requirement</Button>
                </Link>
                <Link href="/catalog">
                  <Button size="lg" variant="outline">Explore Catalog</Button>
                </Link>
              </div>
            </div>

            <div className="mt-20 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-3xl border bg-card p-8 shadow-sm">
                <h2 className="text-2xl font-semibold">How it works</h2>

                <div className="mt-8 space-y-5">
                  {steps.map((step, index) => (
                    <div key={step} className="flex gap-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                        {index + 1}
                      </div>
                      <p className="pt-1 text-muted-foreground">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="rounded-3xl border bg-card p-6 shadow-sm">
                    <h3 className="text-xl font-semibold">{benefit.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{benefit.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-20 rounded-3xl border bg-muted p-8 md:p-12">
              <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
                <div>
                  <h2 className="text-3xl font-bold">Ready to plan your next gifting campaign?</h2>
                  <p className="mt-3 text-muted-foreground">
                    Share your requirement and get curated corporate gifting options for your team, clients, or events.
                  </p>
                </div>

                <div className="md:text-right">
                  <Link href="/inquiry">
                    <Button size="lg">Request a Quote</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}