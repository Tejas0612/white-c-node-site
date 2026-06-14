"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useState } from "react"

export default function InquiryPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)

    setLoading(true)
    setError("")
    setSubmitted(false)

    const payload = {
      companyName: formData.get("companyName"),
      contactPerson: formData.get("contactPerson"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      budgetBand: formData.get("budgetBand"),
      quantity: formData.get("quantity"),
      occasion: formData.get("occasion"),
      deliveryCity: formData.get("deliveryCity"),
      brandingRequired: formData.get("brandingRequired"),
      timeline: formData.get("timeline"),
      message: formData.get("message"),
    }

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.message || "Inquiry could not be sent. Please try again.")
        return
      }

      setSubmitted(true)
      form.reset()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

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

              <form className="mt-10 grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="companyName"
                    className="rounded-xl border bg-background p-4"
                    placeholder="Company name"
                    required
                  />
                  <input
                    name="contactPerson"
                    className="rounded-xl border bg-background p-4"
                    placeholder="Contact person"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="email"
                    className="rounded-xl border bg-background p-4"
                    placeholder="Email"
                    type="email"
                    required
                  />
                  <input
                    name="phone"
                    className="rounded-xl border bg-background p-4"
                    placeholder="Phone / WhatsApp number"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    name="budgetBand"
                    className="rounded-xl border bg-background p-4"
                    required
                  >
                    <option value="">Select budget band</option>
                    <option>Under ₹250</option>
                    <option>₹250–₹500</option>
                    <option>₹500–₹1000</option>
                    <option>₹1000+</option>
                  </select>

                  <input
                    name="quantity"
                    className="rounded-xl border bg-background p-4"
                    placeholder="Quantity e.g. 500"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="occasion"
                    className="rounded-xl border bg-background p-4"
                    placeholder="Occasion e.g. Diwali, onboarding"
                  />
                  <input
                    name="deliveryCity"
                    className="rounded-xl border bg-background p-4"
                    placeholder="Delivery city"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    name="brandingRequired"
                    className="rounded-xl border bg-background p-4"
                  >
                    <option value="">Branding required?</option>
                    <option>Yes</option>
                    <option>No</option>
                    <option>Not sure</option>
                  </select>

                  <input
                    name="timeline"
                    className="rounded-xl border bg-background p-4"
                    placeholder="Timeline e.g. within 2 weeks"
                  />
                </div>

                <textarea
                  name="message"
                  className="min-h-36 rounded-xl border bg-background p-4"
                  placeholder="Message / requirements"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-fit rounded-xl bg-black px-6 py-4 text-base font-semibold text-white transition hover:bg-black/90 disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Submit Inquiry"}
                </button>

                {submitted && (
                  <div className="rounded-2xl border bg-secondary p-5">
                    <p className="font-semibold">Inquiry sent successfully ✅</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      You will receive this inquiry on your email.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                    {error}
                  </div>
                )}
              </form>
            </div>

            <aside className="rounded-3xl border bg-card p-8 shadow-sm">
              <h2 className="text-2xl font-semibold">What happens after you submit?</h2>

              <div className="mt-6 space-y-5">
                {[
                  "white-c reviews your requirement.",
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