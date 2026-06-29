import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminUser } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

function createWhatsAppUrl(phone: string | null | undefined) {
  const cleanPhone = String(phone || "").replace(/\D/g, "")

  if (!cleanPhone) return "#"

  return `https://wa.me/${cleanPhone}`
}

export default async function WorkflowTeamPage() {
  await requireAdminUser(["Admin"])

  const { data: members, error } = await supabaseAdmin
    .from("workflow_team_members")
    .select("*")
    .order("created_at", { ascending: true })

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Organization
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Team</h1>
          <p className="mt-2 text-muted-foreground">
            Manage team members used for task assignment and WhatsApp reminders.
          </p>
        </div>

        <button className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background">
          + Add Member
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error.message}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {(members || []).map((member) => (
          <div
            key={member.id}
            className="rounded-2xl border bg-background p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-lg font-bold">
                {String(member.name || "U").charAt(0)}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold">{member.name}</h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {member.role || "Team Member"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </p>
                <p className="mt-1 break-all">{member.email || "—"}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  WhatsApp
                </p>

                {member.whatsapp ? (
                  <a
                    href={createWhatsAppUrl(member.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block font-semibold text-green-600 hover:underline"
                  >
                    {member.whatsapp}
                  </a>
                ) : (
                  <p className="mt-1 text-muted-foreground">No WhatsApp</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <p className="mt-1">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                    {member.is_active ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ))}

        {members?.length === 0 && (
          <div className="col-span-full rounded-2xl border bg-muted p-10 text-center">
            <h2 className="text-xl font-semibold">No team members found</h2>
            <p className="mt-2 text-muted-foreground">
              Add team members to assign tasks and send reminders.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}