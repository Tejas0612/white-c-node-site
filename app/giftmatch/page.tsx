"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

const recommendations = [
  {
    name: "Stainless Steel Bottle",
    category: "Drinkware",
    budget: "₹250–₹500",
    why: "Practical, reusable, and suitable for large employee or workforce gifting.",
    branding: "Logo printing available",
    leadTime: "7–12 days",
  },
  {
    name: "Premium Diary and Pen Set",
    category: "Stationery",
    budget: "₹250–₹500",
    why: "Works well for onboarding, corporate events, and client meetings.",
    branding: "Logo embossing available",
    leadTime: "10–15 days",
  },
  {
    name: "Eco-friendly Welcome Kit",
    category: "Eco-friendly Gifts",
    budget: "₹500–₹1000",
    why: "Good for companies wanting thoughtful, sustainable gifting.",
    branding: "Custom packaging available",
    leadTime: "12–18 days",
  },
]

export default function GiftMatchPage() {
  const [showResults, setShowResults] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                GiftMatch AI
              </p>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                Find the right corporate gifts in seconds.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground">
                Share your budget, quantity, audience, and occasion. GiftMatch will suggest curated gift ideas that fit your campaign.
              </p>
            </div>

            <div className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <form
                className="rounded-3xl border bg-card p-6 shadow-sm md:p-8"
                onSubmit={(e) => {
                  e.preventDefault()
                  setShowResults(true)
                }}
              >
                <h2 className="text-2xl font-semibold">Tell us your requirement</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  This is a mock AI flow for now. Later we will connect it to a recommendation API.
                </p>

                <div className="mt-8 grid gap-4">
                  <select className="rounded-xl border bg-background p-4" required>
                    <option value="">Select budget band</option>
                    <option>Under ₹250</option>
                    <option>₹250–₹500</option>
                    <option>₹500–₹1000</option>
                    <option>₹1000+</option>
                  </select>

                  <input
                    className="rounded-xl border bg-background p-4"
                    placeholder="Quantity e.g. 500"
                    required
                  />

                  <input
                    className="rounded-xl border bg-background p-4"
                    placeholder="Recipient type e.g. employees, clients, workers"
                    required
                  />

                  <input
                    className="rounded-xl border bg-background p-4"
                    placeholder="Occasion e.g. Diwali, onboarding, event"
                    required
                  />

                  <input
                    className="rounded-xl border bg-background p-4"
                    placeholder="Industry e.g. fintech, construction, healthcare"
                  />

                  <select className="rounded-xl border bg-background p-4">
                    <option value="">Branding required?</option>
                    <option>Yes</option>
                    <option>No</option>
                    <option>Not sure</option>
                  </select>

                  <input
                    className="rounded-xl border bg-background p-4"
                    placeholder="Delivery timeline e.g. within 2 weeks"
                  />

                  <textarea
                    className="min-h-28 rounded-xl border bg-background p-4"
                    placeholder="Any additional notes?"
                  />

                  <button
                    type="submit"
                    className="mt-2 w-full rounded-xl bg-black px-6 py-4 text-base font-semibold text-white transition hover:bg-black/90"
                  >
                    Get Gift Recommendations
                  </button>
                </div>
              </form>

              <div className="rounded-3xl border bg-muted/40 p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">Recommended Gift Ideas</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Recommendations will appear here after you submit the form.
                    </p>
                  </div>
                </div>

                {!showResults ? (
                  <div className="mt-8 rounded-3xl border border-dashed bg-background p-10 text-center">
                    <p className="text-lg font-medium">No recommendations yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Fill the form and click “Get Gift Recommendations”.
                    </p>
                  </div>
                ) : (
                  <div className="mt-8 grid gap-5">
                    {recommendations.map((item) => (
                      <div key={item.name} className="rounded-3xl border bg-background p-6 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">{item.category}</p>
                            <h3 className="mt-1 text-2xl font-semibold">{item.name}</h3>
                          </div>

                          <span className="rounded-full bg-secondary px-4 py-2 text-sm font-medium">
                            {item.budget}
                          </span>
                        </div>

                        <p className="mt-4 text-muted-foreground">{item.why}</p>

                        <div className="mt-5 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                          <div className="rounded-2xl bg-muted p-4">
                            <p className="font-medium text-foreground">Branding</p>
                            <p className="mt-1">{item.branding}</p>
                          </div>

                          <div className="rounded-2xl bg-muted p-4">
                            <p className="font-medium text-foreground">Lead time</p>
                            <p className="mt-1">{item.leadTime}</p>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <Link href="/inquiry">
                            <Button>Add to Inquiry</Button>
                          </Link>
                          <Link href="/catalog">
                            <Button variant="outline">View Similar Gifts</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {[
                "Budget-fit suggestions",
                "Recipient-aware curation",
                "Branding and bulk quote ready",
              ].map((item) => (
                <div key={item} className="rounded-3xl border bg-card p-6">
                  <h3 className="text-xl font-semibold">{item}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Designed for B2B gifting teams who need fast, practical, and curated options.
                  </p>
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