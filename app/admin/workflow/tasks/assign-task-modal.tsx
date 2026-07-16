"use client"

import { useRef, useState, useTransition } from "react"
import { createWorkflowTask } from "./actions"

export type TeamMemberOption = {
  id: string
  name: string
  role?: string | null
  whatsapp?: string | null
  is_active?: boolean
}

export type OrderOption = {
  id: string
  order_code: string
  client_name: string
}

export type EnquiryOption = {
  id: string
  enquiry_code: string
  client_name: string
}

type InitialRelation =
  | {
      type: "order"
      id: string
      code: string
      clientName: string
    }
  | {
      type: "enquiry"
      id: string
      code: string
      clientName: string
    }

type RelationType = "general" | "order" | "enquiry"

export function AssignTaskModal({
  teamMembers,
  orders = [],
  enquiries = [],
  initialRelation,
  buttonLabel = "+ Assign Task",
  buttonClassName =
    "rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background",
}: {
  teamMembers: TeamMemberOption[]
  orders?: OrderOption[]
  enquiries?: EnquiryOption[]
  initialRelation?: InitialRelation
  buttonLabel?: string
  buttonClassName?: string
}) {
  const defaultRelationType: RelationType = initialRelation
    ? initialRelation.type
    : "general"

  const [isOpen, setIsOpen] = useState(false)
  const [relationType, setRelationType] =
    useState<RelationType>(defaultRelationType)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const formRef = useRef<HTMLFormElement | null>(null)

  function closeModal() {
    formRef.current?.reset()
    setRelationType(defaultRelationType)
    setError("")
    setIsOpen(false)
  }

  function handleSubmit(formData: FormData) {
    setError("")

    startTransition(async () => {
      try {
        await createWorkflowTask(formData)
        closeModal()
      } catch (taskError: any) {
        setError(taskError?.message || "Failed to create task.")
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClassName}
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">Assign New Task</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a task and assign it to a team member.
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

            <form ref={formRef} action={handleSubmit} className="grid gap-5 p-6">
              {initialRelation ? (
                <>
                  <input
                    type="hidden"
                    name={
                      initialRelation.type === "order"
                        ? "order_id"
                        : "enquiry_id"
                    }
                    value={initialRelation.id}
                  />

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Related To
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {initialRelation.type === "order" ? "Order" : "Enquiry"}: {" "}
                      {initialRelation.code} — {initialRelation.clientName}
                    </p>
                  </div>
                </>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold">Related To</label>
                    <select
                      value={relationType}
                      onChange={(event) =>
                        setRelationType(event.target.value as RelationType)
                      }
                      className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                    >
                      <option value="general">General Task</option>
                      <option value="order">Order</option>
                      <option value="enquiry">Enquiry</option>
                    </select>
                  </div>

                  {relationType === "order" && (
                    <div key="order-relation">
                      <label className="text-sm font-semibold">Related Order</label>
                      <select
                        name="order_id"
                        required
                        defaultValue=""
                        className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                      >
                        <option value="" disabled>
                          Select an order
                        </option>
                        {orders.map((order) => (
                          <option key={order.id} value={order.id}>
                            {order.order_code} — {order.client_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {relationType === "enquiry" && (
                    <div key="enquiry-relation">
                      <label className="text-sm font-semibold">
                        Related Enquiry
                      </label>
                      <select
                        name="enquiry_id"
                        required
                        defaultValue=""
                        className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                      >
                        <option value="" disabled>
                          Select an enquiry
                        </option>
                        {enquiries.map((enquiry) => (
                          <option key={enquiry.id} value={enquiry.id}>
                            {enquiry.enquiry_code} — {enquiry.client_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-semibold">Task Title</label>
                <input
                  name="title"
                  placeholder="Example: Follow up with Nuvoco"
                  required
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold">Assignee</label>
                  <select
                    name="assignee_id"
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

                <div>
                  <label className="text-sm font-semibold">Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <select
                    name="status"
                    defaultValue="Open"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Description</label>
                <textarea
                  name="description"
                  placeholder="Add details, follow-up notes, vendor/client context, or delivery instruction."
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
                  onClick={closeModal}
                  className="rounded-xl border px-5 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-foreground px-5 py-2 text-sm font-semibold text-background disabled:opacity-60"
                >
                  {isPending ? "Saving..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}