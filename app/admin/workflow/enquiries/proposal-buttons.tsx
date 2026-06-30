"use client"

import { useState, useTransition } from "react"

type ProposalButtonsProps = {
  enquiryId: string
  enquiryCode: string
  clientName: string | null
  productNames: string | null
  tentativeQuantity: number | null
  approxCost: number | null
  clientPhone: string | null
  clientEmail: string | null
  remarks: string | null
}

export function ProposalButtons({
  enquiryId,
  enquiryCode,
  clientName,
  productNames,
  tentativeQuantity,
  approxCost,
  clientPhone,
  clientEmail,
  remarks,
}: ProposalButtonsProps) {
  return (
    <div className="w-full space-y-2">
      <BuildAiQuotationButton
        enquiryCode={enquiryCode}
        clientName={clientName}
        productNames={productNames}
        tentativeQuantity={tentativeQuantity}
        approxCost={approxCost}
        clientEmail={clientEmail}
        remarks={remarks}
      />

      <SendProposalButton
        enquiryId={enquiryId}
        enquiryCode={enquiryCode}
        productNames={productNames}
        hasPhone={Boolean(clientPhone)}
      />
    </div>
  )
}

function BuildAiQuotationButton({
  enquiryCode,
  clientName,
  productNames,
  tentativeQuantity,
  approxCost,
  clientEmail,
  remarks,
}: {
  enquiryCode: string
  clientName: string | null
  productNames: string | null
  tentativeQuantity: number | null
  approxCost: number | null
  clientEmail: string | null
  remarks: string | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const prompt = `Create a professional White C corporate gifting proposal PPT quotation.

Client: ${clientName || "Client"}
Reference: ${enquiryCode}
Requirement: ${productNames || "Corporate gifting requirement"}
Quantity: ${tentativeQuantity || "As discussed"}
Approx Budget / Value: ${approxCost || "As discussed"}
Client Email: ${clientEmail || "Not provided"}
Internal Remarks: ${remarks || "None"}

PPT structure:
1. Cover slide with White C branding
2. Client requirement summary
3. Recommended gifting options
4. Custom branding / logo placement possibilities
5. Quantity and budget assumptions
6. Proposal / quotation summary
7. Next steps
8. Thank you slide

Tone:
Premium, simple, corporate, clean, Indian B2B gifting style.

Use White C as the company name.`

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-10 w-full rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
      >
        Build AI PPT Quotation
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">Build AI PPT Quotation</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Copy this prompt and use it to generate the proposal PPT.
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

            <div className="grid gap-5 p-6">
              <textarea
                value={prompt}
                readOnly
                rows={16}
                className="w-full rounded-xl border bg-muted/30 px-4 py-3 text-sm outline-none"
              />

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border px-5 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={copyPrompt}
                  className="rounded-xl bg-foreground px-5 py-2 text-sm font-semibold text-background"
                >
                  {copied ? "Copied" : "Copy Prompt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SendProposalButton({
  enquiryId,
  enquiryCode,
  productNames,
  hasPhone,
}: {
  enquiryId: string
  enquiryCode: string
  productNames: string | null
  hasPhone: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError("")
    setSuccess("")

    const requirement = String(formData.get("requirement") || "").trim()
    const estimatedValue = String(formData.get("estimated_value") || "").trim()
    const validTill = String(formData.get("valid_till") || "").trim()
    const customMessage = String(formData.get("custom_message") || "").trim()

    startTransition(async () => {
      try {
        const response = await fetch("/api/whatsapp/send-proposal-quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enquiryId,
            requirement,
            estimatedValue,
            validTill,
            customMessage,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to send proposal.")
        }

        setSuccess("Proposal sent")
        setIsOpen(false)
      } catch (proposalError: any) {
        setError(proposalError?.message || "Failed to send proposal.")
      }
    })
  }

  return (
    <>
      <button
        type="button"
        disabled={!hasPhone}
        onClick={() => setIsOpen(true)}
        className="h-10 w-full rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        Send Proposal
      </button>

      {success && <p className="text-xs font-medium text-green-600">{success}</p>}

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-6">
              <div>
                <h3 className="text-2xl font-bold">Send Proposal</h3>
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
              <div>
                <label className="text-sm font-semibold">Requirement</label>
                <input
                  name="requirement"
                  defaultValue={productNames || ""}
                  required
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">
                    Estimated Value
                  </label>
                  <input
                    name="estimated_value"
                    placeholder="Example: ₹50,000"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Valid Till</label>
                  <input
                    type="date"
                    name="valid_till"
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Custom Message</label>
                <textarea
                  name="custom_message"
                  rows={5}
                  required
                  placeholder="Please review the proposal and share your confirmation."
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
                  {isPending ? "Sending..." : "Send Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}