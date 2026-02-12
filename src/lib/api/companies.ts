import type { Company } from "@/lib/types";
import { mockGet, mockPost } from "./client";

const MOCK_COMPANIES: Company[] = [
  {
    id: "c1",
    name: "Acme Corp",
    slug: "acme-corp",
    websiteSections: [
      { id: "ws1", title: "About", content: "About us...", order: 1 },
      { id: "ws2", title: "Contact", content: "Contact...", order: 2 },
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "c2",
    name: "Beta Inc",
    slug: "beta-inc",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
];

export async function getCompanies(search?: string): Promise<Company[]> {
  let list = [...MOCK_COMPANIES];
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }
  return mockGet(list);
}

export async function getCompany(id: string): Promise<Company | null> {
  const found = MOCK_COMPANIES.find((c) => c.id === id);
  return mockGet(found ?? null);
}

export async function updateCompany(
  id: string,
  data: Partial<Pick<Company, "name" | "slug" | "websiteSections">>
): Promise<Company> {
  return mockPost({
    ...MOCK_COMPANIES.find((c) => c.id === id),
    ...data,
    updatedAt: new Date().toISOString(),
  } as Company);
}
