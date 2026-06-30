"use client"

import { useState, useTransition } from "react"
import {
  deleteWorkflowOrder,
  updateWorkflowOrderRemark,
  updateWorkflowOrderStatus,
} from "./actions"

type OrderActionsProps = {
  orderId: string
  orderCode: string
  currentStatus: string
  canDelete?: boolean
}

export function OrderActions({
  orderId,
  orderCode,
  currentStatus,
  canDelete = false,
}: OrderActionsProps) {
  return (
    <div className="w-full space-y-2">
      <UpdateOrderStatusButton
        orderId={orderId}
        orderCode={orderCode}
        currentStatus={currentStatus}
      />

      <UpdateOrderRemarkButton
        orderId={orderId}
        orderCode={orderCode}
      />

      {canDelete && (
        <DeleteOrderButton
          orderId={orderId}
          orderCode={orderCode}
        />
      )}
    </div>
  )
}

function UpdateOrderStatusButton({
  orderId,
  orderCode,
  currentStatus,
}: {
  orderId: string
  orderCode: string
  currentStatus: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError("")

    const status = String(formData.get("status") || "").trim()

    startTransition(async () => {
      try {
        await updateWorkflowOrderStatus({
          orderId,
          status,
        })

        setIsOpen(false)
      } catch (statusError: any) {
        setError(statusError?.message || "Failed to update order status.")
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-10 w-full rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
      >
        Update Status
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">Update Order Status</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Reference: {orderCode}
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
              <input type="hidden" name="order_id" value={orderId} />

              <div>
                <label className="text-sm font-semibold">Status</label>

                <div className="relative mt-2">
                  <select
                    name="status"
                    defaultValue={currentStatus || "New"}
                    className="h-12 w-full appearance-none rounded-2xl border bg-background px-4 pr-12 text-sm font-medium outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-muted-foreground">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
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
                  {isPending ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
function UpdateOrderRemarkButton({
  orderId,
  orderCode,
}: {
  orderId: string
  orderCode: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError("")

    const status = String(formData.get("status") || "").trim()

    startTransition(async () => {
      try {
        await updateWorkflowOrderStatus({
          orderId,
          status,
        })

        setIsOpen(false)
      } catch (statusError: any) {
        setError(statusError?.message || "Failed to update order status.")
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-10 w-full rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
      >
        Add Remark
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">Add Remark</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Reference: {orderCode}
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
              <input type="hidden" name="order_id" value={orderId} />

              <div>
                <label className="text-sm font-semibold">Remark</label>

                <textarea
                  name="remark"
                  rows={5}
                  required
                  placeholder="Add latest production, dispatch, PO, payment, or delivery update"
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
                  {isPending ? "Saving..." : "Save Remark"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function DeleteOrderButton({
  orderId,
  orderCode,
}: {
  orderId: string
  orderCode: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    setError("")

    startTransition(async () => {
      try {
        await deleteWorkflowOrder({
          orderId,
        })

        setIsOpen(false)
      } catch (deleteError: any) {
        setError(deleteError?.message || "Failed to delete order.")
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
        Delete Order
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl border bg-background shadow-2xl">
            <div className="border-b p-6">
              <h3 className="text-2xl font-bold text-red-600">
                Delete Order?
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                This will permanently delete order {orderCode}. This action
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
                  {isPending ? "Deleting..." : "Delete Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}