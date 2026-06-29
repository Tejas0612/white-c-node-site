export type ParsedWhatsAppTaskMessage = {
  action: "DONE" | "REMARK" | null
  taskCode: string | null
  remark: string | null
}

export function parseWhatsAppTaskMessage(
  messageText: string
): ParsedWhatsAppTaskMessage {
  const cleanText = String(messageText || "").trim()

  if (!cleanText) {
    return {
      action: null,
      taskCode: null,
      remark: null,
    }
  }

  const normalizedText = cleanText.replace(/\s+/g, " ")

  const doneMatch = normalizedText.match(/\bDONE\s+(T-[A-Z0-9]+)\b/i)

  if (doneMatch) {
    return {
      action: "DONE",
      taskCode: doneMatch[1].toUpperCase(),
      remark: null,
    }
  }

  const remarkMatch = normalizedText.match(
    /\bREMARK\s+(T-[A-Z0-9]+)\s+(.+)/i
  )

  if (remarkMatch) {
    return {
      action: "REMARK",
      taskCode: remarkMatch[1].toUpperCase(),
      remark: remarkMatch[2].trim(),
    }
  }

  return {
    action: null,
    taskCode: null,
    remark: null,
  }
}