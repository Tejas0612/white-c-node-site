"use client"

import { useState, useTransition } from "react"
import {
  updateWorkflowOrderRemark,
  updateWorkflowOrderStatus,
} from "./actions"

const orderStatuses = [
  "New",
  "Processing",
  "Dispatched",
  "Delivered",
  "On Hold",
  "Cancelled",
]

export function OrderActions({
  orderId,
  orderCode,
  currentStatus,
}: {
  orderId: string
  orderCode: string
  currentStatus: string
}) {
  const [status, setStatus] = useState(currentStatus || "New")
  const [remark, setRemark] = useState("")
  const [isRemarkOpen, setIsRemarkOpen] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleStatusChange(nextStatus: string) {
    setStatus(nextStatus)
    setError("")
    setSuccess("")

    startTransition(async () => {
      try {
        await updateWorkflowOrderStatus({
          orderId,
          status: nextStatus,
        })

        setSuccess("Status updated")
      } catch (statusError: any) {
        setError(statusError?.message || "Failed to update status.")
      }
    })
  }

  function handleSaveRemark() {
    setError("")
    setSuccess("")

    startTransition(async () => {
      try {
        await updateWorkflowOrderRemark({
          orderId,
          remark,
          status,
        })

        setRemark("")
        setIsRemarkOpen(false)
        setSuccess("Remark saved")
      } catch (remarkError: any) {
        setError(remarkError?.message || "Failed to save remark.")
      }
    })
  }

  return (
    <>
      <div className="w-full max-w-[300px]">
        <div className="grid gap-2">
          <select
            value={status}
            onChange={(event) => handleStatusChange(event.target.value)}
            disabled={isPending}
            className="h-9 rounded-xl border bg-background px-3 text-xs font-semibold outline-none disabled:opacity-60"
          >
            {orderStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsRemarkOpen(true)}
            className="h-9 rounded-xl border px-3 text-xs font-semibold hover:bg-muted"
          >
            Add Remark
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
                <h3 className="text-2xl font-bold">Add Order Remark</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add an internal update for {orderCode}.
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
                  {orderStatuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Remark</label>
                <textarea
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  rows={4}
                  placeholder="Example: Client approved artwork, production started."
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