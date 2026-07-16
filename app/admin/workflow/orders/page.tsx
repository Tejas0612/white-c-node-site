import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { isAdminOrOwner, isOwner } from "@/lib/admin-role-utils"
import { StatusFilterBar } from "@/components/admin/status-filter-bar"
import { CreateOrderModal } from "./create-order-modal"
import { OrderActions } from "./order-actions"
import { EditOrderButton } from "./edit-order-button"

export const dynamic = "force-dynamic"

function statusClasses(label: string) {
  if (["Delivered", "Done", "Won"].includes(label)) {
    return "border-green-200 bg-green-50 text-green-700"
  }

  if (["Cancelled", "Lost", "Overdue"].includes(label)) {
    return "border-red-200 bg-red-50 text-red-700"
  }

  if (
    [
      "New",
      "Open",
      "In Progress",
      "Partially Dispatched",
      "Dispatched",
      "On Hold",
    ].includes(label)
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  return "border-slate-200 bg-slate-50 text-slate-600"
}

function StatusPill({ label }: { label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(label)}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

function SignalCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone: "slate" | "amber" | "green" | "red"
}) {
  const classes =
    tone === "green"
      ? "border-green-200 bg-green-50/60 text-green-700"
      : tone === "red"
        ? "border-red-200 bg-red-50/60 text-red-700"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50/60 text-amber-700"
          : "border-slate-200 bg-slate-50/60 text-slate-700"

  return (
    <div className={`rounded-2xl border p-5 ${classes}`}>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-current" />
        <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold sm:text-3xl">{value}</p>
    </div>
  )
}

function formatCurrency(value: number | string | null | undefined) {
  const numberValue = Number(value || 0)

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numberValue)
}

function normalizeTaskStatus(status: string | null | undefined) {
  if (status === "Done") return "Done"
  if (status === "In Progress") return "In Progress"
  return "Open"
}

function getAssigneeName(task: any) {
  const assignee = Array.isArray(task.workflow_team_members)
    ? task.workflow_team_members[0]
    : task.workflow_team_members

  return assignee?.name || "Unassigned"
}

