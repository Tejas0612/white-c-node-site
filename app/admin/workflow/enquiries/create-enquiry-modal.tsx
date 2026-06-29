"use client"

import { useRef, useState, useTransition } from "react"
import { createWorkflowEnquiry } from "./actions"

type TeamMember = {
  id: string
  name: string
  role: string | null
  email: string | null
  whatsapp: string | null
  is_active: boolean
}

export function CreateEnquiryModal({
  teamMembers,
}: {
  teamMembers: TeamMember[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError("")

    startTransition(async () => {
      try {
        await createWorkflowEnquiry(formData)
        formRef.current?.reset()
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
        className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background"
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
                  Add a customer requirement, trigger acknowledgement email, and
                  track proposal progress.
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

            <form ref={formRef} action={handleSubmit} className="grid gap-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Client Name</label>
                  <input
                    name="client_name"
                    placeholder="Example: Nuvoco"
                    required
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Assigned To</label>
                  <select
                    name="assigned_to"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} {member.role ? `— ${member.role}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Client Phone</label>
                  <input
                    name="client_phone"
                    placeholder="+919876543210"
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
                <label className="text-sm font-semibold">Product(s)</label>
                <input
                  name="product_names"
                  placeholder="Example: Backpacks, bottles, employee kits"
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="text-sm font-semibold">Tentative Qty</label>
                  <input
                    type="number"
                    name="tentative_quantity"
                    placeholder="300"
                    min="0"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Approx Value</label>
                  <input
                    type="number"
                    name="approx_cost"
                    placeholder="500000"
                    min="0"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Enquiry Date</label>
                  <input
                    type="date"
                    name="enquiry_date"
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

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <select
                    name="status"
                    defaultValue="New"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Quote Sent">Quote Sent</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Proposal</label>
                  <select
                    name="proposal_status"
                    defaultValue="Draft Needed"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="Draft Needed">Draft Needed</option>
                    <option value="Draft Created">Draft Created</option>
                    <option value="Sent for Approval">Sent for Approval</option>
                    <option value="Shared with Client">Shared with Client</option>
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
                    <option value="Responded">Responded</option>
                    <option value="Follow-up Required">Follow-up Required</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">PO Status</label>
                  <select
                    name="po_status"
                    defaultValue="Not Received"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="Not Received">Not Received</option>
                    <option value="Expected">Expected</option>
                    <option value="Received">Received</option>
                    <option value="Payment Pending">Payment Pending</option>
                    <option value="Payment Received">Payment Received</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Potential Order Success %
                </label>
                <input
                  type="range"
                  name="success_probability"
                  min="0"
                  max="100"
                  step="5"
                  defaultValue="10"
                  className="mt-3 w-full"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Use higher score when client responds, proposal is shared, PO
                  is expected, or payment is near.
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold">Remarks</label>
                <textarea
                  name="remarks"
                  placeholder="Add requirement details, budget range, deadline, proposal notes, or follow-up context."
                  rows={4}
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
                  {isPending ? "Saving..." : "Save Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}