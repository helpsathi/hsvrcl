import { TokenPayload } from "./auth";
import { NextResponse } from "next/server";

export type AdminSubRoleType = "SUPER_ADMIN" | "ADMIN" | "SUPPORT" | "MODERATOR" | "FINANCE";

export interface PermissionOptions {
  requiredSubRoles?: AdminSubRoleType[];
}

/**
 * Validates that the session belongs to an ADMIN and optionally checks if their sub-role matches authorized roles.
 * SUPER_ADMIN and ADMIN always bypass granular sub-role checks.
 */
export function requireAdminPermission(
  session: TokenPayload | null,
  options?: PermissionOptions
): { authorized: boolean; response?: NextResponse } {
  const userSubRole = (session as any)?.adminSubRole as AdminSubRoleType | undefined;
  
  // The user must explicitly have the ADMIN role in their token
  const isAdminRole = session?.role === "ADMIN";

  if (!session || !isAdminRole) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized - Admin role required" }, { status: 401 }),
    };
  }

  // If specific sub-roles are required
  if (options?.requiredSubRoles && options.requiredSubRoles.length > 0) {
    // SUPER_ADMIN and basic ADMIN or unassigned super admin email overrides have root administrative rights
    if (!userSubRole || userSubRole === "SUPER_ADMIN" || userSubRole === "ADMIN") {
      return { authorized: true };
    }

    if (!options.requiredSubRoles.includes(userSubRole)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: `Forbidden - Requires one of the following administrative roles: ${options.requiredSubRoles.join(", ")}` },
          { status: 403 }
        ),
      };
    }
  }

  return { authorized: true };
}
