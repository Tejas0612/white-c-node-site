import { Resend } from "resend"
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const resend = new Resend(process.env.RESEND_API_KEY)

const MAX_REQUEST_BYTES = 64_000
const MAX_PRODUCTS = 20
const INQUIRY_IP_LIMIT = 20
const INQUIRY_EMAIL_LIMIT = 5
const INQUIRY_WINDOW_SECONDS = 60 * 60

type InquiryProduct = {
  id: string
  name: string
  brand?: string | null
  category?: string | null
  budget_band?: string | null
  image_url?: string | null
  quantity?: number
}

type InquiryCustomer = {
  name: string
  company: string
  email: string
  phone: string
  requirement: string
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  extraHeaders: Record<string, string> = {}
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      ...extraHeaders,
    },
  })
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength)
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "")
  return digits.length >= 7 && digits.length <= 15
}

function escapeHtml(value: unknown) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function normalizeCustomer(value: unknown): InquiryCustomer | null {
  if (!value || typeof value !== "object") return null

  const customer = value as Record<string, unknown>

  const normalized = {
    name: cleanText(customer.name, 120),
    company: cleanText(customer.company, 160),
    email: cleanText(customer.email, 254).toLowerCase(),
    phone: cleanText(customer.phone, 40),
    requirement: cleanText(customer.requirement, 3_000),
  }

  if (
    !normalized.name ||
    !normalized.email ||
    !normalized.phone ||
    !isValidEmail(normalized.email) ||
    !isValidPhone(normalized.phone)
  ) {
    return null
  }

  return normalized
}

function normalizeProducts(value: unknown): InquiryProduct[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_PRODUCTS) {
    return null
  }

  const products: InquiryProduct[] = []

  for (const rawProduct of value) {
    if (!rawProduct || typeof rawProduct !== "object") {
      return null
    }

    const product = rawProduct as Record<string, unknown>
    const id = cleanText(product.id, 120)
    const name = cleanText(product.name, 250)

    const rawQuantity = Number(product.quantity ?? 1)
    const quantity =
      Number.isSafeInteger(rawQuantity) && rawQuantity >= 1 && rawQuantity <= 10_000
        ? rawQuantity
        : NaN

    if (!id || !name || !Number.isFinite(quantity)) {
      return null
    }

    products.push({
      id,
      name,
      brand: cleanText(product.brand, 150) || null,
      category: cleanText(product.category, 150) || null,
      budget_band: cleanText(product.budget_band, 80) || null,
      image_url: cleanText(product.image_url, 2_000) || null,
      quantity,
    })
  }

  return products
}

