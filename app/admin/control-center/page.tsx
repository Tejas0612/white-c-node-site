import Link from "next/link"
import { redirect } from "next/navigation"
import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { CostPlanner } from "./planner"
import { refreshCatalogue } from "./actions"

export const dynamic = "force-dynamic"

async function websiteStatus() {
  try {
    const response = await fetch("https://www.white-c.in", { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(6000) })
    return { ok: response.ok, label: `HTTP ${response.status}`, host: response.headers.get("server") || "Unknown host" }
  } catch { return { ok: false, label: "Could not reach website", host: "Check provider" } }
}

export default async function ControlCenter() {
  const user = await requireAdminUser()
  if (user.role !== "Owner" && !user.roles?.includes("Owner")) redirect("/admin/workflow")
  const [site, database] = await Promise.all([
    websiteStatus(),
    supabaseAdmin.from("products").select("id", { head: true }).limit(1).abortSignal(AbortSignal.timeout(6000)),
  ])
  const aiEnabled = process.env.GIFTMATCH_AI_ENABLED === "true" && Boolean(process.env.OPENAI_API_KEY)
  const services = [
    { name: "Public website", purpose: "Your customer storefront", label: site.label, ok: site.ok, detail: `Detected host: ${site.host}. This checks the homepage, not every customer journey.`, url: "https://www.white-c.in" },
    { name: "Database", purpose: "Products, team & orders", label: database.error ? "Needs attention" : "Responding", ok: !database.error, detail: "A small live read checks connectivity. Billing allowance is separate from availability.", url: "https://supabase.com/dashboard/project/ecjuikdplxvlrgjwlygj" },
    { name: "Render", purpose: "Replacement hosting", label: process.env.RENDER ? "Running here" : "Deployment pending", ok: Boolean(process.env.RENDER), detail: "Free compute selected for migration. Sleeping services can take time to wake; verify bandwidth and workspace limits.", url: "https://dashboard.render.com" },
    { name: "GiftMatch", purpose: "Gift recommendations", label: aiEnabled ? "Paid AI enabled" : "No paid AI calls", ok: !aiEnabled, detail: aiEnabled ? "OpenAI usage can incur costs. Disable GIFTMATCH_AI_ENABLED to use built-in matching." : "Built-in matching works without paid AI. Other tools, such as brochure extraction, can still use paid APIs.", url: "https://platform.openai.com/usage" },
  ]
  return <main className="min-h-screen bg-[#f5f6f8] text-[#172b35]">
    <header className="border-b border-slate-200 bg-white px-5 py-5 lg:px-12"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4"><Link href="/admin/workflow" className="text-xl font-bold tracking-[0.18em]">WHITEC<span className="ml-3 text-xs font-medium tracking-normal text-slate-500">Owner workspace</span></Link><nav className="flex gap-5 text-sm"><Link href="/admin/workflow">Business dashboard</Link><Link href="/catalog">View catalogue ↗</Link><form action="/api/admin/logout" method="post"><button>Sign out</button></form></nav></div></header>
    <div className="mx-auto max-w-7xl space-y-7 px-5 py-9 lg:px-12">
      <section className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Clarity before another subscription</p><h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Your service & cost centre</h1><p className="mt-3 max-w-2xl text-slate-500">See what is working, what needs attention, and where your money goes.</p></div><div className="text-right text-xs text-slate-500"><p>Checked {new Date().toLocaleString("en-IN", {timeZone: "Asia/Kolkata"})} IST</p><Link href="/admin/control-center" prefetch={false} className="mt-2 inline-block rounded-lg border bg-white px-4 py-2 text-sm text-slate-800">Check again ↻</Link></div></section>
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><p className="text-xs font-bold uppercase tracking-wider text-amber-800">Provider notice · 25 September 2026</p><h2 className="mt-2 text-xl font-semibold">Bandwidth needs attention. Your files are not 13 GB.</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-amber-950">Supabase reported 13.11 GB transferred against a 5.5 GB allowance, with restrictions warned after 28 September. Reducing future downloads does not erase this cycle’s usage. Check the current provider balance and reset date before assuming recovery.</p><a className="mt-4 inline-block text-sm font-semibold underline" href="https://supabase.com/dashboard/org/lwzzwkvbxfauspgrjsod/usage" target="_blank" rel="noreferrer">Open current usage ↗</a></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
        ["Reported bandwidth", "13.11 GB", "Provider email · 25 Sep · not live"], ["Stored product images", "3.3 MB", "37 files · verified 27 Sep"], ["Database size", "14 MB", "Verified 27 Sep · not a billing meter"], ["Catalogue cache", "5 minutes", "Shared reads across visits & filters"],
      ].map(([title,value,note])=><article key={title} className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm text-slate-500">{title}</p><p className="my-3 text-3xl font-semibold tracking-tight">{value}</p><p className="text-xs leading-5 text-slate-500">{note}</p></article>)}</section>
      <section><h2 className="mb-4 text-lg font-semibold">Connected services</h2><div className="grid gap-4 md:grid-cols-2">{services.map(service=><article key={service.name} className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-semibold">{service.name}</h3><p className="mt-1 text-sm text-slate-500">{service.purpose}</p></div><span className={`h-fit rounded-full px-3 py-1 text-xs font-medium ${service.ok ? "bg-teal-50 text-teal-800" : "bg-amber-50 text-amber-900"}`}>{service.label}</span></div><p className="mt-5 text-sm leading-6 text-slate-500">{service.detail}</p><a href={service.url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-teal-800">Open service ↗</a></article>)}</div></section>
      <CostPlanner userId={user.id} />
      <section className="grid gap-5 lg:grid-cols-2"><article className="rounded-2xl border bg-white p-6"><h2 className="text-lg font-semibold">Cost controls in this release</h2><ul className="mt-4 space-y-3 text-sm text-slate-600"><li>✓ Catalogue reads shared for five minutes</li><li>✓ 24 products per page; images load as needed</li><li>✓ Catalogue links do not preload pages</li><li>✓ New brochure images compressed and cached</li><li>✓ Paid GiftMatch AI is off unless explicitly enabled</li></ul><form action={refreshCatalogue}><button className="mt-6 rounded-xl bg-[#173e3b] px-5 py-3 text-sm font-medium text-white">Refresh published catalogue</button></form><p className="mt-2 text-xs text-slate-500">Use after catalogue edits. This clears the cache; it does not delete products.</p></article><article className="rounded-2xl border bg-white p-6"><h2 className="text-lg font-semibold">Recovery checklist</h2><ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-600"><li>Keep the verified local backup before changing hosting.</li><li>Deploy and test the Render copy, including sign-in and enquiries.</li><li>Resolve Supabase’s current-cycle restriction with the provider. Cache fixes reduce future usage only.</li><li>Point GoDaddy DNS to the verified replacement.</li><li>Cancel unused Vercel services after cutover; moving DNS alone does not cancel billing.</li></ol><div className="mt-5 flex gap-5 text-sm font-semibold text-teal-800"><a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">Vercel billing ↗</a><a href="https://dcc.godaddy.com" target="_blank" rel="noreferrer">Domain & DNS ↗</a></div></article></section>
      <p className="pb-6 text-xs leading-5 text-slate-500">Owner-only workspace. No API keys are displayed. Historical readings are labelled; live billing totals are not connected. This dashboard does not cancel subscriptions or automatically change provider plans.</p>
    </div>
  </main>
}
