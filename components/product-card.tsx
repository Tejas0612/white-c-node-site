"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Tag } from "lucide-react"
import type { Product } from "@/lib/data"

export function ProductCard({
  product,
  onInquire,
}: {
  product: Product
  onInquire?: (product: Product) => void
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <Badge className="absolute left-3 top-3 bg-card/90 text-foreground shadow-sm backdrop-blur">
          {product.category}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-lg font-semibold leading-tight text-navy text-pretty">
            {product.name}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-foreground">{product.budgetBand}</span>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-secondary-foreground">
            <Tag className="size-3" /> MOQ {product.moq}
          </span>
          {product.brandingAvailable && (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-accent-foreground">
              <Check className="size-3" /> Branding
            </span>
          )}
          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-secondary-foreground">
            {product.leadTime}
          </span>
        </div>

        {onInquire && (
          <Button
            variant="outline"
            className="mt-5 w-full"
            onClick={() => onInquire(product)}
          >
            Add to Inquiry
          </Button>
        )}
      </div>
    </div>
  )
}
