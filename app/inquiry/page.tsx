"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function InquiryPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="px-6 py-20">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Request Quote
              </p>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                Tell us your gifting requirement.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
                Share your budget band, quantity, occasion, and branding needs. Our team will help you with curated options and a custom quote.
              </p>

              <form
                className="mt-10 grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  setSubmitted(true)
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <input className="rounded-xl border bg-background p-4" placeholder="Company name" required />
                  <input className="rounded-xl border bg-background p-4" placeholder="Contact person" required />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input className="rounded-xl border bg-background p-4" placeholder="Email" type="email" required />
                  <input className="rounded-xl border bg-background p-4" placeholder="Phone / WhatsApp number" required />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <select className="rounded-xl border bg-background p-4" required>
                    <option value="">Select budget band</option>
                    <option>Under ₹250</option>
                    <option>₹250–₹500</option>
                    <option>₹500–₹1000</option>
                    <option>₹1000+</option>
                  </select>

                  <input className="rounded-xl border bg-background p-4" placeholder="Quantity e.g. 500" required />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input className="rounded-xl border bg-background p-4" placeholder="Occasion e.g. Diwali, onboarding" />
                  <input className="rounded-xl border bg-background p-4" placeholder="Delivery city" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <select className="rounded-xl border bg-background p-4">
                    <option value="">Branding required?</option>
                    <option>Yes</option>
                    <option>No</option>
                    <option>Not sure</option>
                  </select>

                  <input className="rounded-xl border bg-background p-4" placeholder="Timeline e.g. within 2 weeks" />
                </div>

                <textarea
                  className="min-h-36 rounded-xl border bg-background p-4"
                  placeholder="Message / requirements"
                />

                <button
                type="submit"
                className="w-fit rounded-xl bg-black px-6 py-4 text-base font-semibold text-white transition hover:bg-black/90"
                >
                Submit Inquiry
                </button>

                {submitted && (
                  <div className="rounded-2xl border bg-secondary p-5">
                    <p className="font-semibold">Inquiry captured locally ✅</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Next step: we will connect this form to email, Google Sheets, WhatsApp, or CRM.
                    </p>
                  </div>
                )}
              </form>
            </div>

            <aside className="rounded-3xl border bg-card p-8 shadow-sm">
              <h2 className="text-2xl font-semibold">What happens after you submit?</h2>

              <div className="mt-6 space-y-5">
                {[
                  "WhiteC reviews your requirement.",
                  "Curated product options are shortlisted.",
                  "Logo branding and packaging options are checked.",
                  "Bulk quote is prepared based on quantity and timeline.",
                  "Final options are shared for approval.",
                ].map((item, index) => (
                  <div key={item} className="flex gap-4">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                      {index + 1}
                    </div>
                    <p className="text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl bg-muted p-5">
                <p className="font-medium">No online payment required.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  This is an inquiry-first B2B journey. Pricing is shared privately after requirement review.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}