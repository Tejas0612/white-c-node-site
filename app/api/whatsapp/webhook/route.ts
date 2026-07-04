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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  )
}

async function findTaskByReference(taskReference: string) {
  const cleanReference = cleanText(taskReference)
  const upperReference = cleanReference.toUpperCase()

  if (!cleanReference) {
    return null
  }

  const { data: taskByCode, error: taskCodeError } = await supabaseAdmin
    .from("workflow_tasks")
    .select("id, task_code, title, status, assignee_id")
    .ilike("task_code", upperReference)
    .maybeSingle()

  if (taskCodeError) {
    await supabaseAdmin
      .from("whatsapp_webhook_events")
      .insert({
        event_type: "task_lookup_by_code_error",
        raw_payload: {
          taskReference: cleanReference,
          error: taskCodeError.message,
        },
      })
  }

  if (taskByCode) {
    return taskByCode
  }

  if (!isUuid(cleanReference)) {
    return null
  }

  const { data: taskById, error: taskIdError } = await supabaseAdmin
    .from("workflow_tasks")
    .select("id, task_code, title, status, assignee_id")
    .eq("id", cleanReference)
    .maybeSingle()

  if (taskIdError) {
    await supabaseAdmin
      .from("whatsapp_webhook_events")
      .insert({
        event_type: "task_lookup_by_id_error",
        raw_payload: {
          taskReference: cleanReference,
          error: taskIdError.message,
        },
      })
  }

  return taskById || null
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

  if (!cleanPhone || !cleanMessage) {
    return
  }

  const upperMessage = cleanMessage.toUpperCase()

  const { data: teamMembers } = await supabaseAdmin
    .from("workflow_team_members")
    .select("id, name, whatsapp")
    .eq("is_active", true)

  const teamMember = (teamMembers || []).find((member) => {
    return normalizePhone(member.whatsapp) === cleanPhone
  })

  if (!teamMember) {
    return
  }

  if (upperMessage.startsWith("DONE")) {
    const taskReference = cleanText(
      cleanMessage
        .replace(/^DONE/i, "")
        .replace(/^TASKID/i, "")
        .replace(/^TASK ID/i, "")
        .replace(/^TASKCODE/i, "")
        .replace(/^TASK CODE/i, "")
        .trim()
    )

    if (!taskReference) {
      return
    }

    const matchedTask = await findTaskByReference(taskReference)

    if (!matchedTask) {
      await supabaseAdmin
        .from("whatsapp_webhook_events")
        .insert({
          event_type: "task_done_reply_no_match",
          raw_payload: {
            fromPhone: cleanPhone,
            teamMemberId: teamMember.id,
            teamMemberName: teamMember.name,
            messageText: cleanMessage,
            extractedReference: taskReference,
          },
        })

      return
    }

    await supabaseAdmin
      .from("workflow_tasks")
      .update({
        status: "Done",
        remark: `Marked done by WhatsApp reply from ${teamMember.name}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchedTask.id)

    await supabaseAdmin
      .from("whatsapp_webhook_events")
      .insert({
        event_type: "task_marked_done_by_whatsapp",
        raw_payload: {
          fromPhone: cleanPhone,
          teamMemberId: teamMember.id,
          teamMemberName: teamMember.name,
          taskId: matchedTask.id,
          taskCode: matchedTask.task_code,
          messageText: cleanMessage,
        },
      })

    return
  }

  if (upperMessage.startsWith("REMARK")) {
    const withoutKeyword = cleanMessage.replace(/^REMARK/i, "").trim()
    const firstSpaceIndex = withoutKeyword.indexOf(" ")

    if (firstSpaceIndex <= 0) {
      return
    }

    const taskReference = cleanText(withoutKeyword.slice(0, firstSpaceIndex))
    const remark = cleanText(withoutKeyword.slice(firstSpaceIndex + 1))

    if (!taskReference || !remark) {
      return
    }

    const matchedTask = await findTaskByReference(taskReference)

    if (!matchedTask) {
      await supabaseAdmin
        .from("whatsapp_webhook_events")
        .insert({
          event_type: "task_remark_reply_no_match",
          raw_payload: {
            fromPhone: cleanPhone,
            teamMemberId: teamMember.id,
            teamMemberName: teamMember.name,
            messageText: cleanMessage,
            extractedReference: taskReference,
          },
        })

      return
    }

    await supabaseAdmin
      .from("workflow_tasks")
      .update({
        remark,
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchedTask.id)

    await supabaseAdmin
      .from("whatsapp_webhook_events")
      .insert({
        event_type: "task_remark_added_by_whatsapp",
        raw_payload: {
          fromPhone: cleanPhone,
          teamMemberId: teamMember.id,
          teamMemberName: teamMember.name,
          taskId: matchedTask.id,
          taskCode: matchedTask.task_code,
          messageText: cleanMessage,
          remark,
        },
      })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    await supabaseAdmin
      .from("whatsapp_webhook_events")
      .insert({
        event_type: "whatsapp_webhook_post_v2_started",
        raw_payload: body,
      })

    const entries = Array.isArray(body?.entry) ? body.entry : []

    await supabaseAdmin
      .from("whatsapp_webhook_events")
      .insert({
        event_type: "whatsapp_webhook_entries_count",
        raw_payload: {
          entriesCount: entries.length,
        },
      })

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : []

      await supabaseAdmin
        .from("whatsapp_webhook_events")
        .insert({
          event_type: "whatsapp_webhook_changes_count",
          raw_payload: {
            changesCount: changes.length,
          },
        })

      for (const change of changes) {
        const value = change?.value || {}

        const statuses = Array.isArray(value?.statuses)
          ? value.statuses
          : []

        const messages = Array.isArray(value?.messages)
          ? value.messages
          : []

        await supabaseAdmin
          .from("whatsapp_webhook_events")
          .insert({
            event_type: "whatsapp_webhook_value_detected",
            raw_payload: {
              statusesCount: statuses.length,
              messagesCount: messages.length,
            },
          })

        for (const statusItem of statuses) {
          await updateOutboundMessageStatus(statusItem)
        }

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

          await supabaseAdmin
            .from("whatsapp_webhook_events")
            .insert({
              event_type: "incoming_whatsapp_message",
              raw_payload: {
                fromPhone,
                messageText,
                message,
              },
            })

          await handleTaskReply({
            fromPhone,
            messageText,
          })
        }
      }
    }

    await supabaseAdmin
      .from("whatsapp_webhook_events")
      .insert({
        event_type: "whatsapp_webhook_post_v2_completed",
        raw_payload: {
          success: true,
        },
      })

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    await supabaseAdmin
      .from("whatsapp_webhook_events")
      .insert({
        event_type: "whatsapp_webhook_error",
        raw_payload: {
          error: error?.message || "Webhook processing failed.",
        },
      })

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