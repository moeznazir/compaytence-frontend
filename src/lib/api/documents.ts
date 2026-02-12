import type { Document } from "@/lib/types";
import { mockGet, mockPost } from "./client";

const MOCK_DOCUMENTS: Document[] = [
  {
    id: "d1",
    name: "Policy 2024.pdf",
    type: "policy",
    modifiedAt: "2024-01-15T10:00:00Z",
    companyId: "c1",
  },
  {
    id: "d2",
    name: "Compliance Report.pdf",
    type: "report",
    modifiedAt: "2024-01-10T14:30:00Z",
    companyId: "c1",
  },
];

export async function getDocuments(params?: {
  type?: string;
  modifiedAfter?: string;
}): Promise<Document[]> {
  let list = [...MOCK_DOCUMENTS];
  if (params?.type) {
    list = list.filter((d) => d.type === params.type);
  }
  if (params?.modifiedAfter) {
    list = list.filter(
      (d) => new Date(d.modifiedAt) >= new Date(params!.modifiedAfter!)
    );
  }
  return mockGet(list);
}

export async function getDocumentUrl(id: string): Promise<{ url: string }> {
  return mockGet({ url: "#" });
}
