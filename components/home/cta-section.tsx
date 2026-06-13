import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function CtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-border bg-card px-6 py-12 text-center sm:px-12 lg:py-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-sm font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-warm" />
          Let&apos;s build your gifting program
        </span>
        <h2 className="mx-auto mt-5 max-w-2xl font-heading text-3xl font-bold tracking-tight text-navy text-balance sm:text-4xl">
          Tell us your budget and audience — we&apos;ll handle the rest
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
          Get curated recommendations, branding mockups, and a transparent bulk quote, all without
          any online payment.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" nativeButton={false} render={<Link href="/giftmatch">Try GiftMatch AI <ArrowRight className="size-4" /></Link>} />
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/inquiry">Request a Quote</Link>} />
        </div>
      </div>
    </section>
  )
}
