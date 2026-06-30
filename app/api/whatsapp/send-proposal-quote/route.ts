import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

function cleanPhone(phone: string) {
  return String(phone || "").replace(/[^\d]/g, "")
}

function cleanTemplateText(value: string) {
  return String(value || "")
    .replace(/[\n\r\t]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function getWhatsAppConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0"
  const templateName = process.env.WHATSAPP_PROPOSAL_TEMPLATE_NAME
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US"

  if (!phoneNumberId) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID is missing.")
  }

  if (!accessToken) {
    throw new Error("WHATSAPP_ACCESS_TOKEN is missing.")
  }

  return {
    phoneNumberId,
    accessToken,
    apiVersion,
    templateName,
    languageCode,
  }
}

function buildProposalMessage({
  clientName,
  enquiryCode,
  requirement,
  estimatedValue,
  validTill,
  customMessage,
}: {
  clientName: string
  enquiryCode: string
  requirement: string
  estimatedValue: string
  validTill: string
  customMessage: string
}) {
  return `Hi ${clientName}, this is White C.

Proposal / Quotation Details:
Reference: ${enquiryCode}
Requirement: ${requirement}
Estimated Value: ${estimatedValue || "As discussed"}
Valid Till: ${validTill || "As discussed"}

${customMessage}

Our team will assist you with branding, quantity confirmation, and next steps.`
}

async function sendProposalWhatsApp({
  enquiry,
  requirement,
  estimatedValue,
  validTill,
  customMessage,
}: {
  enquiry: any
  requirement: string
  estimatedValue: string
  validTill: string
  customMessage: string
}) {
  const {
    phoneNumberId,
    accessToken,
    apiVersion,
    templateName,
    languageCode,
  } = getWhatsAppConfig()

  const toPhone = cleanPhone(enquiry.client_phone || "")

  if (!toPhone) {
    throw new Error("Client WhatsApp number is missing or invalid.")
  }

  const clientName = cleanTemplateText(enquiry.client_name || "there")
  const enquiryCode = cleanTemplateText(enquiry.enquiry_code || "")
  const finalRequirement = cleanTemplateText(
    requirement || enquiry.product_names || "your gifting requirement"
  )
  const finalEstimatedValue = cleanTemplateText(estimatedValue || "As discussed")
  const finalValidTill = cleanTemplateText(validTill || "As discussed")
  const finalCustomMessage = cleanTemplateText(
    customMessage || "Please review the proposal and share your confirmation."
  )

  const messageText = buildProposalMessage({
    clientName,
    enquiryCode,
    requirement: finalRequirement,
    estimatedValue: finalEstimatedValue,
    validTill: finalValidTill,
    customMessage: finalCustomMessage,
  })

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`

  const payload = templateName
    ? {
        messaging_product: "whatsapp",
        to: toPhone,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: clientName,
                },
                {
                  type: "text",
                  text: enquiryCode,
                },
                {
                  type: "text",
                  text: finalRequirement,
                },
                {
                  type: "text",
                  text: finalEstimatedValue,
                },
                {
                  type: "text",
                  text: finalValidTill,
                },
                {
                  type: "text",
                  text: finalCustomMessage,
                },
              ],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to: toPhone,
        type: "text",
        text: {
          preview_url: false,
          body: messageText,
        },
      }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const responseJson = await response.json()

  await supabaseAdmin.from("whatsapp_outbound_messages").insert({
    enquiry_id: enquiry.id,
    to_phone: toPhone,
    message_type: templateName
      ? "proposal_quote_template"
      : "proposal_quote_text",
    message_text: messageText,
    whatsapp_message_id: responseJson?.messages?.[0]?.id || null,
    send_status: response.ok ? "Sent" : "Failed",
    error_message: response.ok ? null : JSON.stringify(responseJson),
    raw_response: responseJson,
  })

  if (!response.ok) {
    throw new Error(
      responseJson?.error?.message || "Failed to send proposal WhatsApp."
    )
  }

  await supabaseAdmin
    .from("workflow_enquiries")
    .update({
      proposal_status: "Sent",
      last_client_interaction_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", enquiry.id)

  return responseJson
}

export async function POST(request: Request) {
  try {
    await requireAdminUser(["Admin", "Owner", "Sales", "Operations"])

    const body = await request.json()

    const enquiryId = cleanTemplateText(body.enquiryId || "")
    const requirement = cleanTemplateText(body.requirement || "")
    const estimatedValue = cleanTemplateText(body.estimatedValue || "")
    const validTill = cleanTemplateText(body.validTill || "")
    const customMessage = cleanTemplateText(body.customMessage || "")

    if (!enquiryId) {
      throw new Error("Enquiry ID is required.")
    }

    const { data: enquiry, error } = await supabaseAdmin
      .from("workflow_enquiries")
      .select(
        "id, enquiry_code, client_name, client_phone, client_email, product_names"
      )
      .eq("id", enquiryId)
      .single()

    if (error || !enquiry) {
      throw new Error(error?.message || "Enquiry not found.")
    }

    if (!enquiry.client_phone) {
      throw new Error("Client phone number is missing.")
    }

    const result = await sendProposalWhatsApp({
      enquiry,
      requirement,
      estimatedValue,
      validTill,
      customMessage,
    })

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to send proposal.",
      },
      {
        status: 400,
      }
    )
  }
}