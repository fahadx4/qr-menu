import type { StaffMember } from "@/types";

export const mockStaff: StaffMember[] = [
  {
    id: "s1", tenant_id: "t1", user_id: "u1",
    name: "You (Owner)", email: "owner@burgerhouse.com",
    role: "owner", status: "active",
    last_login: new Date().toISOString(),
    invited_at: new Date(Date.now() - 90 * 86400 * 1000).toISOString(),
  },
  {
    id: "s2", tenant_id: "t1", user_id: "u2",
    name: "Maria Gonzalez", email: "maria@burgerhouse.com",
    role: "manager", status: "active",
    last_login: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    invited_at: new Date(Date.now() - 60 * 86400 * 1000).toISOString(),
  },
  {
    id: "s3", tenant_id: "t1", user_id: "u3",
    name: "James Chen", email: "james@burgerhouse.com",
    role: "kitchen", branch_scope: ["b1"], status: "active",
    last_login: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    invited_at: new Date(Date.now() - 45 * 86400 * 1000).toISOString(),
  },
  {
    id: "s4", tenant_id: "t1", user_id: "u4",
    name: "Sofia Patel", email: "sofia@burgerhouse.com",
    role: "waiter", branch_scope: ["b2"], status: "active",
    last_login: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    invited_at: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
  },
  {
    id: "s5", tenant_id: "t1", user_id: "u5",
    name: "Tom Wilson", email: "tom@burgerhouse.com",
    role: "cashier", status: "pending",
    invited_at: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
  },
];
