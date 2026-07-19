import { NextRequest, NextResponse } from "next/server"

const ADMIN_SESSION_COOKIE = "whitec_admin_session"

const publicAdminPaths = new Set([
  "/admin/login",
  "/api/admin/login",
  "/api/admin/logout",
])

function isPublicAdminPath(pathname: string) {
  return (
    publicAdminPaths.has(pathname) ||
    [...publicAdminPaths].some((path) => pathname === `${path}/`)
  )
}

function unauthorizedJson() {
  return NextResponse.json(
    {
      success: false,
      message: "Unauthorized.",
    },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  )
}

async function isValidAdminSession(sessionToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return false
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/admin_sessions?select=id,expires_at,admin_users(is_active)&session_token=eq.${encodeURIComponent(
      sessionToken
    )}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}`,
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

  if (isPublicAdminPath(pathname)) {
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
      return unauthorizedJson()
    }

    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  const validSession = await isValidAdminSession(sessionToken)

  if (!validSession) {
    const response = isAdminApiPath
      ? unauthorizedJson()
      : NextResponse.redirect(new URL("/admin/login", request.url))

    response.cookies.set(ADMIN_SESSION_COOKIE, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      priority: "high",
    })

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}