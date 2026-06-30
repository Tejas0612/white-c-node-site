"use client"

import { useState, useTransition } from "react"
import {
  updateWorkflowEnquiryRemark,
  updateWorkflowEnquiryTracking,
} from "./actions"

type EnquiryActionsProps = {
  enquiryId: string
  enquiryCode: string
  currentStatus: string
  currentRemark: string
  successProbability: number
  proposalStatus: string
  clientResponseStatus: string
  poStatus: string
  hasPhone: boolean
}

export function EnquiryActions({
  enquiryId,
  enquiryCode,
  currentStatus,
  currentRemark,
  successProbability,
  proposalStatus,
  clientResponseStatus,
  poStatus,
}: EnquiryActionsProps) {
  return (
    <div className="w-full space-y-2">
      <UpdateEnquiryTrackingButton
        enquiryId={enquiryId}
        enquiryCode={enquiryCode}
        currentStatus={currentStatus}
        successProbability={successProbability}
        proposalStatus={proposalStatus}
        clientResponseStatus={clientResponseStatus}
        poStatus={poStatus}
      />

      <UpdateEnquiryRemarkButton
        enquiryId={enquiryId}
        enquiryCode={enquiryCode}
        currentRemark={currentRemark}
      />
    </div>
  )
}

function UpdateEnquiryTrackingButton({
  enquiryId,
  enquiryCode,
  currentStatus,
  successProbability,
  proposalStatus,
  clientResponseStatus,
  poStatus,
}: {
  enquiryId: string
  enquiryCode: string
  currentStatus: string
  successProbability: number
  proposalStatus: string
  clientResponseStatus: string
  poStatus: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError("")

    startTransition(async () => {
      try {
        await updateWorkflowEnquiryTracking(formData)
        setIsOpen(false)
      } catch (trackingError: any) {
        setError(trackingError?.message || "Failed to update enquiry.")
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-10 w-full rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
      >
        Update Status
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">Update Enquiry</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reference: {enquiryCode}
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
              <input type="hidden" name="enquiry_id" value={enquiryId} />

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <select
                    name="status"
                    defaultValue={currentStatus || "New"}
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
                    defaultValue={successProbability || 10}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold">
                    Proposal Status
                  </label>
                  <select
                    name="proposal_status"
                    defaultValue={proposalStatus || "Draft Needed"}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="Draft Needed">Draft Needed</option>
                    <option value="Draft Ready">Draft Ready</option>
                    <option value="Sent">Sent</option>
                    <option value="Revision Needed">Revision Needed</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">
                    Client Response
                  </label>
                  <select
                    name="client_response_status"
                    defaultValue={clientResponseStatus || "No Response Yet"}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="No Response Yet">No Response Yet</option>
                    <option value="Interested">Interested</option>
                    <option value="Negotiating">Negotiating</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">PO Status</label>
                  <select
                    name="po_status"
                    defaultValue={poStatus || "Not Received"}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="Not Received">Not Received</option>
                    <option value="Expected">Expected</option>
                    <option value="Received">Received</option>
                    <option value="Not Required">Not Required</option>
                  </select>
                </div>
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
                  {isPending ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function UpdateEnquiryRemarkButton({
  enquiryId,
  enquiryCode,
  currentRemark,
}: {
  enquiryId: string
  enquiryCode: string
  currentRemark: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError("")

    startTransition(async () => {
      try {
        await updateWorkflowEnquiryRemark(formData)
        setIsOpen(false)
      } catch (remarkError: any) {
        setError(remarkError?.message || "Failed to update remark.")
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-10 w-full rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
      >
        Add Remark
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">Add Remark</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reference: {enquiryCode}
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
              <input type="hidden" name="enquiry_id" value={enquiryId} />

              <div>
                <label className="text-sm font-semibold">Remark</label>
                <textarea
                  name="remark"
                  rows={5}
                  required
                  defaultValue={currentRemark || ""}
                  placeholder="Add latest client update or internal note"
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
                  {isPending ? "Saving..." : "Save Remark"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}