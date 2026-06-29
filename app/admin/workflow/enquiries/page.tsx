import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { isAdminOrOwner } from "@/lib/admin-role-utils"
import { CreateEnquiryModal } from "./create-enquiry-modal"
import { EnquiryActions } from "./enquiry-actions"
import { EditEnquiryButton } from "./edit-enquiry-button"

export const dynamic = "force-dynamic"

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold">
      {label}
    </span>
  )
}

function SuccessBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)))

  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground"
          style={{ width: `${safeValue}%` }}
        />
      </div>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">
        {safeValue}% chance
      </p>
    </div>
  )
}

export default async function WorkflowEnquiriesPage() {

  const user = await requireAdminUser([
    "Admin",
    "Owner",
    "Sales",
    "Operations",
    ])

  const canEdit = isAdminOrOwner(user)

  const { data: enquiries, error } = await supabaseAdmin
    .from("workflow_enquiries")
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

  const { data: teamMembers } = await supabaseAdmin
    .from("workflow_team_members")
    .select("id, name, role, whatsapp, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })

  const allEnquiries = enquiries || []
  const activeTeamMembers = teamMembers || []

  const totalValue = allEnquiries.reduce(
    (sum, enquiry) => sum + Number(enquiry.approx_cost || 0),
    0
  )

  const wonCount = allEnquiries.filter((enquiry) => enquiry.status === "Won").length
  const activeCount = allEnquiries.filter(
    (enquiry) => enquiry.status !== "Won" && enquiry.status !== "Lost"
  ).length

  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Workflow
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Enquiries</h1>
          <p className="mt-2 text-muted-foreground">
            Track client enquiries, proposal status, WhatsApp updates, and conversion probability.
          </p>
        </div>

        <CreateEnquiryModal teamMembers={activeTeamMembers} />
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error.message}
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Enquiries
          </p>
          <h2 className="mt-4 text-4xl font-bold">{allEnquiries.length}</h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Active
          </p>
          <h2 className="mt-4 text-4xl font-bold text-orange-600">
            {activeCount}
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

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pipeline Value
          </p>
          <h2 className="mt-4 text-3xl font-bold">
            {formatCurrency(totalValue)}
          </h2>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-xl font-bold">Enquiry List</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Send WhatsApp updates and maintain enquiry remarks.
          </p>
        </div>

        <div className="divide-y">
          {allEnquiries.map((enquiry) => (
            <div key={enquiry.id} className="p-5">
              <div className="grid gap-5 xl:grid-cols-[1.2fr_1.3fr_1fr_1fr_1.15fr]">
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

                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>{enquiry.client_phone || "No phone"}</p>
                    <p>{enquiry.client_email || "No email"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Requirement
                  </p>
                  <p className="mt-1 font-semibold">
                    {enquiry.product_names || "—"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Qty: {enquiry.tentative_quantity || "—"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Approx: {formatCurrency(enquiry.approx_cost)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Proposal
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {enquiry.proposal_status || "Draft Needed"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Client: {enquiry.client_response_status || "No Response Yet"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    PO: {enquiry.po_status || "Not Received"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Success
                  </p>
                  <div className="mt-3">
                    <SuccessBar value={enquiry.success_probability || 0} />
                  </div>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Remark
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {enquiry.remarks || "—"}
                  </p>
                </div>

                <div className="flex justify-start xl:justify-end">
                  <div className="ml-auto flex w-full max-w-[190px] flex-col items-end gap-2">
                    <EnquiryActions
                        enquiryId={enquiry.id}
                        enquiryCode={enquiry.enquiry_code}
                        currentStatus={enquiry.status || "New"}
                        currentRemark={enquiry.remarks || ""}
                        successProbability={enquiry.success_probability || 10}
                        proposalStatus={enquiry.proposal_status || "Draft Needed"}
                        clientResponseStatus={
                        enquiry.client_response_status || "No Response Yet"
                        }
                        poStatus={enquiry.po_status || "Not Received"}
                        hasPhone={Boolean(enquiry.client_phone)}
                    />

                    {canEdit && (
                        <EditEnquiryButton
                        enquiry={enquiry}
                        teamMembers={teamMembers || []}
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