import { cookies } from "next/headers"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number
) {
  return Response.json(body, {
    status,
    headers: noStoreHeaders,
  })
}

function invalidCredentialsResponse() {
  return jsonResponse(
    {
      success: false,
      message: "Invalid email or password.",
    },
    401
  )
}

export async function POST(request: Request) {
  try {
    let requestBody: unknown

    try {
      requestBody = await request.json()
    } catch {
      return jsonResponse(
        {
          success: false,
          message: "Invalid login request.",
        },
        400
      )
    }

    if (!requestBody || typeof requestBody !== "object") {
      return jsonResponse(
        {
          success: false,
          message: "Invalid login request.",
        },
        400
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
        400
      )
    }

    if (email.length > 254 || password.length > 200) {
      return invalidCredentialsResponse()
    }

    const { data: user, error } = await supabaseAdmin
      .from("admin_users")
      .select("id, name, email, role, roles, password_hash, is_active")
      .eq("email", email)
      .eq("is_active", true)
      .single()

    if (error || !user?.password_hash) {
      return invalidCredentialsResponse()
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatches) {
      return invalidCredentialsResponse()
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
        500
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
      200
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