"use client"

import { useState, useTransition } from "react"
import {
  createWorkflowTeamMember,
  updateWorkflowTeamMember,
} from "./actions"

type TeamMember = {
  id?: string
  name?: string
  role?: string | null
  roles?: string[] | null
  email?: string | null
  whatsapp?: string | null
  avatar_url?: string | null
  is_active?: boolean | null
}

const roleOptions = [
  "Admin",
  "Operations",
  "Sales",
  "Accounts",
  "Catalog",
  "Viewer",
  "Employee",
]

function getMemberRoles(member?: TeamMember) {
  if (member?.roles && member.roles.length > 0) {
    return member.roles
  }

  if (member?.role) {
    return [member.role]
  }

  return ["Employee"]
}

export function AddTeamMemberButton() {
  return <TeamMemberModal mode="create" />
}

export function EditTeamMemberButton({ member }: { member: TeamMember }) {
  return <TeamMemberModal mode="edit" member={member} />
}

function TeamMemberModal({
  mode,
  member,
}: {
  mode: "create" | "edit"
  member?: TeamMember
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const selectedRoles = getMemberRoles(member)

  function handleSubmit(formData: FormData) {
    setError("")

    startTransition(async () => {
      try {
        if (mode === "edit") {
          await updateWorkflowTeamMember(formData)
        } else {
          await createWorkflowTeamMember(formData)
        }

        setIsOpen(false)
      } catch (teamError: any) {
        setError(teamError?.message || "Failed to save team member.")
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          mode === "create"
            ? "rounded-xl bg-foreground px-5 py-2 text-sm font-semibold text-background hover:opacity-90"
            : "rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
        }
      >
        {mode === "create" ? "+ Add Team Member" : "Edit"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">
                  {mode === "create" ? "Add Team Member" : "Edit Team Member"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage contact details, active status, and multiple workflow roles.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border px-3 py-1 text-sm font-semibold hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <form action={handleSubmit} className="grid gap-5 p-6">
              {mode === "edit" && (
                <input
                  type="hidden"
                  name="team_member_id"
                  value={member?.id || ""}
                />
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Name</label>
                  <input
                    name="name"
                    required
                    defaultValue={member?.name || ""}
                    placeholder="Example: Shreyans"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <select
                    name="is_active"
                    defaultValue={member?.is_active === false ? "false" : "true"}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={member?.email || ""}
                    placeholder="name@white-c.in"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">WhatsApp</label>
                  <input
                    name="whatsapp"
                    defaultValue={member?.whatsapp || ""}
                    placeholder="+919830113007"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Roles</label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select one or more roles for this team member.
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {roleOptions.map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold"
                    >
                      <input
                        type="checkbox"
                        name="roles"
                        value={role}
                        defaultChecked={selectedRoles.includes(role)}
                        className="h-4 w-4"
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Avatar URL</label>
                <input
                  name="avatar_url"
                  defaultValue={member?.avatar_url || ""}
                  placeholder="Optional image URL"
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border px-5 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-foreground px-5 py-2 text-sm font-semibold text-background disabled:opacity-60"
                >
                  {isPending ? "Saving..." : "Save Team Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}