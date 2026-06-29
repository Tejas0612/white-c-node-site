import { AdminShell } from "@/components/admin/admin-shell"

export default function BrochureImportAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell allowedRoles={["Catalog"]}>{children}</AdminShell>
}