// Central sample data for WhiteC. Structured so it can later be swapped for
// real product/catalog APIs, CRM data, or AI recommendation endpoints.

export const BUDGET_BANDS = [
  "Under ₹250",
  "₹250–₹500",
  "₹500–₹1000",
  "₹1000+",
] as const

export type BudgetBand = (typeof BUDGET_BANDS)[number]

export const CATEGORIES = [
  "Bottles",
  "Diaries",
  "Tech Accessories",
  "Apparel",
  "Hampers",
  "Eco-friendly Gifts",
] as const

export type Category = (typeof CATEGORIES)[number]

export const OCCASIONS = [
  "Employee Onboarding",
  "Diwali Gifting",
  "Client Appreciation",
  "Event Giveaways",
  "Dealer/Distributor Gifting",
  "Annual Day",
] as const

export const RECIPIENT_TYPES = [
  "Employees",
  "Clients",
  "Event Attendees",
  "Dealers/Distributors",
  "Blue-collar Workforce",
  "Executives",
] as const

export const INDUSTRIES = [
  "IT & Software",
  "Manufacturing",
  "BFSI",
  "Healthcare",
  "Retail & E-commerce",
  "Real Estate",
  "Other",
] as const

export const LEAD_TIMES = [
  "Express (3–5 days)",
  "Standard (7–10 days)",
  "Bulk (2–3 weeks)",
] as const

export const TIMELINES = [
  "Immediate (this week)",
  "Within 2 weeks",
  "Within a month",
  "Just exploring",
] as const

export interface Product {
  id: string
  name: string
  category: Category
  budgetBand: BudgetBand
  moq: number
  brandingAvailable: boolean
  leadTime: string
  occasion: string[]
  recipientType: string[]
  description: string
  image: string
}

export const PRODUCTS: Product[] = [
  {
    id: "steel-bottle",
    name: "Stainless Steel Bottle",
    category: "Bottles",
    budgetBand: "₹250–₹500",
    moq: 50,
    brandingAvailable: true,
    leadTime: "Standard (7–10 days)",
    occasion: ["Employee Onboarding", "Annual Day", "Event Giveaways"],
    recipientType: ["Employees", "Event Attendees", "Blue-collar Workforce"],
    description:
      "Durable double-wall stainless steel bottle that keeps beverages hot or cold. A practical everyday companion for large teams.",
    image: "/products/steel-bottle.png",
  },
  {
    id: "diary-pen-set",
    name: "Premium Diary & Pen Set",
    category: "Diaries",
    budgetBand: "₹500–₹1000",
    moq: 25,
    brandingAvailable: true,
    leadTime: "Standard (7–10 days)",
    occasion: ["Client Appreciation", "Employee Onboarding", "Diwali Gifting"],
    recipientType: ["Clients", "Employees", "Executives"],
    description:
      "Vegan-leather diary paired with a metal pen in a gift box. A refined desk essential ideal for client and leadership gifting.",
    image: "/products/diary-pen-set.png",
  },
  {
    id: "tech-organizer",
    name: "Tech Organizer Pouch",
    category: "Tech Accessories",
    budgetBand: "₹500–₹1000",
    moq: 50,
    brandingAvailable: true,
    leadTime: "Standard (7–10 days)",
    occasion: ["Client Appreciation", "Event Giveaways"],
    recipientType: ["Employees", "Clients", "Executives"],
    description:
      "Compact travel organizer for cables, chargers, and accessories. Keeps essentials tidy for the modern professional.",
    image: "/products/tech-organizer.png",
  },
  {
    id: "logo-tshirt",
    name: "Custom Logo T-Shirt",
    category: "Apparel",
    budgetBand: "₹250–₹500",
    moq: 100,
    brandingAvailable: true,
    leadTime: "Bulk (2–3 weeks)",
    occasion: ["Annual Day", "Event Giveaways", "Employee Onboarding"],
    recipientType: ["Employees", "Event Attendees", "Blue-collar Workforce"],
    description:
      "Soft cotton-blend tee with full-color logo printing. Perfect for team events, drives, and on-ground campaigns.",
    image: "/products/logo-tshirt.png",
  },
  {
    id: "eco-welcome-kit",
    name: "Eco-friendly Welcome Kit",
    category: "Eco-friendly Gifts",
    budgetBand: "₹500–₹1000",
    moq: 50,
    brandingAvailable: true,
    leadTime: "Standard (7–10 days)",
    occasion: ["Employee Onboarding", "Client Appreciation"],
    recipientType: ["Employees", "Clients"],
    description:
      "Sustainable welcome bundle with recycled notebook, plantable pen, and jute pouch. A thoughtful, planet-friendly first impression.",
    image: "/products/eco-welcome-kit.png",
  },
  {
    id: "festive-hamper",
    name: "Festive Hamper Box",
    category: "Hampers",
    budgetBand: "₹1000+",
    moq: 25,
    brandingAvailable: true,
    leadTime: "Bulk (2–3 weeks)",
    occasion: ["Diwali Gifting", "Client Appreciation"],
    recipientType: ["Clients", "Executives", "Dealers/Distributors"],
    description:
      "Curated festive box with gourmet treats and premium accents. A celebratory gesture for clients and partners during festivals.",
    image: "/products/festive-hamper.png",
  },
  {
    id: "wireless-charger",
    name: "Wireless Charging Pad",
    category: "Tech Accessories",
    budgetBand: "₹1000+",
    moq: 25,
    brandingAvailable: true,
    leadTime: "Standard (7–10 days)",
    occasion: ["Client Appreciation", "Diwali Gifting"],
    recipientType: ["Clients", "Executives"],
    description:
      "Sleek fast-charging pad with a premium finish. A high-perceived-value gift for clients and leadership.",
    image: "/products/wireless-charger.png",
  },
  {
    id: "onboarding-kit",
    name: "Employee Onboarding Kit",
    category: "Hampers",
    budgetBand: "₹1000+",
    moq: 50,
    brandingAvailable: true,
    leadTime: "Bulk (2–3 weeks)",
    occasion: ["Employee Onboarding"],
    recipientType: ["Employees"],
    description:
      "All-in-one day-one kit with branded bottle, notebook, tee, and accessories in a custom box. Makes new joiners feel valued.",
    image: "/products/onboarding-kit.png",
  },
]

