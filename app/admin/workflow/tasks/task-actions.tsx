"use client"

import { useState, useTransition } from "react"
import {
  deleteWorkflowTask,
  markWorkflowTaskDone,
  updateWorkflowTaskRemark,
} from "./actions"

type TaskActionsProps = {
  taskId: string
  taskCode: string
  currentStatus: string
  canDelete?: boolean
}

export function TaskActions({
  taskId,
  taskCode,
  currentStatus,
  canDelete = false,
}: TaskActionsProps) {
  const [isRemarkOpen, setIsRemarkOpen] = useState(false)
  const [remark, setRemark] = useState("")
  const [status, setStatus] = useState(
    currentStatus === "Done" ? "Done" : "Remarked"
  )
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isPending, startTransition] = useTransition()

  const isDone = currentStatus === "Done"

  function handleSendReminder() {
    setError("")
    setSuccess("")

    startTransition(async () => {
      try {
        const response = await fetch("/api/whatsapp/send-task-reminder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "single",
            taskId,
          }),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to send reminder.")
        }

        setSuccess(
          result.to
            ? `Sent to ${result.to}`
            : "Reminder sent"
        )
      } catch (sendError: any) {
        setError(sendError?.message || "Failed to send reminder.")
      }
    })
  }

  function handleMarkDone() {
    setError("")
    setSuccess("")

    startTransition(async () => {
      try {
        await markWorkflowTaskDone(taskId)
      } catch (taskError: any) {
        setError(taskError?.message || "Failed to mark task done.")
      }
    })
  }

  function handleSaveRemark() {
    setError("")
    setSuccess("")

    startTransition(async () => {
      try {
        await updateWorkflowTaskRemark({
          taskId,
          remark,
          status,
        })

        setRemark("")
        setIsRemarkOpen(false)
      } catch (taskError: any) {
        setError(taskError?.message || "Failed to save remark.")
      }
    })
  }

  return (
    <>
      <div className="w-full max-w-[280px]">
        <div className="grid grid-cols-3 gap-2">
          {!isDone ? (
            <button
              type="button"
              onClick={handleSendReminder}
              disabled={isPending}
              className="h-9 rounded-xl border px-3 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60"
            >
              {isPending ? "..." : "Send"}
            </button>
          ) : (
            <div />
          )}

          {!isDone ? (
            <button
              type="button"
              onClick={handleMarkDone}
              disabled={isPending}
              className="h-9 rounded-xl border px-3 text-xs font-semibold hover:bg-muted disabled:opacity-60"
            >
              Done
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={() => setIsRemarkOpen(true)}
            className="h-9 rounded-xl border px-3 text-xs font-semibold hover:bg-muted"
          >
            Remark
          </button>
        </div>

        <div className="mt-2 min-h-[34px]">
          {success && (
            <p className="text-xs font-medium leading-4 text-green-600">
              {success}
            </p>
          )}

          {error && (
            <p className="text-xs font-medium leading-4 text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>

      {isRemarkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">Add Task Remark</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add an update for task {taskCode}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsRemarkOpen(false)}
                className="rounded-full border px-3 py-1 text-sm font-semibold hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-5 p-6">
              <div>
                <label className="text-sm font-semibold">Status</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                >
                  <option value="Remarked">Remarked</option>
                  <option value="Pending">Pending</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Remark</label>
                <textarea
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  placeholder="Example: Vendor confirmed dispatch by tomorrow."
                  rows={4}
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
                  onClick={() => setIsRemarkOpen(false)}
                  className="rounded-xl border px-5 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveRemark}
                  disabled={isPending}
                  className="rounded-xl bg-foreground px-5 py-2 text-sm font-semibold text-background disabled:opacity-60"
                >
                  {isPending ? "Saving..." : "Save Remark"}
                </button>

                {canDelete && (
                  <DeleteTaskButton
                    taskId={taskId}
                    taskCode={taskCode}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


function DeleteTaskButton({
  taskId,
  taskCode,
}: {
  taskId: string
  taskCode: string
}) {
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