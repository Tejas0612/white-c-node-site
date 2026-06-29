import { AdminShell } from "@/components/admin/admin-shell"

export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminShell
      allowedRoles={[
        "Operations",
        "Sales",
        "Accounts",
        "Catalog",
        "Viewer",
      ]}
    >
      {children}
    </AdminShell>
  )
}