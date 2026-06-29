import { NextRequest, NextResponse } from "next/server"

const ADMIN_SESSION_COOKIE = "whitec_admin_session"

const publicAdminPaths = [
  "/admin/login",
  "/api/admin/login",
  "/api/admin/logout",
  "/api/admin/set-password",
]

async function isValidAdminSession(sessionToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return false
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/admin_sessions?select=id,expires_at,admin_users(is_active)&session_token=eq.${sessionToken}&expires_at=gt.${new Date().toISOString()}`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    }
  )

  if (!response.ok) {
    return false
  }

  const sessions = await response.json()

  if (!Array.isArray(sessions) || sessions.length === 0) {
    return false
  }

  const session = sessions[0]

  return session?.admin_users?.is_active === true
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isPublicAdminPath = publicAdminPaths.some((path) =>
    pathname.startsWith(path)
  )

  if (isPublicAdminPath) {
    return NextResponse.next()
  }

  const isAdminPath = pathname.startsWith("/admin")
  const isAdminApiPath = pathname.startsWith("/api/admin")

  if (!isAdminPath && !isAdminApiPath) {
    return NextResponse.next()
  }

  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value

  if (!sessionToken) {
    if (isAdminApiPath) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      )
    }

    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  const validSession = await isValidAdminSession(sessionToken)

  if (!validSession) {
    const response = isAdminApiPath
      ? NextResponse.json(
          {
            success: false,
            message: "Unauthorized.",
          },
          { status: 401 }
        )
      : NextResponse.redirect(new URL("/admin/login", request.url))

    response.cookies.delete(ADMIN_SESSION_COOKIE)

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}