"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

type ProductInput = {
  sku?: unknown
  name?: unknown
  category?: unknown
  budget_band?: unknown
  occasion?: unknown
  recipient_type?: unknown
  material?: unknown
  moq?: unknown
  branding_available?: unknown
  lead_time?: unknown
  description?: unknown
  image_url?: unknown
  is_active?: unknown
  is_featured?: unknown
}

function cleanText(value: unknown) {
  const text = String(value ?? "").trim()
  return text.length > 0 ? text : null
}

function cleanBoolean(value: unknown, defaultValue: boolean) {
  return typeof value === "boolean" ? value : defaultValue
}

function normalizeProductInput(input: ProductInput) {
  return {
    sku: cleanText(input.sku),
    name: cleanText(input.name),
    category: cleanText(input.category),
    budget_band: cleanText(input.budget_band),
    occasion: cleanText(input.occasion),
    recipient_type: cleanText(input.recipient_type),
    material: cleanText(input.material),
    moq: cleanText(input.moq),
    brandable_area: cleanText(input.branding_available),
    lead_time: cleanText(input.lead_time),
    description: cleanText(input.description),
    image_url: cleanText(input.image_url),
    is_active: cleanBoolean(input.is_active, true),
    is_featured: cleanBoolean(input.is_featured, false),
  }
}

function validateProduct(
  product: ReturnType<typeof normalizeProductInput>
) {
  if (!product.sku) return "SKU is required."
  if (!product.name) return "Product name is required."
  if (!product.category) return "Category is required."
  if (!product.budget_band) return "Budget band is required."

  if (product.sku.length > 150) return "SKU is too long."
  if (product.name.length > 250) return "Product name is too long."

  return null
}

function revalidateProductPages(sku?: string | null) {
  revalidatePath("/admin/products")
  revalidateTag("public-catalog", { expire: 0 })
  revalidatePath("/catalog")

  if (sku) {
    revalidatePath(`/catalog/${sku}`)
  }
}

export async function getProductForEdit(productId: string) {
  await requireAdminUser(["Owner", "Admin"])

  const cleanProductId = String(productId || "").trim()

  if (!cleanProductId) {
    return {
      success: false as const,
      message: "Product ID is required.",
      product: null,
    }
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      `
      id,
      sku,
      name,
      category,
      budget_band,
      occasion,
      recipient_type,
      material,
      moq,
      brandable_area,
      lead_time,
      description,
      image_url,
      is_active,
      is_featured
    `
    )
    .eq("id", cleanProductId)
    .single()

  if (error || !data) {
    console.error("Product edit lookup failed:", error)

    return {
      success: false as const,
      message: "Unable to load this product.",
      product: null,
    }
  }

  return {
    success: true as const,
    message: "",
    product: {
      ...data,
      branding_available: data.brandable_area,
    },
  }
}

export async function createProduct(input: ProductInput) {
  await requireAdminUser(["Owner", "Admin"])

  const product = normalizeProductInput(input)
  const validationError = validateProduct(product)

  if (validationError) {
    return {
      success: false as const,
      message: validationError,
    }
  }

  const { error } = await supabaseAdmin.from("products").insert(product)

  if (error) {
    console.error("Product creation failed:", error)

    return {
      success: false as const,
      message:
        error.code === "23505"
          ? "A product with this SKU already exists."
          : "Unable to create the product right now.",
    }
  }

  revalidateProductPages(product.sku)

  return {
    success: true as const,
    message: "Product created successfully.",
  }
}

export async function updateProduct(
  productId: string,
  input: ProductInput
) {
  await requireAdminUser(["Owner", "Admin"])

  const cleanProductId = String(productId || "").trim()

  if (!cleanProductId) {
    return {
      success: false as const,
      message: "Product ID is required.",
    }
  }

  const product = normalizeProductInput(input)
  const validationError = validateProduct(product)

  if (validationError) {
    return {
      success: false as const,
      message: validationError,
    }
  }

  const { data: existingProduct } = await supabaseAdmin
    .from("products")
    .select("sku")
    .eq("id", cleanProductId)
    .single()

  const { error } = await supabaseAdmin
    .from("products")
    .update(product)
    .eq("id", cleanProductId)

  if (error) {
    console.error("Product update failed:", error)

    return {
      success: false as const,
      message:
        error.code === "23505"
          ? "A product with this SKU already exists."
          : "Unable to update the product right now.",
    }
  }

  revalidateProductPages(existingProduct?.sku)
  revalidateProductPages(product.sku)

  return {
    success: true as const,
    message: "Product updated successfully.",
  }
}

export async function deleteProduct(productId: string) {
  await requireAdminUser(["Owner", "Admin"])

  const cleanProductId = String(productId || "").trim()

  if (!cleanProductId) {
    return {
      success: false as const,
      message: "Product ID is required.",
    }
  }

  const { data: existingProduct } = await supabaseAdmin
    .from("products")
    .select("sku")
    .eq("id", cleanProductId)
    .single()

  const { error } = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", cleanProductId)

  if (error) {
    console.error("Product deletion failed:", error)

    return {
      success: false as const,
      message: "Unable to delete the product right now.",
    }
  }

  revalidateProductPages(existingProduct?.sku)

  return {
    success: true as const,
    message: "Product deleted successfully.",
  }
}