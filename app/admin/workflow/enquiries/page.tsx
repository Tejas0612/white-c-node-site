import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminUser } from "@/lib/admin-auth"

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

export default async function WorkflowEnquiriesPage() {
  await requireAdminUser(["Sales", "Operations"])

  const { data: enquiries, error } = await supabaseAdmin
    .from("workflow_enquiries")
    .select("*")
    .order("created_at", { ascending: false })

  const allEnquiries = enquiries || []

  const newEnquiries = allEnquiries.filter(
    (enquiry) => enquiry.status === "New"
  )

  const contactedEnquiries = allEnquiries.filter(
    (enquiry) => enquiry.status === "Contacted"
  )

  const quoteSentEnquiries = allEnquiries.filter(
    (enquiry) => enquiry.status === "Quote Sent"
  )

  const wonEnquiries = allEnquiries.filter(
    (enquiry) => enquiry.status === "Won"
  )

  const totalApproxValue = allEnquiries.reduce(
    (total, enquiry) => total + Number(enquiry.approx_cost || 0),
    0
  )

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Pipeline
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Customer Enquiries
          </h1>
          <p className="mt-2 text-muted-foreground">
            Track customer requirements, product interest, quantities, status,
            and WhatsApp follow-ups.
          </p>
        </div>

        <button className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background">
          + New Enquiry
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error.message}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            New
          </p>
          <h2 className="mt-4 text-4xl font-bold text-blue-600">
            {newEnquiries.length}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Contacted
          </p>
          <h2 className="mt-4 text-4xl font-bold">
            {contactedEnquiries.length}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quote Sent
          </p>
          <h2 className="mt-4 text-4xl font-bold">
            {quoteSentEnquiries.length}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Won
          </p>
          <h2 className="mt-4 text-4xl font-bold text-green-600">
            {wonEnquiries.length}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Approx Value
          </p>
          <h2 className="mt-4 text-2xl font-bold">
            {formatCurrency(totalApproxValue)}
          </h2>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-xl font-bold">Enquiry List</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage client requirements and follow-ups.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl border bg-muted px-4 py-2 text-sm font-semibold">
              Current
            </span>
            <span className="rounded-xl border px-4 py-2 text-sm font-semibold text-muted-foreground">
              Won
            </span>
            <span className="rounded-xl border px-4 py-2 text-sm font-semibold text-muted-foreground">
              Lost
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-4">Client</th>
                <th className="px-5 py-4">Product(s)</th>
                <th className="px-5 py-4">Tentative Qty</th>
                <th className="px-5 py-4">Approx Cost</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Remarks</th>
              </tr>
            </thead>

            <tbody>
              {allEnquiries.map((enquiry) => {
                const message = createClientFollowUpMessage(enquiry)
                const whatsappUrl = createWhatsAppUrl(
                  enquiry.client_phone,
                  message
                )

                return (
                  <tr key={enquiry.id} className="border-b">
                    <td className="px-5 py-4">
                      <p className="font-semibold">{enquiry.client_name}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {enquiry.enquiry_code}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {enquiry.product_names || "—"}
                    </td>

                    <td className="px-5 py-4">
                      {enquiry.tentative_quantity || "—"}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {formatCurrency(Number(enquiry.approx_cost || 0))}
                    </td>

                    <td className="px-5 py-4">
                      {enquiry.enquiry_date || "—"}
                    </td>

                    <td className="px-5 py-4">
                      {enquiry.client_phone ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-green-600 hover:underline"
                        >
                          {enquiry.client_phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No phone</span>
                      )}

                      {enquiry.client_email && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {enquiry.client_email}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                        {enquiry.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {enquiry.remarks || "—"}
                    </td>
                  </tr>
                )
              })}

              {allEnquiries.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-muted-foreground"
                  >
                    No enquiries found.
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