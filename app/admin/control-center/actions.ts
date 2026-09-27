"use server"

import { requireAdminUser } from "@/lib/admin-auth"
import { revalidatePath, revalidateTag } from "next/cache"

export async function refreshCatalogue() {
  const user = await requireAdminUser()
  if (user.role !== "Owner" && !user.roles?.includes("Owner")) throw new Error("Owner access required")
  revalidateTag("public-catalog", { expire: 0 })
  revalidatePath("/catalog")
  revalidatePath("/admin/control-center")
}
