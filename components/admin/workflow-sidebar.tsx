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
  { label: "Stock Report", href: "/admin/workflow/stock-report" },
  { label: "Team", href: "/admin/workflow/team" },
  { label: "Catalog", href: "/admin/products" },
  { label: "Import Brochure", href: "/admin/brochure-import" },
]

export function WorkflowSidebar({ user }: { user: SidebarUser }) {
  return (
    <aside className="hidden min-h-screen w-52 shrink-0 border-r bg-background lg:block">
      <div className="border-b px-4 py-5">
        <Link href="/admin/workflow" className="flex items-center">
          <img
            src="/brand/whitec-logo-dark.png"
            alt="White C"
            className="h-14 w-auto max-w-[140px] object-contain"
          />
        </Link>

        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Admin Workflow
        </p>
      </div>

      <nav className="space-y-1 p-3">
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

      <div className="mt-auto border-t p-4">
        <p className="truncate text-xs font-semibold text-muted-foreground">
          {user.email}
        </p>
      </div>
    </aside>
  )
}