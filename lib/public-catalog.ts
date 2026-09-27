import "server-only"
import { createClient } from "@supabase/supabase-js"

// Only public catalogue reads use this cache. Never cache sessions or admin data.
export const catalogClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, {
      ...init,
      cache: "force-cache",
      next: { revalidate: 300, tags: ["public-catalog"] },
      signal: AbortSignal.timeout(10_000),
    }) },
  }
)

export const PUBLIC_PRODUCT_FIELDS = "id,sku,brand,name,category,budget_band,occasion,recipient_type,use_case,industry,material,brandable_area,packaging,logistics_type,delivery_window,moq,lead_time,color_options,tags,description,image_url,image_filename,is_active"
