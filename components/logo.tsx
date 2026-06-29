import Link from "next/link"

type LogoProps = {
  href?: string
  className?: string
  imageClassName?: string
}

export function Logo({
  href = "/",
  className = "",
  imageClassName = "",
}: LogoProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center ${className}`}
      aria-label="White C Home"
    >
      <img
        src="/brand/whitec-logo-dark.png"
        alt="White C"
        className={`h-14 w-auto max-w-[140px] object-contain ${imageClassName}`}
      />
    </Link>
  )
}

export default Logo