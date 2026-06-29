"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

type InquiryProduct = {
  id: string
  name: string
  brand?: string | null
  category?: string | null
  budget_band?: string | null
  image_url?: string | null
  quantity?: number
}

type InquiryForm = {
  name: string
  company: string
  email: string
  phone: string
  requirement: string
}

const STORAGE_KEY = "whitec_inquiry_products"

export default function InquiryPage() {
  const [products, setProducts] = useState<InquiryProduct[]>([])
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>(
    {}
  )
  const [form, setForm] = useState<InquiryForm>({
    name: "",
    company: "",
    email: "",
    phone: "",
    requirement: "",
  })
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const savedProducts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")

    const productsWithQuantity = savedProducts.map(
      (product: InquiryProduct) => ({
        ...product,
        quantity: Number(product.quantity || 1),
      })
    )

    const initialQuantityInputs: Record<string, string> = {}

    productsWithQuantity.forEach((product: InquiryProduct) => {
      initialQuantityInputs[product.id] = String(product.quantity || 1)
    })

    setProducts(productsWithQuantity)
    setQuantityInputs(initialQuantityInputs)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productsWithQuantity))
  }, [])

  const totalQuantity = useMemo(() => {
    return products.reduce(
      (total, product) => total + Number(product.quantity || 1),
      0
    )
  }, [products])

  function updateLocalStorage(updatedProducts: InquiryProduct[]) {
    setProducts(updatedProducts)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts))
  }

  function setProductQuantity(productId: string, quantity: number) {
    const safeQuantity = Math.max(1, quantity)

    const updatedProducts = products.map((product) =>
      product.id === productId
        ? {
            ...product,
            quantity: safeQuantity,
          }
        : product
    )

    setQuantityInputs((currentInputs) => ({
      ...currentInputs,
      [productId]: String(safeQuantity),
    }))

    updateLocalStorage(updatedProducts)
  }

  function handleQuantityTyping(productId: string, value: string) {
    const onlyNumbers = value.replace(/\D/g, "")

    setQuantityInputs((currentInputs) => ({
      ...currentInputs,
      [productId]: onlyNumbers,
    }))

    if (!onlyNumbers) {
      return
    }

    const updatedProducts = products.map((product) =>
      product.id === productId
        ? {
            ...product,
            quantity: Math.max(1, Number(onlyNumbers)),
          }
        : product
    )

    updateLocalStorage(updatedProducts)
  }

  function handleQuantityBlur(productId: string) {
    const currentValue = quantityInputs[productId]

    if (!currentValue || Number(currentValue) < 1) {
      setProductQuantity(productId, 1)
    }
  }

  function decreaseQuantity(productId: string) {
    const product = products.find((item) => item.id === productId)
    const currentQuantity = Number(product?.quantity || 1)

    setProductQuantity(productId, Math.max(1, currentQuantity - 1))
  }

  function increaseQuantity(productId: string) {
    const product = products.find((item) => item.id === productId)
    const currentQuantity = Number(product?.quantity || 1)

    setProductQuantity(productId, currentQuantity + 1)
  }

  function removeProduct(productId: string) {
    const updatedProducts = products.filter(
      (product) => product.id !== productId
    )

    const updatedQuantityInputs = { ...quantityInputs }
    delete updatedQuantityInputs[productId]

    setQuantityInputs(updatedQuantityInputs)
    updateLocalStorage(updatedProducts)
  }

  function clearInquiryList() {
    setQuantityInputs({})
    updateLocalStorage([])
  }

  function updateForm(field: keyof InquiryForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  async function submitInquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setMessage("")
    setError("")

    if (products.length === 0) {
      setError("Please add at least one product to your inquiry list.")
      return
    }

    if (!form.name.trim()) {
      setError("Please enter your name.")
      return
    }

    if (!form.email.trim()) {
      setError("Please enter your email.")
      return
    }

    if (!form.phone.trim()) {
      setError("Please enter your phone number.")
      return
    }

    const finalProducts = products.map((product) => ({
      ...product,
      quantity: Math.max(1, Number(product.quantity || 1)),
    }))

    setIsSending(true)

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: form,
          products: finalProducts,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to send inquiry.")
      }

      setMessage(
        "Your inquiry has been sent successfully. Our team will contact you soon."
      )

      setForm({
        name: "",
        company: "",
        email: "",
        phone: "",
        requirement: "",
      })

      clearInquiryList()
    } catch (submitError: any) {
      setError(
        submitError?.message ||
          "Something went wrong while sending your inquiry."
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Request a Quote
            </p>

            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Share your gifting requirement.
            </h1>

            <p className="mt-5 text-lg text-muted-foreground">
              Review selected products, add approximate quantities, and send
              your requirement. We will get back with suitable options and
              pricing.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-3xl border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Selected Products</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {products.length} product{products.length === 1 ? "" : "s"}{" "}
                    selected · Total quantity {totalQuantity}
                  </p>
                </div>

                {products.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearInquiryList}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {products.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="grid gap-4 rounded-2xl border bg-background p-4 sm:grid-cols-[110px_1fr]"
                    >
                      <div className="relative h-28 overflow-hidden rounded-xl bg-white">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            sizes="110px"
                            className="object-contain p-2"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {product.brand || "white-c"} ·{" "}
                            {product.category || "Corporate Gift"}
                          </p>

                          <h3 className="mt-1 text-xl font-semibold">
                            {product.name}
                          </h3>

                          {product.budget_band && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Budget band: {product.budget_band}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <label className="text-sm font-semibold">
                            Quantity
                          </label>

                          <div className="flex items-center overflow-hidden rounded-xl border">
                            <button
                              type="button"
                              onClick={() => decreaseQuantity(product.id)}
                              className="h-10 w-10 border-r text-lg font-semibold hover:bg-muted"
                            >
                              −
                            </button>

                            <input
                              type="text"
                              inputMode="numeric"
                              value={
                                quantityInputs[product.id] ??
                                String(product.quantity || 1)
                              }
                              onChange={(event) =>
                                handleQuantityTyping(
                                  product.id,
                                  event.target.value
                                )
                              }
                              onBlur={() => handleQuantityBlur(product.id)}
                              className="h-10 w-20 bg-background px-3 text-center text-sm outline-none"
                            />

                            <button
                              type="button"
                              onClick={() => increaseQuantity(product.id)}
                              className="h-10 w-10 border-l text-lg font-semibold hover:bg-muted"
                            >
                              +
                            </button>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeProduct(product.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border bg-muted p-8 text-center">
                  <h3 className="text-xl font-semibold">
                    No products selected yet
                  </h3>

                  <p className="mt-2 text-muted-foreground">
                    Browse the catalog and add products to your inquiry list.
                  </p>

                  <Link href="/catalog">
                    <Button className="mt-6">Browse Catalog</Button>
                  </Link>
                </div>
              )}
            </section>

            <section className="rounded-3xl border bg-card p-6">
              <h2 className="text-2xl font-bold">Your Details</h2>

              <form onSubmit={submitInquiry} className="mt-6 space-y-5">
                <div>
                  <label className="text-sm font-semibold">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="Your name"
                    className="mt-2 h-12 w-full rounded-xl border bg-background px-4 outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Company Name</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(event) =>
                      updateForm("company", event.target.value)
                    }
                    placeholder="Company name"
                    className="mt-2 h-12 w-full rounded-xl border bg-background px-4 outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateForm("email", event.target.value)
                    }
                    placeholder="email@company.com"
                    className="mt-2 h-12 w-full rounded-xl border bg-background px-4 outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Phone *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateForm("phone", event.target.value)
                    }
                    placeholder="Phone number"
                    className="mt-2 h-12 w-full rounded-xl border bg-background px-4 outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">
                    Requirement / Notes
                  </label>
                  <textarea
                    value={form.requirement}
                    onChange={(event) =>
                      updateForm("requirement", event.target.value)
                    }
                    placeholder="Mention event, delivery city, timeline, branding requirement, budget, or any specific preference."
                    rows={5}
                    className="mt-2 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    {message}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSending || products.length === 0}
                  className="h-12 w-full rounded-xl text-base font-semibold"
                >
                  {isSending ? "Sending Inquiry..." : "Send Inquiry"}
                </Button>

                <p className="text-xs leading-5 text-muted-foreground">
                  We do not show public pricing because final pricing depends on
                  quantity, branding, packaging, and delivery requirements.
                </p>
              </form>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}