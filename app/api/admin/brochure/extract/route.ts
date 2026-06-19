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
  features?: string[]
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
  features: string[]
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

function cleanFeatures(features: unknown) {
  if (!Array.isArray(features)) return []

  return features
    .map((feature) => String(feature || "").trim())
    .filter(Boolean)
    .slice(0, 8)
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
  const features = cleanFeatures(product.features)

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
    features,
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

      return `${outputPrefix}.jpg`
    } catch (error) {
      lastError = error
    }
  }

  console.error("PDF conversion failed:", lastError)

  throw new Error(
    "PDF conversion failed. Install Poppler using Homebrew, then restart server."
  )
}

function getBestKnownImageFolder(brand: string, brochureName: string) {
  const key = `${brand} ${brochureName}`.toLowerCase()

  if (key.includes("fuzo")) {
    return "fuzo-may-2026"
  }

  return null
}

async function findBestKnownImageUrl(
  brand: string,
  brochureName: string,
  page: number,
  position: number
) {
  const folder = getBestKnownImageFolder(brand, brochureName)

  if (!folder) return null

  const pagePart = `p${String(page).padStart(3, "0")}`
  const positionPart = String(position).padStart(2, "0")
  const expectedPrefix = `${slugify(brochureName)}-${pagePart}-${positionPart}-`

  const { data, error } = await supabaseAdmin.storage
    .from("product-images")
    .list(folder, {
      limit: 1000,
      offset: 0,
    })

  if (error) {
    console.log("Known image lookup error:", error.message)
    return null
  }

  const matchedFile = data?.find((file) => file.name.startsWith(expectedPrefix))

  if (!matchedFile) return null

  const storagePath = `${folder}/${matchedFile.name}`

  const { data: publicData } = supabaseAdmin.storage
    .from("product-images")
    .getPublicUrl(storagePath)

  return {
    imageUrl: publicData.publicUrl,
    imageFilename: matchedFile.name,
  }
}

async function createWideCatalogImage(
  imagePath: string,
  brand: string,
  brochureName: string
) {
  const metadata = await sharp(imagePath).metadata()

  const imageWidth = metadata.width || 0
  const imageHeight = metadata.height || 0

  if (!imageWidth || !imageHeight) {
    return sharp(imagePath)
      .resize({
        width: 1200,
        withoutEnlargement: true,
      })
      .jpeg({ quality: 92 })
      .toBuffer()
  }

  const key = `${brand} ${brochureName}`.toLowerCase()

  const crop =
    key.includes("fuzo")
      ? { x: 6, y: 0, width: 88, height: 47 }
      : { x: 6, y: 0, width: 88, height: 55 }

  const left = Math.round((crop.x / 100) * imageWidth)
  const top = Math.round((crop.y / 100) * imageHeight)
  const width = Math.round((crop.width / 100) * imageWidth)
  const height = Math.round((crop.height / 100) * imageHeight)

  return sharp(imagePath)
    .extract({
      left,
      top,
      width: Math.min(width, imageWidth - left),
      height: Math.min(height, imageHeight - top),
    })
    .resize({
      width: 1200,
      withoutEnlargement: true,
    })
    .jpeg({ quality: 92 })
    .toBuffer()
}

async function uploadGeneratedImageToSupabase(
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

  const { error } = await supabaseAdmin.storage
    .from("product-images")
    .upload(storagePath, imageBuffer, {
      contentType: "image/jpeg",
      upsert: true,
      cacheControl: "0",
    })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabaseAdmin.storage
    .from("product-images")
    .getPublicUrl(storagePath)

  return {
    imageUrl: `${data.publicUrl}?v=${uniqueRunId}`,
    imageFilename,
  }
}

async function extractProductsFromImage(
  imagePath: string,
  brand: string,
  brochureName: string,
  page: number
) {
  const imageBuffer = await fs.readFile(imagePath)
  const base64Image = imageBuffer.toString("base64")

  const prompt = `
You are extracting product data from a corporate gifting brochure page image.

Brand: ${brand}
Brochure: ${brochureName}
Page number: ${page}

Extract ONLY products visible on this page.

Return ONLY valid JSON array. No markdown. No explanation.

If there is one product on the page, return one object.
If there are multiple products on the page, return multiple objects in top-to-bottom / left-to-right order.

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
    "features": []
  }
]

Rules:
- Use the visible product title from the page.
- Do not return actual prices.
- Read feature icons, specification text, battery/capacity, material, handle, closure, charging, size, speed, compatibility, and usage notes if visible.
- Description must be 18 to 35 words.
- Description must include 3 to 5 useful product features when visible.
- Do not use only generic wording like "suitable for corporate gifting".
- features must contain 3 to 8 short bullet points based on visible features/specifications.
- category must be one of: Drinkware, Tech Accessories, Desk Accessories, Bags, Home & Living, Wellness, Stationery, Lifestyle, Travel Accessories, Others.
- budget_band must be one of: Under ₹250, ₹250–₹500, ₹500–₹1000, ₹1000+.
- occasion must be one of: Employee onboarding, Diwali gifting, Client appreciation, Event giveaway, Conference / Event, Corporate gifting.
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

    for (let page = startPage; page <= endPage; page++) {
      const imagePath = await convertPdfPageToImage(pdfBuffer, page, tempDir)

      const extractedProducts = await extractProductsFromImage(
        imagePath,
        brand,
        brochureName,
        page
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
                features: ["Corporate gifting product"],
              },
            ]

      for (let index = 0; index < finalExtractedProducts.length; index++) {
        const position = index + 1
        const extractedProduct = finalExtractedProducts[index]

        const knownImage = await findBestKnownImageUrl(
          brand,
          brochureName,
          page,
          position
        )

        let imageData = knownImage

        if (!imageData) {
          const generatedImageBuffer = await createWideCatalogImage(
            imagePath,
            brand,
            brochureName
          )

          imageData = await uploadGeneratedImageToSupabase(
            generatedImageBuffer,
            brochureName,
            page,
            position,
            extractedProduct.name || `Product ${page}-${position}`
          )
        }

        products.push(
          normalizeProduct(
            extractedProduct,
            brand,
            brochureName,
            page,
            position,
            imageData.imageUrl,
            imageData.imageFilename
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