import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminUser } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function WorkflowOrdersPage() {
  await requireAdminUser(["Operations", "Accounts"])

  const { data: orders, error } = await supabaseAdmin
    .from("workflow_orders")
    .select("*")
    .order("created_at", { ascending: false })

  const allOrders = orders || []

  const currentOrders = allOrders.filter(
    (order) => order.status !== "Delivered" && order.status !== "Cancelled"
  )

  const deliveredOrders = allOrders.filter(
    (order) => order.status === "Delivered"
  )

  const totalOrderValue = allOrders.reduce(
    (total, order) => total + Number(order.order_value || 0),
    0
  )

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Operations
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Orders</h1>
          <p className="mt-2 text-muted-foreground">
            Track customer orders, quantities, order value, PO links, and
            fulfillment status.
          </p>
        </div>

        <button className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background">
          + New Order
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error.message}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Current Orders
          </p>
          <h2 className="mt-4 text-4xl font-bold">{currentOrders.length}</h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Delivered
          </p>
          <h2 className="mt-4 text-4xl font-bold text-green-600">
            {deliveredOrders.length}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Order Value
          </p>
          <h2 className="mt-4 text-3xl font-bold">
            {formatCurrency(totalOrderValue)}
          </h2>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-xl font-bold">Order List</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Current and archived order pipeline.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl border bg-muted px-4 py-2 text-sm font-semibold">
              Current
            </span>
            <span className="rounded-xl border px-4 py-2 text-sm font-semibold text-muted-foreground">
              Archived
            </span>
            <span className="rounded-xl border px-4 py-2 text-sm font-semibold text-muted-foreground">
              All
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-4">Client</th>
                <th className="px-5 py-4">Order Date</th>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Qty</th>
                <th className="px-5 py-4">Sale Price</th>
                <th className="px-5 py-4">Order Value</th>
                <th className="px-5 py-4">PO</th>
                <th className="px-5 py-4">Remarks</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {allOrders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="px-5 py-4">
                    <p className="font-semibold">{order.client_name}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {order.order_code}
                    </p>
                  </td>

                  <td className="px-5 py-4">{order.order_date || "—"}</td>

                  <td className="px-5 py-4">{order.product_name}</td>

                  <td className="px-5 py-4">{order.quantity}</td>

                  <td className="px-5 py-4">
                    {formatCurrency(Number(order.sale_price || 0))}
                  </td>

                  <td className="px-5 py-4 font-semibold">
                    {formatCurrency(Number(order.order_value || 0))}
                  </td>

                  <td className="px-5 py-4">
                    {order.po_url ? (
                      <a
                        href={order.po_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        Open
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {order.remarks || "—"}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}

              {allOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-10 text-center text-muted-foreground"
                  >
                    No orders found.
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