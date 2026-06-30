"use client"

import { useState, useTransition } from "react"
import { deleteWorkflowTask } from "./actions"

type DeleteTaskButtonProps = {
  taskId: string
  taskCode: string
}

export function DeleteTaskButton({
  taskId,
  taskCode,
}: DeleteTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    setError("")

    startTransition(async () => {
      try {
        await deleteWorkflowTask({
          taskId,
        })

        setIsOpen(false)
      } catch (deleteError: any) {
        setError(deleteError?.message || "Failed to delete task.")
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-10 w-full rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        Delete Task
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl border bg-background shadow-2xl">
            <div className="border-b p-6">
              <h3 className="text-2xl font-bold text-red-600">
                Delete Task?
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                This will permanently delete task {taskCode}. This action
                cannot be undone.
              </p>
            </div>

            <div className="grid gap-5 p-6">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border px-5 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isPending ? "Deleting..." : "Delete Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}