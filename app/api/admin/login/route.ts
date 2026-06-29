import { cookies } from "next/headers"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 }
      )
    }

    const { data: user, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("email", String(email).toLowerCase().trim())
      .eq("is_active", true)
      .single()

    if (error || !user) {
      return Response.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      )
    }

    if (!user.password_hash) {
      return Response.json(
        {
          success: false,
          message:
            "Password is not set for this user yet. Ask the owner to set it.",
        },
        { status: 401 }
      )
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatches) {
      return Response.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      )
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
      return Response.json(
        {
          success: false,
          message: sessionError.message,
        },
        { status: 500 }
      )
    }

    const cookieStore = await cookies()

    cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    })

    return Response.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        roles: user.roles,
      },
    })
  } catch (error: any) {
    console.error("Admin login error:", error)

    return Response.json(
      {
        success: false,
        message: error?.message || "Something went wrong during login.",
      },
      { status: 500 }
    )
  }
}