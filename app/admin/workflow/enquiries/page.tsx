import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminUser } from "@/lib/admin-auth"
import { CreateEnquiryModal } from "./create-enquiry-modal"

export const dynamic = "force-dynamic"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

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

function createClientFollowUpMessage(enquiry: any) {
  return `Hi ${enquiry.client_name}, this is regarding your White C gifting enquiry for ${
    enquiry.product_names || "your selected products"
  }.

We are reviewing the requirement and will share suitable options/quotation shortly.

Thanks,
White C`
}

function SuccessBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)))

  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-green-600"
          style={{ width: `${safeValue}%` }}
        />
      </div>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">
        {safeValue}% potential
      </p>
    </div>
  )
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold">
      {label}
    </span>
  )
}

export default async function WorkflowEnquiriesPage() {
  await requireAdminUser(["Sales", "Operations"])

  const { data: enquiries, error } = await supabaseAdmin
    .from("workflow_enquiries")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: teamMembers } = await supabaseAdmin
    .from("workflow_team_members")
    .select("id, name, role, email, whatsapp, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })

  const allEnquiries = enquiries || []
  const activeTeamMembers = teamMembers || []

  const newEnquiries = allEnquiries.filter(
    (enquiry) => enquiry.status === "New"
  )

  const quoteSentEnquiries = allEnquiries.filter(
    (enquiry) => enquiry.status === "Quote Sent"
  )

  const wonEnquiries = allEnquiries.filter(
    (enquiry) => enquiry.status === "Won" || enquiry.converted_to_order
  )

  const poReceived = allEnquiries.filter(
    (enquiry) =>
      enquiry.po_status === "Received" ||
      enquiry.po_status === "Payment Received"
  )

  const totalApproxValue = allEnquiries.reduce(
    (total, enquiry) => total + Number(enquiry.approx_cost || 0),
    0
  )

  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Pipeline
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Customer Enquiries
          </h1>
          <p className="mt-2 text-muted-foreground">
            Track enquiries, proposals, client responses, PO status, and
            conversion potential.
          </p>
        </div>

        <CreateEnquiryModal teamMembers={activeTeamMembers} />
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error.message}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <div className="rounded-2xl border bg-background p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            New
          </p>
          <h2 className="mt-3 text-3xl font-bold text-blue-600">
            {newEnquiries.length}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quote Sent
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            {quoteSentEnquiries.length}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            PO / Payment
          </p>
          <h2 className="mt-3 text-3xl font-bold text-purple-600">
            {poReceived.length}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Converted
          </p>
          <h2 className="mt-3 text-3xl font-bold text-green-600">
            {wonEnquiries.length}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-5 sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Approx Value
          </p>
          <h2 className="mt-3 text-2xl font-bold">
            {formatCurrency(totalApproxValue)}
          </h2>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-xl font-bold">Enquiry List</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Compact view without horizontal scrolling.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusPill label="Current" />
            <StatusPill label="Won" />
            <StatusPill label="Lost" />
          </div>
        </div>

        <div className="divide-y">
          {allEnquiries.map((enquiry) => {
            const message = createClientFollowUpMessage(enquiry)
            const whatsappUrl = createWhatsAppUrl(enquiry.client_phone, message)

            return (
              <div key={enquiry.id} className="p-5">
                <div className="grid gap-5 xl:grid-cols-[1.2fr_1.4fr_1fr_1fr_1fr]">
                  <div>
                    <p className="font-bold">{enquiry.client_name}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {enquiry.enquiry_code}
                    </p>

                    <div className="mt-3">
                      <StatusPill label={enquiry.status || "New"} />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Product / Requirement
                    </p>
                    <p className="mt-1 font-medium">
                      {enquiry.product_names || "—"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Qty: {enquiry.tentative_quantity || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Approx Value
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {formatCurrency(Number(enquiry.approx_cost || 0))}
                    </p>

                    <div className="mt-3">
                      <SuccessBar
                        value={Number(enquiry.success_probability || 0)}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Progress
                    </p>
                    <div className="mt-2 space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Proposal:</span>{" "}
                        {enquiry.proposal_status || "Draft Needed"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Response:</span>{" "}
                        {enquiry.client_response_status || "No Response Yet"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">PO:</span>{" "}
                        {enquiry.po_status || "Not Received"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Contact
                    </p>

                    {enquiry.client_phone ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block font-semibold text-green-600 hover:underline"
                      >
                        {enquiry.client_phone}
                      </a>
                    ) : (
                      <p className="mt-1 text-muted-foreground">No phone</p>
                    )}

                    {enquiry.client_email && (
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {enquiry.client_email}
                      </p>
                    )}
                  </div>
                </div>

                {enquiry.remarks && (
                  <div className="mt-4 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Remarks:
                    </span>{" "}
                    {enquiry.remarks}
                  </div>
                )}
              </div>
            )
          })}

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