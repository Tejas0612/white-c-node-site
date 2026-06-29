import { supabaseAdmin } from "@/lib/supabase-admin"
import { AssignTaskModal } from "./assign-task-modal"
import { TaskActions } from "./task-actions"

export const dynamic = "force-dynamic"

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold">
      {label}
    </span>
  )
}

export default async function WorkflowTasksPage() {
  const { data: tasks, error } = await supabaseAdmin
    .from("workflow_tasks")
    .select(
      `
      *,
      workflow_team_members (
        name,
        email,
        whatsapp
      )
    `
    )
    .order("created_at", { ascending: false })

  const { data: teamMembers } = await supabaseAdmin
    .from("workflow_team_members")
    .select("id, name, role, whatsapp, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })

  const allTasks = tasks || []
  const activeTeamMembers = teamMembers || []

  const pendingTasks = allTasks.filter((task) => task.status === "Pending")
  const doneTasks = allTasks.filter((task) => task.status === "Done")
  const remarkedTasks = allTasks.filter((task) => task.status === "Remarked")

  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Workflow
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Tasks</h1>
          <p className="mt-2 text-muted-foreground">
            Assign tasks, send WhatsApp reminders, and track completion.
          </p>
        </div>

        <AssignTaskModal teamMembers={activeTeamMembers} />
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error.message}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pending
          </p>
          <h2 className="mt-4 text-4xl font-bold text-orange-600">
            {pendingTasks.length}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Done
          </p>
          <h2 className="mt-4 text-4xl font-bold text-green-600">
            {doneTasks.length}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Remarked
          </p>
          <h2 className="mt-4 text-4xl font-bold text-blue-600">
            {remarkedTasks.length}
          </h2>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-xl font-bold">Task List</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Compact task view without horizontal scrolling.
          </p>
        </div>

        <div className="divide-y">
          {allTasks.map((task) => (
            <div key={task.id} className="p-5">
              <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr_0.9fr_1fr_1.15fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-xs font-semibold text-muted-foreground">
                      {task.task_code}
                    </p>
                    <StatusPill label={task.status || "Pending"} />
                  </div>

                  <h3 className="mt-2 text-base font-bold">{task.title}</h3>

                  {task.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Assignee
                  </p>
                  <p className="mt-1 font-semibold">
                    {task.workflow_team_members?.name || "Unassigned"}
                  </p>

                  {task.workflow_team_members?.whatsapp ? (
                    <p className="mt-1 text-xs font-semibold text-green-600">
                      {task.workflow_team_members.whatsapp}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      No WhatsApp
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Due Date
                  </p>
                  <p className="mt-1 whitespace-nowrap font-medium">
                    {task.due_date || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Remark
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {task.remark || "—"}
                  </p>
                </div>

                <div className="flex justify-start xl:justify-end">
                  <TaskActions
                    taskId={task.id}
                    taskCode={task.task_code}
                    currentStatus={task.status || "Pending"}
                  />
                </div>
              </div>
            </div>
          ))}

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