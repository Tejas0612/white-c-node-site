"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CopyTaskCodeButtonProps {
  taskCode: string
}

export default function CopyTaskCodeButton({
  taskCode,
}: CopyTaskCodeButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(taskCode)
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch (error) {
      console.error("Failed to copy TaskCode:", error)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-7 gap-1.5 px-2 text-xs"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </Button>
  )
}