"use client"

import { useState, useTransition } from "react"
import { updateWorkflowEnquiryDetails } from "./actions"

type TeamMember = {
  id: string
  name: string
}

type Enquiry = {
  id: string
  client_name: string | null
  product_names: string | null
  tentative_quantity: number | null
  approx_cost: number | null
  client_phone: string | null
  client_email: string | null
  status: string | null
  remarks: string | null
  assigned_to: string | null
  success_probability: number | null
  proposal_status: string | null
  client_response_status: string | null
  po_status: string | null
  converted_to_order: boolean | null
  next_follow_up_date: string | null
}

export function EditEnquiryButton({
  enquiry,
  teamMembers,
}: {
  enquiry: Enquiry
  teamMembers: TeamMember[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError("")

    startTransition(async () => {
      try {
        await updateWorkflowEnquiryDetails(formData)
        setIsOpen(false)
      } catch (enquiryError: any) {
        setError(enquiryError?.message || "Failed to update enquiry.")
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="self-end rounded-full border border-muted-foreground/20 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">Edit Enquiry</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Admin / Owner only
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
              <input type="hidden" name="enquiry_id" value={enquiry.id} />

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Client Name</label>
                  <input
                    name="client_name"
                    defaultValue={enquiry.client_name || ""}
                    required
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Product Names</label>
                  <input
                    name="product_names"
                    defaultValue={enquiry.product_names || ""}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-4">
                <div>
                  <label className="text-sm font-semibold">Quantity</label>
                  <input
                    type="number"
                    name="tentative_quantity"
                    min="0"
                    defaultValue={enquiry.tentative_quantity || 0}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Approx Cost</label>
                  <input
                    type="number"
                    name="approx_cost"
                    min="0"
                    step="0.01"
                    defaultValue={enquiry.approx_cost || 0}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <select
                    name="status"
                    defaultValue={enquiry.status || "New"}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Quoted">Quoted</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Probability %</label>
                  <input
                    type="number"
                    name="success_probability"
                    min="0"
                    max="100"
                    defaultValue={enquiry.success_probability || 0}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold">Client Phone</label>
                  <input
                    name="client_phone"
                    defaultValue={enquiry.client_phone || ""}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Client Email</label>
                  <input
                    type="email"
                    name="client_email"
                    defaultValue={enquiry.client_email || ""}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Assigned To</label>
                  <select
                    name="assigned_to"
                    defaultValue={enquiry.assigned_to || ""}
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

              <div className="grid gap-5 md:grid-cols-4">
                <div>
                  <label className="text-sm font-semibold">Proposal Status</label>
                  <input
                    name="proposal_status"
                    defaultValue={enquiry.proposal_status || ""}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Client Response</label>
                  <input
                    name="client_response_status"
                    defaultValue={enquiry.client_response_status || ""}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">PO Status</label>
                  <input
                    name="po_status"
                    defaultValue={enquiry.po_status || ""}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Next Follow Up</label>
                  <input
                    type="date"
                    name="next_follow_up_date"
                    defaultValue={enquiry.next_follow_up_date || ""}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Converted To Order</label>
                <select
                  name="converted_to_order"
                  defaultValue={enquiry.converted_to_order ? "true" : "false"}
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Remarks</label>
                <textarea
                  name="remarks"
                  rows={4}
                  defaultValue={enquiry.remarks || ""}
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