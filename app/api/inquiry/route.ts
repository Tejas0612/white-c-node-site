import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

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
        { success: false, message: "INQUIRY_RECEIVER_EMAIL is missing in .env.local" },
        { status: 500 }
      )
    }

    const { error } = await resend.emails.send({
      from: `white-c Website <${fromEmail}>`,
      to: [receiverEmail],
      replyTo: data.email,
      subject: "New inquiry from white-c website",
      html: `
        <h2>New inquiry from white-c website</h2>

        <p><strong>Company Name:</strong> ${data.companyName || ""}</p>
        <p><strong>Contact Person:</strong> ${data.contactPerson || ""}</p>
        <p><strong>Email:</strong> ${data.email || ""}</p>
        <p><strong>Phone:</strong> ${data.phone || ""}</p>
        <p><strong>Budget Band:</strong> ${data.budgetBand || ""}</p>
        <p><strong>Quantity:</strong> ${data.quantity || ""}</p>
        <p><strong>Occasion:</strong> ${data.occasion || ""}</p>
        <p><strong>Delivery City:</strong> ${data.deliveryCity || ""}</p>
        <p><strong>Branding Required:</strong> ${data.brandingRequired || ""}</p>
        <p><strong>Timeline:</strong> ${data.timeline || ""}</p>
        <p><strong>Message:</strong> ${data.message || ""}</p>
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