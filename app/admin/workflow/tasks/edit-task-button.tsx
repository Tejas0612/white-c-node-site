"use client"

import { useState, useTransition } from "react"
import { updateWorkflowTaskDetails } from "./actions"

type TeamMember = {
  id: string
  name: string
}

type Task = {
  id: string
  title: string | null
  description: string | null
  assignee_id: string | null
  due_date: string | null
  status: string | null
  remark: string | null
}

export function EditTaskButton({
  task,
  teamMembers,
}: {
  task: Task
  teamMembers: TeamMember[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError("")

    startTransition(async () => {
      try {
        await updateWorkflowTaskDetails(formData)
        setIsOpen(false)
      } catch (taskError: any) {
        setError(taskError?.message || "Failed to update task.")
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="self-end rounded-full border border-muted-foreground/20 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">Edit Task</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Admin / Owner only
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
              <input type="hidden" name="task_id" value={task.id} />

              <div>
                <label className="text-sm font-semibold">Title</label>
                <input
                  name="title"
                  defaultValue={task.title || ""}
                  required
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Description</label>
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={task.description || ""}
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold">Assignee</label>
                  <select
                    name="assignee_id"
                    defaultValue={task.assignee_id || ""}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    defaultValue={task.due_date || ""}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <select
                    name="status"
                    defaultValue={task.status || "Open"}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Remark</label>
                <textarea
                  name="remark"
                  rows={3}
                  defaultValue={task.remark || ""}
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
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
                  {isPending ? "Saving..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}