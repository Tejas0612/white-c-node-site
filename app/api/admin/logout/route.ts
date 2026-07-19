import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const legacySessionCookieNames = [
  "admin_session",
  "admin_session_token",
  "whitec_admin_session_token",
]

const sessionCookieNames = [
  ADMIN_SESSION_COOKIE,
  ...legacySessionCookieNames,
]

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const sessionTokens = sessionCookieNames
    .map((cookieName) => cookieStore.get(cookieName)?.value)
    .filter((token): token is string => Boolean(token))

  if (sessionTokens.length > 0) {
    const { error } = await supabaseAdmin
      .from("admin_sessions")
      .delete()
      .in("session_token", sessionTokens)

    if (error) {
      console.error("Admin session deletion failed:", error)
    }
  }

  const response = NextResponse.redirect(new URL("/admin/login", request.url), {
    status: 303,
  })

  response.headers.set("Cache-Control", "no-store, max-age=0")

  for (const cookieName of sessionCookieNames) {
    response.cookies.set(cookieName, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      priority: "high",
    })
  }

  return response
}