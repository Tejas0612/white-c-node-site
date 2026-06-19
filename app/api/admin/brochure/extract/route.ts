import fs from "fs/promises"
import os from "os"
import path from "path"
import { execFile } from "child_process"
import { promisify } from "util"
import sharp from "sharp"
import OpenAI from "openai"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"
export const maxDuration = 120

const execFileAsync = promisify(execFile)

type CropBox = {
  x: number
  y: number
  width: number
  height: number
}

type AiExtractedProduct = {
  name?: string
  category?: string
  budget_band?: string
  occasion?: string
  recipient_type?: string
  use_case?: string
  industry?: string
  material?: string | null
  brandable_area?: string | null
  packaging?: string | null
  logistics_type?: string | null
  delivery_window?: string | null
  moq?: string | null
  lead_time?: string | null
  color_options?: string | null
  tag_1?: string
  tag_2?: string | null
  tag_3?: string | null
  tag_4?: string | null
  tag_5?: string | null
  description?: string
  crop_box?: CropBox | null
}

type ExtractedProduct = {
  brand: string
  name: string
  category: string
  budget_band: string
  occasion: string
  recipient_type: string
  use_case: string
  industry: string
  material: string | null
  brandable_area: string | null
  packaging: string | null
  logistics_type: string | null
  delivery_window: string | null
  moq: string | null
  lead_time: string | null
  color_options: string | null
  tag_1: string
  tag_2: string | null
  tag_3: string | null
  tag_4: string | null
  tag_5: string | null
  description: string
  image_url: string | null
  image_filename: string | null
  source_brochure: string
  source_page: string
  source_position: string
  is_active: boolean
  is_featured: boolean
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function slugify(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function cleanJsonText(value: string) {
  return String(value || "")
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim()
}

function normalizeCropBox(cropBox: CropBox | null | undefined): CropBox | null {
  if (!cropBox) return null

  const x = Number(cropBox.x)
  const y = Number(cropBox.y)
  const width = Number(cropBox.width)
  const height = Number(cropBox.height)

  if (
    Number.isNaN(x) ||
    Number.isNaN(y) ||
    Number.isNaN(width) ||
    Number.isNaN(height)
  ) {
    return null
  }

  if (width <= 8 || height <= 8) {
    return null
  }

  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
    width: Math.max(8, Math.min(100, width)),
    height: Math.max(8, Math.min(100, height)),
  }
}

function isBadCrop(cropBox: CropBox | null) {
  if (!cropBox) return true

  const area = cropBox.width * cropBox.height

  const looksLikeFullPage =
    cropBox.x <= 8 &&
    cropBox.y <= 8 &&
    cropBox.width >= 75 &&
    cropBox.height >= 65

  const tooTiny = area < 500
  const tooLarge = area > 4200

  return looksLikeFullPage || tooTiny || tooLarge
}

function getFallbackCropProfile(brand: string, brochureName: string): CropBox {
  const key = `${brand} ${brochureName}`.toLowerCase()

  if (key.includes("fuzo")) {
    return {
      x: 23,
      y: 2,
      width: 48,
      height: 38,
    }
  }

  return {
    x: 15,
    y: 0,
    width: 70,
    height: 48,
  }
}

function normalizeProduct(
  product: AiExtractedProduct,
  brand: string,
  brochureName: string,
  page: number,
  position: number,
  imageUrl: string | null,
  imageFilename: string | null
): ExtractedProduct {
  return {
    brand,
    name: String(product.name || `Product ${page}-${position}`).trim(),
    category: String(product.category || "Others").trim(),
    budget_band: String(product.budget_band || "₹500–₹1000").trim(),
    occasion: String(product.occasion || "Corporate gifting").trim(),
    recipient_type: String(product.recipient_type || "Employees").trim(),
    use_case: String(product.use_case || "Employee gifting").trim(),
    industry: String(product.industry || "Others").trim(),
    material: product.material || null,
    brandable_area: product.brandable_area || null,
    packaging: product.packaging || null,
    logistics_type: product.logistics_type || null,
    delivery_window: product.delivery_window || null,
    moq: product.moq || null,
    lead_time: product.lead_time || null,
    color_options: product.color_options || null,
    tag_1: String(product.tag_1 || "Corporate gifting").trim(),
    tag_2: product.tag_2 || "Premium",
    tag_3: product.tag_3 || null,
    tag_4: product.tag_4 || null,
    tag_5: product.tag_5 || null,
    description: String(
      product.description ||
        "Corporate gifting product suitable for employee and client gifting."
    ).trim(),
    image_url: imageUrl,
    image_filename: imageFilename,
    source_brochure: brochureName,
    source_page: String(page),
    source_position: String(position),
    is_active: true,
    is_featured: false,
  }
}

async function convertPdfPageToImage(
  pdfBuffer: Buffer,
  page: number,
  tempDir: string
) {
  const pdfPath = path.join(tempDir, "brochure.pdf")
  await fs.writeFile(pdfPath, pdfBuffer)

  const outputPrefix = path.join(tempDir, `page-${page}`)

  const possiblePaths = [
    "/opt/homebrew/bin/pdftocairo",
    "/usr/local/bin/pdftocairo",
    "pdftocairo",
  ]

  let lastError: unknown = null

  for (const binaryPath of possiblePaths) {
    try {
      console.log("Trying pdftocairo binary:", binaryPath)

      await execFileAsync(binaryPath, [
        "-jpeg",
        "-f",
        String(page),
        "-l",
        String(page),
        "-singlefile",
        "-scale-to",
        "1600",
        pdfPath,
        outputPrefix,
      ])

      const imagePath = `${outputPrefix}.jpg`
      console.log("PDF converted image path:", imagePath)

      return imagePath
    } catch (error) {
      lastError = error
      console.log("pdftocairo failed for:", binaryPath)
    }
  }

  console.error("PDF conversion failed:", lastError)

  throw new Error(
    "PDF conversion failed. Install Poppler using Homebrew, then restart server."
  )
}

async function getExistingCropProfile(
  brand: string,
  brochureName: string,
  layoutKey: string
): Promise<CropBox | null> {
  const { data, error } = await supabaseAdmin
    .from("brochure_crop_profiles")
    .select("crop_x, crop_y, crop_width, crop_height")
    .eq("brand", brand)
    .eq("brochure_name", brochureName)
    .eq("layout_key", layoutKey)
    .maybeSingle()

  if (error) {
    console.log("Crop profile lookup error:", error.message)
    return null
  }

  if (!data) return null

  return {
    x: Number(data.crop_x),
    y: Number(data.crop_y),
    width: Number(data.crop_width),
    height: Number(data.crop_height),
  }
}

async function saveCropProfile(
  brand: string,
  brochureName: string,
  layoutKey: string,
  cropBox: CropBox
) {
  const { error } = await supabaseAdmin
    .from("brochure_crop_profiles")
    .upsert(
      {
        brand,
        brochure_name: brochureName,
        layout_key: layoutKey,
        crop_x: cropBox.x,
        crop_y: cropBox.y,
        crop_width: cropBox.width,
        crop_height: cropBox.height,
        confidence: 0.85,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "brand,brochure_name,layout_key",
      }
    )

  if (error) {
    console.log("Crop profile save error:", error.message)
  }
}

async function cropProductImage(imagePath: string, cropBox: CropBox) {
  const image = sharp(imagePath)
  const metadata = await image.metadata()

  const imageWidth = metadata.width || 0
  const imageHeight = metadata.height || 0

  if (!imageWidth || !imageHeight) {
    return sharp(imagePath).jpeg({ quality: 92 }).toBuffer()
  }

  console.log("Final crop box used:", cropBox)

  const paddingPercent = 2

  const paddedX = Math.max(0, cropBox.x - paddingPercent)
  const paddedY = Math.max(0, cropBox.y - paddingPercent)
  const paddedWidth = Math.min(100 - paddedX, cropBox.width + paddingPercent * 2)
  const paddedHeight = Math.min(100 - paddedY, cropBox.height + paddingPercent * 2)

  const left = Math.round((paddedX / 100) * imageWidth)
  const top = Math.round((paddedY / 100) * imageHeight)
  const width = Math.round((paddedWidth / 100) * imageWidth)
  const height = Math.round((paddedHeight / 100) * imageHeight)

  return sharp(imagePath)
    .extract({
      left,
      top,
      width: Math.min(width, imageWidth - left),
      height: Math.min(height, imageHeight - top),
    })
    .resize({
      width: 900,
      withoutEnlargement: true,
    })
    .jpeg({ quality: 92 })
    .toBuffer()
}

async function uploadProductImageToSupabase(
  imageBuffer: Buffer,
  brochureName: string,
  page: number,
  position: number,
  productName: string
) {
  const uniqueRunId = Date.now()

  const imageFilename = `${slugify(brochureName)}-p${String(page).padStart(
    3,
    "0"
  )}-${String(position).padStart(2, "0")}-${slugify(
    productName
  )}-${uniqueRunId}.jpg`

  const storagePath = `brochures/${slugify(brochureName)}/${imageFilename}`

  console.log("Trying to upload cropped product image:", storagePath)
  console.log("Image buffer size:", imageBuffer.length)

  const { error } = await supabaseAdmin.storage
    .from("product-images")
    .upload(storagePath, imageBuffer, {
      contentType: "image/jpeg",
      upsert: true,
      cacheControl: "0",
    })

  if (error) {
    console.log("Supabase upload error:", error)
    throw new Error(error.message)
  }

  const { data } = supabaseAdmin.storage
    .from("product-images")
    .getPublicUrl(storagePath)

  const publicUrlWithCacheBust = `${data.publicUrl}?v=${uniqueRunId}`

  console.log("Public image URL:", publicUrlWithCacheBust)

  return {
    imageUrl: publicUrlWithCacheBust,
    imageFilename,
  }
}

async function extractProductsFromImage(
  imagePath: string,
  brand: string,
  brochureName: string,
  page: number,
  shouldAskForCrop: boolean
) {
  const imageBuffer = await fs.readFile(imagePath)
  const base64Image = imageBuffer.toString("base64")

  const cropInstruction = shouldAskForCrop
    ? `
Also return crop_box for the main product photo area.
crop_box must use percentage coordinates from 0 to 100 relative to the full page.
Do not include footer, page title, body text, logo, or page number.
`
    : `
Do not return crop_box. The system already has a crop profile.
`

  const prompt = `
You are extracting product data from a corporate gifting brochure page image.

Brand: ${brand}
Brochure: ${brochureName}
Page number: ${page}

Extract ONLY products visible on this page.

Return ONLY valid JSON array. No markdown. No explanation.

If there is one product on the page, return one object.
If there are multiple products on the page, return multiple objects in top-to-bottom / left-to-right order.

${cropInstruction}

Use this exact JSON shape:
[
  {
    "name": "",
    "category": "",
    "budget_band": "",
    "occasion": "",
    "recipient_type": "",
    "use_case": "",
    "industry": "",
    "material": null,
    "brandable_area": null,
    "packaging": null,
    "logistics_type": null,
    "delivery_window": null,
    "moq": null,
    "lead_time": null,
    "color_options": null,
    "tag_1": "",
    "tag_2": "",
    "tag_3": null,
    "tag_4": null,
    "tag_5": null,
    "description": "",
    "crop_box": {
      "x": 23,
      "y": 2,
      "width": 48,
      "height": 38
    }
  }
]

Rules:
- Do not invent product names if the page clearly shows a product title.
- Use the visible product title from the page.
- Do not return actual prices.
- If exact budget is not visible, infer a broad corporate gifting budget band.
- category must be one of: Drinkware, Tech Accessories, Desk Accessories, Bags, Home & Living, Wellness, Stationery, Others.
- budget_band must be one of: Under ₹250, ₹250–₹500, ₹500–₹1000, ₹1000+.
- occasion must be one of: Employee onboarding, Diwali gifting, Client appreciation, Event giveaway, Corporate gifting.
- recipient_type must be one of: Employees, Clients, Leadership, Sales team, Ground staff, Others.
- use_case must be one of: Employee gifting, Client gifting, Bulk gifting, Premium gifting, Event gifting.
- industry must be one of: IT, BFSI, Pharma, Manufacturing, Real Estate, Education, Others.
`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
  })

  const text = completion.choices[0]?.message?.content || "[]"

  return JSON.parse(cleanJsonText(text)) as AiExtractedProduct[]
}

