import Link from "next/link"

type SidebarUser = {
  name?: string
  email?: string
  role?: string | null
  roles?: string[] | null
}

type RoleAccessRow = {
  page_key: string
  allowed_roles: string[]
  is_visible: boolean
}

type NavItem = {
  pageKey: string
  label: string
  href: string
  fallbackRoles: string[]
}

const navItems: NavItem[] = [
  {
    pageKey: "dashboard",
    label: "Dashboard",
    href: "/admin/workflow",
    fallbackRoles: [
      "Admin",
      "Operations",
      "Sales",
      "Accounts",
      "Catalog",
      "Viewer",
      "Employee",
    ],
  },
  {
    pageKey: "orders",
    label: "Orders",
    href: "/admin/workflow/orders",
    fallbackRoles: ["Admin", "Operations", "Sales", "Accounts"],
  },
  {
    pageKey: "enquiries",
    label: "Enquiries",
    href: "/admin/workflow/enquiries",
    fallbackRoles: ["Admin", "Sales", "Operations"],
  },
  {
    pageKey: "tasks",
    label: "Tasks",
    href: "/admin/workflow/tasks",
    fallbackRoles: ["Admin", "Operations", "Sales", "Accounts"],
  },
  {
    pageKey: "team",
    label: "Team",
    href: "/admin/workflow/team",
    fallbackRoles: ["Admin"],
  },
  {
    pageKey: "stock_report",
    label: "Stock Report",
    href: "/admin/workflow/stock-report",
    fallbackRoles: ["Admin", "Operations", "Accounts", "Catalog"],
  },
  {
    pageKey: "catalog",
    label: "Catalog",
    href: "/admin/products",
    fallbackRoles: ["Admin", "Catalog"],
  },
  {
    pageKey: "brochure_import",
    label: "Import Brochure",
    href: "/admin/brochure-import",
    fallbackRoles: ["Admin", "Catalog"],
  },
]

function getUserRoles(user: SidebarUser) {
  const roles = new Set<string>()

  if (user.role) {
    roles.add(user.role)
  }

  if (Array.isArray(user.roles)) {
    user.roles.forEach((role) => {
      if (role) {
        roles.add(role)
      }
    })
  }

  return roles
}

function canSeeNavItem({
  user,
  item,
  accessRows,
}: {
  user: SidebarUser
  item: NavItem
  accessRows?: RoleAccessRow[]
}) {
  const userRoles = getUserRoles(user)

  if (userRoles.has("Admin") || userRoles.has("Owner")) {
    return true
  }

  const matrixRow = accessRows?.find((row) => row.page_key === item.pageKey)

  if (matrixRow && matrixRow.is_visible === false) {
    return false
  }

  const allowedRoles =
    matrixRow && Array.isArray(matrixRow.allowed_roles)
      ? matrixRow.allowed_roles
      : item.fallbackRoles

  return allowedRoles.some((role) => userRoles.has(role))
}

function getVisibleNavItems({
  user,
  accessRows,
}: {
  user: SidebarUser
  accessRows?: RoleAccessRow[]
}) {
  return navItems.filter((item) =>
    canSeeNavItem({
      user,
      item,
      accessRows,
    })
  )
}

export function WorkflowSidebar({
  user,
  accessRows,
}: {
  user: SidebarUser
  accessRows?: RoleAccessRow[]
}) {
  const visibleNavItems = getVisibleNavItems({ user, accessRows })

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
        {visibleNavItems.map((item) => (
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

export function AdminMobileNav({
  user,
  accessRows,
}: {
  user: SidebarUser
  accessRows?: RoleAccessRow[]
}) {
  const visibleNavItems = getVisibleNavItems({ user, accessRows })

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
        {visibleNavItems.map((item) => (
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