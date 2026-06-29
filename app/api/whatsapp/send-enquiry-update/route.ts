import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminUser } from "@/lib/admin-auth"
import {
  cleanWhatsAppPhone,
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
} from "@/lib/whatsapp-cloud"

export const dynamic = "force-dynamic"

function buildEnquiryUpdateText(enquiry: any) {
  return `Hi ${enquiry.client_name}, this is White C.

We have received your gifting enquiry for ${enquiry.product_names || "your requirement"}.

Our team is reviewing it and will get back to you shortly.

Reference: ${enquiry.enquiry_code}`
}

async function logOutboundMessage({
  enquiryId,
  toPhone,
  messageText,
  result,
}: {
  enquiryId: string
  toPhone: string
  messageText: string
  result: any
}) {
  const { error } = await supabaseAdmin.from("whatsapp_outbound_messages").insert({
    enquiry_id: enquiryId,
    to_phone: toPhone,
    message_type: "enquiry_update",
    message_text: messageText,
    whatsapp_message_id: result.whatsappMessageId || null,
    send_status: result.success ? "Sent" : "Failed",
    error_message: result.success ? null : result.error || "Failed",
    raw_response: result.response || null,
  })

  if (error) {
    console.error("WhatsApp enquiry outbound log failed:", error)
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser(["Sales", "Operations"])

    const body = await request.json()
    const enquiryId = String(body.enquiryId || "").trim()

    if (!enquiryId) {
      return NextResponse.json(
        {
          success: false,
          message: "Enquiry ID is required.",
        },
        { status: 400 }
      )
    }

    const { data: enquiry, error } = await supabaseAdmin
      .from("workflow_enquiries")
      .select("*")
      .eq("id", enquiryId)
      .single()

    if (error || !enquiry) {
      return NextResponse.json(
        {
          success: false,
          message: error?.message || "Enquiry not found.",
        },
        { status: 404 }
      )
    }

    const toPhone = cleanWhatsAppPhone(enquiry.client_phone)
    const messageText = buildEnquiryUpdateText(enquiry)

    if (!toPhone) {
      return NextResponse.json(
        {
          success: false,
          message: "Client WhatsApp number is missing.",
        },
        { status: 400 }
      )
    }

    const templateName = process.env.WHATSAPP_ENQUIRY_TEMPLATE_NAME

    const result = templateName
      ? await sendWhatsAppTemplateMessage({
          to: toPhone,
          templateName,
          bodyVariables: [
            enquiry.client_name || "Client",
            enquiry.product_names || "your requirement",
            enquiry.enquiry_code || "-",
          ],
        })
      : await sendWhatsAppTextMessage({
          to: toPhone,
          message: messageText,
        })

    await logOutboundMessage({
      enquiryId,
      toPhone,
      messageText,
      result,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || "Failed to send WhatsApp update.",
          to: toPhone,
          result,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp update sent.",
      to: toPhone,
      whatsapp_message_id: result.whatsappMessageId || null,
      result,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to send enquiry WhatsApp update.",
      },
      { status: 500 }
    )
  }
}