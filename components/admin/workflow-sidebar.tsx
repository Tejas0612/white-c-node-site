import Link from "next/link"

const navItems = [
  {
    label: "Dashboard",
    href: "/admin/workflow",
  },
  {
    label: "Orders",
    href: "/admin/workflow/orders",
  },
  {
    label: "Enquiries",
    href: "/admin/workflow/enquiries",
  },
  {
    label: "Tasks",
    href: "/admin/workflow/tasks",
  },
  {
    label: "Team",
    href: "/admin/workflow/team",
  },
  {
    label: "Products",
    href: "/admin/products",
  },
  {
    label: "Brochure Import",
    href: "/admin/brochure-import",
  },
]

export function WorkflowSidebar() {
  return (
    <aside className="hidden min-h-screen w-72 border-r bg-background lg:block">
      <div className="border-b p-6">
        <h1 className="text-2xl font-bold tracking-tight">WHITE C</h1>
        <p className="mt-1 text-sm text-muted-foreground">Admin Workflow</p>
      </div>

      <nav className="space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}