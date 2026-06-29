import bcrypt from "bcryptjs"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { email, password, setupSecret } = await request.json()

    if (!process.env.ADMIN_SESSION_SECRET) {
      return Response.json(
        {
          success: false,
          message: "ADMIN_SESSION_SECRET is missing.",
        },
        { status: 500 }
      )
    }

    if (setupSecret !== process.env.ADMIN_SESSION_SECRET) {
      return Response.json(
        {
          success: false,
          message: "Invalid setup secret.",
        },
        { status: 401 }
      )
    }

    if (!email || !password) {
      return Response.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 }
      )
    }

    if (String(password).length < 8) {
      return Response.json(
        {
          success: false,
          message: "Password must be at least 8 characters.",
        },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const { error } = await supabaseAdmin
      .from("admin_users")
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq("email", String(email).toLowerCase().trim())

    if (error) {
      return Response.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: "Password updated.",
    })
  } catch (error: any) {
    console.error("Set password error:", error)

    return Response.json(
      {
        success: false,
        message: error?.message || "Failed to set password.",
      },
      { status: 500 }
    )
  }
}