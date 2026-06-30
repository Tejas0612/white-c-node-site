import Link from "next/link"

type PaginationBarProps = {
  basePath: string
  currentPage: number
  totalPages: number
  searchParams?: Record<string, string | undefined>
}

function buildPageHref({
  basePath,
  page,
  searchParams,
}: {
  basePath: string
  page: number
  searchParams?: Record<string, string | undefined>
}) {
  const params = new URLSearchParams()

  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (value && key !== "page") {
      params.set(key, value)
    }
  })

  if (page > 1) {
    params.set("page", String(page))
  }

  const queryString = params.toString()

  return queryString ? `${basePath}?${queryString}` : basePath
}

export function PaginationBar({
  basePath,
  currentPage,
  totalPages,
  searchParams,
}: PaginationBarProps) {
  if (totalPages <= 1) {
    return null
  }

  const previousPage = Math.max(currentPage - 1, 1)
  const nextPage = Math.min(currentPage + 1, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
      <p className="text-sm font-medium text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <Link
          href={buildPageHref({
            basePath,
            page: previousPage,
            searchParams,
          })}
          className={
            currentPage === 1
              ? "pointer-events-none rounded-xl border px-4 py-2 text-sm font-semibold text-muted-foreground opacity-50"
              : "rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
          }
        >
          Previous
        </Link>

        {Array.from({ length: totalPages }).map((_, index) => {
          const page = index + 1

          if (
            page !== 1 &&
            page !== totalPages &&
            Math.abs(page - currentPage) > 1
          ) {
            if (page === 2 || page === totalPages - 1) {
              return (
                <span
                  key={page}
                  className="px-2 text-sm font-semibold text-muted-foreground"
                >
                  …
                </span>
              )
            }

            return null
          }

          return (
            <Link
              key={page}
              href={buildPageHref({
                basePath,
                page,
                searchParams,
              })}
              className={
                currentPage === page
                  ? "rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background"
                  : "rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
              }
            >
              {page}
            </Link>
          )
        })}

        <Link
          href={buildPageHref({
            basePath,
            page: nextPage,
            searchParams,
          })}
          className={
            currentPage === totalPages
              ? "pointer-events-none rounded-xl border px-4 py-2 text-sm font-semibold text-muted-foreground opacity-50"
              : "rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
          }
        >
          Next
        </Link>
      </div>
    </div>
  )
}