"use client"

import { useState, useTransition } from "react"
import { createWorkflowEnquiry } from "./actions"

type TeamMember = {
  id: string
  name: string
  role?: string | null
  whatsapp?: string | null
  is_active?: boolean | null
}

export function CreateEnquiryModal({
  teamMembers,
}: {
  teamMembers: TeamMember[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError("")

    startTransition(async () => {
      try {
        await createWorkflowEnquiry(formData)
        setIsOpen(false)
      } catch (enquiryError: any) {
        setError(enquiryError?.message || "Failed to create enquiry.")
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl bg-foreground px-5 py-2 text-sm font-semibold text-background hover:opacity-90"
      >
        + New Enquiry
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">New Enquiry</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a new client enquiry and assign it to the right team member.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border px-3 py-1 text-sm font-semibold hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <form action={handleSubmit} className="grid gap-5 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Client Name</label>
                  <input
                    name="client_name"
                    required
                    placeholder="Example: Novoco"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Assigned To</label>
                  <select
                    name="assigned_to"
                    defaultValue=""
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Client Phone</label>
                  <input
                    name="client_phone"
                    placeholder="Example: +919836232942"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Client Email</label>
                  <input
                    type="email"
                    name="client_email"
                    placeholder="client@company.com"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Product / Requirement</label>
                <textarea
                  name="product_names"
                  rows={3}
                  placeholder="Example: Premium bottles under ₹500 for 500 employees"
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold">Tentative Quantity</label>
                  <input
                    type="number"
                    name="tentative_quantity"
                    min="1"
                    defaultValue="1"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Approx Value</label>
                  <input
                    type="number"
                    name="approx_cost"
                    min="0"
                    defaultValue="0"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Enquiry Date</label>
                  <input
                    type="date"
                    name="enquiry_date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <select
                    name="status"
                    defaultValue="New"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Proposal Status</label>
                  <select
                    name="proposal_status"
                    defaultValue="Draft Needed"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="Draft Needed">Draft Needed</option>
                    <option value="Draft Ready">Draft Ready</option>
                    <option value="Sent for Approval">Sent for Approval</option>
                    <option value="Approved">Approved</option>
                    <option value="Sent to Client">Sent to Client</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Client Response</label>
                  <select
                    name="client_response_status"
                    defaultValue="No Response Yet"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="No Response Yet">No Response Yet</option>
                    <option value="Interested">Interested</option>
                    <option value="Needs Revision">Needs Revision</option>
                    <option value="Negotiating">Negotiating</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold">PO Status</label>
                  <select
                    name="po_status"
                    defaultValue="Not Received"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="Not Received">Not Received</option>
                    <option value="Requested">Requested</option>
                    <option value="Received">Received</option>
                    <option value="Payment Pending">Payment Pending</option>
                    <option value="Payment Received">Payment Received</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Success Probability</label>
                  <input
                    type="number"
                    name="success_probability"
                    min="0"
                    max="100"
                    defaultValue="10"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Next Follow-up</label>
                  <input
                    type="date"
                    name="next_follow_up_date"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Remarks</label>
                <textarea
                  name="remarks"
                  rows={3}
                  placeholder="Internal notes"
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border px-5 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-foreground px-5 py-2 text-sm font-semibold text-background disabled:opacity-60"
                >
                  {isPending ? "Saving..." : "Create Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}