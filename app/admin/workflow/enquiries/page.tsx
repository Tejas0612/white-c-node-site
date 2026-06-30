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

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold">
      {label}
    </span>
  )
}

function formatCurrency(value: number | null) {
  if (!value) {
    return "—"
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function buildPageHref({
    statusFilter,
    page,
  }: {
    statusFilter: string
    page: number
  }) {
    if (statusFilter === "All") {
      return `/admin/workflow/enquiries?page=${page}`
    }

    return `/admin/workflow/enquiries?status=${encodeURIComponent(
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

  const enquiryStatuses = [
    "All",
    "New",
    "In Progress",
    "Quoted",
    "Won",
    "Lost",
  ]

  const { data: enquiries, error } = await supabaseAdmin
    .from("workflow_enquiries")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: teamMembers } = await supabaseAdmin
    .from("workflow_team_members")
    .select("id, name, role, whatsapp, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })

  const allTeamMembers = teamMembers || []
  const allEnquiriesRaw = enquiries || []

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
  const endIndex = startIndex + pageSize

  const allEnquiries = filteredEnquiries.slice(startIndex, endIndex)

  const newCount = allEnquiriesRaw.filter(
    (enquiry) => (enquiry.status || "New") === "New"
  ).length

  const quotedCount = allEnquiriesRaw.filter(
    (enquiry) => enquiry.status === "Quoted"
  ).length

  const wonCount = allEnquiriesRaw.filter(
    (enquiry) => enquiry.status === "Won"
  ).length

  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Workflow
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Enquiries
          </h1>

          <p className="mt-2 text-muted-foreground">
            Track incoming enquiries, client response, probability, proposal
            status, and PO status.
          </p>
        </div>

        <CreateEnquiryModal teamMembers={allTeamMembers} />
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error.message}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total
          </p>
          <h2 className="mt-4 text-4xl font-bold">
            {allEnquiriesRaw.length}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            New
          </p>
          <h2 className="mt-4 text-4xl font-bold text-orange-600">
            {newCount}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quoted
          </p>
          <h2 className="mt-4 text-4xl font-bold text-blue-600">
            {quotedCount}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Won
          </p>
          <h2 className="mt-4 text-4xl font-bold text-green-600">
            {wonCount}
          </h2>
        </div>
      </div>

      <StatusFilterBar
        basePath="/admin/workflow/enquiries"
        currentStatus={statusFilter}
        statuses={enquiryStatuses}
      />

      <section className="rounded-2xl border bg-background">
        <div className="border-b p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Enquiry List</h2>

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
                  {allEnquiries.length} of {totalFilteredEnquiries} enquiries
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
          {allEnquiries.map((enquiry: any) => (
            <div key={enquiry.id} className="p-5">
              <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr_1fr_1fr_1.15fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-xs font-semibold text-muted-foreground">
                      {enquiry.enquiry_code}
                    </p>

                    <StatusPill label={enquiry.status || "New"} />
                  </div>

                  <h3 className="mt-2 text-base font-bold">
                    {enquiry.client_name}
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {enquiry.product_names || "No product details"}
                  </p>

                  <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                    <p>
                      Phone:{" "}
                      <span className="font-semibold text-foreground">
                        {enquiry.client_phone || "—"}
                      </span>
                    </p>

                    <p>
                      Email:{" "}
                      <span className="font-semibold text-foreground">
                        {enquiry.client_email || "—"}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Requirement
                  </p>

                  <p className="mt-1 text-sm">
                    Qty:{" "}
                    <span className="font-semibold">
                      {enquiry.tentative_quantity || "—"}
                    </span>
                  </p>

                  <p className="mt-1 text-sm">
                    Value:{" "}
                    <span className="font-semibold">
                      {formatCurrency(enquiry.approx_cost)}
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Date: {enquiry.enquiry_date || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pipeline
                  </p>

                  <p className="mt-1 text-sm">
                    Probability:{" "}
                    <span className="font-semibold">
                      {enquiry.success_probability || 10}%
                    </span>
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Proposal: {enquiry.proposal_status || "Draft Needed"}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Response:{" "}
                    {enquiry.client_response_status || "No Response Yet"}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    PO: {enquiry.po_status || "Not Received"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Remark
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {enquiry.remarks || "—"}
                  </p>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Follow Up
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {enquiry.next_follow_up_date || "—"}
                  </p>
                </div>

                <div className="flex justify-start xl:justify-end">
                  <div className="ml-auto flex w-full max-w-[230px] flex-col items-end gap-2">
                    <EnquiryActions
                      enquiryId={enquiry.id}
                      enquiryCode={enquiry.enquiry_code}
                      currentStatus={enquiry.status || "New"}
                      currentRemark={enquiry.remarks || ""}
                      successProbability={enquiry.success_probability || 10}
                      proposalStatus={
                        enquiry.proposal_status || "Draft Needed"
                      }
                      clientResponseStatus={
                        enquiry.client_response_status || "No Response Yet"
                      }
                      poStatus={enquiry.po_status || "Not Received"}
                      hasPhone={Boolean(enquiry.client_phone)}
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

                    {canDelete && (
                      <DeleteEnquiryButton
                        enquiryId={enquiry.id}
                        enquiryCode={enquiry.enquiry_code}
                      />
                    )}

                    {canEdit && (
                      <EditEnquiryButton
                        enquiry={enquiry}
                        teamMembers={allTeamMembers}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {allEnquiries.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">
              No enquiries found.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}