function createProductRows(products: InquiryProduct[]) {
  return products
    .map(
      (product, index) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${index + 1}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong>${escapeHtml(product.name)}</strong><br />
            <span style="color: #6b7280;">
              ${escapeHtml(product.brand || "white-c")} · ${escapeHtml(
                product.category || "Corporate Gift"
              )}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${escapeHtml(product.budget_band || "-")}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${escapeHtml(product.quantity || 1)}
          </td>
        </tr>
      `
    )
    .join("")
}

function createPlainProductList(products: InquiryProduct[]) {
  return products
    .map(
      (product, index) => `${index + 1}. ${product.name}
Brand: ${product.brand || "white-c"}
Category: ${product.category || "Corporate Gift"}
Budget Band: ${product.budget_band || "-"}
Quantity: ${product.quantity || 1}`
    )
    .join("\n\n")
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0)

    if (contentLength > MAX_REQUEST_BYTES) {
      return jsonResponse(
        {
          success: false,
          message: "Inquiry request is too large.",
        },
        413
      )
    }

    const ipRateLimit = await consumeRateLimit({
      request,
      scope: "public-inquiry-ip",
      limit: INQUIRY_IP_LIMIT,
      windowSeconds: INQUIRY_WINDOW_SECONDS,
    })

    const ipRateHeaders = createRateLimitHeaders(ipRateLimit)

    if (!ipRateLimit.allowed) {
      return jsonResponse(
        {
          success: false,
          message: "Too many inquiry attempts. Please try again later.",
        },
        429,
        ipRateHeaders
      )
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return jsonResponse(
        {
          success: false,
          message: "Invalid inquiry request.",
        },
        400,
        ipRateHeaders
      )
    }

    if (!body || typeof body !== "object") {
      return jsonResponse(
        {
          success: false,
          message: "Invalid inquiry request.",
        },
        400,
        ipRateHeaders
      )
    }

    const requestBody = body as Record<string, unknown>
    const customer = normalizeCustomer(requestBody.customer)
    const products = normalizeProducts(requestBody.products)

    if (!customer) {
      return jsonResponse(
        {
          success: false,
          message: "Please provide a valid name, email, and phone number.",
        },
        400,
        ipRateHeaders
      )
    }

    if (!products) {
      return jsonResponse(
        {
          success: false,
          message: `Select between 1 and ${MAX_PRODUCTS} valid products.`,
        },
        400,
        ipRateHeaders
      )
    }

    const emailRateLimit = await consumeRateLimit({
      request,
      scope: "public-inquiry-email",
      identifier: customer.email,
      limit: INQUIRY_EMAIL_LIMIT,
      windowSeconds: INQUIRY_WINDOW_SECONDS,
    })

    const emailRateHeaders = createRateLimitHeaders(emailRateLimit)

    if (!emailRateLimit.allowed) {
      return jsonResponse(
        {
          success: false,
          message: "Too many inquiry attempts. Please try again later.",
        },
        429,
        emailRateHeaders
      )
    }

    if (
      !process.env.RESEND_API_KEY ||
      !process.env.INQUIRY_RECEIVER_EMAIL ||
      !process.env.RESEND_FROM_EMAIL
    ) {
      console.error("Inquiry email configuration is incomplete.")

      return jsonResponse(
        {
          success: false,
          message: "Inquiry service is temporarily unavailable.",
        },
        503,
        emailRateHeaders
      )
    }

    const totalQuantity = products.reduce(
      (total, product) => total + Number(product.quantity || 1),
      0
    )

    const subject = `New white-c Inquiry from ${customer.name}`

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111827; max-width: 760px;">
        <h1 style="margin-bottom: 8px;">New white-c Inquiry</h1>
        <p style="color: #6b7280; margin-top: 0;">
          A customer submitted a new corporate gifting inquiry.
        </p>

        <h2 style="margin-top: 28px;">Customer Details</h2>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Name</td>
            <td style="padding: 8px 0;"><strong>${escapeHtml(
              customer.name
            )}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Company</td>
            <td style="padding: 8px 0;">${escapeHtml(
              customer.company || "-"
            )}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Email</td>
            <td style="padding: 8px 0;">${escapeHtml(customer.email)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Phone</td>
            <td style="padding: 8px 0;">${escapeHtml(customer.phone)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Requirement</td>
            <td style="padding: 8px 0;">${escapeHtml(
              customer.requirement || "-"
            ).replaceAll("\n", "<br />")}</td>
          </tr>
        </table>

        <h2 style="margin-top: 28px;">Selected Products</h2>

        <p style="color: #6b7280;">
          ${products.length} product${products.length === 1 ? "" : "s"} selected ·
          Total quantity ${totalQuantity}
        </p>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background: #f9fafb;">
              <th align="left" style="padding: 12px;">#</th>
              <th align="left" style="padding: 12px;">Product</th>
              <th align="left" style="padding: 12px;">Budget Band</th>
              <th align="left" style="padding: 12px;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${createProductRows(products)}
          </tbody>
        </table>
      </div>
    `

    const text = `
New white-c Inquiry

Customer Details:
Name: ${customer.name}
Company: ${customer.company || "-"}
Email: ${customer.email}
Phone: ${customer.phone}
Requirement: ${customer.requirement || "-"}

Selected Products:
${createPlainProductList(products)}

Total Quantity: ${totalQuantity}
`

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.INQUIRY_RECEIVER_EMAIL,
      replyTo: customer.email,
      subject,
      html,
      text,
    })

    if (error) {
      console.error("Inquiry email send failed:", error)

      return jsonResponse(
        {
          success: false,
          message: "Unable to send your inquiry right now.",
        },
        502,
        emailRateHeaders
      )
    }

    return jsonResponse(
      {
        success: true,
      },
      200,
      emailRateHeaders
    )
  } catch (error) {
    console.error("Inquiry send error:", error)

    return jsonResponse(
      {
        success: false,
        message: "Something went wrong while sending your inquiry.",
      },
      500
    )
  }
}