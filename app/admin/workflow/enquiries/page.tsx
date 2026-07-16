import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { isAdminOrOwner, isOwner } from "@/lib/admin-role-utils"
import { StatusFilterBar } from "@/components/admin/status-filter-bar"
import { CreateEnquiryModal } from "./create-enquiry-modal"
import { EnquiryActions } from "./enquiry-actions"
import { EditEnquiryButton } from "./edit-enquiry-button"
import { ProposalButtons } from "./proposal-buttons"
import { DeleteEnquiryButton } from "./delete-enquiry-button"

export const dynamic = "force-dynamic"

function statusClasses(label: string) {
  if (["Won", "Done", "Delivered"].includes(label)) {
    return "border-green-200 bg-green-50 text-green-700"
  }

  if (["Lost", "Cancelled", "Overdue"].includes(label)) {
    return "border-red-200 bg-red-50 text-red-700"
  }

  if (["New", "In Progress", "Quoted", "Open"].includes(label)) {
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
  tone: "amber" | "green" | "red"
}) {
  const classes =
    tone === "green"
      ? "border-green-200 bg-green-50/60 text-green-700"
      : tone === "red"
        ? "border-red-200 bg-red-50/60 text-red-700"
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

function formatCurrency(value: number | null) {
  if (!value) return "—"

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value))
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
    ? `/admin/workflow/enquiries?page=${page}`
    : `/admin/workflow/enquiries?status=${encodeURIComponent(statusFilter)}&page=${page}`
}

