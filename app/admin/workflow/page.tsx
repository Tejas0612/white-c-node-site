import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function WorkflowDashboardPage() {
  const { data: orders } = await supabaseAdmin
    .from("workflow_orders")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: enquiries } = await supabaseAdmin
    .from("workflow_enquiries")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: tasks } = await supabaseAdmin
    .from("workflow_tasks")
    .select(
      `
      *,
      workflow_team_members (
        name,
        whatsapp
      )
    `
    )
    .order("created_at", { ascending: false })

  const activeOrders = orders?.filter((order) => order.status !== "Delivered")
  const pendingTasks = tasks?.filter((task) => task.status === "Pending")
  const revenue =
    orders?.reduce((total, order) => total + Number(order.order_value || 0), 0) ||
    0

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Overview
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Today's command center
          </h1>
        </div>

        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Active Orders
          </p>
          <h2 className="mt-4 text-4xl font-bold">{activeOrders?.length || 0}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {orders?.length || 0} total
          </p>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            New Enquiries
          </p>
          <h2 className="mt-4 text-4xl font-bold">
            {enquiries?.filter((enquiry) => enquiry.status === "New").length ||
              0}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {enquiries?.length || 0} total
          </p>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pending Tasks
          </p>
          <h2 className="mt-4 text-4xl font-bold">{pendingTasks?.length || 0}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Needs follow-up</p>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Order Value
          </p>
          <h2 className="mt-4 text-3xl font-bold">{formatCurrency(revenue)}</h2>
          <p className="mt-1 text-sm text-green-600">Total pipeline value</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border bg-background p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Operations
              </p>
              <h2 className="mt-1 text-2xl font-bold">Recent Orders</h2>
            </div>

            <Link
              href="/admin/workflow/orders"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-3">Client</th>
                  <th className="py-3">Product</th>
                  <th className="py-3">Qty</th>
                  <th className="py-3">Value</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(orders || []).slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-4 font-semibold">{order.client_name}</td>
                    <td className="py-4">{order.product_name}</td>
                    <td className="py-4">{order.quantity}</td>
                    <td className="py-4 font-semibold">
                      {formatCurrency(Number(order.order_value || 0))}
                    </td>
                    <td className="py-4">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border bg-background p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                My Queue
              </p>
              <h2 className="mt-1 text-2xl font-bold">Pending Tasks</h2>
            </div>

            <Link
              href="/admin/workflow/tasks"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {(pendingTasks || []).slice(0, 5).map((task) => (
              <div key={task.id} className="rounded-xl border p-4">
                <p className="text-xs font-semibold text-muted-foreground">
                  {task.task_code}
                </p>
                <h3 className="mt-1 font-semibold">{task.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  @ {task.workflow_team_members?.name || "Unassigned"}
                </p>
              </div>
            ))}

            {pendingTasks?.length === 0 && (
              <p className="text-sm text-muted-foreground">No pending tasks.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}