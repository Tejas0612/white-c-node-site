import { cookies } from "next/headers"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth"
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_LOGIN_REQUEST_BYTES = 4_096
const LOGIN_IP_LIMIT = 30
const LOGIN_ACCOUNT_LIMIT = 5
const LOGIN_WINDOW_SECONDS = 15 * 60

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  extraHeaders: Record<string, string> = {}
) {
  return Response.json(body, {
    status,
    headers: {
      ...noStoreHeaders,
      ...extraHeaders,
    },
  })
}

function invalidCredentialsResponse(
  extraHeaders: Record<string, string> = {}
) {
  return jsonResponse(
    {
      success: false,
      message: "Invalid email or password.",
    },
    401,
    extraHeaders
  )
}

function rateLimitedResponse(
  retryAfterSeconds: number,
  extraHeaders: Record<string, string>
) {
  return jsonResponse(
    {
      success: false,
      message: `Too many login attempts. Please try again in ${Math.ceil(
        retryAfterSeconds / 60
      )} minute(s).`,
    },
    429,
    extraHeaders
  )
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0)

    if (contentLength > MAX_LOGIN_REQUEST_BYTES) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid login request.",
        },
        413
      )
    }

    const ipRateLimit = await consumeRateLimit({
      request,
      scope: "admin-login-ip",
      limit: LOGIN_IP_LIMIT,
      windowSeconds: LOGIN_WINDOW_SECONDS,
    })

    const ipRateLimitHeaders = createRateLimitHeaders(ipRateLimit)

    if (!ipRateLimit.allowed) {
      return rateLimitedResponse(
        ipRateLimit.retryAfterSeconds,
        ipRateLimitHeaders
      )
    }

    let requestBody: unknown

    try {
      requestBody = await request.json()
    } catch {
      return jsonResponse(
        {
          success: false,
          message: "Invalid login request.",
        },
        400,
        ipRateLimitHeaders
      )
    }

    if (!requestBody || typeof requestBody !== "object") {
      return jsonResponse(
        {
          success: false,
          message: "Invalid login request.",
        },
        400,
        ipRateLimitHeaders
      )
    }

    const { email: rawEmail, password: rawPassword } = requestBody as {
      email?: unknown
      password?: unknown
    }

    const email =
      typeof rawEmail === "string" ? rawEmail.toLowerCase().trim() : ""
    const password = typeof rawPassword === "string" ? rawPassword : ""

    if (!email || !password) {
      return jsonResponse(
        {
          success: false,
          message: "Email and password are required.",
        },
        400,
        ipRateLimitHeaders
      )
    }

    if (email.length > 254 || password.length > 200) {
      return invalidCredentialsResponse(ipRateLimitHeaders)
    }

    const accountRateLimit = await consumeRateLimit({
      request,
      scope: "admin-login-account",
      identifier: email,
      limit: LOGIN_ACCOUNT_LIMIT,
      windowSeconds: LOGIN_WINDOW_SECONDS,
    })

    const accountRateLimitHeaders = createRateLimitHeaders(accountRateLimit)

    if (!accountRateLimit.allowed) {
      return rateLimitedResponse(
        accountRateLimit.retryAfterSeconds,
        accountRateLimitHeaders
      )
    }

    const { data: user, error } = await supabaseAdmin
      .from("admin_users")
      .select("id, name, email, role, roles, password_hash, is_active")
      .eq("email", email)
      .eq("is_active", true)
      .single()

    if (error || !user?.password_hash) {
      return invalidCredentialsResponse(accountRateLimitHeaders)
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatches) {
      return invalidCredentialsResponse(accountRateLimitHeaders)
    }

    const sessionToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error: sessionError } = await supabaseAdmin
      .from("admin_sessions")
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      })

    if (sessionError) {
      console.error("Admin session creation failed:", sessionError)

      return jsonResponse(
        {
          success: false,
          message: "Unable to sign in right now. Please try again.",
        },
        500,
        accountRateLimitHeaders
      )
    }

    const cookieStore = await cookies()

    cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
      priority: "high",
    })

    return jsonResponse(
      {
        success: true,
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
          roles: user.roles,
        },
      },
      200,
      accountRateLimitHeaders
    )
  } catch (error) {
    console.error("Admin login error:", error)

    return jsonResponse(
      {
        success: false,
        message: "Unable to sign in right now. Please try again.",
      },
      500
    )
  }
}