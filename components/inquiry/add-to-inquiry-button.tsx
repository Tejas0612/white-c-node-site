"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type InquiryProduct = {
  id: string
  name: string
  brand?: string | null
  category?: string | null
  budget_band?: string | null
  image_url?: string | null
}

export function AddToInquiryButton({ product }: { product: InquiryProduct }) {
  const [added, setAdded] = useState(false)

  function handleAdd() {
    const existing = JSON.parse(
      localStorage.getItem("whitec_inquiry_products") || "[]"
    )

    const alreadyExists = existing.some((item: InquiryProduct) => item.id === product.id)

    const updated = alreadyExists ? existing : [...existing, product]

    localStorage.setItem("whitec_inquiry_products", JSON.stringify(updated))
    setAdded(true)
  }

  return (
    <Button type="button" onClick={handleAdd}>
      {added ? "Added to Inquiry" : "Add to Inquiry"}
    </Button>
  )
}