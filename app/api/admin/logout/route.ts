import { cookies } from "next/headers"

export async function POST() {
  const cookieStore = await cookies()

  cookieStore.set("whitec_admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return Response.json({
    success: true,
    message: "Logged out successfully.",
  })
}