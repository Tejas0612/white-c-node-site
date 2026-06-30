import Link from "next/link"

export function StatusFilterBar({
  basePath,
  currentStatus,
  statuses,
}: {
  basePath: string
  currentStatus: string
  statuses: string[]
}) {
  return (
    <div className="mt-6 mb-5 flex flex-wrap gap-2">
      {statuses.map((status) => {
        const isActive = currentStatus === status
        const href =
          status === "All"
            ? basePath
            : `${basePath}?status=${encodeURIComponent(status)}`

        return (
          <Link
            key={status}
            href={href}
            className={
              isActive
                ? "rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
                : "rounded-full border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          >
            {status}
          </Link>
        )
      })}
    </div>
  )
}