export default async function WorkflowEnquiriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; page?: string }>
}) {
  const user = await requireAdminUser([
    "Admin",
    "Owner",
    "Sales",
    "Operations",
  ])

  const canEdit = isAdminOrOwner(user)
  const canDelete = isOwner(user)
  const params = searchParams ? await searchParams : {}
  const statusFilter = params?.status || "All"
  const currentPage = Math.max(Number(params?.page || "1"), 1)
  const pageSize = 10
  const enquiryStatuses = ["All", "New", "In Progress", "Quoted", "Won", "Lost"]

  const [{ data: enquiries, error }, { data: teamMembers }, { data: tasks, error: taskError }] =
    await Promise.all([
      supabaseAdmin
        .from("workflow_enquiries")
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
          enquiry_id,
          workflow_team_members (
            id,
            name
          )
        `
        )
        .not("enquiry_id", "is", null)
        .order("created_at", { ascending: false }),
    ])

  const allTeamMembers = teamMembers || []
  const teamById = new Map(allTeamMembers.map((member: any) => [member.id, member]))
  const allEnquiriesRaw = enquiries || []
  const tasksByEnquiry = new Map<string, any[]>()

  for (const task of tasks || []) {
    if (!task.enquiry_id) continue
    const current = tasksByEnquiry.get(task.enquiry_id) || []
    current.push(task)
    tasksByEnquiry.set(task.enquiry_id, current)
  }

  const filteredEnquiries =
    statusFilter === "All"
      ? allEnquiriesRaw
      : allEnquiriesRaw.filter(
          (enquiry) => (enquiry.status || "New") === statusFilter
        )

  const totalFilteredEnquiries = filteredEnquiries.length
  const totalPages = Math.max(Math.ceil(totalFilteredEnquiries / pageSize), 1)
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const allEnquiries = filteredEnquiries.slice(startIndex, startIndex + pageSize)

  const openCount = allEnquiriesRaw.filter(
    (enquiry) => !["Won", "Lost"].includes(enquiry.status || "New")
  ).length
  const wonCount = allEnquiriesRaw.filter((enquiry) => enquiry.status === "Won").length
  const lostCount = allEnquiriesRaw.filter((enquiry) => enquiry.status === "Lost").length

  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Workflow
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Enquiries</h1>
          <p className="mt-2 text-muted-foreground">
            Manage enquiries, owners, follow-ups, and linked tasks.
          </p>
        </div>
        <CreateEnquiryModal teamMembers={allTeamMembers} />
      </div>

      {(error || taskError) && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error?.message || taskError?.message}
        </div>
      )}

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <SignalCard label="Open" value={openCount} tone="amber" />
        <SignalCard label="Won" value={wonCount} tone="green" />
        <SignalCard label="Lost" value={lostCount} tone="red" />
      </div>

      <StatusFilterBar
        basePath="/admin/workflow/enquiries"
        currentStatus={statusFilter}
        statuses={enquiryStatuses}
      />

      <section className="rounded-2xl border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-xl font-bold">Enquiry List</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalFilteredEnquiries} enquiries · Filter: {statusFilter}
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
          {allEnquiries.map((enquiry: any) => {
            const owner = enquiry.assigned_to
              ? teamById.get(enquiry.assigned_to)
              : null
            const relatedTasks = tasksByEnquiry.get(enquiry.id) || []

            return (
              <article key={enquiry.id} className="p-5">
                <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr_1fr_240px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs font-semibold text-muted-foreground">
                        {enquiry.enquiry_code}
                      </p>
                      <StatusPill label={enquiry.status || "New"} />
                    </div>

                    <h3 className="mt-2 text-lg font-bold">{enquiry.client_name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {enquiry.product_names || "No product details"}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Owner: <span className="font-semibold text-foreground">{owner?.name || "Unassigned"}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Phone: {enquiry.client_phone || "—"} · Email: {enquiry.client_email || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Commercial</p>
                    <p className="mt-2 text-sm">Quantity: <span className="font-semibold">{enquiry.tentative_quantity || "—"}</span></p>
                    <p className="mt-1 text-sm">Approx value: <span className="font-semibold">{formatCurrency(enquiry.approx_cost)}</span></p>
                    <p className="mt-1 text-sm">Probability: <span className="font-semibold">{enquiry.success_probability || 10}%</span></p>
                    <p className="mt-1 text-xs text-muted-foreground">Enquiry date: {enquiry.enquiry_date || "—"}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Follow-up</p>
                    <p className="mt-2 text-sm">Next date: <span className="font-semibold">{enquiry.next_follow_up_date || "—"}</span></p>
                    <p className="mt-1 text-sm text-muted-foreground">Proposal: {enquiry.proposal_status || "Draft Needed"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Response: {enquiry.client_response_status || "No Response Yet"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">PO: {enquiry.po_status || "Not Received"}</p>
                    <p className="mt-3 text-sm text-muted-foreground">{enquiry.remarks || "No remarks"}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <EnquiryActions
                      enquiryId={enquiry.id}
                      enquiryCode={enquiry.enquiry_code}
                      clientName={enquiry.client_name}
                      currentStatus={enquiry.status || "New"}
                      currentRemark={enquiry.remarks || ""}
                      successProbability={enquiry.success_probability || 10}
                      proposalStatus={enquiry.proposal_status || "Draft Needed"}
                      clientResponseStatus={enquiry.client_response_status || "No Response Yet"}
                      poStatus={enquiry.po_status || "Not Received"}
                      hasPhone={Boolean(enquiry.client_phone)}
                      teamMembers={allTeamMembers}
                    />

                    <ProposalButtons
                      enquiryId={enquiry.id}
                      enquiryCode={enquiry.enquiry_code}
                      clientName={enquiry.client_name}
                      productNames={enquiry.product_names}
                      tentativeQuantity={enquiry.tentative_quantity}
                      approxCost={enquiry.approx_cost}
                      clientPhone={enquiry.client_phone}
                      clientEmail={enquiry.client_email}
                      remarks={enquiry.remarks}
                    />

                    {canEdit && <EditEnquiryButton enquiry={enquiry} teamMembers={allTeamMembers} />}
                    {canDelete && <DeleteEnquiryButton enquiryId={enquiry.id} enquiryCode={enquiry.enquiry_code} />}
                  </div>
                </div>

                <RelatedTasks tasks={relatedTasks} />
              </article>
            )
          })}

          {allEnquiries.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">No enquiries found.</div>
          )}
        </div>
      </section>
    </div>
  )
}