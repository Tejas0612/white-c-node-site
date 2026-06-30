import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { isAdminOrOwner, isOwner } from "@/lib/admin-role-utils"
import { StatusFilterBar } from "@/components/admin/status-filter-bar"
import { CreateOrderModal } from "./create-order-modal"
import { OrderActions } from "./order-actions"
import { EditOrderButton } from "./edit-order-button"

export const dynamic = "force-dynamic"

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold">
      {label}
    </span>
  )
}

function formatCurrency(value: number | string | null | undefined) {
  const numberValue = Number(value || 0)

  if (!numberValue) {
    return "₹0"
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numberValue)
}

function formatRateCurrency(value: number | string | null | undefined) {
  const numberValue = Number(value || 0)

  if (!numberValue) {
    return "₹0.00"
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue)
}

function getOrderValue(order: any) {
  return Number(order.order_value || 0)
}

function getStatusCount(orders: any[], status: string) {
  return orders.filter((order) => (order.status || "New") === status).length
}

function InsightCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string
  value: string | number
  helper?: string
  tone?: "default" | "orange" | "green" | "blue" | "red"
}) {
  const toneClass =
    tone === "orange"
      ? "text-orange-600"
      : tone === "green"
        ? "text-green-600"
        : tone === "blue"
          ? "text-blue-600"
          : tone === "red"
            ? "text-red-600"
            : "text-foreground"

  return (
    <div className="rounded-2xl border bg-background p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <h2 className={`mt-4 text-3xl font-bold ${toneClass}`}>
        {value}
      </h2>

      {helper && (
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          {helper}
        </p>
      )}
    </div>
  )
}

function MiniMetric({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border bg-muted/30 px-4 py-3">
      <p className="text-xs font-semibold text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold">
        {value}
      </p>
    </div>
  )
}

