import { NextResponse } from "next/server"
import crypto from "crypto"
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

function normalizeTaskSearchText(value: string | null | undefined) {
  return cleanText(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
}

async function findTaskByReference(
  taskReference: string,
  assigneeId?: string
) {
  const cleanReference = cleanText(taskReference)

  if (!cleanReference) {
    return null
  }

  const normalizedReference = normalizeTaskSearchText(cleanReference)

  const { data: taskByCode } = await supabaseAdmin
    .from("workflow_tasks")
    .select("id, task_code, title, description, status, assignee_id, created_at")
    .ilike("task_code", cleanReference)
    .maybeSingle()

  if (taskByCode) {
    return taskByCode
  }

  if (isUuid(cleanReference)) {
    const { data: taskById } = await supabaseAdmin
      .from("workflow_tasks")
      .select("id, task_code, title, description, status, assignee_id, created_at")
      .eq("id", cleanReference)
      .maybeSingle()

    if (taskById) {
      return taskById
    }
  }

  const { data: recentTasks, error: recentTasksError } = await supabaseAdmin
    .from("workflow_tasks")
    .select("id, task_code, title, description, status, assignee_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100)

  if (recentTasksError) {
    await supabaseAdmin
      .from("whatsapp_webhook_events")
      .insert({
        event_type: "task_title_lookup_error",
        raw_payload: {
          taskReference: cleanReference,
          error: recentTasksError.message,
        },
      })

    return null
  }

  const sortedTasks = [...(recentTasks || [])].sort((a, b) => {
    if (!assigneeId) {
      return 0
    }

    const aAssigned = a.assignee_id === assigneeId ? 1 : 0
    const bAssigned = b.assignee_id === assigneeId ? 1 : 0

    return bAssigned - aAssigned
  })

  const matchedTask = sortedTasks.find((task) => {
    const normalizedTitle = normalizeTaskSearchText(task.title)
    const normalizedDescription = normalizeTaskSearchText(task.description)
    const normalizedCombined = normalizeTaskSearchText(
      `${task.title || ""} ${task.description || ""}`
    )

    return (
      normalizedTitle === normalizedReference ||
      normalizedTitle.includes(normalizedReference) ||
      normalizedReference.includes(normalizedTitle) ||
      normalizedDescription.includes(normalizedReference) ||
      normalizedCombined.includes(normalizedReference)
    )
  })

  if (matchedTask) {
    return matchedTask
  }

  await supabaseAdmin
    .from("whatsapp_webhook_events")
    .insert({
      event_type: "task_reference_no_match_debug",
      raw_payload: {
        taskReference: cleanReference,
        normalizedReference,
        assigneeId,
        checkedTasks: sortedTasks.slice(0, 20).map((task) => ({
          task_code: task.task_code,
          title: task.title,
          description: task.description,
          assignee_id: task.assignee_id,
        })),
      },
    })

  return null
}

function getWhatsAppAppSecret() {
  return cleanText(
    process.env.WHATSAPP_APP_SECRET ||
      process.env.META_APP_SECRET
  )
}

function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
) {
  const appSecret = getWhatsAppAppSecret()

  if (
    !appSecret ||
    !signatureHeader ||
    !signatureHeader.startsWith("sha256=")
  ) {
    return false
  }

  const receivedHex = signatureHeader.slice("sha256=".length)

  if (!/^[a-f0-9]{64}$/i.test(receivedHex)) {
    return false
  }

  const expectedHex = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex")

  const receivedBuffer = Buffer.from(receivedHex, "hex")
  const expectedBuffer = Buffer.from(expectedHex, "hex")

  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  )
}

export async function GET(request: Request) {
  const url = new URL(request.url)

  const isLocalTest = url.searchParams.get("local_test") === "1"

  if (isLocalTest) {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        {
          success: false,
          error: "Local test is disabled outside development.",
        },
        {
          status: 403,
        }
      )
    }

    const phone = normalizePhone(
      url.searchParams.get("phone") || "919836232942"
    )

    const message = cleanText(
      url.searchParams.get("message") || "done"
    )

    await supabaseAdmin
      .from("whatsapp_webhook_events")
      .insert({
        event_type: "local_whatsapp_test_message",
        raw_payload: {
          phone,
          message,
        },
      })

    await handleTaskReply({
      fromPhone: phone,
      messageText: message,
    })

    return NextResponse.json({
      success: true,
      phone,
      message,
    })
  }

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

