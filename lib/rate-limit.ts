import "server-only"

import { createHash } from "crypto"
import { supabaseAdmin } from "@/lib/supabase-admin"

type RateLimitOptions = {
  request: Request
  scope: string
  limit: number
  windowSeconds: number
  identifier?: string
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: string
  retryAfterSeconds: number
  error?: string
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const forwardedIp = forwardedFor?.split(",")[0]?.trim()

  return (
    forwardedIp ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  )
}

function createRateLimitKey({
  request,
  scope,
  identifier,
}: Pick<RateLimitOptions, "request" | "scope" | "identifier">) {
  const ipAddress = getClientIp(request)
  const normalizedIdentifier = String(identifier || "")
    .trim()
    .toLowerCase()
    .slice(0, 254)

  return createHash("sha256")
    .update(`${scope}:${ipAddress}:${normalizedIdentifier}`)
    .digest("hex")
}

export async function consumeRateLimit({
  request,
  scope,
  limit,
  windowSeconds,
  identifier,
}: RateLimitOptions): Promise<RateLimitResult> {
  const keyHash = createRateLimitKey({
    request,
    scope,
    identifier,
  })

  const { data, error } = await supabaseAdmin.rpc(
    "consume_security_rate_limit",
    {
      p_key_hash: keyHash,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    }
  )

  if (error) {
    console.error("Rate-limit check failed:", {
      scope,
      error,
    })

    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 60_000).toISOString(),
      retryAfterSeconds: 60,
      error: "Rate-limit service unavailable.",
    }
  }

  const result = Array.isArray(data) ? data[0] : data

  const resetAt =
    typeof result?.reset_at === "string"
      ? result.reset_at
      : new Date(Date.now() + windowSeconds * 1000).toISOString()

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000)
  )

  return {
    allowed: Boolean(result?.allowed),
    remaining: Number(result?.remaining || 0),
    resetAt,
    retryAfterSeconds,
  }
}

export function createRateLimitHeaders(result: RateLimitResult) {
  return {
    "Cache-Control": "no-store, max-age=0",
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": result.resetAt,
    ...(result.allowed
      ? {}
      : {
          "Retry-After": String(result.retryAfterSeconds),
        }),
  }
}