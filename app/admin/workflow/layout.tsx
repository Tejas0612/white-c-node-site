import { WorkflowSidebar } from "@/components/admin/workflow-sidebar"
import { requireAdminUser } from "@/lib/admin-auth"

export default async function WorkflowLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdminUser([
    "Operations",
    "Sales",
    "Accounts",
    "Catalog",
    "Viewer",
  ])

  return (
    <div className="flex min-h-screen bg-muted/30">
      <WorkflowSidebar />

      <main className="flex-1">
        <header className="flex items-center justify-between border-b bg-background px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Logged in as
            </p>
            <h2 className="font-semibold">{user.name}</h2>
          </div>

          <form action="/api/admin/logout" method="post">
            <button className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted">
              Logout
            </button>
          </form>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}