export async function POST(request: Request) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "brochure-import-"))

  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          success: false,
          message: "OPENAI_API_KEY is missing in .env.local.",
        },
        { status: 500 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json(
        {
          success: false,
          message: "SUPABASE_SERVICE_ROLE_KEY is missing in .env.local.",
        },
        { status: 500 }
      )
    }

    const formData = await request.formData()

    const file = formData.get("file") as File | null
    const brand = String(formData.get("brand") || "").trim()
    const brochureName = String(formData.get("brochureName") || "").trim()
    const startPage = Number(formData.get("startPage") || 1)
    const endPage = Number(formData.get("endPage") || startPage)

    if (!file) {
      return Response.json(
        { success: false, message: "PDF file is required." },
        { status: 400 }
      )
    }

    if (!brand || !brochureName) {
      return Response.json(
        { success: false, message: "Brand and brochure name are required." },
        { status: 400 }
      )
    }

    if (endPage < startPage) {
      return Response.json(
        { success: false, message: "End page cannot be before start page." },
        { status: 400 }
      )
    }

    const pageCount = endPage - startPage + 1

    if (pageCount > 3) {
      return Response.json(
        {
          success: false,
          message:
            "For testing, please extract maximum 3 pages only. Try page 2 to 4.",
        },
        { status: 400 }
      )
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer())
    const products: ExtractedProduct[] = []

    const layoutKey = "default-product-hero"
    let cropProfile = await getExistingCropProfile(brand, brochureName, layoutKey)

    for (let page = startPage; page <= endPage; page++) {
      const imagePath = await convertPdfPageToImage(pdfBuffer, page, tempDir)

      const shouldAskForCrop = cropProfile === null

      const extractedProducts = await extractProductsFromImage(
        imagePath,
        brand,
        brochureName,
        page,
        shouldAskForCrop
      )

      const finalExtractedProducts =
        extractedProducts.length > 0
          ? extractedProducts
          : [
              {
                name: `Product ${page}-1`,
                category: "Others",
                budget_band: "₹500–₹1000",
                occasion: "Corporate gifting",
                recipient_type: "Employees",
                use_case: "Employee gifting",
                industry: "Others",
                tag_1: "Corporate gifting",
                tag_2: "Premium",
                description:
                  "Corporate gifting product suitable for employee and client gifting.",
              },
            ]

      if (!cropProfile) {
        const firstCropBox = normalizeCropBox(finalExtractedProducts[0]?.crop_box)

        if (firstCropBox && !isBadCrop(firstCropBox)) {
          cropProfile = firstCropBox
        } else {
          cropProfile = getFallbackCropProfile(brand, brochureName)
        }

        await saveCropProfile(brand, brochureName, layoutKey, cropProfile)
      }

      for (let index = 0; index < finalExtractedProducts.length; index++) {
        const position = index + 1
        const extractedProduct = finalExtractedProducts[index]

        const croppedImageBuffer = await cropProductImage(imagePath, cropProfile)

        const uploadedImage = await uploadProductImageToSupabase(
          croppedImageBuffer,
          brochureName,
          page,
          position,
          extractedProduct.name || `Product ${page}-${position}`
        )

        products.push(
          normalizeProduct(
            extractedProduct,
            brand,
            brochureName,
            page,
            position,
            uploadedImage.imageUrl,
            uploadedImage.imageFilename
          )
        )
      }
    }

    return Response.json({
      success: true,
      products,
    })
  } catch (error: any) {
    console.error("Brochure extract error:", error)

    if (error?.code === "insufficient_quota" || error?.status === 429) {
      return Response.json(
        {
          success: false,
          message:
            "OpenAI API quota/billing issue. Add billing or credits in OpenAI Platform, then try again.",
        },
        { status: 429 }
      )
    }

    return Response.json(
      {
        success: false,
        message:
          error?.message ||
          "Something went wrong while extracting brochure. Check terminal logs.",
      },
      { status: 500 }
    )
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}