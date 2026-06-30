"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminUser } from "@/lib/admin-auth"

function generateTaskCode() {
  const randomPart = Math.random().toString(16).slice(2, 10).toUpperCase()
  return `T-${randomPart}`
}

export async function createWorkflowTask(formData: FormData) {
  await requireAdminUser(["Operations", "Sales", "Accounts"])

  const title = String(formData.get("title") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const assigneeId = String(formData.get("assignee_id") || "").trim()
  const dueDate = String(formData.get("due_date") || "").trim()
  const status = String(formData.get("status") || "Pending").trim()

  if (!title) {
    throw new Error("Task title is required.")
  }

  const { error } = await supabaseAdmin.from("workflow_tasks").insert({
    task_code: generateTaskCode(),
    title,
    description: description || null,
    assignee_id: assigneeId || null,
    due_date: dueDate || null,
    status: status || "Pending",
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/tasks")
  revalidatePath("/admin/workflow")
}

export async function markWorkflowTaskDone(taskId: string) {
  await requireAdminUser(["Operations", "Sales", "Accounts"])

  if (!taskId) {
    throw new Error("Task ID is required.")
  }

  const { error } = await supabaseAdmin
    .from("workflow_tasks")
    .update({
      status: "Done",
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/tasks")
  revalidatePath("/admin/workflow")
}

export async function updateWorkflowTaskRemark({
  taskId,
  remark,
  status,
}: {
  taskId: string
  remark: string
  status: string
}) {
  await requireAdminUser(["Operations", "Sales", "Accounts"])

  const cleanRemark = String(remark || "").trim()
  const cleanStatus = String(status || "Remarked").trim()

  if (!taskId) {
    throw new Error("Task ID is required.")
  }

  if (!cleanRemark) {
    throw new Error("Remark is required.")
  }

  const { error } = await supabaseAdmin
    .from("workflow_tasks")
    .update({
      remark: cleanRemark,
      status: cleanStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/tasks")
  revalidatePath("/admin/workflow")
}

export async function updateWorkflowTaskDetails(formData: FormData) {
  await requireAdminUser(["Admin", "Owner"])

  const taskId = String(formData.get("task_id") || "").trim()
  const title = String(formData.get("title") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const assigneeId = String(formData.get("assignee_id") || "").trim()
  const dueDate = String(formData.get("due_date") || "").trim()
  const status = String(formData.get("status") || "").trim()
  const remark = String(formData.get("remark") || "").trim()

  if (!taskId) {
    throw new Error("Task ID is required.")
  }

  if (!title) {
    throw new Error("Task title is required.")
  }

  const { error } = await supabaseAdmin
    .from("workflow_tasks")
    .update({
      title,
      description: description || null,
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
      status: status || "Open",
      remark: remark || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/tasks")
  revalidatePath("/admin/workflow")
}

export async function deleteWorkflowTask({
  taskId,
}: {
  taskId: string
}) {
  await requireAdminUser(["Owner"])

  const cleanTaskId = String(taskId || "").trim()

  if (!cleanTaskId) {
    throw new Error("Task ID is required.")
  }

  const { error } = await supabaseAdmin
    .from("workflow_tasks")
    .delete()
    .eq("id", cleanTaskId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/tasks")
  revalidatePath("/admin/workflow")
}