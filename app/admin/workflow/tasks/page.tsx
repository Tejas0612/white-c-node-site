import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { isAdminOrOwner, isOwner } from "@/lib/admin-role-utils"
import { StatusFilterBar } from "@/components/admin/status-filter-bar"
import { AssignTaskModal } from "./assign-task-modal"
import { TaskActions } from "./task-actions"
import { EditTaskButton } from "./edit-task-button"
import { DeleteTaskButton } from "./delete-task-button"

export const dynamic = "force-dynamic"

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold">
      {label}
    </span>
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—"
  }

  return value
}

function getTaskStatus(task: any) {
  return task.status || "Open"
}

function getAssigneeName(task: any) {
  const assignee = Array.isArray(task.workflow_team_members)
    ? task.workflow_team_members[0]
    : task.workflow_team_members

  return assignee?.name || "Unassigned"
}

function getAssigneeId(task: any) {
  const assignee = Array.isArray(task.workflow_team_members)
    ? task.workflow_team_members[0]
    : task.workflow_team_members

  return assignee?.id || task.assignee_id || "unassigned"
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

function TeamScoreCard({
  rank,
  name,
  completed,
  total,
}: {
  rank: number
  name: string
  completed: number
  total: number
}) {
  const completionRate =
    total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="rounded-2xl border bg-background p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            #{rank}
          </p>

          <h3 className="mt-2 text-base font-bold">{name}</h3>
        </div>

        <div className="rounded-full bg-muted px-3 py-1 text-xs font-bold">
          {completionRate}%
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Done
          </p>
          <p className="mt-1 text-xl font-bold text-green-600">
            {completed}
          </p>
        </div>

        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Total
          </p>
          <p className="mt-1 text-xl font-bold">{total}</p>
        </div>
      </div>
    </div>
  )
}

function buildPageHref({
  statusFilter,
  page,
}: {
  statusFilter: string
  page: number
}) {
  if (statusFilter === "All") {
    return `/admin/workflow/tasks?page=${page}`
  }

  return `/admin/workflow/tasks?status=${encodeURIComponent(
    statusFilter
  )}&page=${page}`
}

