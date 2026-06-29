export type AdminUserLike = {
  role?: string | null
  roles?: string[] | null
}

export function getAdminRoles(user: AdminUserLike) {
  const roles = new Set<string>()

  if (user.role) {
    roles.add(user.role)
  }

  if (Array.isArray(user.roles)) {
    user.roles.forEach((role) => {
      if (role) {
        roles.add(role)
      }
    })
  }

  return roles
}

export function isAdminOrOwner(user: AdminUserLike) {
  const roles = getAdminRoles(user)

  return roles.has("Admin") || roles.has("Owner")
}