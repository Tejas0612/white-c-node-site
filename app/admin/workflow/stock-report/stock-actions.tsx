"use client"

import { useState, useTransition } from "react"
import { createStockItem, importStockCsv, updateStockItem } from "./actions"

type StockItem = {
  stockId?: string
  productId?: string
  brand?: string
  item?: string
  description?: string
  stockQty?: number
  cost?: number
  notes?: string
}

export function AddStockItemButton() {
  return <StockItemModal mode="create" />
}

export function EditStockItemButton({ item }: { item: StockItem }) {
  return <StockItemModal mode="edit" item={item} />
}

export function UploadStockCsvButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError("")
    setSuccess("")

    startTransition(async () => {
      try {
        const result = await importStockCsv(formData)

        if (result.created > 0 && result.updated === 0) {
        setSuccess(
            `First upload: Created ${result.created}, updated ${result.updated}`
        )
        } else if (result.created === 0 && result.updated > 0) {
        setSuccess(
            `Second upload same file: Created ${result.created}, updated ${result.updated}`
        )
        } else {
        setSuccess(
            `Upload completed: Created ${result.created}, updated ${result.updated}`
        )
        }
        setIsOpen(false)
      } catch (uploadError: any) {
        setError(uploadError?.message || "Failed to import CSV.")
      }
    })
  }

  return (
    <>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-xl border px-5 py-2 text-sm font-semibold hover:bg-muted"
        >
          Upload CSV
        </button>

        {success && (
          <p className="mt-2 text-xs font-medium text-green-600">{success}</p>
        )}

        {error && (
          <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">Upload Stock CSV</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload your brother’s stock sheet after saving it as CSV.
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
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-sm font-semibold">Required CSV columns</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  Brand, Item, Description, Stock Qty, Cost
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold">CSV File</label>
                <input
                  type="file"
                  name="csv_file"
                  accept=".csv,text/csv"
                  required
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
                  {isPending ? "Importing..." : "Import CSV"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function StockItemModal({
  mode,
  item,
}: {
  mode: "create" | "edit"
  item?: StockItem
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError("")

    startTransition(async () => {
      try {
        if (mode === "edit") {
          await updateStockItem(formData)
        } else {
          await createStockItem(formData)
        }

        setIsOpen(false)
      } catch (stockError: any) {
        setError(stockError?.message || "Failed to save stock item.")
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
        {mode === "create" ? "+ Add Stock Item" : "Edit"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">
                  {mode === "create" ? "Add Stock Item" : "Edit Stock Item"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Stock item will stay linked to the product list internally.
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
                <>
                  <input
                    type="hidden"
                    name="stock_id"
                    value={item?.stockId || ""}
                  />
                  <input
                    type="hidden"
                    name="product_id"
                    value={item?.productId || ""}
                  />
                </>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Brand</label>
                  <input
                    name="brand"
                    defaultValue={item?.brand || ""}
                    placeholder="Example: Swayam"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Item</label>
                  <input
                    name="item"
                    required
                    defaultValue={item?.item || ""}
                    placeholder="Example: Daffodil - Dohar 1pc"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={item?.description || ""}
                  placeholder="Example: Double Size in a bag"
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Stock Qty</label>
                  <input
                    type="number"
                    name="stock_qty"
                    min="0"
                    defaultValue={item?.stockQty || 0}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Cost</label>
                  <input
                    type="number"
                    name="cost"
                    min="0"
                    step="0.01"
                    defaultValue={item?.cost || 0}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Internal Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={item?.notes || ""}
                  placeholder="Optional stock note"
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
                  {isPending ? "Saving..." : "Save Stock Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}