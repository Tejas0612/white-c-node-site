import { cn } from "@/lib/utils"

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: "left" | "center"
  className?: string
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wide text-warm-foreground">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-navy text-balance sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground text-pretty">
          {description}
        </p>
      )}
    </div>
  )
}
