"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminUser } from "@/lib/admin-auth"

async function generateTaskCode() {
  const { data, error } = await supabaseAdmin.rpc(
    "generate_workflow_task_code"
  )

  if (error || !data) {
    throw new Error(error?.message || "Failed to generate task code.")
  }

  return String(data)
}

export async function createWorkflowTask(formData: FormData) {
  await requireAdminUser(["Admin", "Owner", "Operations", "Sales", "Accounts"])

  const title = String(formData.get("title") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const assigneeId = String(formData.get("assignee_id") || "").trim()
  const dueDate = String(formData.get("due_date") || "").trim()
  const status = String(formData.get("status") || "Open").trim()
  const orderId = String(formData.get("order_id") || "").trim()
  const enquiryId = String(formData.get("enquiry_id") || "").trim()

  if (!title) {
    throw new Error("Task title is required.")
  }

  if (orderId && enquiryId) {
    throw new Error("A task can be linked to either an order or an enquiry, not both.")
  }

  const { error } = await supabaseAdmin.from("workflow_tasks").insert({
    task_code: await generateTaskCode(),
    title,
    description: description || null,
    assignee_id: assigneeId || null,
    due_date: dueDate || null,
    status: status || "Open",
    order_id: orderId || null,
    enquiry_id: enquiryId || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/tasks")
  revalidatePath("/admin/workflow/orders")
  revalidatePath("/admin/workflow/enquiries")
  revalidatePath("/admin/workflow")
}

export async function markWorkflowTaskDone(taskId: string) {
  await requireAdminUser(["Admin", "Owner", "Operations", "Sales", "Accounts"])

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
  await requireAdminUser(["Admin", "Owner", "Operations", "Sales", "Accounts"])

  const cleanRemark = String(remark || "").trim()
  const cleanStatus = String(status || "Open").trim()

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
  const orderId = String(formData.get("order_id") || "").trim()
  const enquiryId = String(formData.get("enquiry_id") || "").trim()

  if (!taskId) {
    throw new Error("Task ID is required.")
  }

  if (!title) {
    throw new Error("Task title is required.")
  }

  if (orderId && enquiryId) {
    throw new Error("A task can be linked to either an order or an enquiry, not both.")
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
      order_id: orderId || null,
      enquiry_id: enquiryId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/tasks")
  revalidatePath("/admin/workflow/orders")
  revalidatePath("/admin/workflow/enquiries")
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