import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight } from "lucide-react"
import { TRUST_STRIP } from "@/lib/data"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:py-24 lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-warm" />
            AI-powered gift discovery
          </span>
          <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.05] tracking-tight text-navy text-balance sm:text-5xl lg:text-6xl">
            Thoughtful Gifts. Stronger Connections.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
            Premium corporate gifts for every occasion, thoughtfully curated to leave a lasting
            impression — matched to your budget, audience, and branding.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/giftmatch">Explore GiftMatch AI</Link>}
            />
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/catalog">Browse Catalog</Link>}
            />
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
            {TRUST_STRIP.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-1.5 rounded-full bg-warm" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="relative aspect-[5/4] overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
            <Image
              src="/hero-gifting.png"
              alt="A professional happily opening a premium corporate gift box at their desk"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-border bg-card px-5 py-4 shadow-md sm:block">
            <p className="font-heading text-2xl font-bold text-navy">500+</p>
            <p className="text-sm text-muted-foreground">gifting programs delivered</p>
          </div>
        </div>
      </div>
    </section>
  )
}
