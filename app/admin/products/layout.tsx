import { AdminShell } from "@/components/admin/admin-shell"

export default function CatalogAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell allowedRoles={["Catalog"]}>{children}</AdminShell>
}