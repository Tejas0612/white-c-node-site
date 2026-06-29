import { supabaseAdmin } from "@/lib/supabase-admin"
import { AssignTaskModal } from "./assign-task-modal"
import { SendAllTaskRemindersButton, TaskActions } from "./task-actions"

export const dynamic = "force-dynamic"

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
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Workflow
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Tasks</h1>
          <p className="mt-2 text-muted-foreground">
            Assign tasks, track follow-ups, and send WhatsApp reminders from the
            connected White C sender number.
          </p>
        </div>

        <SendAllTaskRemindersButton />
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
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-xl font-bold">Task List</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Send reminders, update task status, and capture remarks.
            </p>
          </div>

          <AssignTaskModal teamMembers={activeTeamMembers} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Task</th>
                <th className="px-5 py-4">Assignee</th>
                <th className="px-5 py-4">Due</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Remark</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {allTasks.map((task) => (
                <tr key={task.id} className="border-b">
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                    {task.task_code}
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-semibold">{task.title}</p>
                    {task.description && (
                      <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium">
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
                  </td>

                  <td className="px-5 py-4">{task.due_date || "—"}</td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                      {task.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {task.remark || "—"}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <TaskActions
                      taskId={task.id}
                      taskCode={task.task_code}
                      currentStatus={task.status}
                    />
                  </td>
                </tr>
              ))}

              {allTasks.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-muted-foreground"
                  >
                    No tasks found.
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