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
  const templateName = process.env.WHATSAPP_TASK_TEMPLATE_NAME
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

function buildTaskText({
  assigneeName,
  taskCode,
  taskTitle,
  taskDescription,
  dueDate,
}: {
  assigneeName: string
  taskCode: string
  taskTitle: string
  taskDescription: string
  dueDate: string
}) {
  return `Hi ${assigneeName}, this is a White C task reminder.

Task Code: ${taskCode}
Task: ${taskTitle}
Description: ${taskDescription || "—"}
Due Date: ${dueDate}

Please reply with:
DONE ${taskCode}
or
REMARK ${taskCode} your update.`
}

async function sendWhatsAppTaskReminder({
  task,
  assigneeName,
  toPhone,
}: {
  task: any
  assigneeName: string
  toPhone: string
}) {
  const {
    phoneNumberId,
    accessToken,
    apiVersion,
    templateName,
    languageCode,
  } = getWhatsAppConfig()

  const taskCode = cleanTemplateText(task.task_code || "")
  const taskTitle = cleanTemplateText(task.title || "")
  const taskDescription = cleanTemplateText(task.description || "")
  const dueDate = cleanTemplateText(task.due_date || "Not set")

  const messageText = buildTaskText({
    assigneeName,
    taskCode,
    taskTitle,
    taskDescription,
    dueDate,
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
                  text: cleanTemplateText(assigneeName),
                },
                {
                  type: "text",
                  text: taskCode,
                },
                {
                  type: "text",
                  text: taskTitle || "—",
                },
                {
                  type: "text",
                  text: taskDescription || "—",
                },
                {
                  type: "text",
                  text: dueDate,
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
    task_id: task.id,
    to_phone: toPhone,
    message_type: templateName ? "task_reminder_template" : "task_reminder_text",
    message_text: messageText,
    whatsapp_message_id: responseJson?.messages?.[0]?.id || null,
    send_status: response.ok ? "Sent" : "Failed",
    error_message: response.ok ? null : JSON.stringify(responseJson),
    raw_response: responseJson,
  })

  if (!response.ok) {
    throw new Error(
      responseJson?.error?.message || "Failed to send WhatsApp task reminder."
    )
  }

  return responseJson
}

export async function POST(request: Request) {
  try {
    await requireAdminUser([
      "Admin",
      "Owner",
      "Operations",
      "Sales",
      "Accounts",
    ])

    const body = await request.json()
    const taskId = String(body.taskId || "").trim()

    if (!taskId) {
      throw new Error("Task ID is required.")
    }

    const { data: task, error } = await supabaseAdmin
      .from("workflow_tasks")
      .select(
        `
        id,
        task_code,
        title,
        description,
        due_date,
        status,
        workflow_team_members (
          name,
          whatsapp
        )
      `
      )
      .eq("id", taskId)
      .single()

    if (error || !task) {
      throw new Error(error?.message || "Task not found.")
    }

    if (task.status === "Done") {
      throw new Error("Reminder cannot be sent for a completed task.")
    }

    const assignee = Array.isArray(task.workflow_team_members)
      ? task.workflow_team_members[0]
      : task.workflow_team_members

    if (!assignee?.whatsapp) {
      throw new Error("Assignee WhatsApp number is missing.")
    }

    const toPhone = cleanPhone(assignee.whatsapp)

    if (!toPhone) {
      throw new Error("Assignee WhatsApp number is invalid.")
    }

    const result = await sendWhatsAppTaskReminder({
      task,
      assigneeName: assignee.name || "there",
      toPhone,
    })

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to send task reminder.",
      },
      {
        status: 400,
      }
    )
  }
}