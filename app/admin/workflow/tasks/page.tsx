import { supabaseAdmin } from "@/lib/supabase-admin"
import { AssignTaskModal } from "./assign-task-modal"
import { TaskActions } from "./task-actions"

export const dynamic = "force-dynamic"

function cleanPhone(phone: string | null | undefined) {
  return String(phone || "").replace(/\D/g, "")
}

function createWhatsAppUrl(phone: string | null | undefined, message: string) {
  const cleanedPhone = cleanPhone(phone)

  if (!cleanedPhone) return "#"

  return `https://web.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(
    message
  )}`
}

function createTaskReminderMessage(task: any) {
  const assigneeName = task.workflow_team_members?.name || "there"

  return `Hi ${assigneeName}, reminder for your pending White C task:

Task Code: ${task.task_code}
Task: ${task.title}
${task.description ? `Details: ${task.description}` : ""}
${task.due_date ? `Due date: ${task.due_date}` : ""}

Please reply in this format:

DONE ${task.task_code}

or

REMARK ${task.task_code} your update here

Example:
REMARK ${task.task_code} Vendor confirmed dispatch tomorrow.`
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

  const reminderMessages = pendingTasks
    .filter((task) => task.workflow_team_members?.whatsapp)
    .map((task) => `${task.workflow_team_members.name}: ${task.task_code} - ${task.title}`)
    .join("\n")

  const adminReminderMessage = `White C pending task reminders:

${reminderMessages || "No pending tasks with WhatsApp numbers."}

Ask team members to reply:
DONE TASK_CODE
or
REMARK TASK_CODE update text`

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Workflow
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Tasks</h1>
          <p className="mt-2 text-muted-foreground">
            Assign tasks, track follow-ups, and send WhatsApp reminders.
          </p>
        </div>

        <a
          href={createWhatsAppUrl("+919836232942", adminReminderMessage)}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border bg-background px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
        >
          Send reminders now
        </a>
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
              Track operations, follow-ups, and delivery responsibilities.
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
              {allTasks.map((task) => {
                const message = createTaskReminderMessage(task)
                const whatsappUrl = createWhatsAppUrl(
                  task.workflow_team_members?.whatsapp,
                  message
                )

                return (
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
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs font-semibold text-green-600 hover:underline"
                        >
                          {task.workflow_team_members.whatsapp}
                        </a>
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
                )
              })}

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