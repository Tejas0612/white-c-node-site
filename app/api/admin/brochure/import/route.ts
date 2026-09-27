import { revalidateTag } from "next/cache"
import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_REQUEST_BYTES = 2_000_000
const MAX_PRODUCTS_PER_IMPORT = 200

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  })
}

function slugify(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function createBrochureSku(product: any) {
  return slugify(
    [
      product.brand,
      product.source_brochure,
      `p${String(product.source_page || "").padStart(3, "0")}`,
      String(product.source_position || "").padStart(2, "0"),
    ]
      .filter(Boolean)
      .join("-")
  )
}

function cleanText(value: unknown) {
  const text = String(value || "").trim()
  return text.length > 0 ? text : null
}

function cleanFeatures(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((feature) => String(feature || "").trim())
    .filter(Boolean)
    .slice(0, 8)
}

export async function POST(request: Request) {
  await requireAdminUser(["Owner", "Admin"])

  try {
    const contentLength = Number(request.headers.get("content-length") || 0)

    if (contentLength > MAX_REQUEST_BYTES) {
      return jsonResponse(
        {
          success: false,
          message: "Import request is too large.",
        },
        413
      )
    }

    let requestBody: unknown

    try {
      requestBody = await request.json()
    } catch {
      return jsonResponse(
        {
          success: false,
          message: "Invalid import request.",
        },
        400
      )
    }

    if (!requestBody || typeof requestBody !== "object") {
      return jsonResponse(
        {
          success: false,
          message: "Invalid import request.",
        },
        400
      )
    }

    const { products } = requestBody as { products?: unknown }

    if (!Array.isArray(products) || products.length === 0) {
      return jsonResponse(
        {
          success: false,
          message: "No products provided.",
        },
        400
      )
    }

    if (products.length > MAX_PRODUCTS_PER_IMPORT) {
      return jsonResponse(
        {
          success: false,
          message: `Import a maximum of ${MAX_PRODUCTS_PER_IMPORT} products at a time.`,
        },
        400
      )
    }

    const rows = products.map((product: any) => {
      const sku = createBrochureSku(product)

      return {
        sku,
        brand: cleanText(product.brand),
        name: String(product.name || "").trim(),
        category: String(product.category || "Others").trim(),
        budget_band: String(product.budget_band || "₹500–₹1000").trim(),
        occasion: cleanText(product.occasion),
        recipient_type: cleanText(product.recipient_type),
        use_case: cleanText(product.use_case),
        industry: cleanText(product.industry),
        material: cleanText(product.material),
        brandable_area: cleanText(product.brandable_area),
        packaging: cleanText(product.packaging),
        logistics_type: cleanText(product.logistics_type),
        delivery_window: cleanText(product.delivery_window),
        moq: cleanText(product.moq),
        lead_time: cleanText(product.lead_time),
        color_options: cleanText(product.color_options),
        tags: [
          product.tag_1,
          product.tag_2,
          product.tag_3,
          product.tag_4,
          product.tag_5,
        ]
          .map((tag) => String(tag || "").trim())
          .filter(Boolean)
          .join(", "),
        description: cleanText(product.description),
        image_url: cleanText(product.image_url),
        source_brochure: cleanText(product.source_brochure),
        source_page: cleanText(product.source_page),
        source_position: cleanText(product.source_position),
        image_filename: cleanText(product.image_filename),
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
      }
    })

    if (rows.some((row) => !row.sku || !row.name)) {
      return jsonResponse(
        {
          success: false,
          message: "Every product must have a valid name and brochure reference.",
        },
        400
      )
    }

    const { error } = await supabaseAdmin
      .from("products")
      .upsert(rows, {
        onConflict: "sku",
      })

    if (error) {
      console.error("Brochure product upsert failed:", error)

      return jsonResponse(
        {
          success: false,
          message: "Unable to import products right now.",
        },
        500
      )
    }

    for (let index = 0; index < products.length; index++) {
      const product = products[index] as any
      const sku = createBrochureSku(product)
      const imageUrl = cleanText(product.image_url)
      const imageFilename = cleanText(product.image_filename)
      const features = cleanFeatures(product.features)

      if (imageUrl) {
        const { error: deleteImageError } = await supabaseAdmin
          .from("product_images")
          .delete()
          .eq("product_sku", sku)
          .eq("sort_order", 1)

        if (deleteImageError) {
          console.error("Product image cleanup failed:", deleteImageError)
        }

        const { error: imageInsertError } = await supabaseAdmin
          .from("product_images")
          .insert({
            product_sku: sku,
            image_url: imageUrl,
            image_filename: imageFilename,
            image_type: "main",
            sort_order: 1,
          })

        if (imageInsertError) {
          console.error("Product image insert failed:", imageInsertError)
        }
      }

      const { error: deleteFeaturesError } = await supabaseAdmin
        .from("product_features")
        .delete()
        .eq("product_sku", sku)

      if (deleteFeaturesError) {
        console.error("Product feature cleanup failed:", deleteFeaturesError)
      }

      if (features.length > 0) {
        const { error: featureInsertError } = await supabaseAdmin
          .from("product_features")
          .insert(
            features.map((feature, featureIndex) => ({
              product_sku: sku,
              feature_text: feature,
              sort_order: featureIndex + 1,
            }))
          )

        if (featureInsertError) {
          console.error("Product feature insert failed:", featureInsertError)
        }
      }
    }

    revalidateTag("public-catalog", { expire: 0 })
    return jsonResponse({
      success: true,
      count: rows.length,
    })
  } catch (error) {
    console.error("Brochure import error:", error)

    return jsonResponse(
      {
        success: false,
        message: "Something went wrong while importing products.",
      },
      500
    )
  }
}