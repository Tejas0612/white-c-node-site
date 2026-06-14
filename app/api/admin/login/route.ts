import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    const adminPassword = process.env.ADMIN_PASSWORD
    const sessionSecret = process.env.ADMIN_SESSION_SECRET

    if (!adminPassword || !sessionSecret) {
      return Response.json(
        {
          success: false,
          message: "Admin environment variables are missing.",
        },
        { status: 500 }
      )
    }

    if (password !== adminPassword) {
      return Response.json(
        {
          success: false,
          message: "Incorrect admin password.",
        },
        { status: 401 }
      )
    }

    const cookieStore = await cookies()

    cookieStore.set("whitec_admin_session", sessionSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return Response.json({
      success: true,
      message: "Logged in successfully.",
    })
  } catch {
    return Response.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      { status: 500 }
    )
  }
}