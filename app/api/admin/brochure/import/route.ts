import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

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
  try {
    const { products } = await request.json()

    if (!Array.isArray(products) || products.length === 0) {
      return Response.json(
        { success: false, message: "No products provided." },
        { status: 400 }
      )
    }

    const rows = products.map((product) => {
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

    const { error } = await supabaseAdmin
      .from("products")
      .upsert(rows, {
        onConflict: "sku",
      })

    if (error) {
      return Response.json(
        { success: false, message: error.message },
        { status: 500 }
      )
    }

    for (let index = 0; index < products.length; index++) {
      const product = products[index]
      const sku = createBrochureSku(product)
      const imageUrl = cleanText(product.image_url)
      const imageFilename = cleanText(product.image_filename)
      const features = cleanFeatures(product.features)

      if (imageUrl) {
        await supabaseAdmin
          .from("product_images")
          .delete()
          .eq("product_sku", sku)
          .eq("sort_order", 1)

        await supabaseAdmin.from("product_images").insert({
          product_sku: sku,
          image_url: imageUrl,
          image_filename: imageFilename,
          image_type: "main",
          sort_order: 1,
        })
      }

      await supabaseAdmin
        .from("product_features")
        .delete()
        .eq("product_sku", sku)

      if (features.length > 0) {
        await supabaseAdmin.from("product_features").insert(
          features.map((feature, featureIndex) => ({
            product_sku: sku,
            feature_text: feature,
            sort_order: featureIndex + 1,
          }))
        )
      }
    }

    return Response.json({
      success: true,
      count: rows.length,
    })
  } catch (error: any) {
    console.error("Brochure import error:", error)

    return Response.json(
      {
        success: false,
        message:
          error?.message || "Something went wrong while importing products.",
      },
      { status: 500 }
    )
  }
}