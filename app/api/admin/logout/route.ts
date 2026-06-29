import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase-admin"

const possibleSessionCookieNames = [
  "admin_session",
  "admin_session_token",
  "whitec_admin_session",
  "whitec_admin_session_token",
]

async function clearAdminSession() {
  const cookieStore = await cookies()

  for (const cookieName of possibleSessionCookieNames) {
    const sessionToken = cookieStore.get(cookieName)?.value

    if (sessionToken) {
      await supabaseAdmin
        .from("admin_sessions")
        .delete()
        .eq("session_token", sessionToken)
    }

    cookieStore.delete(cookieName)
  }
}

export async function POST(request: Request) {
  await clearAdminSession()

  const response = NextResponse.redirect(new URL("/admin/login", request.url), {
    status: 303,
  })

  for (const cookieName of possibleSessionCookieNames) {
    response.cookies.set(cookieName, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  }

  return response
}

export async function GET(request: Request) {
  await clearAdminSession()

  const response = NextResponse.redirect(new URL("/admin/login", request.url), {
    status: 303,
  })

  for (const cookieName of possibleSessionCookieNames) {
    response.cookies.set(cookieName, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  }

  return response
}