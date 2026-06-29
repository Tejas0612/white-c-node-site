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