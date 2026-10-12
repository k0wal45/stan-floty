import type { UserRole } from "./auth";

export interface AdminTenantUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
}

export interface AdminTenant {
  id: string;
  name: string;
  nip: string | null;
  plan: string;
  createdAt: Date;
  users: AdminTenantUser[];
  itemCount: number;
  rentalCount: number;
}
