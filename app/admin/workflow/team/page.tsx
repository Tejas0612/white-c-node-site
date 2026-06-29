import { requireAdminUser } from "@/lib/admin-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import {
  AddTeamMemberButton,
  EditTeamMemberButton,
} from "./team-member-actions"

export const dynamic = "force-dynamic"

function StatusPill({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
        Active
      </span>
    )
  }

  return (
    <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
      Inactive
    </span>
  )
}

function RolePill({ role }: { role: string }) {
  return (
    <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
      {role}
    </span>
  )
}

function getMemberRoles(member: any) {
  if (member.roles && member.roles.length > 0) {
    return member.roles
  }

  if (member.role) {
    return [member.role]
  }

  return ["Employee"]
}

export default async function WorkflowTeamPage() {
  await requireAdminUser(["Admin"])

  const { data: teamMembers, error } = await supabaseAdmin
    .from("workflow_team_members")
    .select("*")
    .order("created_at", { ascending: true })

  const allTeamMembers = teamMembers || []
  const activeCount = allTeamMembers.filter((member) => member.is_active).length
  const inactiveCount = allTeamMembers.filter((member) => !member.is_active).length

  return (
    <div className="max-w-full overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Workflow
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Team</h1>
          <p className="mt-2 text-muted-foreground">
            Manage team members, contact numbers, active status, and workflow roles.
          </p>
        </div>

        <AddTeamMemberButton />
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error.message}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Members
          </p>
          <h2 className="mt-4 text-4xl font-bold">{allTeamMembers.length}</h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Active
          </p>
          <h2 className="mt-4 text-4xl font-bold text-green-600">
            {activeCount}
          </h2>
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Inactive
          </p>
          <h2 className="mt-4 text-4xl font-bold text-red-600">
            {inactiveCount}
          </h2>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold">Team Members</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Card view for quick review and editing.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {allTeamMembers.map((member) => {
            const roles = getMemberRoles(member)

            return (
              <div
                key={member.id}
                className="rounded-2xl border bg-background p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="h-16 w-16 rounded-2xl border object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border bg-muted text-xl font-bold">
                        {member.name?.slice(0, 1) || "?"}
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-bold">{member.name}</h3>
                      <div className="mt-2">
                        <StatusPill isActive={Boolean(member.is_active)} />
                      </div>
                    </div>
                  </div>

                  <EditTeamMemberButton member={member} />
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Roles
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {roles.map((role: string) => (
                      <RolePill key={role} role={role} />
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Email
                    </p>
                    <p className="mt-1 break-all text-sm">
                      {member.email || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      WhatsApp
                    </p>
                    <p className="mt-1 text-sm font-semibold text-green-600">
                      {member.whatsapp || "—"}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}

          {allTeamMembers.length === 0 && (
            <div className="rounded-2xl border bg-background p-10 text-center text-muted-foreground md:col-span-2 xl:col-span-3">
              No team members found.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}