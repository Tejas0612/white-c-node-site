import { NextResponse } from "next/server"
import pptxgen from "pptxgenjs"
import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

function cleanText(value: string | number | null | undefined) {
  return String(value || "")
    .replace(/[\n\r\t]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function formatCurrency(value: number | string | null | undefined) {
  const numberValue = Number(value || 0)

  if (!numberValue) {
    return "As discussed"
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numberValue)
}

function addFooter(slide: any, pptx: any) {
  slide.addShape(pptx.ShapeType.line, {
    x: 0.6,
    y: 6.9,
    w: 12.1,
    h: 0,
    line: {
      color: "DDDDDD",
      width: 1,
    },
  })

  slide.addText("White C Corporate Gifting", {
    x: 0.6,
    y: 7.05,
    w: 5,
    h: 0.25,
    fontSize: 8,
    color: "666666",
  })

  slide.addText("Confidential Proposal", {
    x: 9.7,
    y: 7.05,
    w: 3,
    h: 0.25,
    fontSize: 8,
    color: "666666",
    align: "right",
  })
}

function addTitle(slide: any, title: string, subtitle?: string) {
  slide.addText(title, {
    x: 0.7,
    y: 0.55,
    w: 11.8,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: "111827",
  })

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.72,
      y: 1.15,
      w: 11.3,
      h: 0.35,
      fontSize: 11,
      color: "6B7280",
    })
  }
}

function addInfoBox({
  slide,
  label,
  value,
  x,
  y,
  w,
}: {
  slide: any
  label: string
  value: string
  x: number
  y: number
  w: number
}) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h: 0.9,
    rectRadius: 0.08,
    fill: {
      color: "F8FAFC",
    },
    line: {
      color: "E5E7EB",
      width: 1,
    },
  })

  slide.addText(label, {
    x: x + 0.18,
    y: y + 0.14,
    w: w - 0.36,
    h: 0.22,
    fontSize: 8,
    bold: true,
    color: "6B7280",
  })

  slide.addText(value || "—", {
    x: x + 0.18,
    y: y + 0.45,
    w: w - 0.36,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: "111827",
    fit: "shrink",
  })
}

