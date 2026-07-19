import bcrypt from "bcryptjs"
import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

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

export async function POST(request: Request) {
  await requireAdminUser(["Owner"])

  try {
    let requestBody: unknown

    try {
      requestBody = await request.json()
    } catch {
      return jsonResponse(
        {
          success: false,
          message: "Invalid password update request.",
        },
        400
      )
    }

    if (!requestBody || typeof requestBody !== "object") {
      return jsonResponse(
        {
          success: false,
          message: "Invalid password update request.",
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

    if (email.length > 254) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid email address.",
        },
        400
      )
    }

    if (password.length < 12) {
      return jsonResponse(
        {
          success: false,
          message: "Password must be at least 12 characters.",
        },
        400
      )
    }

    if (password.length > 200) {
      return jsonResponse(
        {
          success: false,
          message: "Password is too long.",
        },
        400
      )
    }

    const { data: targetUser, error: userError } = await supabaseAdmin
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .single()

    if (userError || !targetUser) {
      return jsonResponse(
        {
          success: false,
          message: "Unable to update password for this account.",
        },
        404
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const { error: updateError } = await supabaseAdmin
      .from("admin_users")
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUser.id)

    if (updateError) {
      console.error("Password update failed:", updateError)

      return jsonResponse(
        {
          success: false,
          message: "Unable to update password right now.",
        },
        500
      )
    }

    const { error: sessionDeleteError } = await supabaseAdmin
      .from("admin_sessions")
      .delete()
      .eq("user_id", targetUser.id)

    if (sessionDeleteError) {
      console.error(
        "Password updated, but session invalidation failed:",
        sessionDeleteError
      )
    }

    return jsonResponse(
      {
        success: true,
        message: "Password updated. Existing sessions were signed out.",
      },
      200
    )
  } catch (error) {
    console.error("Set password error:", error)

    return jsonResponse(
      {
        success: false,
        message: "Unable to update password right now.",
      },
      500
    )
  }
}