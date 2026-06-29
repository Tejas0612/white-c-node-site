"use server"

import { revalidatePath } from "next/cache"
import { Resend } from "resend"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminUser } from "@/lib/admin-auth"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

function generateEnquiryCode() {
  const randomPart = Math.random().toString(16).slice(2, 10).toUpperCase()
  return `ENQ-${randomPart}`
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

async function sendEnquiryEmails({
  enquiryCode,
  clientName,
  clientEmail,
  clientPhone,
  productNames,
  tentativeQuantity,
  approxCost,
  remarks,
  proposalStatus,
  successProbability,
}: {
  enquiryCode: string
  clientName: string
  clientEmail: string | null
  clientPhone: string | null
  productNames: string | null
  tentativeQuantity: number | null
  approxCost: number
  remarks: string | null
  proposalStatus: string
  successProbability: number
}) {
  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    return
  }

  const adminEmail = process.env.INQUIRY_RECEIVER_EMAIL

  if (adminEmail) {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: adminEmail,
      subject: `New White C enquiry: ${clientName} (${enquiryCode})`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New enquiry received</h2>
          <p><strong>Enquiry Code:</strong> ${enquiryCode}</p>
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Phone:</strong> ${clientPhone || "-"}</p>
          <p><strong>Email:</strong> ${clientEmail || "-"}</p>
          <p><strong>Product(s):</strong> ${productNames || "-"}</p>
          <p><strong>Tentative Qty:</strong> ${tentativeQuantity || "-"}</p>
          <p><strong>Approx Value:</strong> ${formatCurrency(approxCost || 0)}</p>
          <p><strong>Proposal Status:</strong> ${proposalStatus}</p>
          <p><strong>Success Probability:</strong> ${successProbability}%</p>
          <p><strong>Remarks:</strong><br/>${remarks || "-"}</p>
          <hr/>
          <p>Please prepare proposal/PPT draft for approval before sharing with client.</p>
        </div>
      `,
    })
  }

  if (clientEmail) {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: clientEmail,
      subject: `We received your gifting enquiry - White C`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Hi ${clientName},</p>
          <p>Thank you for reaching out to White C.</p>
          <p>We have received your gifting enquiry and our team is reviewing the requirement.</p>
          <p>We will get back to you shortly with suitable options and next steps.</p>
          <p><strong>Reference:</strong> ${enquiryCode}</p>
          <p>Regards,<br/>White C Team</p>
        </div>
      `,
    })
  }
}

export async function createWorkflowEnquiry(formData: FormData) {
  await requireAdminUser(["Sales", "Operations"])

  const enquiryCode = generateEnquiryCode()

  const clientName = String(formData.get("client_name") || "").trim()
  const productNames = String(formData.get("product_names") || "").trim()
  const tentativeQuantity = Number(formData.get("tentative_quantity") || 0)
  const approxCost = Number(formData.get("approx_cost") || 0)
  const enquiryDate = String(formData.get("enquiry_date") || "").trim()
  const clientPhone = String(formData.get("client_phone") || "").trim()
  const clientEmail = String(formData.get("client_email") || "").trim()
  const status = String(formData.get("status") || "New").trim()
  const remarks = String(formData.get("remarks") || "").trim()
  const assignedTo = String(formData.get("assigned_to") || "").trim()
  const successProbability = Number(formData.get("success_probability") || 10)
  const proposalStatus = String(
    formData.get("proposal_status") || "Draft Needed"
  ).trim()
  const clientResponseStatus = String(
    formData.get("client_response_status") || "No Response Yet"
  ).trim()
  const poStatus = String(formData.get("po_status") || "Not Received").trim()
  const nextFollowUpDate = String(formData.get("next_follow_up_date") || "").trim()

  if (!clientName) {
    throw new Error("Client name is required.")
  }

  const { error } = await supabaseAdmin.from("workflow_enquiries").insert({
    enquiry_code: enquiryCode,
    client_name: clientName,
    product_names: productNames || null,
    tentative_quantity: tentativeQuantity || null,
    approx_cost: approxCost || 0,
    enquiry_date: enquiryDate || new Date().toISOString().slice(0, 10),
    client_phone: clientPhone || null,
    client_email: clientEmail || null,
    status: status || "New",
    remarks: remarks || null,
    source: "Admin",
    assigned_to: assignedTo || null,
    success_probability: successProbability,
    proposal_status: proposalStatus,
    client_response_status: clientResponseStatus,
    po_status: poStatus,
    converted_to_order: status === "Won",
    next_follow_up_date: nextFollowUpDate || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  try {
    await sendEnquiryEmails({
      enquiryCode,
      clientName,
      clientEmail: clientEmail || null,
      clientPhone: clientPhone || null,
      productNames: productNames || null,
      tentativeQuantity: tentativeQuantity || null,
      approxCost,
      remarks: remarks || null,
      proposalStatus,
      successProbability,
    })
  } catch (emailError) {
    console.error("Enquiry email failed:", emailError)
  }

  revalidatePath("/admin/workflow/enquiries")
  revalidatePath("/admin/workflow")
}

export async function updateWorkflowEnquiryRemark({
  enquiryId,
  remark,
  status,
  successProbability,
  proposalStatus,
  clientResponseStatus,
  poStatus,
}: {
  enquiryId: string
  remark: string
  status: string
  successProbability: number
  proposalStatus: string
  clientResponseStatus: string
  poStatus: string
}) {
  await requireAdminUser(["Sales", "Operations"])

  const cleanRemark = String(remark || "").trim()

  if (!enquiryId) {
    throw new Error("Enquiry ID is required.")
  }

  if (!cleanRemark) {
    throw new Error("Remark is required.")
  }

  const { error } = await supabaseAdmin
    .from("workflow_enquiries")
    .update({
      remarks: cleanRemark,
      status: status || "In Progress",
      success_probability: successProbability,
      proposal_status: proposalStatus || "Draft Needed",
      client_response_status: clientResponseStatus || "No Response Yet",
      po_status: poStatus || "Not Received",
      converted_to_order: status === "Won",
      last_client_interaction_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", enquiryId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/enquiries")
  revalidatePath("/admin/workflow")
}