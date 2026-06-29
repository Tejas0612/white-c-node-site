export type WhatsAppSendResult = {
  success: boolean
  whatsappMessageId?: string | null
  response?: any
  error?: string
}

function getWhatsAppApiVersion() {
  return process.env.WHATSAPP_API_VERSION || "v21.0"
}

function getTemplateLanguage() {
  return process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US"
}

export function cleanWhatsAppPhone(phone: string | null | undefined) {
  return String(phone || "").replace(/\D/g, "")
}

async function sendWhatsAppPayload(payload: any): Promise<WhatsAppSendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const apiVersion = getWhatsAppApiVersion()

  if (!phoneNumberId) {
    return { success: false, error: "WHATSAPP_PHONE_NUMBER_ID is missing." }
  }

  if (!accessToken) {
    return { success: false, error: "WHATSAPP_ACCESS_TOKEN is missing." }
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  )

  const result = await response.json()

  if (!response.ok) {
    return {
      success: false,
      response: result,
      error:
        result?.error?.message ||
        result?.error?.error_user_msg ||
        "WhatsApp message failed.",
    }
  }

  return {
    success: true,
    response: result,
    whatsappMessageId: result?.messages?.[0]?.id || null,
  }
}

export async function sendWhatsAppTextMessage({
  to,
  message,
}: {
  to: string
  message: string
}): Promise<WhatsAppSendResult> {
  const cleanTo = cleanWhatsAppPhone(to)

  if (!cleanTo) {
    return { success: false, error: "Recipient WhatsApp number is missing." }
  }

  return sendWhatsAppPayload({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanTo,
    type: "text",
    text: {
      preview_url: false,
      body: message,
    },
  })
}

export async function sendWhatsAppTemplateMessage({
  to,
  templateName,
  bodyVariables,
}: {
  to: string
  templateName: string
  bodyVariables: string[]
}): Promise<WhatsAppSendResult> {
  const cleanTo = cleanWhatsAppPhone(to)

  if (!cleanTo) {
    return { success: false, error: "Recipient WhatsApp number is missing." }
  }

  if (!templateName) {
    return { success: false, error: "WhatsApp template name is missing." }
  }

  return sendWhatsAppPayload({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanTo,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: getTemplateLanguage(),
      },
      components: [
        {
          type: "body",
          parameters: bodyVariables.map((value) => ({
            type: "text",
            text: value || "-",
          })),
        },
      ],
    },
  })
}