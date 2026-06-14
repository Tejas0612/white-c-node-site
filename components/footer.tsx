import Link from "next/link"
import { MapPin, Phone, Clock } from "lucide-react"
import { Logo } from "@/components/logo"

const FOOTER_LINKS = [
  {
    heading: "Explore",
    links: [
      { href: "/giftmatch", label: "GiftMatch AI" },
      { href: "/catalog", label: "Catalog" },
      { href: "/inquiry", label: "Request a Quote" },
      { href: "/about", label: "About WhiteC" },
    ],
  },
  {
    heading: "Use cases",
    links: [
      { href: "/catalog", label: "Employee onboarding" },
      { href: "/catalog", label: "Diwali gifting" },
      { href: "/catalog", label: "Client appreciation" },
      { href: "/catalog", label: "Event giveaways" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "Why WhiteC" },
      { href: "/inquiry", label: "Contact sales" },
      { href: "/inquiry", label: "Bulk inquiry" },
      { href: "/admin", label: "Admin" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href="/">
              <Logo />
            </Link>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              AI-powered corporate gifting for every budget, team, and occasion.
              Inquiry-first curation, branding, and bulk quotation support across India.
            </p>

            <ul className="mt-5 flex flex-col gap-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-warm" />
                <span>CK-125, Sector 2, Salt Lake City, Kolkata – 700091</span>
              </li>

              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-warm" />
                <a
                  href="tel:+919830113007"
                  className="transition-colors hover:text-foreground"
                >
                  +91-9830113007
                </a>
              </li>

              <li className="flex items-center gap-2.5">
                <Clock className="size-4 shrink-0 text-warm" />
                <span>Mon–Fri, 9:00 AM – 5:00 PM</span>
              </li>
            </ul>
          </div>

          {FOOTER_LINKS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-foreground">
                {col.heading}
              </h3>

              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} WhiteC. Corporate gifting, made smarter.
          </p>

          <p className="text-sm text-muted-foreground">
            Inquiry-based platform — no online payments required.
          </p>
        </div>
      </div>
    </footer>
  )
}