export default async function WorkflowOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; page?: string }>
}) {
  const user = await requireAdminUser([
    "Admin",
    "Owner",
    "Operations",
    "Sales",
    "Accounts",
  ])

  const canEdit = isAdminOrOwner(user)
  const canDelete = isOwner(user)

  const params = searchParams ? await searchParams : {}
  const statusFilter = params?.status || "All"
  const currentPage = Math.max(Number(params?.page || "1"), 1)
  const pageSize = 10

  const orderStatuses = [
    "All",
    "New",
    "In Progress",
    "On Hold",
    "Dispatched",
    "Delivered",
    "Cancelled",
  ]

  const { data: orders, error } = await supabaseAdmin
    .from("workflow_orders")
    .select("*")
    .order("created_at", { ascending: false })

  const allOrdersRaw = orders || []

  const filteredOrders =
    statusFilter === "All"
      ? allOrdersRaw
      : allOrdersRaw.filter(
          (order) => (order.status || "New") === statusFilter
        )

  const totalFilteredOrders = filteredOrders.length
  const totalPages = Math.max(Math.ceil(totalFilteredOrders / pageSize), 1)
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = startIndex + pageSize

  const allOrders = filteredOrders.slice(startIndex, endIndex)

  const totalOrders = allOrdersRaw.length

  const activeOrders = allOrdersRaw.filter(
    (order) => !["Delivered", "Cancelled"].includes(order.status || "New")
  )

  const deliveredOrders = allOrdersRaw.filter(
    (order) => order.status === "Delivered"
  )

  const cancelledOrders = allOrdersRaw.filter(
    (order) => order.status === "Cancelled"
  )

  const pendingDispatchOrders = allOrdersRaw.filter((order) =>
    ["New", "In Progress", "On Hold"].includes(order.status || "New")
  )

  const ordersWithoutPo = allOrdersRaw.filter((order) => !order.po_url)

  const totalValue = allOrdersRaw.reduce(
    (sum, order) => sum + getOrderValue(order),
    0
  )

  const activeValue = activeOrders.reduce(
    (sum, order) => sum + getOrderValue(order),
    0
  )

  const deliveredValue = deliveredOrders.reduce(
    (sum, order) => sum + getOrderValue(order),
    0
  )

  const cancelledValue = cancelledOrders.reduce(
    (sum, order) => sum + getOrderValue(order),
    0
  )

  const averageOrderValue =
    totalOrders > 0 ? Math.round(totalValue / totalOrders) : 0

  const highestValueOrder = [...allOrdersRaw].sort(
    (a, b) => getOrderValue(b) - getOrderValue(a)
  )[0]

  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Workflow
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Orders
          </h1>

          <p className="mt-2 text-muted-foreground">
            Track order value, dispatch progress, PO status, remarks, and
            operational follow-ups.
          </p>
        </div>

        <CreateOrderModal />
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error.message}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          label="Total Orders"
          value={totalOrders}
          helper={`${activeOrders.length} active orders`}
        />

        <InsightCard
          label="Total Value"
          value={formatCurrency(totalValue)}
          helper="All orders combined"
        />

        <InsightCard
          label="Active Value"
          value={formatCurrency(activeValue)}
          helper="Not delivered or cancelled"
          tone="orange"
        />

        <InsightCard
          label="Delivered Value"
          value={formatCurrency(deliveredValue)}
          helper={`${deliveredOrders.length} delivered orders`}
          tone="green"
        />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          label="Pending Dispatch"
          value={pendingDispatchOrders.length}
          helper="New, in progress, or on hold"
          tone="orange"
        />

        <InsightCard
          label="Orders Without PO"
          value={ordersWithoutPo.length}
          helper="Need PO upload or PO link"
          tone={ordersWithoutPo.length > 0 ? "red" : "green"}
        />

        <InsightCard
          label="Average Order Value"
          value={formatCurrency(averageOrderValue)}
          helper="Based on all orders"
          tone="blue"
        />

        <InsightCard
          label="Cancelled Value"
          value={formatCurrency(cancelledValue)}
          helper={`${cancelledOrders.length} cancelled orders`}
          tone={cancelledOrders.length > 0 ? "red" : "default"}
        />
      </div>

      <StatusFilterBar
        basePath="/admin/workflow/orders"
        currentStatus={statusFilter}
        statuses={orderStatuses}
      />
            <section className="rounded-2xl border bg-background">
        <div className="border-b p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Order List</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Filtered by: {statusFilter}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Showing
                </p>

                <p className="mt-1 text-sm font-bold">
                  {allOrders.length} of {totalFilteredOrders} orders
                </p>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2 rounded-2xl border bg-muted/30 px-3 py-3">
                  <a
                    href={
                      safeCurrentPage <= 1
                        ? "#"
                        : statusFilter === "All"
                          ? `/admin/workflow/orders?page=${safeCurrentPage - 1}`
                          : `/admin/workflow/orders?status=${encodeURIComponent(
                              statusFilter
                            )}&page=${safeCurrentPage - 1}`
                    }
                    className={
                      safeCurrentPage <= 1
                        ? "pointer-events-none rounded-xl border px-3 py-2 text-xs font-semibold text-muted-foreground opacity-50"
                        : "rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted"
                    }
                  >
                    Prev
                  </a>

                  <span className="px-2 text-sm font-bold">
                    {safeCurrentPage} / {totalPages}
                  </span>

                  <a
                    href={
                      safeCurrentPage >= totalPages
                        ? "#"
                        : statusFilter === "All"
                          ? `/admin/workflow/orders?page=${safeCurrentPage + 1}`
                          : `/admin/workflow/orders?status=${encodeURIComponent(
                              statusFilter
                            )}&page=${safeCurrentPage + 1}`
                    }
                    className={
                      safeCurrentPage >= totalPages
                        ? "pointer-events-none rounded-xl border px-3 py-2 text-xs font-semibold text-muted-foreground opacity-50"
                        : "rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted"
                    }
                  >
                    Next
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="divide-y">
          {allOrders.map((order: any) => (
            <div key={order.id} className="p-5">
              <div className="grid gap-5 xl:grid-cols-[1.2fr_1.2fr_1fr_1fr_1.1fr]">
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

                  <p className="mt-1 text-xs text-muted-foreground">
                    Date: {order.order_date || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Product
                  </p>

                  <p className="mt-1 text-base font-bold">
                    {order.product_name || "—"}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Qty:{" "}
                    <span className="font-semibold text-foreground">
                      {order.quantity || "—"}
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Value
                  </p>

                  <p className="mt-1 text-lg font-bold">
                    {formatRateCurrency(order.order_value)}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Rate: {formatRateCurrency(order.sale_price)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Remark
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.remarks || "—"}
                  </p>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    PO
                  </p>

                  {order.po_url ? (
                    <a
                      href={order.po_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex text-sm font-semibold text-blue-600 hover:underline"
                    >
                      View PO
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-orange-600">
                      Missing PO
                    </p>
                  )}
                </div>

                <div className="flex justify-start xl:justify-end">
                  <div className="ml-auto flex w-full max-w-[210px] flex-col items-end gap-2">
                    <OrderActions
                      orderId={order.id}
                      orderCode={order.order_code}
                      currentStatus={order.status || "New"}
                      canDelete={canDelete}
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