function RelatedTasks({ tasks }: { tasks: any[] }) {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <details className="mt-5 rounded-2xl border bg-muted/20">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold">
        Tasks attached · {tasks.length}
      </summary>

      <div className="border-t px-4 py-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks attached yet.</p>
        ) : (
          <div className="grid gap-2">
            {tasks.map((task) => {
              const status = normalizeTaskStatus(task.status)
              const isOverdue =
                Boolean(task.due_date) &&
                task.due_date < today &&
                status !== "Done"

              return (
                <div
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{task.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {getAssigneeName(task)} · Due {task.due_date || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill label={status} />
                    {isOverdue && <StatusPill label="Overdue" />}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </details>
  )
}

function buildPageHref({
  statusFilter,
  page,
}: {
  statusFilter: string
  page: number
}) {
  return statusFilter === "All"
    ? `/admin/workflow/orders?page=${page}`
    : `/admin/workflow/orders?status=${encodeURIComponent(statusFilter)}&page=${page}`
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
    "Partially Dispatched",
    "Dispatched",
    "Delivered",
    "Cancelled",
  ]

  const [{ data: orders, error }, { data: teamMembers }, { data: tasks, error: taskError }] =
    await Promise.all([
      supabaseAdmin
        .from("workflow_orders")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("workflow_team_members")
        .select("id, name, role, whatsapp, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("workflow_tasks")
        .select(
          `
          id,
          title,
          status,
          due_date,
          order_id,
          workflow_team_members (
            id,
            name
          )
        `
        )
        .not("order_id", "is", null)
        .order("created_at", { ascending: false }),
    ])

  const allOrdersRaw = orders || []
  const activeTeamMembers = teamMembers || []
  const tasksByOrder = new Map<string, any[]>()

  for (const task of tasks || []) {
    if (!task.order_id) continue
    const current = tasksByOrder.get(task.order_id) || []
    current.push(task)
    tasksByOrder.set(task.order_id, current)
  }

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
  const allOrders = filteredOrders.slice(startIndex, startIndex + pageSize)

  const totalOrders = allOrdersRaw.length
  const totalOrderValue = allOrdersRaw.reduce(
    (sum, order) => sum + Number(order.order_value || 0),
    0
  )
  const deliveredOrders = allOrdersRaw.filter(
    (order) => order.status === "Delivered"
  )
  const deliveredCount = deliveredOrders.length
  const deliveredValue = deliveredOrders.reduce(
    (sum, order) => sum + Number(order.order_value || 0),
    0
  )

  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Workflow</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Orders</h1>
          <p className="mt-2 text-muted-foreground">
            Track fulfilment, dispatch status, and linked operational tasks.
          </p>
        </div>
        <CreateOrderModal />
      </div>

      {(error || taskError) && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error?.message || taskError?.message}
        </div>
      )}

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SignalCard label="Orders Received" value={totalOrders} tone="slate" />
        <SignalCard
          label="Total Order Value"
          value={formatCurrency(totalOrderValue)}
          tone="amber"
        />
        <SignalCard label="Delivered Orders" value={deliveredCount} tone="green" />
        <SignalCard
          label="Delivered Value"
          value={formatCurrency(deliveredValue)}
          tone="green"
        />
      </div>

      <StatusFilterBar
        basePath="/admin/workflow/orders"
        currentStatus={statusFilter}
        statuses={orderStatuses}
      />

      <section className="rounded-2xl border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-xl font-bold">Order List</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalFilteredOrders} orders · Filter: {statusFilter}
            </p>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <a
                href={safeCurrentPage <= 1 ? "#" : buildPageHref({ statusFilter, page: safeCurrentPage - 1 })}
                className={safeCurrentPage <= 1 ? "pointer-events-none rounded-xl border px-3 py-2 text-xs font-semibold opacity-40" : "rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted"}
              >
                Prev
              </a>
              <span className="text-sm font-bold">{safeCurrentPage} / {totalPages}</span>
              <a
                href={safeCurrentPage >= totalPages ? "#" : buildPageHref({ statusFilter, page: safeCurrentPage + 1 })}
                className={safeCurrentPage >= totalPages ? "pointer-events-none rounded-xl border px-3 py-2 text-xs font-semibold opacity-40" : "rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted"}
              >
                Next
              </a>
            </div>
          )}
        </div>

        <div className="divide-y">
          {allOrders.map((order: any) => {
            const relatedTasks = tasksByOrder.get(order.id) || []

            return (
              <article key={order.id} className="p-5">
                <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr_1fr_230px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs font-semibold text-muted-foreground">{order.order_code}</p>
                      <StatusPill label={order.status || "New"} />
                    </div>
                    <h3 className="mt-2 text-lg font-bold">{order.client_name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{order.product_name || "No product details"}</p>
                    <p className="mt-3 text-xs text-muted-foreground">Order date: {order.order_date || "—"}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Commercial</p>
                    <p className="mt-2 text-sm">Quantity: <span className="font-semibold">{order.quantity || "—"}</span></p>
                    <p className="mt-1 text-sm">Rate: <span className="font-semibold">{formatCurrency(order.sale_price)}</span></p>
                    <p className="mt-1 text-base font-bold">Value: {formatCurrency(order.order_value)}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operations</p>
                    <p className="mt-2 text-sm text-muted-foreground">{order.remarks || "No remarks"}</p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Purchase Order</p>
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
                      <p className="mt-1 text-sm font-semibold text-amber-700">PO not added</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <OrderActions
                      orderId={order.id}
                      orderCode={order.order_code}
                      clientName={order.client_name}
                      currentStatus={order.status || "New"}
                      teamMembers={activeTeamMembers}
                      canDelete={canDelete}
                    />
                    {canEdit && <EditOrderButton order={order} />}
                  </div>
                </div>

                <RelatedTasks tasks={relatedTasks} />
              </article>
            )
          })}

          {allOrders.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">No orders found.</div>
          )}
        </div>
      </section>
    </div>
  )
}