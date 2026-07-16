"use client"

import { useRef, useState, useTransition } from "react"
import { createWorkflowEnquiryWithOptionalTask } from "./create-enquiry-with-task"

type TeamMember = {
  id: string
  name: string
  role: string | null
  whatsapp: string | null
  is_active: boolean
}

export function CreateEnquiryModal({
  teamMembers,
}: {
  teamMembers: TeamMember[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [ownerId, setOwnerId] = useState("")
  const [createTask, setCreateTask] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const formRef = useRef<HTMLFormElement | null>(null)

  function closeModal() {
    formRef.current?.reset()
    setOwnerId("")
    setCreateTask(false)
    setError("")
    setIsOpen(false)
  }

  function handleOwnerChange(value: string) {
    setOwnerId(value)

    if (!value) {
      setCreateTask(false)
    }
  }

  function handleSubmit(formData: FormData) {
    setError("")

    startTransition(async () => {
      try {
        await createWorkflowEnquiryWithOptionalTask(formData)
        closeModal()
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
        className="rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background"
      >
        + New Enquiry
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border bg-background shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-background p-6">
              <div>
                <h3 className="text-2xl font-bold">New Enquiry</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a client enquiry, assign an owner, and optionally create a linked follow-up task.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border px-3 py-1 text-sm font-semibold hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <form ref={formRef} action={handleSubmit} className="grid gap-6 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Client Name</label>
                  <input
                    name="client_name"
                    required
                    placeholder="Example: Novoco"
                    className="mt-2 h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Enquiry Owner</label>
                  <select
                    name="assigned_to"
                    value={ownerId}
                    onChange={(event) => handleOwnerChange(event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}{member.role ? ` — ${member.role}` : ""}
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
                    className="mt-2 h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Client Email</label>
                  <input
                    type="email"
                    name="client_email"
                    placeholder="Example: purchase@company.com"
                    className="mt-2 h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Product / Requirement</label>
                <textarea
                  name="product_names"
                  required
                  rows={3}
                  placeholder="Example: Premium bottles under ₹500 for 500 employees"
                  className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold">Tentative Quantity</label>
                  <input
                    type="number"
                    min="1"
                    name="tentative_quantity"
                    defaultValue="1"
                    className="mt-2 h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Approx Value</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="approx_cost"
                    defaultValue="0"
                    className="mt-2 h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Enquiry Date</label>
                  <input
                    type="date"
                    name="enquiry_date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="mt-2 h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <select
                    name="status"
                    defaultValue="New"
                    className="mt-2 h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Quoted">Quoted</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Proposal Status</label>
                  <select
                    name="proposal_status"
                    defaultValue="Draft Needed"
                    className="mt-2 h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="Draft Needed">Draft Needed</option>
                    <option value="Draft Ready">Draft Ready</option>
                    <option value="Sent">Sent</option>
                    <option value="Revision Needed">Revision Needed</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Client Response</label>
                  <select
                    name="client_response_status"
                    defaultValue="No Response Yet"
                    className="mt-2 h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="No Response Yet">No Response Yet</option>
                    <option value="Interested">Interested</option>
                    <option value="Negotiating">Negotiating</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold">PO Status</label>
                  <select
                    name="po_status"
                    defaultValue="Not Received"
                    className="mt-2 h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="Not Received">Not Received</option>
                    <option value="Expected">Expected</option>
                    <option value="Received">Received</option>
                    <option value="Not Required">Not Required</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Success Probability</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="success_probability"
                    defaultValue="10"
                    className="mt-2 h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Next Follow-up</label>
                  <input
                    type="date"
                    name="next_follow_up_date"
                    className="mt-2 h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Remarks</label>
                <textarea
                  name="remarks"
                  rows={3}
                  placeholder="Add any client context or internal notes."
                  className="mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              <label
                className={`flex items-start gap-3 rounded-2xl border p-4 ${
                  ownerId ? "cursor-pointer bg-amber-50/60" : "cursor-not-allowed bg-muted/30 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  name="create_follow_up_task"
                  value="yes"
                  checked={createTask}
                  disabled={!ownerId}
                  onChange={(event) => setCreateTask(event.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-bold">
                    Create a linked follow-up task for this owner
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Optional. The task will use the Next Follow-up date and will appear inside this enquiry.
                  </span>
                </span>
              </label>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-background py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
                >
                  {isPending ? "Creating..." : createTask ? "Create Enquiry + Task" : "Create Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}