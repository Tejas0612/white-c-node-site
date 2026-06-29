import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminUser } from "@/lib/admin-auth"
import {
  cleanWhatsAppPhone,
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
} from "@/lib/whatsapp-cloud"

export const dynamic = "force-dynamic"

type SendTaskReminderRequest = {
  mode?: "single" | "pending"
  taskId?: string
}

function buildTaskReminderText(task: any) {
  const assigneeName = task.workflow_team_members?.name || "Team"
  const taskCode = task.task_code || "-"
  const title = task.title || "-"
  const dueDate = task.due_date || "Not set"

  return `Hi ${assigneeName}, this is a White C task reminder.

Task Code: ${taskCode}
Task: ${title}
Due Date: ${dueDate}

Please reply:
DONE ${taskCode}
or
REMARK ${taskCode} your update here`
}

async function logOutboundMessage({
  taskId,
  toPhone,
  messageText,
  result,
}: {
  taskId: string | null
  toPhone: string
  messageText: string
  result: any
}) {
  const { error } = await supabaseAdmin.from("whatsapp_outbound_messages").insert({
    task_id: taskId,
    to_phone: toPhone,
    message_type: "task_reminder",
    message_text: messageText,
    whatsapp_message_id: result.whatsappMessageId || null,
    send_status: result.success ? "Sent" : "Failed",
    error_message: result.success ? null : result.error || "Failed",
    raw_response: result.response || null,
  })

  if (error) {
    console.error("WhatsApp outbound log failed:", error)
  }
}

async function sendTaskReminder(task: any) {
  const toPhone = cleanWhatsAppPhone(task.workflow_team_members?.whatsapp)
  const messageText = buildTaskReminderText(task)
  const templateName = process.env.WHATSAPP_TASK_TEMPLATE_NAME

  if (!toPhone) {
    const result = {
      success: false,
      error: "Assignee WhatsApp number is missing.",
    }

    await logOutboundMessage({
      taskId: task.id,
      toPhone: "",
      messageText,
      result,
    })

    return {
      taskId: task.id,
      taskCode: task.task_code,
      to: "",
      ...result,
    }
  }

  const result = templateName
    ? await sendWhatsAppTemplateMessage({
        to: toPhone,
        templateName,
        bodyVariables: [
          task.workflow_team_members?.name || "Team",
          task.task_code || "-",
          task.title || "-",
          task.due_date || "Not set",
        ],
      })
    : await sendWhatsAppTextMessage({
        to: toPhone,
        message: messageText,
      })

  await logOutboundMessage({
    taskId: task.id,
    toPhone,
    messageText,
    result,
  })

  return {
    taskId: task.id,
    taskCode: task.task_code,
    to: toPhone,
    ...result,
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser(["Operations", "Sales", "Accounts"])

    const body = (await request.json()) as SendTaskReminderRequest
    const mode = body.mode || "single"

    let query = supabaseAdmin
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

    if (mode === "single") {
      if (!body.taskId) {
        return NextResponse.json(
          {
            success: false,
            message: "Task ID is required.",
          },
          { status: 400 }
        )
      }

      query = query.eq("id", body.taskId).limit(1)
    } else {
      query = query.eq("status", "Pending")
    }

    const { data: tasks, error } = await query

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      )
    }

    const allTasks = tasks || []

    if (allTasks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No task found.",
        },
        { status: 404 }
      )
    }

    if (mode === "single" && allTasks[0]?.status === "Done") {
      return NextResponse.json(
        {
          success: false,
          message: "Reminder is not sent for completed tasks.",
        },
        { status: 400 }
      )
    }

    const results = []

    for (const task of allTasks) {
      if (task.status === "Done") {
        continue
      }

      const result = await sendTaskReminder(task)
      results.push(result)
    }

    const sentCount = results.filter((result) => result.success).length
    const failedCount = results.filter((result) => !result.success).length

    if (mode === "single") {
      const result = results[0]

      if (!result?.success) {
        return NextResponse.json(
          {
            success: false,
            message: result?.error || "Failed to send reminder.",
            to: result?.to || null,
            result,
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Reminder sent.",
        to: result.to,
        whatsapp_message_id: result.whatsappMessageId || null,
        result,
      })
    }

    return NextResponse.json({
      success: true,
      sent_count: sentCount,
      failed_count: failedCount,
      results,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to send task reminder.",
      },
      { status: 500 }
    )
  }
}