import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { isAdminOrOwner } from "@/lib/admin-role-utils"
import { CreateOrderModal } from "./create-order-modal"
import { OrderActions } from "./order-actions"
import { EditOrderButton } from "./edit-order-button"

export const dynamic = "force-dynamic"


function formatCurrency(value: number | null) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold">
      {label}
    </span>
  )
}

export default async function WorkflowOrdersPage() {

  const user = await requireAdminUser([
    "Admin",
    "Owner",
    "Operations",
    "Sales",
    "Accounts",
    ])

  const canEdit = isAdminOrOwner(user)
  
  const { data: orders, error } = await supabaseAdmin
    .from("workflow_orders")
    .select("*")
    .order("created_at", { ascending: false })

  const allOrders = orders || []

  const totalValue = allOrders.reduce(
    (sum, order) => sum + Number(order.order_value || 0),
    0
  )

  const activeOrders = allOrders.filter(
    (order) =>
      order.status !== "Delivered" &&
      order.status !== "Cancelled"
  )

  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Workflow
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Orders</h1>
          <p className="mt-2 text-muted-foreground">
            Track confirmed orders, status updates, PO links, and remarks.
          </p>
        </div>

        <CreateOrderModal />
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error.message}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Orders
          </p>
          <h2 className="mt-4 text-4xl font-bold">{allOrders.length}</h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Active Orders
          </p>
          <h2 className="mt-4 text-4xl font-bold text-orange-600">
            {activeOrders.length}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Value
          </p>
          <h2 className="mt-4 text-3xl font-bold">
            {formatCurrency(totalValue)}
          </h2>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-xl font-bold">Order List</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage order progress without horizontal scrolling.
          </p>
        </div>

        <div className="divide-y">
          {allOrders.map((order) => (
            <div key={order.id} className="p-5">
              <div className="grid gap-5 xl:grid-cols-[1.2fr_1.4fr_0.8fr_1fr_1.15fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-xs font-semibold text-muted-foreground">
                      {order.order_code}
                    </p>
                    <StatusPill label={order.status || "New"} />
                  </div>

                  <h3 className="mt-2 text-base font-bold">
                    {order.client_name}
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Date: {order.order_date || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Product
                  </p>
                  <p className="mt-1 font-semibold">{order.product_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Qty: {order.quantity || 0}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Value
                  </p>
                  <p className="mt-1 font-semibold">
                    {formatCurrency(order.order_value)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Remark
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.remarks || "—"}
                  </p>

                  {order.po_url && (
                    <a
                      href={order.po_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs font-semibold text-blue-600 underline"
                    >
                      View PO
                    </a>
                  )}
                </div>

                <div className="flex justify-start xl:justify-end">
                  <div className="ml-auto flex w-full max-w-[190px] flex-col items-end gap-2">
                    <OrderActions
                        orderId={order.id}
                        orderCode={order.order_code}
                        currentStatus={order.status || "New"}
                    />

                    {canEdit && <EditOrderButton order={order} />}
                    </div>
                </div>
              </div>
            </div>
          ))}

          {allOrders.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">
              No orders found.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}