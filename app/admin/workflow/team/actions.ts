"use server"

import { revalidatePath } from "next/cache"
import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

function getSelectedRoles(formData: FormData) {
  const roles = formData
    .getAll("roles")
    .map((role) => String(role || "").trim())
    .filter(Boolean)

  return roles.length > 0 ? roles : ["Employee"]
}

function getSelectedMatrixRoles(formData: FormData) {
  return formData
    .getAll("matrix_roles")
    .map((role) => String(role || "").trim())
    .filter(Boolean)
}

export async function createWorkflowTeamMember(formData: FormData) {
  await requireAdminUser(["Admin"])

  const name = String(formData.get("name") || "").trim()
  const email = String(formData.get("email") || "").trim()
  const whatsapp = String(formData.get("whatsapp") || "").trim()
  const avatarUrl = String(formData.get("avatar_url") || "").trim()
  const isActive = String(formData.get("is_active") || "true") === "true"
  const selectedRoles = getSelectedRoles(formData)

  if (!name) {
    throw new Error("Name is required.")
  }

  const { error } = await supabaseAdmin.from("workflow_team_members").insert({
    name,
    role: selectedRoles[0],
    roles: selectedRoles,
    email: email || null,
    whatsapp: whatsapp || null,
    avatar_url: avatarUrl || null,
    is_active: isActive,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/team")
  revalidatePath("/admin/workflow/tasks")
  revalidatePath("/admin/workflow/enquiries")
}

export async function updateWorkflowTeamMember(formData: FormData) {
  await requireAdminUser(["Admin"])

  const teamMemberId = String(formData.get("team_member_id") || "").trim()
  const name = String(formData.get("name") || "").trim()
  const email = String(formData.get("email") || "").trim()
  const whatsapp = String(formData.get("whatsapp") || "").trim()
  const avatarUrl = String(formData.get("avatar_url") || "").trim()
  const isActive = String(formData.get("is_active") || "true") === "true"
  const selectedRoles = getSelectedRoles(formData)

  if (!teamMemberId) {
    throw new Error("Team member ID is required.")
  }

  if (!name) {
    throw new Error("Name is required.")
  }

  const { error } = await supabaseAdmin
    .from("workflow_team_members")
    .update({
      name,
      role: selectedRoles[0],
      roles: selectedRoles,
      email: email || null,
      whatsapp: whatsapp || null,
      avatar_url: avatarUrl || null,
      is_active: isActive,
    })
    .eq("id", teamMemberId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/team")
  revalidatePath("/admin/workflow/tasks")
  revalidatePath("/admin/workflow/enquiries")
}

export async function updateRoleAccessMatrix(formData: FormData) {
  await requireAdminUser(["Owner"])

  const matrixId = String(formData.get("matrix_id") || "").trim()
  const allowedActions = String(formData.get("allowed_actions") || "").trim()
  const isVisible = String(formData.get("is_visible") || "true") === "true"

  const selectedRoles = getSelectedMatrixRoles(formData)

  if (!matrixId) {
    throw new Error("Matrix row ID is required.")
  }

  if (!allowedActions) {
    throw new Error("Allowed actions description is required.")
  }

  if (selectedRoles.length === 0) {
    throw new Error("Select at least one role.")
  }

  const { error } = await supabaseAdmin
    .from("admin_role_access_matrix")
    .update({
      allowed_actions: allowedActions,
      allowed_roles: selectedRoles,
      is_visible: isVisible,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matrixId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/team")
  revalidatePath("/admin/workflow")
  revalidatePath("/admin/workflow/orders")
  revalidatePath("/admin/workflow/enquiries")
  revalidatePath("/admin/workflow/tasks")
  revalidatePath("/admin/workflow/stock-report")
  revalidatePath("/admin/products")
  revalidatePath("/admin/brochure-import")
}