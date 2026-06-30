"use client"

import { useState, useTransition } from "react"
import { updateWorkflowOrderDetails } from "./actions"

type Order = {
  id: string
  client_name: string | null
  product_name: string | null
  quantity: number | null
  sale_price: number | null
  order_date: string | null
  po_url: string | null
  status: string | null
  remarks: string | null
}

export function EditOrderButton({ order }: { order: Order }) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError("")

    startTransition(async () => {
      try {
        await updateWorkflowOrderDetails(formData)
        setIsOpen(false)
      } catch (orderError: any) {
        setError(orderError?.message || "Failed to update order.")
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
                <h3 className="text-2xl font-bold">Edit Order</h3>
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
              <input type="hidden" name="order_id" value={order.id} />

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Client Name</label>
                  <input
                    name="client_name"
                    defaultValue={order.client_name || ""}
                    required
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Product Name</label>
                  <input
                    name="product_name"
                    defaultValue={order.product_name || ""}
                    required
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-4">
                <div>
                  <label className="text-sm font-semibold">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    defaultValue={order.quantity || 1}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Sale Price</label>
                  <input
                    type="number"
                    name="sale_price"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    defaultValue={order.sale_price || ""}
                    placeholder="Example: 465.50"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Order Date</label>
                  <input
                    type="date"
                    name="order_date"
                    defaultValue={order.order_date || ""}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <select
                    name="status"
                    defaultValue={order.status || "New"}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">PO URL</label>
                <input
                  name="po_url"
                  defaultValue={order.po_url || ""}
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Remarks</label>
                <textarea
                  name="remarks"
                  rows={4}
                  defaultValue={order.remarks || ""}
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
                  {isPending ? "Saving..." : "Save Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}