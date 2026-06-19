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

type AddToInquiryButtonProps = {
  product: InquiryProduct
  className?: string
}

export function AddToInquiryButton({
  product,
  className,
}: AddToInquiryButtonProps) {
  const [added, setAdded] = useState(false)

  function handleAdd() {
    const existing = JSON.parse(
      localStorage.getItem("whitec_inquiry_products") || "[]"
    )

    const alreadyExists = existing.some(
      (item: InquiryProduct) => item.id === product.id
    )

    const updated = alreadyExists ? existing : [...existing, product]

    localStorage.setItem("whitec_inquiry_products", JSON.stringify(updated))
    setAdded(true)
  }

  return (
    <Button type="button" onClick={handleAdd} className={className}>
      {added ? "Added" : "Add to Inquiry"}
    </Button>
  )
}