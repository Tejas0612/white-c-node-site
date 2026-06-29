import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import {
  AddStockItemButton,
  EditStockItemButton,
  UploadStockCsvButton,
} from "./stock-actions"

export const dynamic = "force-dynamic"

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

export default async function StockReportPage() {
  await requireAdminUser(["Operations", "Accounts", "Catalog"])

  const { data: stockRows, error } = await supabaseAdmin
    .from("product_stock_reports")
    .select(
      `
      id,
      product_id,
      current_stock,
      cost_price,
      notes,
      updated_at,
      products (
        id,
        brand,
        name,
        description,
        sku,
        is_active
      )
    `
    )
    .order("created_at", { ascending: false })

  const allStockRows = stockRows || []

  const totalQty = allStockRows.reduce(
    (sum: number, row: any) => sum + Number(row.current_stock || 0),
    0
  )

  const totalCostValue = allStockRows.reduce(
    (sum: number, row: any) =>
      sum + Number(row.current_stock || 0) * Number(row.cost_price || 0),
    0
  )

  const brandCount = new Set(
    allStockRows
      .map((row: any) => row.products?.brand)
      .filter(Boolean)
  ).size

  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Inventory
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Stock Report
          </h1>
          <p className="mt-2 text-muted-foreground">
            Simple internal stock sheet: Brand, Item, Description, Stock Qty, and Cost.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
            <UploadStockCsvButton />
            <AddStockItemButton />
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error.message}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Brands
          </p>
          <h2 className="mt-4 text-4xl font-bold">{brandCount}</h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Stock Qty
          </p>
          <h2 className="mt-4 text-4xl font-bold">{totalQty}</h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Cost Value
          </p>
          <h2 className="mt-4 text-3xl font-bold">
            {formatCurrency(totalCostValue)}
          </h2>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-xl font-bold">Current Stock</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This follows your brother’s Excel structure and keeps every item linked to Products.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b bg-green-50">
                <th className="p-4 font-semibold">Brand</th>
                <th className="p-4 font-semibold">Item</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 text-right font-semibold">Stock Qty</th>
                <th className="p-4 text-right font-semibold">Cost</th>
                <th className="p-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {allStockRows.map((row: any) => {
                const product = row.products

                return (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="p-4 align-top font-semibold">
                      {product?.brand || "—"}
                    </td>

                    <td className="p-4 align-top">
                      <p className="font-semibold">{product?.name || "—"}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {product?.sku || ""}
                      </p>
                    </td>

                    <td className="p-4 align-top text-muted-foreground">
                      {product?.description || "—"}
                    </td>

                    <td className="p-4 align-top text-right font-semibold">
                      {row.current_stock || 0}
                    </td>

                    <td className="p-4 align-top text-right font-semibold">
                      {row.cost_price ? formatCurrency(row.cost_price) : "—"}
                    </td>

                    <td className="p-4 align-top text-right">
                      <EditStockItemButton
                        item={{
                          stockId: row.id,
                          productId: product?.id,
                          brand: product?.brand || "",
                          item: product?.name || "",
                          description: product?.description || "",
                          stockQty: row.current_stock || 0,
                          cost: row.cost_price || 0,
                          notes: row.notes || "",
                        }}
                      />
                    </td>
                  </tr>
                )
              })}

              {allStockRows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-muted-foreground"
                  >
                    No stock items found. Add your first stock item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}