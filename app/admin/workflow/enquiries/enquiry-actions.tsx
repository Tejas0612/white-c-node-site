"use client"

import { useState, useTransition } from "react"
import { updateWorkflowEnquiryRemark } from "./actions"

const enquiryStatuses = [
  "New",
  "In Progress",
  "Proposal Sent",
  "Follow Up",
  "Won",
  "Lost",
]

const proposalStatuses = [
  "Draft Needed",
  "Draft Ready",
  "Sent for Approval",
  "Approved",
  "Sent to Client",
]

const clientResponseStatuses = [
  "No Response Yet",
  "Interested",
  "Needs Revision",
  "Negotiating",
  "Confirmed",
  "Not Interested",
]

const poStatuses = [
  "Not Received",
  "Requested",
  "Received",
  "Payment Pending",
  "Payment Received",
]

export function EnquiryActions({
  enquiryId,
  enquiryCode,
  currentStatus,
  currentRemark,
  successProbability,
  proposalStatus,
  clientResponseStatus,
  poStatus,
  hasPhone,
}: {
  enquiryId: string
  enquiryCode: string
  currentStatus: string
  currentRemark: string
  successProbability: number
  proposalStatus: string
  clientResponseStatus: string
  poStatus: string
  hasPhone: boolean
}) {
  const [isRemarkOpen, setIsRemarkOpen] = useState(false)
  const [remark, setRemark] = useState(currentRemark || "")
  const [status, setStatus] = useState(currentStatus || "In Progress")
  const [probability, setProbability] = useState(successProbability || 10)
  const [proposal, setProposal] = useState(proposalStatus || "Draft Needed")
  const [clientResponse, setClientResponse] = useState(
    clientResponseStatus || "No Response Yet"
  )
  const [po, setPo] = useState(poStatus || "Not Received")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSendWhatsApp() {
    setError("")
    setSuccess("")

    startTransition(async () => {
      try {
        const response = await fetch("/api/whatsapp/send-enquiry-update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enquiryId,
          }),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to send WhatsApp update.")
        }

        setSuccess(result.to ? `Sent to ${result.to}` : "WhatsApp sent")
      } catch (sendError: any) {
        setError(sendError?.message || "Failed to send WhatsApp update.")
      }
    })
  }

  function handleSaveRemark() {
    setError("")
    setSuccess("")

    startTransition(async () => {
      try {
        await updateWorkflowEnquiryRemark({
          enquiryId,
          remark,
          status,
          successProbability: probability,
          proposalStatus: proposal,
          clientResponseStatus: clientResponse,
          poStatus: po,
        })

        setIsRemarkOpen(false)
        setSuccess("Remark saved")
      } catch (remarkError: any) {
        setError(remarkError?.message || "Failed to save remark.")
      }
    })
  }

  return (
    <>
      <div className="w-full max-w-[300px]">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={!hasPhone || isPending}
            className="h-9 rounded-xl border px-3 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            WhatsApp
          </button>

          <button
            type="button"
            onClick={() => setIsRemarkOpen(true)}
            className="h-9 rounded-xl border px-3 text-xs font-semibold hover:bg-muted"
          >
            Remark
          </button>
        </div>

        <div className="mt-2 min-h-[34px]">
          {success && (
            <p className="text-xs font-medium leading-4 text-green-600">
              {success}
            </p>
          )}

          {error && (
            <p className="text-xs font-medium leading-4 text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>

      {isRemarkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">Add Enquiry Remark</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update internal progress for {enquiryCode}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsRemarkOpen(false)}
                className="rounded-full border px-3 py-1 text-sm font-semibold hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-5 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    {enquiryStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">
                    Success Probability: {probability}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={probability}
                    onChange={(event) =>
                      setProbability(Number(event.target.value))
                    }
                    className="mt-4 w-full"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold">Proposal</label>
                  <select
                    value={proposal}
                    onChange={(event) => setProposal(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    {proposalStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">
                    Client Response
                  </label>
                  <select
                    value={clientResponse}
                    onChange={(event) => setClientResponse(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    {clientResponseStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">PO</label>
                  <select
                    value={po}
                    onChange={(event) => setPo(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    {poStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Remark</label>
                <textarea
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  rows={4}
                  placeholder="Example: Client asked for 500 premium bottles under ₹500."
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
                  onClick={() => setIsRemarkOpen(false)}
                  className="rounded-xl border px-5 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveRemark}
                  disabled={isPending}
                  className="rounded-xl bg-foreground px-5 py-2 text-sm font-semibold text-background disabled:opacity-60"
                >
                  {isPending ? "Saving..." : "Save Remark"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}