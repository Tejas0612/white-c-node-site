import Link from "next/link"

type SidebarUser = {
  name?: string
  email?: string
  role?: string | null
  roles?: string[] | null
}

const navItems = [
  { label: "Dashboard", href: "/admin/workflow" },
  { label: "Orders", href: "/admin/workflow/orders" },
  { label: "Enquiries", href: "/admin/workflow/enquiries" },
  { label: "Tasks", href: "/admin/workflow/tasks" },
  { label: "Team", href: "/admin/workflow/team" },
  { label: "Stock Report", href: "/admin/workflow/stock-report" },
  { label: "Catalog", href: "/admin/products" },
  { label: "Import Brochure", href: "/admin/brochure-import" },
]

export function WorkflowSidebar({ user }: { user: SidebarUser }) {
  return (
    <aside className="hidden min-h-screen w-52 shrink-0 border-r bg-background lg:flex lg:flex-col">
      <div className="border-b px-4 py-5">
        <Link href="/admin/workflow" className="flex items-center">
          <img
            src="/brand/whitec-logo-dark.png"
            alt="White C"
            className="h-20 w-auto max-w-[165px] object-contain"
          />
        </Link>

        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Admin Workflow
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-3">
        <Link
          href="/"
          className="mb-3 block rounded-xl border px-3 py-2.5 text-center text-sm font-semibold hover:bg-muted"
        >
          View Website
        </Link>

        <p className="truncate text-xs font-semibold text-muted-foreground">
          {user.email}
        </p>
      </div>
    </aside>
  )
}

export function AdminMobileNav() {
  return (
    <div className="border-b bg-background px-4 py-3 lg:hidden">
      <div className="mb-3 flex items-center justify-between gap-4">
        <Link href="/admin/workflow" className="flex items-center">
          <img
            src="/brand/whitec-logo-dark.png"
            alt="White C"
            className="h-12 w-auto max-w-[130px] object-contain"
          />
        </Link>

        <Link
          href="/"
          className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted"
        >
          View Website
        </Link>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}