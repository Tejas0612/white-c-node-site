import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const ADMIN_SESSION_COOKIE = "whitec_admin_session"

export type AdminUser = {
  id: string
  name: string
  email: string
  role: string | null
  roles: string[] | null
  whatsapp: string | null
  is_active: boolean
}

export function hasAllowedRole(
  userRoles: string[] | null | undefined,
  allowedRoles: string[]
) {
  const roles = userRoles || []

  return (
    roles.includes("Owner") ||
    roles.includes("Admin") ||
    roles.some((role) => allowedRoles.includes(role))
  )
}

export async function getCurrentAdminUser() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (!sessionToken) {
    return null
  }

  const { data: session, error: sessionError } = await supabaseAdmin
    .from("admin_sessions")
    .select(
      `
      id,
      session_token,
      expires_at,
      user_id,
      admin_users (
        id,
        name,
        email,
        role,
        roles,
        whatsapp,
        is_active
      )
    `
    )
    .eq("session_token", sessionToken)
    .gt("expires_at", new Date().toISOString())
    .single()

  if (sessionError || !session?.admin_users) {
    return null
  }

  const user = session.admin_users as unknown as AdminUser

  if (!user.is_active) {
    return null
  }

  return user
}

export async function requireAdminUser(allowedRoles?: string[]) {
  const user = await getCurrentAdminUser()

  if (!user) {
    redirect("/admin/login")
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const allowed = hasAllowedRole(user.roles, allowedRoles)

    if (!allowed) {
      redirect("/admin/unauthorized")
    }
  }

  return user
}