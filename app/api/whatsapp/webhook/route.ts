import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

function cleanText(value: string | number | null | undefined) {
  return String(value || "")
    .replace(/[\n\r\t]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function normalizePhone(value: string | number | null | undefined) {
  return String(value || "")
    .replace(/\D/g, "")
    .trim()
}

function getWhatsAppVerifyToken() {
  return cleanText(process.env.WHATSAPP_VERIFY_TOKEN)
}

function getStatusTimestamp(timestamp: string | number | null | undefined) {
  const value = Number(timestamp || 0)

  if (!value) {
    return new Date().toISOString()
  }

  return new Date(value * 1000).toISOString()
}

function mapSendStatus(status: string) {
  if (status === "failed") {
    return "Failed"
  }

  if (status === "delivered") {
    return "Delivered"
  }

  if (status === "read") {
    return "Read"
  }

  if (status === "sent") {
    return "Sent"
  }

  return "Accepted"
}

export async function GET(request: Request) {
  const url = new URL(request.url)

  const mode = url.searchParams.get("hub.mode")
  const token = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")

  const verifyToken = getWhatsAppVerifyToken()

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, {
      status: 200,
    })
  }

  return NextResponse.json(
    {
      success: false,
      error: "Webhook verification failed.",
    },
    {
      status: 403,
    }
  )
}
async function updateOutboundMessageStatus(statusItem: any) {
  const whatsappMessageId = cleanText(statusItem?.id)
  const status = cleanText(statusItem?.status).toLowerCase()

  if (!whatsappMessageId || !status) {
    return
  }

  const statusTime = getStatusTimestamp(statusItem?.timestamp)

  const updatePayload: any = {
    delivery_status: status,
    send_status: mapSendStatus(status),
    webhook_status_payload: statusItem,
  }

  if (status === "delivered") {
    updatePayload.delivered_at = statusTime
  }

  if (status === "read") {
    updatePayload.read_at = statusTime
  }

  if (status === "failed") {
    updatePayload.failed_at = statusTime

    const errorDetails =
      statusItem?.errors?.[0]?.message ||
      statusItem?.errors?.[0]?.title ||
      JSON.stringify(statusItem?.errors || statusItem)

    updatePayload.error_message = errorDetails
  }

  await supabaseAdmin
    .from("whatsapp_outbound_messages")
    .update(updatePayload)
    .eq("whatsapp_message_id", whatsappMessageId)
}

async function handleTaskReply({
  fromPhone,
  messageText,
}: {
  fromPhone: string
  messageText: string
}) {
  const cleanPhone = normalizePhone(fromPhone)
  const cleanMessage = cleanText(messageText)
  const upperMessage = cleanMessage.toUpperCase()

  if (!cleanPhone || !cleanMessage) {
    return
  }

  const { data: teamMember } = await supabaseAdmin
    .from("workflow_team_members")
    .select("id, name, whatsapp")
    .eq("whatsapp", cleanPhone)
    .maybeSingle()

  if (!teamMember) {
    return
  }

  if (upperMessage.startsWith("DONE ")) {
    const taskCode = cleanText(cleanMessage.slice(5))

    if (!taskCode) {
      return
    }

    await supabaseAdmin
      .from("workflow_tasks")
      .update({
        status: "Done",
        remark: `Marked done by WhatsApp reply from ${teamMember.name}`,
        updated_at: new Date().toISOString(),
      })
      .eq("task_code", taskCode)
      .eq("assignee_id", teamMember.id)

    return
  }

  if (upperMessage.startsWith("REMARK ")) {
    const withoutKeyword = cleanMessage.slice(7).trim()
    const firstSpaceIndex = withoutKeyword.indexOf(" ")

    if (firstSpaceIndex <= 0) {
      return
    }

    const taskCode = cleanText(withoutKeyword.slice(0, firstSpaceIndex))
    const remark = cleanText(withoutKeyword.slice(firstSpaceIndex + 1))

    if (!taskCode || !remark) {
      return
    }

    await supabaseAdmin
      .from("workflow_tasks")
      .update({
        remark,
        updated_at: new Date().toISOString(),
      })
      .eq("task_code", taskCode)
      .eq("assignee_id", teamMember.id)
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()

    await supabaseAdmin
      .from("whatsapp_webhook_events")
      .insert({
        event_type: "whatsapp_webhook_post",
        raw_payload: body,
      })

    const entries = Array.isArray(body?.entry) ? body.entry : []

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : []

      for (const change of changes) {
        const value = change?.value || {}

        const statuses = Array.isArray(value?.statuses)
          ? value.statuses
          : []

        for (const statusItem of statuses) {
          await updateOutboundMessageStatus(statusItem)
        }

        const messages = Array.isArray(value?.messages)
          ? value.messages
          : []

        for (const message of messages) {
          const fromPhone = normalizePhone(message?.from)

          const messageText = cleanText(
            message?.text?.body ||
              message?.button?.text ||
              message?.interactive?.button_reply?.title ||
              message?.interactive?.button_reply?.id ||
              message?.interactive?.list_reply?.title ||
              message?.interactive?.list_reply?.id ||
              ""
          )

          await handleTaskReply({
            fromPhone,
            messageText,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Webhook processing failed.",
      },
      {
        status: 200,
      }
    )
  }
}