async function getRecentTaskFromLastMessage(toPhone: string) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const { data: recentMessages, error: recentMessageError } =
    await supabaseAdmin
      .from("whatsapp_outbound_messages")
      .select("task_id, message_text, created_at, message_type, to_phone")
      .eq("to_phone", toPhone)
      .in("message_type", [
        "task_reminder_template",
        "task_reminder_text",
      ])
      .gte("created_at", fiveMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(5)

  if (recentMessageError) {
    await supabaseAdmin
      .from("whatsapp_webhook_events")
      .insert({
        event_type: "recent_task_lookup_error",
        raw_payload: {
          toPhone,
          error: recentMessageError.message,
        },
      })

    return null
  }

  const lastMessage = recentMessages?.[0]

  if (!lastMessage) {
    await supabaseAdmin
      .from("whatsapp_webhook_events")
      .insert({
        event_type: "recent_task_not_found",
        raw_payload: {
          toPhone,
          fiveMinutesAgo,
        },
      })

    return null
  }

  if (lastMessage.task_id) {
    const { data: taskById } = await supabaseAdmin
      .from("workflow_tasks")
      .select("id, task_code, title, description, status, assignee_id")
      .eq("id", lastMessage.task_id)
      .maybeSingle()

    if (taskById) {
      return taskById
    }
  }

  const messageText = cleanText(lastMessage.message_text || "")
  const codeMatch = messageText.match(/T-[A-Z0-9]+/i)

  if (codeMatch?.[0]) {
    const taskByCode = await findTaskByReference(codeMatch[0])

    if (taskByCode) {
      return taskByCode
    }
  }

  await supabaseAdmin
    .from("whatsapp_webhook_events")
    .insert({
      event_type: "recent_task_found_but_no_task_match",
      raw_payload: {
        toPhone,
        lastMessage,
      },
    })

  return null
}

function removeTaskWords(value: string) {
  return cleanText(value)
    .replace(/^task\s+id\s+/i, "")
    .replace(/^task\s+code\s+/i, "")
    .replace(/^taskid\s+/i, "")
    .replace(/^taskcode\s+/i, "")
    .replace(/^task\s+/i, "")
    .trim()
}

function looksLikeTaskReference(value: string) {
  const cleanValue = cleanText(value)

  if (!cleanValue) {
    return false
  }

  if (isUuid(cleanValue)) {
    return true
  }

  return /^T-[A-Z0-9]+$/i.test(cleanValue)
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

  const { data: teamMembers } = await supabaseAdmin
    .from("workflow_team_members")
    .select("id, name, whatsapp, role, roles, is_active")
    .eq("is_active", true)

  const teamMember = (teamMembers || []).find((member) => {
    return normalizePhone(member.whatsapp) === cleanPhone
  })

  if (!teamMember) {
    await supabaseAdmin
      .from("whatsapp_webhook_events")
      .insert({
        event_type: "task_reply_sender_not_found",
        raw_payload: {
          fromPhone: cleanPhone,
          messageText: cleanMessage,
        },
      })

    return
  }

  const lowerMessage = cleanMessage.toLowerCase()

  const isDoneReply =
    lowerMessage === "done" ||
    lowerMessage.startsWith("done ") ||
    lowerMessage === "mark as done"

  const isRemarkReply =
    lowerMessage === "remark" ||
    lowerMessage.startsWith("remark ")

  if (!isDoneReply && !isRemarkReply) {
    return
  }

  const command = isDoneReply ? "DONE" : "REMARK"

  let remainingText = cleanMessage
    .replace(/^done/i, "")
    .replace(/^remark/i, "")
    .trim()

  remainingText = removeTaskWords(remainingText)

  let taskReference = ""
  let remarkText = ""

  if (remainingText) {
    if (command === "DONE") {
      taskReference = cleanText(remainingText)
    }

    if (command === "REMARK") {
      const colonIndex = remainingText.indexOf(":")

      if (colonIndex > 0) {
        taskReference = cleanText(remainingText.slice(0, colonIndex))
        remarkText = cleanText(remainingText.slice(colonIndex + 1))
      } else {
        const parts = remainingText.split(" ")
        const possibleReference = cleanText(parts[0])

        if (looksLikeTaskReference(possibleReference)) {
          taskReference = possibleReference
          remarkText = cleanText(parts.slice(1).join(" "))
        } else {
          remarkText = cleanText(remainingText)
        }
      }
    }
  }

  let matchedTask = null

  if (taskReference) {
    matchedTask = await findTaskByReference(taskReference, teamMember.id)
  }

  if (!matchedTask) {
    matchedTask = await getRecentTaskFromLastMessage(cleanPhone)
  }

  if (!matchedTask) {
    await supabaseAdmin
      .from("whatsapp_webhook_events")
      .insert({
        event_type: "task_reply_no_recent_or_reference_match",
        raw_payload: {
          fromPhone: cleanPhone,
          teamMemberId: teamMember.id,
          teamMemberName: teamMember.name,
          messageText: cleanMessage,
          extractedReference: taskReference,
          command,
        },
      })

    return
  }

  if (command === "DONE") {
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
          matchedUsing: taskReference ? "task_reference" : "recent_message",
        },
      })

    return
  }

  const finalRemark =
    remarkText ||
    `Remark received by WhatsApp reply from ${teamMember.name}`

  await supabaseAdmin
    .from("workflow_tasks")
    .update({
      remark: finalRemark,
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
        remark: finalRemark,
        matchedUsing: taskReference ? "task_reference" : "recent_message",
      },
    })
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signatureHeader = request.headers.get("x-hub-signature-256")

    if (!verifyMetaWebhookSignature(rawBody, signatureHeader)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid webhook signature.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      )
    }

    let body: any

    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid webhook payload.",
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      )
    }

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