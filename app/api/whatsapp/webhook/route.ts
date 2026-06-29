import crypto from "crypto"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { parseWhatsAppTaskMessage } from "@/lib/whatsapp-task-parser"

export const runtime = "nodejs"

function verifyMetaSignature({
  rawBody,
  signatureHeader,
  appSecret,
}: {
  rawBody: string
  signatureHeader: string | null
  appSecret: string
}) {
  if (!appSecret) {
    return true
  }

  if (!signatureHeader) {
    return false
  }

  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(expectedSignature)
  )
}

function extractMessagesFromPayload(payload: any) {
  const messages: any[] = []

  const entries = payload?.entry || []

  for (const entry of entries) {
    const changes = entry?.changes || []

    for (const change of changes) {
      const value = change?.value
      const incomingMessages = value?.messages || []

      for (const message of incomingMessages) {
        messages.push(message)
      }
    }
  }

  return messages
}

function getMessageText(message: any) {
  if (message?.type === "text") {
    return message?.text?.body || ""
  }

  if (message?.button?.text) {
    return message.button.text
  }

  if (message?.interactive?.button_reply?.title) {
    return message.interactive.button_reply.title
  }

  if (message?.interactive?.list_reply?.title) {
    return message.interactive.list_reply.title
  }

  return ""
}

async function updateTaskFromWhatsAppMessage({
  whatsappMessageId,
  fromPhone,
  messageText,
  rawPayload,
}: {
  whatsappMessageId: string | null
  fromPhone: string | null
  messageText: string
  rawPayload: any
}) {
  const parsed = parseWhatsAppTaskMessage(messageText)

  let matchedTaskId: string | null = null
  let processingStatus = "Ignored"
  let processingError: string | null = null

  try {
    if (!parsed.action || !parsed.taskCode) {
      processingStatus = "Ignored"

      await supabaseAdmin.from("whatsapp_inbound_messages").insert({
        whatsapp_message_id: whatsappMessageId,
        from_phone: fromPhone,
        message_text: messageText,
        parsed_action: parsed.action,
        parsed_task_code: parsed.taskCode,
        parsed_remark: parsed.remark,
        matched_task_id: matchedTaskId,
        raw_payload: rawPayload,
        processing_status: processingStatus,
        processing_error: null,
      })

      return
    }

    const { data: task, error: taskError } = await supabaseAdmin
      .from("workflow_tasks")
      .select("id, task_code, title, status, remark")
      .eq("task_code", parsed.taskCode)
      .single()

    if (taskError || !task) {
      processingStatus = "Task Not Found"
      processingError = `No task found for code ${parsed.taskCode}`

      await supabaseAdmin.from("whatsapp_inbound_messages").insert({
        whatsapp_message_id: whatsappMessageId,
        from_phone: fromPhone,
        message_text: messageText,
        parsed_action: parsed.action,
        parsed_task_code: parsed.taskCode,
        parsed_remark: parsed.remark,
        matched_task_id: null,
        raw_payload: rawPayload,
        processing_status: processingStatus,
        processing_error: processingError,
      })

      return
    }

    matchedTaskId = task.id

    if (parsed.action === "DONE") {
      const { error: updateError } = await supabaseAdmin
        .from("workflow_tasks")
        .update({
          status: "Done",
          remark: task.remark || "Marked done from WhatsApp reply.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      processingStatus = "Task Marked Done"
    }

    if (parsed.action === "REMARK") {
      const { error: updateError } = await supabaseAdmin
        .from("workflow_tasks")
        .update({
          status: "Remarked",
          remark: parsed.remark,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      processingStatus = "Remark Updated"
    }

    await supabaseAdmin.from("whatsapp_inbound_messages").insert({
      whatsapp_message_id: whatsappMessageId,
      from_phone: fromPhone,
      message_text: messageText,
      parsed_action: parsed.action,
      parsed_task_code: parsed.taskCode,
      parsed_remark: parsed.remark,
      matched_task_id: matchedTaskId,
      raw_payload: rawPayload,
      processing_status: processingStatus,
      processing_error: null,
    })
  } catch (error: any) {
    await supabaseAdmin.from("whatsapp_inbound_messages").insert({
      whatsapp_message_id: whatsappMessageId,
      from_phone: fromPhone,
      message_text: messageText,
      parsed_action: parsed.action,
      parsed_task_code: parsed.taskCode,
      parsed_remark: parsed.remark,
      matched_task_id: matchedTaskId,
      raw_payload: rawPayload,
      processing_status: "Error",
      processing_error: error?.message || "Failed to process message.",
    })
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)

  const mode = url.searchParams.get("hub.mode")
  const token = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN &&
    challenge
  ) {
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }

  return new Response("Forbidden", {
    status: 403,
  })
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()

    const signatureHeader = request.headers.get("x-hub-signature-256")

    const signatureValid = verifyMetaSignature({
      rawBody,
      signatureHeader,
      appSecret: process.env.WHATSAPP_APP_SECRET || "",
    })

    if (!signatureValid) {
      return Response.json(
        {
          success: false,
          message: "Invalid signature.",
        },
        { status: 401 }
      )
    }

    const payload = JSON.parse(rawBody)

    const messages = extractMessagesFromPayload(payload)

    for (const message of messages) {
      const messageText = getMessageText(message)

      await updateTaskFromWhatsAppMessage({
        whatsappMessageId: message?.id || null,
        fromPhone: message?.from || null,
        messageText,
        rawPayload: payload,
      })
    }

    return Response.json({
      success: true,
      processed_messages: messages.length,
    })
  } catch (error: any) {
    console.error("WhatsApp webhook error:", error)

    return Response.json(
      {
        success: false,
        message: error?.message || "Webhook processing failed.",
      },
      { status: 500 }
    )
  }
}