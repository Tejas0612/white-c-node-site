"use client"

import { useState, useTransition } from "react"
import { updateRoleAccessMatrix } from "./actions"

const roleOptions = [
  "Admin",
  "Operations",
  "Sales",
  "Accounts",
  "Catalog",
  "Viewer",
  "Employee",
]

type RoleAccessRow = {
  id: string
  page_key: string
  page_label: string
  page_href: string | null
  allowed_actions: string
  allowed_roles: string[]
  is_visible: boolean
}

export function EditRoleAccessButton({ row }: { row: RoleAccessRow }) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError("")

    startTransition(async () => {
      try {
        await updateRoleAccessMatrix(formData)
        setIsOpen(false)
      } catch (accessError: any) {
        setError(accessError?.message || "Failed to update role access.")
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">Edit Role Access</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {row.page_label}
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
              <input type="hidden" name="matrix_id" value={row.id} />

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Page</label>
                  <input
                    value={row.page_label}
                    disabled
                    className="mt-2 h-11 w-full rounded-xl border bg-muted px-4 text-sm text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Visibility</label>
                  <select
                    name="is_visible"
                    defaultValue={row.is_visible ? "true" : "false"}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="true">Visible in Admin Sidebar</option>
                    <option value="false">Hidden from Admin Sidebar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Allowed Actions</label>
                <textarea
                  name="allowed_actions"
                  defaultValue={row.allowed_actions}
                  rows={4}
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Allowed Roles</label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select the roles that should see this page in the admin portal.
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {roleOptions.map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold"
                    >
                      <input
                        type="checkbox"
                        name="matrix_roles"
                        value={role}
                        defaultChecked={row.allowed_roles?.includes(role)}
                        className="h-4 w-4"
                      />
                      {role}
                    </label>
                  ))}
                </div>
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
                  {isPending ? "Saving..." : "Save Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}