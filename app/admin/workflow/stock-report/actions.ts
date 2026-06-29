"use server"

import { revalidatePath } from "next/cache"
import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

function generateStockSku() {
  const randomPart = Math.random().toString(16).slice(2, 8).toUpperCase()
  return `STK-${randomPart}`
}

export async function createStockItem(formData: FormData) {
  await requireAdminUser(["Operations", "Accounts", "Catalog"])

  const brand = String(formData.get("brand") || "").trim()
  const item = String(formData.get("item") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const stockQty = Number(formData.get("stock_qty") || 0)
  const cost = Number(formData.get("cost") || 0)
  const notes = String(formData.get("notes") || "").trim()

  if (!item) {
    throw new Error("Item name is required.")
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .insert({
      sku: generateStockSku(),
      name: item,
      brand: brand || null,
      description: description || null,
      category: "Stock Inventory",
      budget_band: null,
      is_active: false,
      is_featured: false,
    })
    .select("id")
    .single()

  if (productError || !product) {
    throw new Error(productError?.message || "Failed to create product.")
  }

  const { error: stockError } = await supabaseAdmin
    .from("product_stock_reports")
    .insert({
      product_id: product.id,
      current_stock: stockQty || 0,
      cost_price: cost || 0,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })

  if (stockError) {
    throw new Error(stockError.message)
  }

  revalidatePath("/admin/workflow/stock-report")
  revalidatePath("/admin/products")
}

export async function updateStockItem(formData: FormData) {
  await requireAdminUser(["Operations", "Accounts", "Catalog"])

  const stockId = String(formData.get("stock_id") || "").trim()
  const productId = String(formData.get("product_id") || "").trim()
  const brand = String(formData.get("brand") || "").trim()
  const item = String(formData.get("item") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const stockQty = Number(formData.get("stock_qty") || 0)
  const cost = Number(formData.get("cost") || 0)
  const notes = String(formData.get("notes") || "").trim()

  if (!stockId) {
    throw new Error("Stock ID is required.")
  }

  if (!productId) {
    throw new Error("Product ID is required.")
  }

  if (!item) {
    throw new Error("Item name is required.")
  }

  const { error: productError } = await supabaseAdmin
    .from("products")
    .update({
      name: item,
      brand: brand || null,
      description: description || null,
    })
    .eq("id", productId)

  if (productError) {
    throw new Error(productError.message)
  }

  const { error: stockError } = await supabaseAdmin
    .from("product_stock_reports")
    .update({
      current_stock: stockQty || 0,
      cost_price: cost || 0,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stockId)

  if (stockError) {
    throw new Error(stockError.message)
  }

  revalidatePath("/admin/workflow/stock-report")
  revalidatePath("/admin/products")
}