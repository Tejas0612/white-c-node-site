"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function AdminLoginPage() {
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [nextUrl, setNextUrl] = useState("/admin/products")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const next = params.get("next")

    if (next && next.startsWith("/admin")) {
      setNextUrl(next)
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.message || "Invalid password")
        return
      }

      router.push(nextUrl)
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Admin Access
          </p>

          <h1 className="mt-2 text-3xl font-bold">Login to Admin</h1>

          <p className="mt-3 text-sm text-muted-foreground">
            Enter the admin password to manage products and imports.
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-xl border bg-background p-4"
              placeholder="Admin password"
              required
            />

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-black px-6 py-4 font-semibold text-white transition hover:bg-black/90 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}