import {
  AdminMobileNav,
  WorkflowSidebar,
} from "@/components/admin/workflow-sidebar"
import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function AdminShell({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: string[]
}) {
  const user = await requireAdminUser(allowedRoles)

  const { data: accessRows } = await supabaseAdmin
    .from("admin_role_access_matrix")
    .select("page_key, allowed_roles, is_visible")
    .order("display_order", { ascending: true })

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <WorkflowSidebar user={user} accessRows={accessRows || []} />

      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <header className="flex items-center justify-between border-b bg-background px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Logged in as
            </p>
            <h2 className="font-semibold">{user.name}</h2>
          </div>

          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Logout
            </button>
          </form>
        </header>

        <AdminMobileNav user={user} accessRows={accessRows || []} />

        <div className="min-w-0 p-4 sm:p-6">{children}</div>
      </main>
    </div>
  )
}