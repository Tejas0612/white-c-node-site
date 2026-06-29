import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminUser } from "@/lib/admin-auth"
import {
  cleanWhatsAppPhone,
  sendWhatsAppTextMessage,
} from "@/lib/whatsapp-cloud"

export const runtime = "nodejs"

function createTaskReminderMessage(task: any) {
  const assigneeName = task.workflow_team_members?.name || "there"

  return `Hi ${assigneeName}, reminder for your pending White C task:

Task Code: ${task.task_code}
Task: ${task.title}
${task.description ? `Details: ${task.description}` : ""}
${task.due_date ? `Due date: ${task.due_date}` : ""}

Please reply in this format:

DONE ${task.task_code}

or

REMARK ${task.task_code} your update here

Example:
REMARK ${task.task_code} Vendor confirmed dispatch tomorrow.`
}

async function sendReminderForTask(task: any) {
  const toPhone = task.workflow_team_members?.whatsapp
  const cleanToPhone = cleanWhatsAppPhone(toPhone)
  const messageText = createTaskReminderMessage(task)

  if (!cleanToPhone) {
    await supabaseAdmin.from("whatsapp_outbound_messages").insert({
      task_id: task.id,
      to_phone: toPhone || null,
      message_text: messageText,
      send_status: "Failed",
      error_message: "Assignee WhatsApp number is missing.",
    })

    return {
      success: false,
      task_code: task.task_code,
      error: "Assignee WhatsApp number is missing.",
    }
  }

  const result = await sendWhatsAppTextMessage({
    to: cleanToPhone,
    message: messageText,
  })

  await supabaseAdmin.from("whatsapp_outbound_messages").insert({
    task_id: task.id,
    to_phone: cleanToPhone,
    message_text: messageText,
    whatsapp_message_id: result.whatsappMessageId || null,
    send_status: result.success ? "Sent" : "Failed",
    error_message: result.error || null,
    raw_response: result.response || null,
  })

  return {
    success: result.success,
    task_code: task.task_code,
    to_phone: cleanToPhone,
    whatsapp_message_id: result.whatsappMessageId || null,
    error: result.error || null,
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser(["Operations", "Sales", "Accounts"])

    const body = await request.json()
    const mode = String(body?.mode || "single")
    const taskId = String(body?.taskId || "")

    if (mode === "pending") {
      const { data: tasks, error } = await supabaseAdmin
        .from("workflow_tasks")
        .select(
          `
          *,
          workflow_team_members (
            name,
            whatsapp
          )
        `
        )
        .eq("status", "Pending")
        .order("created_at", { ascending: false })

      if (error) {
        return Response.json(
          {
            success: false,
            message: error.message,
          },
          { status: 500 }
        )
      }

      const results = []

      for (const task of tasks || []) {
        const result = await sendReminderForTask(task)
        results.push(result)
      }

      return Response.json({
        success: true,
        mode: "pending",
        sent_count: results.filter((result) => result.success).length,
        failed_count: results.filter((result) => !result.success).length,
        results,
      })
    }

    if (!taskId) {
      return Response.json(
        {
          success: false,
          message: "Task ID is required.",
        },
        { status: 400 }
      )
    }

    const { data: task, error } = await supabaseAdmin
      .from("workflow_tasks")
      .select(
        `
        *,
        workflow_team_members (
          name,
          whatsapp
        )
      `
      )
      .eq("id", taskId)
      .single()

    if (error || !task) {
      return Response.json(
        {
          success: false,
          message: error?.message || "Task not found.",
        },
        { status: 404 }
      )
    }

    const result = await sendReminderForTask(task)

    if (!result.success) {
      return Response.json(
        {
          success: false,
          message: result.error || "Failed to send reminder.",
          result,
        },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error("Send task reminder error:", error)

    return Response.json(
      {
        success: false,
        message: error?.message || "Failed to send WhatsApp reminder.",
      },
      { status: 500 }
    )
  }
}