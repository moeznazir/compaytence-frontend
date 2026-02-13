import type { User, UserRole } from "@/lib/types";
import { mockGet, mockPost } from "./client";
import { externalGet, externalPost } from "./external-client";

const MOCK_USER: User = {
  id: "u1",
  email: "admin@example.com",
  name: "Admin User",
  role: "super_admin",
  companyId: "c1",
  companyProfileId: null,
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
    companyProfileId: apiUser.company_profile_id != null ? String(apiUser.company_profile_id) : null,
    enabled: apiUser.enabled !== false,
    createdAt:
      typeof apiUser.created_at === "string"
        ? apiUser.created_at
        : new Date().toISOString(),
  };
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const body = await externalPost<Record<string, unknown>>(
    "xanoAuth",
    "/auth/login",
    { email: payload.email, password: payload.password },
    { auth: false, skipEnsureAuthorized: true, errorFallback: "Invalid email or password" }
  );

  const obj = body && typeof body === "object" ? body : {};
  const token =
    (obj.token ?? obj.authToken ?? obj.auth_token ?? obj.access_token ?? "") as string;
  const apiUser =
    typeof obj.user === "object" && obj.user !== null
      ? (obj.user as Record<string, unknown>)
      : ({ ...obj, email: payload.email } as Record<string, unknown>);
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
      companyProfileId: null,
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

/**
 * GET auth/me – fetch current user details using the auth token.
 * Call after login to get full user (e.g. company_id) from the backend.
 */
export async function getMe(token: string): Promise<User> {
  const data = await externalGet<Record<string, unknown>>("xanoAuth", "/auth/me", {
    token,
    errorFallback: "Failed to load user",
  });
  const apiUser = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>;
  return mapApiUserToUser(apiUser);
}

export async function getCurrentUser(token: string): Promise<User | null> {
  const user = await mockGet(MOCK_USER);
  return user;
}