export interface BudgetCardData {
  band: BudgetBand
  tagline: string
}

export const BUDGET_CARDS: BudgetCardData[] = [
  { band: "Under ₹250", tagline: "Utility gifts for large teams" },
  { band: "₹250–₹500", tagline: "Practical employee gifting" },
  { band: "₹500–₹1000", tagline: "Premium everyday experiences" },
  { band: "₹1000+", tagline: "Executive and festive gifting" },
]

export interface UseCase {
  title: string
  description: string
}

export const USE_CASES: UseCase[] = [
  {
    title: "Employee Onboarding",
    description: "Welcome new joiners with branded day-one kits that build belonging.",
  },
  {
    title: "Diwali Gifting",
    description: "Festive hampers and premium boxes for employees, clients, and partners.",
  },
  {
    title: "Client Appreciation",
    description: "High-perceived-value gifts that strengthen key relationships.",
  },
  {
    title: "Event Giveaways",
    description: "Bulk, brandable merchandise for conferences, drives, and activations.",
  },
  {
    title: "Dealer / Distributor Gifting",
    description: "Reward and retain your channel partners across regions.",
  },
  {
    title: "Blue-collar Workforce Gifting",
    description: "Practical, durable utility gifts at scale for frontline teams.",
  },
]

export interface SampleRecommendation {
  id: string
  name: string
  category: Category
  budgetBand: BudgetBand
  whyItFits: string
  brandingOption: string
  leadTime: string
}

export const SAMPLE_RECOMMENDATIONS: SampleRecommendation[] = [
  {
    id: "rec-1",
    name: "Premium Diary & Pen Set",
    category: "Diaries",
    budgetBand: "₹500–₹1000",
    whyItFits:
      "Sits comfortably in your budget band and signals thoughtfulness — ideal for client appreciation at moderate quantities.",
    brandingOption: "Foil logo embossing on cover + pen engraving",
    leadTime: "Standard (7–10 days)",
  },
  {
    id: "rec-2",
    name: "Stainless Steel Bottle",
    category: "Bottles",
    budgetBand: "₹250–₹500",
    whyItFits:
      "High-utility and durable, making it a strong fit for large teams and recurring daily use with full brand visibility.",
    brandingOption: "Laser-etched or printed logo",
    leadTime: "Standard (7–10 days)",
  },
  {
    id: "rec-3",
    name: "Eco-friendly Welcome Kit",
    category: "Eco-friendly Gifts",
    budgetBand: "₹500–₹1000",
    whyItFits:
      "Aligns with sustainability-led brands and onboarding use cases while keeping per-unit cost in range.",
    brandingOption: "Custom-printed jute pouch + recycled notebook",
    leadTime: "Standard (7–10 days)",
  },
]

export const TRUST_STRIP = [
  "Bulk gifting",
  "Logo branding",
  "Budget-based curation",
  "Fast quotation",
  "Pan-India sourcing",
]

export const BENEFITS = [
  {
    title: "Curated catalogs",
    description: "Hand-picked corporate gifts organized for fast decision-making.",
  },
  {
    title: "Budget-fit recommendations",
    description: "Suggestions matched to your spend band — no guesswork.",
  },
  {
    title: "Logo branding & mockups",
    description: "Visualize your brand on every gift before you confirm.",
  },
  {
    title: "Bulk pricing support",
    description: "Volume-based quotes tailored to your quantity and timeline.",
  },
  {
    title: "Inquiry-first journey",
    description: "No checkout pressure — share needs, get curated options.",
  },
  {
    title: "Human-assisted final quote",
    description: "A specialist reviews and finalizes every requirement.",
  },
]

export const PROCESS_STEPS = [
  { step: "01", title: "Share requirement", description: "Tell us budget, audience, occasion, and quantity." },
  { step: "02", title: "Get curated suggestions", description: "Receive a shortlist matched to your needs." },
  { step: "03", title: "Review branding / mockups", description: "See your logo applied to selected gifts." },
  { step: "04", title: "Confirm bulk quote", description: "Get a transparent volume-based quotation." },
  { step: "05", title: "Dispatch & delivery", description: "We handle packaging and pan-India delivery support." },
]
