"use server"

import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminUser } from "@/lib/admin-auth"

function generateOrderCode() {
  const randomPart = Math.random().toString(16).slice(2, 10).toUpperCase()
  return `ORD-${randomPart}`
}

export async function createWorkflowOrder(formData: FormData) {
  await requireAdminUser(["Operations", "Sales", "Accounts"])

  const clientName = String(formData.get("client_name") || "").trim()
  const productName = String(formData.get("product_name") || "").trim()
  const quantity = Number(String(formData.get("quantity") || "1").replace(/,/g, ""))
  const salePrice = Number(String(formData.get("sale_price") || "0").replace(/,/g, ""))
  const orderValueFromForm = Number(String(formData.get("order_value") || "0").replace(/,/g, ""))
  const orderDate = String(formData.get("order_date") || "").trim()
  const poUrl = String(formData.get("po_url") || "").trim()
  const remarks = String(formData.get("remarks") || "").trim()
  const status = String(formData.get("status") || "New").trim()

  if (!clientName) {
    throw new Error("Client name is required.")
  }

  if (!productName) {
    throw new Error("Product name is required.")
  }

  const cleanQuantity = quantity > 0 ? quantity : 1
  const cleanSalePrice = salePrice > 0 ? salePrice : 0

  const orderValue =
    orderValueFromForm > 0
      ? Number(orderValueFromForm.toFixed(2))
      : Number((cleanQuantity * cleanSalePrice).toFixed(2))

  const { error } = await supabaseAdmin.from("workflow_orders").insert({
    order_code: generateOrderCode(),
    client_name: clientName,
    product_name: productName,
    quantity: cleanQuantity,
    sale_price: salePrice || 0.0,
    order_value: orderValue || 0.0,
    order_date: orderDate || new Date().toISOString().slice(0, 10),
    po_url: poUrl || null,
    remarks: remarks || null,
    status: status || "New",
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/orders")
  revalidatePath("/admin/workflow")
}

export async function updateWorkflowOrderStatus({
  orderId,
  status,
}: {
  orderId: string
  status: string
}) {
  await requireAdminUser(["Operations", "Sales", "Accounts"])

  const cleanStatus = String(status || "").trim()

  if (!orderId) {
    throw new Error("Order ID is required.")
  }

  if (!cleanStatus) {
    throw new Error("Status is required.")
  }

  const { error } = await supabaseAdmin
    .from("workflow_orders")
    .update({
      status: cleanStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/orders")
  revalidatePath("/admin/workflow")
}

export async function updateWorkflowOrderRemark({
  orderId,
  remark,
  status,
}: {
  orderId: string
  remark: string
  status?: string
}) {
  await requireAdminUser(["Operations", "Sales", "Accounts"])

  const cleanRemark = String(remark || "").trim()
  const cleanStatus = String(status || "").trim()

  if (!orderId) {
    throw new Error("Order ID is required.")
  }

  if (!cleanRemark) {
    throw new Error("Remark is required.")
  }

  const updatePayload: Record<string, any> = {
    remarks: cleanRemark,
    updated_at: new Date().toISOString(),
  }

  if (cleanStatus) {
    updatePayload.status = cleanStatus
  }

  const { error } = await supabaseAdmin
    .from("workflow_orders")
    .update(updatePayload)
    .eq("id", orderId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/orders")
  revalidatePath("/admin/workflow")
}


export async function updateWorkflowOrderDetails(formData: FormData) {
  await requireAdminUser(["Admin", "Owner"])

  const orderId = String(formData.get("order_id") || "").trim()
  const clientName = String(formData.get("client_name") || "").trim()
  const productName = String(formData.get("product_name") || "").trim()
  const quantity = Number(String(formData.get("quantity") || "1").replace(/,/g, ""))
  const salePrice = Number(String(formData.get("sale_price") || "0").replace(/,/g, ""))
  const orderValueFromForm = Number(String(formData.get("order_value") || "0").replace(/,/g, ""))
  const orderDate = String(formData.get("order_date") || "").trim()
  const poUrl = String(formData.get("po_url") || "").trim()
  const status = String(formData.get("status") || "").trim()
  const remarks = String(formData.get("remarks") || "").trim()

  if (!orderId) {
    throw new Error("Order ID is required.")
  }

  if (!clientName) {
    throw new Error("Client name is required.")
  }

  if (!productName) {
    throw new Error("Product name is required.")
  }

  const cleanQuantity = quantity > 0 ? quantity : 1
  const cleanSalePrice = salePrice > 0 ? salePrice : 0
  const orderValue =
    orderValueFromForm > 0
      ? Number(orderValueFromForm.toFixed(2))
      : Number((cleanQuantity * cleanSalePrice).toFixed(2))

  const { error } = await supabaseAdmin
    .from("workflow_orders")
    .update({
      client_name: clientName,
      product_name: productName,
      quantity: cleanQuantity,
      sale_price: cleanSalePrice,
      order_value: orderValue,
      order_date: orderDate || null,
      po_url: poUrl || null,
      status: status || "New",
      remarks: remarks || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/workflow/orders")
  revalidatePath("/admin/workflow")
}