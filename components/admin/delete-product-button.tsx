"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm("Are you sure you want to delete this product?")

    if (!confirmed) return

    setLoading(true)

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  )
}