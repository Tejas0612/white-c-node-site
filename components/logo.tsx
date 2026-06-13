import Image from "next/image"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center", className)}>
      <Image
        src="/brand/whitec-logo-dark.png"
        alt="WhiteC logo"
        width={220}
        height={80}
        className="h-36 w-auto object-contain"
        priority
      />
    </span>
  )
}