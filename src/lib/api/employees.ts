import type { User } from "@/lib/types";
import { mockGet, mockPost } from "./client";

const MOCK_EMPLOYEES: User[] = [
  {
    id: "u1",
    email: "admin@acme.com",
    name: "Admin User",
    role: "company_admin",
    companyId: "c1",
    companyProfileId: null,
    enabled: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "u2",
    email: "john@acme.com",
    name: "John Doe",
    role: "company_employee",
    companyId: "c1",
    companyProfileId: null,
    enabled: true,
    createdAt: "2024-01-15T00:00:00Z",
  },
];

export async function getEmployees(companyId: string, search?: string): Promise<User[]> {
  let list = MOCK_EMPLOYEES.filter((e) => e.companyId === companyId);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    );
  }
  return mockGet(list);
}

export async function updateEmployee(
  id: string,
  data: Partial<Pick<User, "name" | "role" | "enabled">>
): Promise<User> {
  const user = MOCK_EMPLOYEES.find((e) => e.id === id);
  return mockPost({ ...user, ...data } as User);
}