function addBullet(slide: any, text: string, y: number) {
  slide.addShape("ellipse", {
    x: 0.85,
    y: y + 0.1,
    w: 0.08,
    h: 0.08,
    fill: {
      color: "111827",
    },
    line: {
      color: "111827",
    },
  })

  slide.addText(text, {
    x: 1.08,
    y,
    w: 11,
    h: 0.35,
    fontSize: 13,
    color: "374151",
    fit: "shrink",
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser(["Owner", "Admin", "Sales", "Operations"])

    const { id } = await params
    const enquiryId = cleanText(id)

    if (!enquiryId) {
      throw new Error("Enquiry ID is required.")
    }

    const { data: enquiry, error } = await supabaseAdmin
      .from("workflow_enquiries")
      .select("*")
      .eq("id", enquiryId)
      .single()

    if (error || !enquiry) {
      throw new Error(error?.message || "Enquiry not found.")
    }

    const clientName = cleanText(enquiry.client_name || "Client")
    const enquiryCode = cleanText(enquiry.enquiry_code || "ENQUIRY")
    const productNames = cleanText(
      enquiry.product_names || "Corporate gifting requirement"
    )
    const tentativeQuantity = cleanText(
      enquiry.tentative_quantity || "As discussed"
    )
    const approxCost = formatCurrency(enquiry.approx_cost)
    const clientEmail = cleanText(enquiry.client_email || "Not provided")
    const clientPhone = cleanText(enquiry.client_phone || "Not provided")
    const remarks = cleanText(enquiry.remarks || "No remarks added")
    const nextFollowUpDate = cleanText(
      enquiry.next_follow_up_date || "As discussed"
    )

    const pptx = new pptxgen()

    pptx.defineLayout({
      name: "CUSTOM_WIDE",
      width: 13.333,
      height: 7.5,
    })

    pptx.layout = "CUSTOM_WIDE"
    pptx.author = "White C"
    pptx.company = "White C"
    pptx.subject = `Quotation proposal for ${clientName}`
    pptx.title = `White C Proposal - ${enquiryCode}`

    pptx.theme = {
      headFontFace: "Arial",
      bodyFontFace: "Arial",
    }

        const cover = pptx.addSlide()
    cover.background = {
      color: "FFFFFF",
    }

    cover.addShape("rect", {
      x: 0,
      y: 0,
      w: 13.333,
      h: 7.5,
      fill: {
        color: "F8FAFC",
      },
      line: {
        color: "F8FAFC",
      },
    })

    cover.addText("WHITE C", {
      x: 0.75,
      y: 0.6,
      w: 2.8,
      h: 0.45,
      fontSize: 18,
      bold: true,
      color: "111827",
    })

    cover.addText("Corporate Gifting Proposal", {
      x: 0.75,
      y: 2.05,
      w: 7.6,
      h: 0.65,
      fontSize: 30,
      bold: true,
      color: "111827",
    })

    cover.addText(`Prepared for ${clientName}`, {
      x: 0.78,
      y: 2.85,
      w: 7.6,
      h: 0.42,
      fontSize: 16,
      color: "374151",
    })

    cover.addText(`Reference: ${enquiryCode}`, {
      x: 0.78,
      y: 3.38,
      w: 5.2,
      h: 0.32,
      fontSize: 12,
      color: "6B7280",
    })

    cover.addShape("roundRect", {
      x: 8.3,
      y: 1.4,
      w: 3.95,
      h: 4.35,
      rectRadius: 0.12,
      fill: {
        color: "FFFFFF",
      },
      line: {
        color: "E5E7EB",
        width: 1,
      },
    })

    cover.addText("Requirement", {
      x: 8.65,
      y: 1.85,
      w: 3.2,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: "6B7280",
    })

    cover.addText(productNames, {
      x: 8.65,
      y: 2.25,
      w: 3.2,
      h: 1.05,
      fontSize: 17,
      bold: true,
      color: "111827",
      fit: "shrink",
    })

    cover.addText("Approx Value", {
      x: 8.65,
      y: 3.55,
      w: 3.2,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: "6B7280",
    })

    cover.addText(approxCost, {
      x: 8.65,
      y: 3.95,
      w: 3.2,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: "111827",
      fit: "shrink",
    })

    cover.addText("Quantity", {
      x: 8.65,
      y: 4.78,
      w: 3.2,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: "6B7280",
    })

    cover.addText(tentativeQuantity, {
      x: 8.65,
      y: 5.15,
      w: 3.2,
      h: 0.35,
      fontSize: 15,
      bold: true,
      color: "111827",
    })

    addFooter(cover, pptx)

    const summary = pptx.addSlide()
    summary.background = {
      color: "FFFFFF",
    }

    addTitle(
      summary,
      "Client Requirement Summary",
      "A quick view of the enquiry and commercial requirement."
    )

    addInfoBox({
      slide: summary,
      label: "Client",
      value: clientName,
      x: 0.7,
      y: 1.8,
      w: 3.6,
    })

    addInfoBox({
      slide: summary,
      label: "Reference",
      value: enquiryCode,
      x: 4.65,
      y: 1.8,
      w: 3.6,
    })

    addInfoBox({
      slide: summary,
      label: "Quantity",
      value: tentativeQuantity,
      x: 8.6,
      y: 1.8,
      w: 3.6,
    })

    addInfoBox({
      slide: summary,
      label: "Approx Value",
      value: approxCost,
      x: 0.7,
      y: 3.05,
      w: 3.6,
    })

    addInfoBox({
      slide: summary,
      label: "Phone",
      value: clientPhone,
      x: 4.65,
      y: 3.05,
      w: 3.6,
    })

    addInfoBox({
      slide: summary,
      label: "Email",
      value: clientEmail,
      x: 8.6,
      y: 3.05,
      w: 3.6,
    })

    summary.addText("Requirement", {
      x: 0.75,
      y: 4.45,
      w: 2.2,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: "6B7280",
    })

    summary.addShape("roundRect", {
      x: 0.7,
      y: 4.85,
      w: 11.9,
      h: 1.25,
      rectRadius: 0.08,
      fill: {
        color: "F8FAFC",
      },
      line: {
        color: "E5E7EB",
      },
    })

    summary.addText(productNames, {
      x: 0.95,
      y: 5.15,
      w: 11.4,
      h: 0.7,
      fontSize: 17,
      bold: true,
      color: "111827",
      fit: "shrink",
    })

    addFooter(summary, pptx)

    const recommendations = pptx.addSlide()
    recommendations.background = {
      color: "FFFFFF",
    }

    addTitle(
      recommendations,
      "Recommended Proposal Direction",
      "Suggested structure for the gifting proposal based on the enquiry."
    )

    addBullet(
      recommendations,
      `Recommended gifting requirement: ${productNames}`,
      1.8
    )

    addBullet(
      recommendations,
      `Estimated quantity to plan for: ${tentativeQuantity}`,
      2.35
    )

    addBullet(
      recommendations,
      `Estimated commercial range: ${approxCost}`,
      2.9
    )

    addBullet(
      recommendations,
      "Branding and logo placement options can be customized as per final product selection.",
      3.45
    )

    addBullet(
      recommendations,
      "Final pricing may vary based on MOQ, customization, packaging, and delivery timeline.",
      4
    )

    addBullet(
      recommendations,
      `Next follow-up date: ${nextFollowUpDate}`,
      4.55
    )

    recommendations.addShape("roundRect", {
      x: 0.75,
      y: 5.35,
      w: 11.8,
      h: 0.9,
      rectRadius: 0.08,
      fill: {
        color: "F8FAFC",
      },
      line: {
        color: "E5E7EB",
      },
    })

    recommendations.addText(`Internal note: ${remarks}`, {
      x: 1,
      y: 5.62,
      w: 11.25,
      h: 0.35,
      fontSize: 11,
      color: "374151",
      fit: "shrink",
    })

    addFooter(recommendations, pptx)

        const quotation = pptx.addSlide()
    quotation.background = {
      color: "FFFFFF",
    }

    addTitle(
      quotation,
      "Quotation Summary",
      "Commercial summary to support client discussion."
    )

    quotation.addShape("roundRect", {
      x: 0.75,
      y: 1.75,
      w: 11.85,
      h: 3.25,
      rectRadius: 0.08,
      fill: {
        color: "FFFFFF",
      },
      line: {
        color: "E5E7EB",
        width: 1,
      },
    })

    quotation.addText("Requirement", {
      x: 1.05,
      y: 2.1,
      w: 2.5,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: "6B7280",
    })

    quotation.addText(productNames, {
      x: 4.05,
      y: 2.1,
      w: 7.95,
      h: 0.35,
      fontSize: 13,
      bold: true,
      color: "111827",
      fit: "shrink",
    })

    quotation.addShape(pptx.ShapeType.line, {
      x: 1.05,
      y: 2.65,
      w: 10.95,
      h: 0,
      line: {
        color: "E5E7EB",
      },
    })

    quotation.addText("Quantity", {
      x: 1.05,
      y: 2.95,
      w: 2.5,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: "6B7280",
    })

    quotation.addText(tentativeQuantity, {
      x: 4.05,
      y: 2.95,
      w: 7.95,
      h: 0.35,
      fontSize: 13,
      bold: true,
      color: "111827",
    })

    quotation.addShape(pptx.ShapeType.line, {
      x: 1.05,
      y: 3.5,
      w: 10.95,
      h: 0,
      line: {
        color: "E5E7EB",
      },
    })

    quotation.addText("Estimated Value", {
      x: 1.05,
      y: 3.8,
      w: 2.5,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: "6B7280",
    })

    quotation.addText(approxCost, {
      x: 4.05,
      y: 3.78,
      w: 7.95,
      h: 0.38,
      fontSize: 15,
      bold: true,
      color: "111827",
    })

    quotation.addText(
      "Note: Final quote will be confirmed after product selection, artwork confirmation, packaging requirement, MOQ confirmation, and delivery location.",
      {
        x: 0.85,
        y: 5.45,
        w: 11.6,
        h: 0.5,
        fontSize: 11,
        color: "6B7280",
        fit: "shrink",
      }
    )

    addFooter(quotation, pptx)

    const nextSteps = pptx.addSlide()
    nextSteps.background = {
      color: "FFFFFF",
    }

    addTitle(
      nextSteps,
      "Next Steps",
      "Recommended process to move from enquiry to confirmed order."
    )

    addBullet(nextSteps, "Finalize preferred gifting product options.", 1.75)

    addBullet(
      nextSteps,
      "Share branding/logo artwork for mockup creation.",
      2.3
    )

    addBullet(
      nextSteps,
      "Confirm quantity, packaging, and delivery timeline.",
      2.85
    )

    addBullet(
      nextSteps,
      "Confirm quotation and commercial approval.",
      3.4
    )

    addBullet(
      nextSteps,
      "Proceed with PO, production, and dispatch planning.",
      3.95
    )

    nextSteps.addShape("roundRect", {
      x: 0.75,
      y: 5,
      w: 11.85,
      h: 1.15,
      rectRadius: 0.08,
      fill: {
        color: "111827",
      },
      line: {
        color: "111827",
      },
    })

    nextSteps.addText("Thank you", {
      x: 1.05,
      y: 5.25,
      w: 4,
      h: 0.4,
      fontSize: 22,
      bold: true,
      color: "FFFFFF",
    })

    nextSteps.addText("White C Corporate Gifting", {
      x: 7.05,
      y: 5.35,
      w: 5.1,
      h: 0.3,
      fontSize: 13,
      color: "FFFFFF",
      align: "right",
    })

    addFooter(nextSteps, pptx)

    const pptBuffer = await pptx.write({
      outputType: "nodebuffer",
    })

    const fileName = `White-C-Proposal-${enquiryCode}.pptx`

    return new NextResponse(pptBuffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate quotation PPT.",
      },
      {
        status: 400,
      }
    )
  }
}