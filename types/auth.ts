export type UserRole = "ADMIN" | "OWNER" | "MANAGER" | "STAFF";

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
  fullName: string;
}

