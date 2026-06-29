"use client"

import { useState, useTransition } from "react"
import {
  markWorkflowTaskDone,
  updateWorkflowTaskRemark,
} from "./actions"

type TaskActionsProps = {
  taskId: string
  taskCode: string
  currentStatus: string
}

export function TaskActions({
  taskId,
  taskCode,
  currentStatus,
}: TaskActionsProps) {
  const [isRemarkOpen, setIsRemarkOpen] = useState(false)
  const [remark, setRemark] = useState("")
  const [status, setStatus] = useState(
    currentStatus === "Done" ? "Done" : "Remarked"
  )
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleMarkDone() {
    setError("")

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
      <div className="flex flex-wrap justify-end gap-2">
        {currentStatus !== "Done" && (
          <button
            type="button"
            onClick={handleMarkDone}
            disabled={isPending}
            className="rounded-xl border px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60"
          >
            Mark Done
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsRemarkOpen(true)}
          className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted"
        >
          Add Remark
        </button>
      </div>

      {error && (
        <p className="mt-2 text-right text-xs font-medium text-red-600">
          {error}
        </p>
      )}

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
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}