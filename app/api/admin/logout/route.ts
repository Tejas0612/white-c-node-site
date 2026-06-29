import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth"

export const runtime = "nodejs"

export async function POST() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (sessionToken) {
    await supabaseAdmin
      .from("admin_sessions")
      .delete()
      .eq("session_token", sessionToken)
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE)

  return Response.json({
    success: true,
  })
}