function TopPagination({
  safeCurrentPage,
  totalPages,
  statusFilter,
}: {
  safeCurrentPage: number
  totalPages: number
  statusFilter: string
}) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border bg-muted/30 px-3 py-3">
      <a
        href={
          safeCurrentPage <= 1
            ? "#"
            : buildPageHref({
                statusFilter,
                page: safeCurrentPage - 1,
              })
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
            : buildPageHref({
                statusFilter,
                page: safeCurrentPage + 1,
              })
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
  )
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

  const { data: tasks, error } = await supabaseAdmin
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
      )
    `
    )
    .order("created_at", { ascending: false })

  const { data: teamMembers } = await supabaseAdmin
    .from("workflow_team_members")
    .select("id, name, role, whatsapp, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })

  const allTasksRaw = tasks || []
  const activeTeamMembers = teamMembers || []

  const filteredTasks =
    statusFilter === "All"
      ? allTasksRaw
      : allTasksRaw.filter((task) => getTaskStatus(task) === statusFilter)

  const totalFilteredTasks = filteredTasks.length
  const totalPages = Math.max(Math.ceil(totalFilteredTasks / pageSize), 1)
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = startIndex + pageSize

  const allTasks = filteredTasks.slice(startIndex, endIndex)

  const totalTasks = allTasksRaw.length

  const openTasks = allTasksRaw.filter(
    (task) => getTaskStatus(task) === "Open"
  )

  const inProgressTasks = allTasksRaw.filter(
    (task) => getTaskStatus(task) === "In Progress"
  )

  const doneTasks = allTasksRaw.filter(
    (task) => getTaskStatus(task) === "Done"
  )

  const overdueTasks = allTasksRaw.filter((task) => {
    const status = getTaskStatus(task)

    return task.due_date && task.due_date < today && status !== "Done"
  })

  const dueTodayTasks = allTasksRaw.filter((task) => {
    const status = getTaskStatus(task)

    return task.due_date === today && status !== "Done"
  })

  const teamScores = activeTeamMembers
    .map((member: any) => {
      const memberTasks = allTasksRaw.filter((task) => {
        const assigneeId = getAssigneeId(task)

        return assigneeId === member.id
      })

      const completedTasks = memberTasks.filter(
        (task) => getTaskStatus(task) === "Done"
      )

      return {
        id: member.id,
        name: member.name,
        total: memberTasks.length,
        completed: completedTasks.length,
      }
    })
    .sort((a, b) => {
      if (b.completed !== a.completed) {
        return b.completed - a.completed
      }

      return b.total - a.total
    })

  const highestTaskCompletedMember = teamScores[0]

  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Workflow
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Tasks
          </h1>

          <p className="mt-2 text-muted-foreground">
            Assign work, track ownership, follow up on overdue items, and
            celebrate team execution.
          </p>
        </div>

        <AssignTaskModal teamMembers={activeTeamMembers} />
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error.message}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          label="Total Tasks"
          value={totalTasks}
          helper={`${doneTasks.length} completed`}
        />

        <InsightCard
          label="Open"
          value={openTasks.length}
          helper="Pending to start"
          tone="orange"
        />

        <InsightCard
          label="In Progress"
          value={inProgressTasks.length}
          helper="Currently active"
          tone="blue"
        />

        <InsightCard
          label="Completed"
          value={doneTasks.length}
          helper="Marked done"
          tone="green"
        />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <InsightCard
          label="Overdue"
          value={overdueTasks.length}
          helper="Past due date and not done"
          tone={overdueTasks.length > 0 ? "red" : "green"}
        />

        <InsightCard
          label="Due Today"
          value={dueTodayTasks.length}
          helper="Needs attention today"
          tone={dueTodayTasks.length > 0 ? "orange" : "default"}
        />

        <InsightCard
          label="Top Performer"
          value={highestTaskCompletedMember?.name || "—"}
          helper={
            highestTaskCompletedMember
              ? `${highestTaskCompletedMember.completed} tasks completed`
              : "No completed tasks yet"
          }
          tone="green"
        />
      </div>

      <section className="mt-6 rounded-2xl border bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h2 className="text-xl font-bold">Team Task Scoreboard</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Completion ranking based on tasks marked as done.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {teamScores.slice(0, 4).map((member, index) => (
            <TeamScoreCard
              key={member.id}
              rank={index + 1}
              name={member.name}
              completed={member.completed}
              total={member.total}
            />
          ))}

          {teamScores.length === 0 && (
            <div className="rounded-2xl border bg-muted/30 p-5 text-sm text-muted-foreground">
              No active team members found.
            </div>
          )}
        </div>
      </section>

      <StatusFilterBar
        basePath="/admin/workflow/tasks"
        currentStatus={statusFilter}
        statuses={taskStatuses}
      />
            <section className="rounded-2xl border bg-background">
        <div className="border-b p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Task List</h2>

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
                  {allTasks.length} of {totalFilteredTasks} tasks
                </p>
              </div>

              <TopPagination
                safeCurrentPage={safeCurrentPage}
                totalPages={totalPages}
                statusFilter={statusFilter}
              />
            </div>
          </div>
        </div>

        <div className="divide-y">
          {allTasks.map((task: any) => {
            const assignee = Array.isArray(task.workflow_team_members)
              ? task.workflow_team_members[0]
              : task.workflow_team_members

            return (
              <div key={task.id} className="p-5">
                <div className="grid gap-5 xl:grid-cols-[1.1fr_1.4fr_1fr_1fr_1.1fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs font-semibold text-muted-foreground">
                        {task.task_code}
                      </p>

                      <StatusPill label={task.status || "Open"} />
                    </div>

                    <h3 className="mt-2 text-base font-bold">
                      {task.title}
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Created: {formatDate(task.created_at?.slice(0, 10))}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Description
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.description || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Owner
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {getAssigneeName(task)}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {assignee?.role || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Due Date
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {formatDate(task.due_date)}
                    </p>

                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Remark
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.remark || "—"}
                    </p>
                  </div>

                  <div className="flex justify-start xl:justify-end">
                    <div className="ml-auto flex w-full max-w-[250px] flex-col items-end gap-2">
                      <TaskActions
                        taskId={task.id}
                        taskCode={task.task_code}
                        currentStatus={task.status || "Open"}
                        canDelete={canDelete}
                      />
                      
                      {canDelete && (
                        <DeleteTaskButton
                          taskId={task.id}
                          taskCode={task.task_code}
                        />
                      )}

                      {canEdit && (
                        <EditTaskButton
                          task={task}
                          teamMembers={activeTeamMembers}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {allTasks.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">
              No tasks found.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}