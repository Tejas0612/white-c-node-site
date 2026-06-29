"use server"

import { revalidatePath } from "next/cache"
import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

function generateStockSku() {
  const randomPart = Math.random().toString(16).slice(2, 8).toUpperCase()
  return `STK-${randomPart}`
}

function cleanText(value: unknown) {
  return String(value || "").trim()
}

function cleanNumber(value: unknown) {
  const cleaned = String(value || "")
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .trim()

  const numberValue = Number(cleaned)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .replace(/-/g, "")
}

function parseCsvLine(line: string) {
  const values: string[] = []
  let current = ""
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const nextChar = line[index + 1]

    if (char === '"' && nextChar === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      insideQuotes = !insideQuotes
      continue
    }

    if (char === "," && !insideQuotes) {
      values.push(current.trim())
      current = ""
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

function parseCsv(csvText: string) {
  const lines = csvText
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error("CSV should have a header row and at least one stock item.")
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader)

  const parsedRows: {
    brand: string
    item: string
    description: string
    stockQty: number
    cost: number
  }[] = []

  let currentBrand = ""
  const pendingRowsWithoutBrand: {
    brand: string
    item: string
    description: string
    stockQty: number
    cost: number
  }[] = []

  lines.slice(1).forEach((line) => {
    const values = parseCsvLine(line)
    const row: Record<string, string> = {}

    headers.forEach((header, index) => {
      row[header] = values[index] || ""
    })

    const brand = cleanText(row.brand)
    const item = cleanText(row.item || row.product || row.productname || row.name)
    const description = cleanText(row.description || row.desc)
    const stockQty = cleanNumber(row.stockqty || row.stock || row.quantity || row.qty)
    const cost = cleanNumber(row.cost || row.costprice || row.price)

    // If this row has only Brand and no Item, treat it as a brand heading.
    // Example:
    // Swayam | blank | blank | blank | blank
    if (brand && !item) {
      currentBrand = brand

      // Fix rare case where Google export places merged brand after first item row.
      if (pendingRowsWithoutBrand.length > 0) {
        pendingRowsWithoutBrand.forEach((pendingRow) => {
          parsedRows.push({
            ...pendingRow,
            brand: currentBrand,
          })
        })
        pendingRowsWithoutBrand.length = 0
      }

      return
    }

    // If row has Brand + Item, update current brand and use it.
    if (brand) {
      currentBrand = brand

      if (pendingRowsWithoutBrand.length > 0) {
        pendingRowsWithoutBrand.forEach((pendingRow) => {
          parsedRows.push({
            ...pendingRow,
            brand: currentBrand,
          })
        })
        pendingRowsWithoutBrand.length = 0
      }
    }

    if (!item) {
      return
    }

    const stockRow = {
      brand: brand || currentBrand,
      item,
      description,
      stockQty,
      cost,
    }

    // If the file starts with item rows before brand is detected,
    // hold them temporarily and assign the next brand.
    if (!stockRow.brand && parsedRows.length === 0 && !currentBrand) {
      pendingRowsWithoutBrand.push(stockRow)
      return
    }

    parsedRows.push(stockRow)
  })

  // If there were pending rows and no brand was ever found, keep them as blank brand.
  pendingRowsWithoutBrand.forEach((pendingRow) => {
    parsedRows.push(pendingRow)
  })

  return parsedRows
}

async function findExistingStockProduct({
  brand,
  item,
}: {
  brand: string
  item: string
}) {
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, name, brand")
    .eq("category", "Stock Inventory")

  const normalizedBrand = brand.trim().toLowerCase()
  const normalizedItem = item.trim().toLowerCase()

  const stockProducts = products || []

  const exactMatch = stockProducts.find((product: any) => {
    const productBrand = String(product.brand || "").trim().toLowerCase()
    const productName = String(product.name || "").trim().toLowerCase()

    return productBrand === normalizedBrand && productName === normalizedItem
  })

  if (exactMatch) {
    return exactMatch
  }

  // This fixes already-imported rows where brand was blank due to merged cells.
  const itemOnlyMatch = stockProducts.find((product: any) => {
    const productBrand = String(product.brand || "").trim()
    const productName = String(product.name || "").trim().toLowerCase()

    return productName === normalizedItem && !productBrand
  })

  if (itemOnlyMatch) {
    return itemOnlyMatch
  }

  return null
}

export async function createStockItem(formData: FormData) {
  await requireAdminUser(["Operations", "Accounts", "Catalog"])

  const brand = cleanText(formData.get("brand"))
  const item = cleanText(formData.get("item"))
  const description = cleanText(formData.get("description"))
  const stockQty = cleanNumber(formData.get("stock_qty"))
  const cost = cleanNumber(formData.get("cost"))
  const notes = cleanText(formData.get("notes"))

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
      budget_band: "Internal Stock",
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

  const stockId = cleanText(formData.get("stock_id"))
  const productId = cleanText(formData.get("product_id"))
  const brand = cleanText(formData.get("brand"))
  const item = cleanText(formData.get("item"))
  const description = cleanText(formData.get("description"))
  const stockQty = cleanNumber(formData.get("stock_qty"))
  const cost = cleanNumber(formData.get("cost"))
  const notes = cleanText(formData.get("notes"))

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

export async function importStockCsv(formData: FormData) {
  await requireAdminUser(["Operations", "Accounts", "Catalog"])

  const file = formData.get("csv_file")

  if (!(file instanceof File)) {
    throw new Error("Please upload a CSV file.")
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    throw new Error("Only CSV files are supported. Please save Excel as CSV first.")
  }

  const csvText = new TextDecoder().decode(await file.arrayBuffer())
  const rows = parseCsv(csvText).filter((row) => row.item)

  if (rows.length === 0) {
    throw new Error("No valid stock rows found in CSV.")
  }

  let createdCount = 0
  let updatedCount = 0

  for (const row of rows) {
    const existingProduct = await findExistingStockProduct({
      brand: row.brand,
      item: row.item,
    })

    let productId = existingProduct?.id

    if (productId) {
      const { error: productUpdateError } = await supabaseAdmin
        .from("products")
        .update({
          brand: row.brand || null,
          name: row.item,
          description: row.description || null,
        })
        .eq("id", productId)

      if (productUpdateError) {
        throw new Error(productUpdateError.message)
      }

      updatedCount += 1
    } else {
      const { data: product, error: productInsertError } = await supabaseAdmin
        .from("products")
        .insert({
          sku: generateStockSku(),
          name: row.item,
          brand: row.brand || null,
          description: row.description || null,
          category: "Stock Inventory",
          budget_band: "Internal Stock",
          is_active: false,
          is_featured: false,
        })
        .select("id")
        .single()

      if (productInsertError || !product) {
        throw new Error(productInsertError?.message || "Failed to create product.")
      }

      productId = product.id
      createdCount += 1
    }

    const { error: stockError } = await supabaseAdmin
      .from("product_stock_reports")
      .upsert(
        {
          product_id: productId,
          current_stock: row.stockQty || 0,
          cost_price: row.cost || 0,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "product_id",
        }
      )

    if (stockError) {
      throw new Error(stockError.message)
    }
  }

  revalidatePath("/admin/workflow/stock-report")
  revalidatePath("/admin/products")

  return {
    imported: rows.length,
    created: createdCount,
    updated: updatedCount,
  }
}