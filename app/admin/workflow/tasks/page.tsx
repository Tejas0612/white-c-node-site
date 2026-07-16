import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { isAdminOrOwner, isOwner } from "@/lib/admin-role-utils"
import { StatusFilterBar } from "@/components/admin/status-filter-bar"
import { AssignTaskModal } from "./assign-task-modal"
import { TaskActions } from "./task-actions"
import { EditTaskButton } from "./edit-task-button"
import { DeleteTaskButton } from "./delete-task-button"

export const dynamic = "force-dynamic"

function normalizeTaskStatus(status: string | null | undefined) {
  if (status === "Done") return "Done"
  if (status === "In Progress") return "In Progress"
  return "Open"
}

function statusClasses(label: string) {
  if (label === "Done") return "border-green-200 bg-green-50 text-green-700"
  if (label === "Overdue") return "border-red-200 bg-red-50 text-red-700"
  if (["Open", "In Progress"].includes(label)) {
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
  value: number
  tone: "amber" | "green"
}) {
  const classes =
    tone === "green"
      ? "border-green-200 bg-green-50/60 text-green-700"
      : "border-amber-200 bg-amber-50/60 text-amber-700"

  return (
    <div className={`rounded-2xl border p-5 ${classes}`}>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-current" />
        <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  )
}

function getAssignee(task: any) {
  return Array.isArray(task.workflow_team_members)
    ? task.workflow_team_members[0]
    : task.workflow_team_members
}

function getRelatedRecord(task: any) {
  const order = Array.isArray(task.workflow_orders)
    ? task.workflow_orders[0]
    : task.workflow_orders

  if (order) {
    return `Order: ${order.order_code} — ${order.client_name}`
  }

  const enquiry = Array.isArray(task.workflow_enquiries)
    ? task.workflow_enquiries[0]
    : task.workflow_enquiries

  if (enquiry) {
    return `Enquiry: ${enquiry.enquiry_code} — ${enquiry.client_name}`
  }

  return "General task"
}

function buildPageHref({
  statusFilter,
  page,
}: {
  statusFilter: string
  page: number
}) {
  return statusFilter === "All"
    ? `/admin/workflow/tasks?page=${page}`
    : `/admin/workflow/tasks?status=${encodeURIComponent(statusFilter)}&page=${page}`
}

export default async function WorkflowTasksPage({
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
  const taskStatuses = ["All", "Open", "In Progress", "Done"]
  const today = new Date().toISOString().slice(0, 10)

  const [
    { data: tasks, error },
    { data: teamMembers },
    { data: orderOptions },
    { data: enquiryOptions },
  ] = await Promise.all([
    supabaseAdmin
      .from("workflow_tasks")
      .select(
        `
        *,
        workflow_team_members (
          id,
          name,
          role,
          whatsapp,
          is_active
        ),
        workflow_orders!workflow_tasks_order_id_fkey (
          id,
          order_code,
          client_name
        ),
        workflow_enquiries!workflow_tasks_enquiry_id_fkey (
          id,
          enquiry_code,
          client_name
        )
      `
      )
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("workflow_team_members")
      .select("id, name, role, whatsapp, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("workflow_orders")
      .select("id, order_code, client_name")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("workflow_enquiries")
      .select("id, enquiry_code, client_name")
      .order("created_at", { ascending: false }),
  ])

  const allTasksRaw = tasks || []
  const activeTeamMembers = teamMembers || []
  const allOrderOptions = orderOptions || []
  const allEnquiryOptions = enquiryOptions || []

  const filteredTasks =
    statusFilter === "All"
      ? allTasksRaw
      : allTasksRaw.filter(
          (task) => normalizeTaskStatus(task.status) === statusFilter
        )

  const totalFilteredTasks = filteredTasks.length
  const totalPages = Math.max(Math.ceil(totalFilteredTasks / pageSize), 1)
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const allTasks = filteredTasks.slice(startIndex, startIndex + pageSize)

  const openCount = allTasksRaw.filter(
    (task) => normalizeTaskStatus(task.status) === "Open"
  ).length
  const inProgressCount = allTasksRaw.filter(
    (task) => normalizeTaskStatus(task.status) === "In Progress"
  ).length
  const doneCount = allTasksRaw.filter(
    (task) => normalizeTaskStatus(task.status) === "Done"
  ).length

  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Workflow</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Tasks</h1>
          <p className="mt-2 text-muted-foreground">
            Track general tasks and work linked to orders or enquiries.
          </p>
        </div>

        <AssignTaskModal
          teamMembers={activeTeamMembers}
          orders={allOrderOptions}
          enquiries={allEnquiryOptions}
        />
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error.message}
        </div>
      )}

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <SignalCard label="Open" value={openCount} tone="amber" />
        <SignalCard label="In Progress" value={inProgressCount} tone="amber" />
        <SignalCard label="Done" value={doneCount} tone="green" />
      </div>

      <StatusFilterBar
        basePath="/admin/workflow/tasks"
        currentStatus={statusFilter}
        statuses={taskStatuses}
      />

      <section className="rounded-2xl border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-xl font-bold">Task List</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalFilteredTasks} tasks · Filter: {statusFilter}
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
          {allTasks.map((task: any) => {
            const assignee = getAssignee(task)
            const status = normalizeTaskStatus(task.status)
            const isOverdue =
              Boolean(task.due_date) &&
              task.due_date < today &&
              status !== "Done"

            return (
              <article key={task.id} className="p-5">
                <div className="grid gap-5 xl:grid-cols-[1.35fr_1.2fr_1fr_250px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs font-semibold text-muted-foreground">{task.task_code}</p>
                      <StatusPill label={status} />
                      {isOverdue && <StatusPill label="Overdue" />}
                    </div>
                    <h3 className="mt-2 text-lg font-bold">{task.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{task.description || "No description"}</p>
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">{getRelatedRecord(task)}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ownership</p>
                    <p className="mt-2 text-sm font-semibold">{assignee?.name || "Unassigned"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{assignee?.role || "No role"}</p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due Date</p>
                    <p className="mt-1 text-sm font-semibold">{task.due_date || "—"}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Latest Remark</p>
                    <p className="mt-2 text-sm text-muted-foreground">{task.remark || "No remark"}</p>
                    <p className="mt-4 text-xs text-muted-foreground">Created: {task.created_at?.slice(0, 10) || "—"}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <TaskActions
                      taskId={task.id}
                      taskCode={task.task_code}
                      currentStatus={status}
                      canDelete={canDelete}
                    />

                    {canEdit && (
                      <EditTaskButton
                        task={{ ...task, status }}
                        teamMembers={activeTeamMembers}
                        orders={allOrderOptions}
                        enquiries={allEnquiryOptions}
                      />
                    )}

                    {canDelete && (
                      <DeleteTaskButton taskId={task.id} taskCode={task.task_code} />
                    )}
                  </div>
                </div>
              </article>
            )
          })}

          {allTasks.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">No tasks found.</div>
          )}
        </div>
      </section>
    </div>
  )
}