import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Hero } from "@/components/home/hero"
import { CategoriesSection } from "@/components/home/categories-section"
import { BudgetSection } from "@/components/home/budget-section"
import { UseCasesSection } from "@/components/home/use-cases-section"
import { ProcessSection } from "@/components/home/process-section"
import { CtaSection } from "@/components/home/cta-section"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <CategoriesSection />
        <BudgetSection />
        <UseCasesSection />
        <ProcessSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
