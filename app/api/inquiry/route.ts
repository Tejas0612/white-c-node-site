import { Resend } from "resend"

export const runtime = "nodejs"

const resend = new Resend(process.env.RESEND_API_KEY)

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
  name?: string
  company?: string
  email?: string
  phone?: string
  requirement?: string
}

function escapeHtml(value: unknown) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function createProductRows(products: InquiryProduct[]) {
  return products
    .map((product, index) => {
      return `
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
    })
    .join("")
}

function createPlainProductList(products: InquiryProduct[]) {
  return products
    .map((product, index) => {
      return `${index + 1}. ${product.name}
Brand: ${product.brand || "white-c"}
Category: ${product.category || "Corporate Gift"}
Budget Band: ${product.budget_band || "-"}
Quantity: ${product.quantity || 1}`
    })
    .join("\n\n")
}

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return Response.json(
        {
          success: false,
          message: "RESEND_API_KEY is missing.",
        },
        { status: 500 }
      )
    }

    if (!process.env.INQUIRY_RECEIVER_EMAIL) {
      return Response.json(
        {
          success: false,
          message: "INQUIRY_RECEIVER_EMAIL is missing.",
        },
        { status: 500 }
      )
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      return Response.json(
        {
          success: false,
          message: "RESEND_FROM_EMAIL is missing.",
        },
        { status: 500 }
      )
    }

    const body = await request.json()

    const customer = body.customer as InquiryCustomer
    const products = body.products as InquiryProduct[]

    if (!customer?.name || !customer?.email || !customer?.phone) {
      return Response.json(
        {
          success: false,
          message: "Name, email, and phone are required.",
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(products) || products.length === 0) {
      return Response.json(
        {
          success: false,
          message: "At least one product is required.",
        },
        { status: 400 }
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
    })
  } catch (error: any) {
    console.error("Inquiry send error:", error)

    return Response.json(
      {
        success: false,
        message:
          error?.message || "Something went wrong while sending inquiry.",
      },
      { status: 500 }
    )
  }
}