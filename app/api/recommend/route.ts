import { generateText, Output } from "ai"
import { z } from "zod"
import { PRODUCTS, type Product } from "@/lib/data"

export const maxDuration = 30

interface MatchInput {
  budget?: string
  occasion?: string
  recipientType?: string
  quantity?: number
  branding?: boolean
  category?: string
  notes?: string
}

interface Recommendation {
  id: string
  name: string
  category: string
  budgetBand: string
  image: string
  moq: number
  leadTime: string
  whyItFits: string
  brandingOption: string
  matchScore: number
}

// Deterministic scoring so the feature always works, even without an AI key.
function scoreProduct(p: Product, input: MatchInput): number {
  let score = 0
  if (input.budget && p.budgetBand === input.budget) score += 40
  if (input.category && p.category === input.category) score += 25
  if (input.occasion && p.occasion.includes(input.occasion)) score += 20
  if (input.recipientType && p.recipientType.includes(input.recipientType)) score += 15
  if (input.branding && p.brandingAvailable) score += 10
  if (typeof input.quantity === "number" && input.quantity >= p.moq) score += 10
  // small base so results are never all-zero
  score += 5
  return score
}

const fallbackBranding = (p: Product) =>
  p.brandingAvailable ? "Logo printing / engraving available" : "Standard packaging"

function fallbackReason(p: Product, input: MatchInput): string {
  const bits: string[] = []
  if (input.budget && p.budgetBand === input.budget) bits.push(`fits your ${p.budgetBand} budget`)
  if (input.occasion && p.occasion.includes(input.occasion))
    bits.push(`well-suited for ${input.occasion.toLowerCase()}`)
  if (input.recipientType && p.recipientType.includes(input.recipientType))
    bits.push(`a strong choice for ${input.recipientType.toLowerCase()}`)
  if (input.branding && p.brandingAvailable) bits.push("supports custom branding")
  if (bits.length === 0) bits.push("a versatile, broadly-loved corporate gift")
  return `This ${p.name.toLowerCase()} is ${bits.join(", ")}.`
}

export async function POST(req: Request) {
  let input: MatchInput
  try {
    input = (await req.json()) as MatchInput
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  // Rank products deterministically
  const ranked = [...PRODUCTS]
    .map((p) => ({ product: p, score: scoreProduct(p, input) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const maxScore = ranked[0]?.score || 1

  // Try to enrich with AI-written rationale. If it fails (no key, timeout),
  // gracefully fall back to templated reasoning.
  let aiReasons: Record<string, { whyItFits: string; brandingOption: string }> | null = null
  try {
    const { experimental_output } = await generateText({
      model: "openai/gpt-5-mini",
      experimental_output: Output.object({
        schema: z.object({
          recommendations: z.array(
            z.object({
              id: z.string(),
              whyItFits: z.string(),
              brandingOption: z.string(),
            }),
          ),
        }),
      }),
      system:
        "You are a corporate gifting advisor for WhiteC, a B2B gifting company in India. " +
        "Given a buyer's requirement and a shortlist of candidate products, write a concise, " +
        "persuasive 'why it fits' explanation (1-2 sentences) and a specific branding suggestion " +
        "for each product. Be practical, professional, and reference budget/occasion/recipient when relevant. " +
        "Use Indian Rupees context. Do not invent products outside the shortlist.",
      prompt: JSON.stringify({
        requirement: input,
        shortlist: ranked.map(({ product }) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          budgetBand: product.budgetBand,
          moq: product.moq,
          brandingAvailable: product.brandingAvailable,
          occasion: product.occasion,
          recipientType: product.recipientType,
          description: product.description,
        })),
      }),
    })

    aiReasons = {}
    for (const r of experimental_output.recommendations) {
      aiReasons[r.id] = { whyItFits: r.whyItFits, brandingOption: r.brandingOption }
    }
  } catch (err) {
    console.log("[v0] AI rationale unavailable, using fallback:", (err as Error).message)
    aiReasons = null
  }

  const recommendations: Recommendation[] = ranked.map(({ product, score }) => {
    const ai = aiReasons?.[product.id]
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      budgetBand: product.budgetBand,
      image: product.image,
      moq: product.moq,
      leadTime: product.leadTime,
      whyItFits: ai?.whyItFits ?? fallbackReason(product, input),
      brandingOption: ai?.brandingOption ?? fallbackBranding(product),
      matchScore: Math.round((score / maxScore) * 100),
    }
  })

  return Response.json({ recommendations, aiPowered: aiReasons !== null })
}
