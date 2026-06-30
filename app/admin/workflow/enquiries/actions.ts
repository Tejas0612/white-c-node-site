"use server"

import { revalidatePath } from "next/cache"
import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

function generateEnquiryCode() {
  const randomPart = Math.random().toString(16).slice(2, 10).toUpperCase()
  return `ENQ-${randomPart}`
}

function cleanText(value: FormDataEntryValue | string | null) {
  return String(value || "").trim()
}

function cleanNumber(value: FormDataEntryValue | string | null) {
  const cleaned = String(value || "")
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .trim()

  const numberValue = Number(cleaned)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function cleanPhone(phone: string) {
  return String(phone || "").replace(/[^\d]/g, "")
}

function cleanTemplateText(value: string) {
  return String(value || "")
    .replace(/[\n\r\t]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function getWhatsAppConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0"
  const templateName = process.env.WHATSAPP_ENQUIRY_TEMPLATE_NAME
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US"

  if (!phoneNumberId || !accessToken || !templateName) {
    return null
  }

  return {
    phoneNumberId,
    accessToken,
    apiVersion,
    templateName,
    languageCode,
  }
}

async function sendAutomaticEnquiryWhatsApp({
  enquiryId,
  enquiryCode,
  clientName,
  clientPhone,
  productNames,
}: {
  enquiryId: string
  enquiryCode: string
  clientName: string
  clientPhone: string
  productNames: string
}) {
  const config = getWhatsAppConfig()

  if (!config) {
    return
  }

  const toPhone = cleanPhone(clientPhone)

  if (!toPhone) {
    return
  }

  const finalClientName = cleanTemplateText(clientName || "there")
  const finalProductNames = cleanTemplateText(productNames || "your requirement")
  const finalEnquiryCode = cleanTemplateText(enquiryCode)

  const messageText = `Hi ${finalClientName}, this is White C.

We have received your gifting enquiry for ${finalProductNames}.

Our team is reviewing it and will get back to you shortly.

Reference: ${finalEnquiryCode}`

  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`

  const payload = {
    messaging_product: "whatsapp",
    to: toPhone,
    type: "template",
    template: {
      name: config.templateName,
      language: {
        code: config.languageCode,
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: finalClientName,
            },
            {
              type: "text",
              text: finalProductNames,
            },
            {
              type: "text",
              text: finalEnquiryCode,
            },
          ],
        },
      ],
    },
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const responseJson = await response.json()

  await supabaseAdmin.from("whatsapp_outbound_messages").insert({
    enquiry_id: enquiryId,
    to_phone: toPhone,
    message_type: "automatic_enquiry_received",
    message_text: messageText,
    whatsapp_message_id: responseJson?.messages?.[0]?.id || null,
    send_status: response.ok ? "Sent" : "Failed",
    error_message: response.ok ? null : JSON.stringify(responseJson),
    raw_response: responseJson,
  })
}

export async function createWorkflowEnquiry(formData: FormData) {
  await requireAdminUser(["Admin", "Owner", "Sales", "Operations"])

  const clientName = cleanText(formData.get("client_name"))
  const productNames = cleanText(formData.get("product_names"))
  const tentativeQuantity = cleanNumber(formData.get("tentative_quantity"))
  const approxCost = cleanNumber(formData.get("approx_cost"))
  const enquiryDate = cleanText(formData.get("enquiry_date"))
  const clientPhone = cleanText(formData.get("client_phone"))
  const clientEmail = cleanText(formData.get("client_email"))
  const status = cleanText(formData.get("status")) || "New"
  const remarks = cleanText(formData.get("remarks"))
  const assignedTo = cleanText(formData.get("assigned_to"))
  const successProbability =
    cleanNumber(formData.get("success_probability")) || 10
  const proposalStatus =
    cleanText(formData.get("proposal_status")) || "Draft Needed"
  const clientResponseStatus =
    cleanText(formData.get("client_response_status")) || "No Response Yet"
  const poStatus = cleanText(formData.get("po_status")) || "Not Received"
  const convertedToOrder =
    String(formData.get("converted_to_order") || "false") === "true"
  const nextFollowUpDate = cleanText(formData.get("next_follow_up_date"))

  if (!clientName) {
    throw new Error("Client name is required.")
  }

  const { data: createdEnquiry, error } = await supabaseAdmin
    .from("workflow_enquiries")
    .insert({
      enquiry_code: generateEnquiryCode(),
      client_name: clientName,
      product_names: productNames || null,
      tentative_quantity: tentativeQuantity || null,
      approx_cost: approxCost || null,
      enquiry_date: enquiryDate || new Date().toISOString().slice(0, 10),
      client_phone: clientPhone || null,
      client_email: clientEmail || null,
      status,
      remarks: remarks || null,
      source: "Admin",
      assigned_to: assignedTo || null,
      success_probability: successProbability,
      proposal_status: proposalStatus,
      client_response_status: clientResponseStatus,
      po_status: poStatus,
      converted_to_order: convertedToOrder,
      next_follow_up_date: nextFollowUpDate || null,
    })
    .select("id, enquiry_code, client_name, client_phone, product_names")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (createdEnquiry?.client_phone) {
    try {
      await sendAutomaticEnquiryWhatsApp({
        enquiryId: createdEnquiry.id,
        enquiryCode: createdEnquiry.enquiry_code,
        clientName: createdEnquiry.client_name || "there",
        clientPhone: createdEnquiry.client_phone,
        productNames: createdEnquiry.product_names || "your requirement",
      })
    } catch (whatsappError) {
      console.error("Automatic enquiry WhatsApp failed:", whatsappError)
    }
  }

  revalidatePath("/admin/workflow/enquiries")
  revalidatePath("/admin/workflow")
}

export async function updateWorkflowEnquiryTracking(formData: FormData) {
  await requireAdminUser(["Admin", "Owner", "Sales", "Operations"])

  const enquiryId = cleanText(formData.get("enquiry_id"))
  const status = cleanText(formData.get("status")) || "New"
  const successProbability =
    cleanNumber(formData.get("success_probability")) || 0
  const proposalStatus = cleanText(formData.get("proposal_status"))
  const clientResponseStatus = cleanText(formData.get("client_response_status"))
  const poStatus = cleanText(formData.get("po_status"))

  if (!enquiryId) {
    throw new Error("Enquiry ID is required.")
  }

  const { error } = await supabaseAdmin
    .from("workflow_enquiries")
    .update({
      status,
      success_probability: successProbability,
      proposal_status: proposalStatus || null,
      client_response_status: clientResponseStatus || null,
      po_status: poStatus || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enquiryId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/enquiries")
  revalidatePath("/admin/workflow")
}

export async function updateWorkflowEnquiryRemark(formData: FormData) {
  await requireAdminUser(["Admin", "Owner", "Sales", "Operations"])

  const enquiryId = cleanText(formData.get("enquiry_id"))
  const remark = cleanText(formData.get("remark"))

  if (!enquiryId) {
    throw new Error("Enquiry ID is required.")
  }

  if (!remark) {
    throw new Error("Remark is required.")
  }

  const { error } = await supabaseAdmin
    .from("workflow_enquiries")
    .update({
      remarks: remark,
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

export async function updateWorkflowEnquiryDetails(formData: FormData) {
  await requireAdminUser(["Admin", "Owner"])

  const enquiryId = cleanText(formData.get("enquiry_id"))
  const clientName = cleanText(formData.get("client_name"))
  const productNames = cleanText(formData.get("product_names"))
  const tentativeQuantity = cleanNumber(formData.get("tentative_quantity"))
  const approxCost = cleanNumber(formData.get("approx_cost"))
  const clientPhone = cleanText(formData.get("client_phone"))
  const clientEmail = cleanText(formData.get("client_email"))
  const status = cleanText(formData.get("status")) || "New"
  const remarks = cleanText(formData.get("remarks"))
  const assignedTo = cleanText(formData.get("assigned_to"))
  const successProbability =
    cleanNumber(formData.get("success_probability")) || 0
  const proposalStatus = cleanText(formData.get("proposal_status"))
  const clientResponseStatus = cleanText(formData.get("client_response_status"))
  const poStatus = cleanText(formData.get("po_status"))
  const convertedToOrder =
    String(formData.get("converted_to_order") || "false") === "true"
  const nextFollowUpDate = cleanText(formData.get("next_follow_up_date"))

  if (!enquiryId) {
    throw new Error("Enquiry ID is required.")
  }

  if (!clientName) {
    throw new Error("Client name is required.")
  }

  const { error } = await supabaseAdmin
    .from("workflow_enquiries")
    .update({
      client_name: clientName,
      product_names: productNames || null,
      tentative_quantity: tentativeQuantity || null,
      approx_cost: approxCost || null,
      client_phone: clientPhone || null,
      client_email: clientEmail || null,
      status,
      remarks: remarks || null,
      assigned_to: assignedTo || null,
      success_probability: successProbability || null,
      proposal_status: proposalStatus || null,
      client_response_status: clientResponseStatus || null,
      po_status: poStatus || null,
      converted_to_order: convertedToOrder,
      next_follow_up_date: nextFollowUpDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enquiryId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/enquiries")
  revalidatePath("/admin/workflow")
}