import type { User, UserRole } from "@/lib/types";
import { mockGet, mockPost } from "./client";

const LOGIN_API_URL = "https://xkt8-uti5-g3tj.n7e.xano.io/api:FofqTbkb/auth/login";

const MOCK_USER: User = {
  id: "u1",
  email: "admin@example.com",
  name: "Admin User",
  role: "super_admin",
  companyId: "c1",
  enabled: true,
  createdAt: new Date().toISOString(),
};

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

/** Map API user shape to our User type (handles different field names) */
function mapApiUserToUser(apiUser: Record<string, unknown>): User {
  const role = (apiUser.role as string) || "company_employee";
  return {
    id: String(apiUser.id ?? apiUser.user_id ?? ""),
    email: String(apiUser.email ?? ""),
    name: String(apiUser.name ?? apiUser.full_name ?? apiUser.email ?? "User"),
    role: ["super_admin", "super_editor", "company_admin", "company_employee"].includes(role)
      ? (role as UserRole)
      : "company_employee",
    companyId: apiUser.company_id != null ? String(apiUser.company_id) : null,
    enabled: apiUser.enabled !== false,
    createdAt:
      typeof apiUser.created_at === "string"
        ? apiUser.created_at
        : new Date().toISOString(),
  };
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(LOGIN_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const body = data as { message?: string; error?: string; msg?: string };
    const message =
      body.message ?? body.error ?? body.msg ?? (res.statusText || "Invalid email or password");
    throw new Error(message);
  }

  const body = data as {
    token?: string;
    authToken?: string;
    auth_token?: string;
    access_token?: string;
    user?: Record<string, unknown>;
    id?: unknown;
    email?: string;
    name?: string;
  };
  const token =
    body.token ?? body.authToken ?? body.auth_token ?? body.access_token ?? "";
  const apiUser =
    typeof body.user === "object" && body.user !== null
      ? body.user
      : { ...body, email: payload.email };
  const user = mapApiUserToUser(apiUser);
  if (!user.email) user.email = payload.email;

  if (!token) {
    throw new Error("Login succeeded but no token was returned.");
  }

  return { user, token };
}

export async function signup(payload: {
  email: string;
  password: string;
  name: string;
  companyName?: string;
}): Promise<LoginResponse> {
  return mockPost({
    user: {
      id: "u-new",
      email: payload.email,
      name: payload.name,
      role: "company_employee",
      companyId: "c-new",
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    token: "mock-jwt-token-" + Date.now(),
  });
}

export async function resetPassword(payload: {
  email: string;
}): Promise<{ success: boolean }> {
  return mockPost({ success: true });
}

export async function getCurrentUser(token: string): Promise<User | null> {
  const user = await mockGet(MOCK_USER);
  return user;
}
