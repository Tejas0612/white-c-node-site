import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

type SelectedProduct = {
  id?: string
  name?: string
  brand?: string | null
  category?: string | null
  budget_band?: string | null
  image_url?: string | null
}

function escapeHtml(value: unknown) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function selectedProductsHtml(products: SelectedProduct[]) {
  if (!Array.isArray(products) || products.length === 0) {
    return `
      <p><strong>Selected Products:</strong> No specific products selected.</p>
    `
  }

  return `
    <h3>Selected Products</h3>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr>
          <th align="left">#</th>
          <th align="left">Product</th>
          <th align="left">Brand</th>
          <th align="left">Category</th>
          <th align="left">Budget Band</th>
        </tr>
      </thead>
      <tbody>
        ${products
          .map(
            (product, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(product.name)}</td>
                <td>${escapeHtml(product.brand || "-")}</td>
                <td>${escapeHtml(product.category || "-")}</td>
                <td>${escapeHtml(product.budget_band || "-")}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!process.env.RESEND_API_KEY) {
      return Response.json(
        { success: false, message: "RESEND_API_KEY is missing in .env.local" },
        { status: 500 }
      )
    }

    const receiverEmail = process.env.INQUIRY_RECEIVER_EMAIL
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

    if (!receiverEmail) {
      return Response.json(
        {
          success: false,
          message: "INQUIRY_RECEIVER_EMAIL is missing in .env.local",
        },
        { status: 500 }
      )
    }

    const selectedProducts = Array.isArray(data.selectedProducts)
      ? data.selectedProducts
      : []

    const { error } = await resend.emails.send({
      from: `white-c Website <${fromEmail}>`,
      to: [receiverEmail],
      replyTo: data.email,
      subject: "New inquiry from white-c website",
      html: `
        <h2>New inquiry from white-c website</h2>

        <h3>Customer Details</h3>
        <p><strong>Company Name:</strong> ${escapeHtml(data.companyName)}</p>
        <p><strong>Contact Person:</strong> ${escapeHtml(data.contactPerson)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>

        <h3>Requirement Details</h3>
        <p><strong>Budget Band:</strong> ${escapeHtml(data.budgetBand)}</p>
        <p><strong>Quantity:</strong> ${escapeHtml(data.quantity)}</p>
        <p><strong>Occasion:</strong> ${escapeHtml(data.occasion)}</p>
        <p><strong>Delivery City:</strong> ${escapeHtml(data.deliveryCity)}</p>
        <p><strong>Branding Required:</strong> ${escapeHtml(data.brandingRequired)}</p>
        <p><strong>Timeline:</strong> ${escapeHtml(data.timeline)}</p>
        <p><strong>Message:</strong> ${escapeHtml(data.message)}</p>

        ${selectedProductsHtml(selectedProducts)}
      `,
    })

    if (error) {
      return Response.json(
        {
          success: false,
          message: error.message || "Resend failed to send inquiry.",
        },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: `Inquiry sent successfully to ${receiverEmail}`,
    })
  } catch {
    return Response.json(
      {
        success: false,
        message: "Something went wrong while sending inquiry.",
      },
      { status: 500 }
    )
  }
}