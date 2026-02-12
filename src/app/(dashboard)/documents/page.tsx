"use client";

import { useEffect, useState } from "react";
import { getDocuments } from "@/lib/api/documents";
import type { Document } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Loading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";
import { formatDate } from "@/lib/utils/format";
import { RequirePermission } from "@/lib/rbac";
import { FileText } from "lucide-react";

const DOC_TYPES = [
  { value: "", label: "All types" },
  { value: "policy", label: "Policy" },
  { value: "report", label: "Report" },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = () => {
    setLoading(true);
    getDocuments({
      type: filterType || undefined,
      modifiedAfter: filterDate || undefined,
    })
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filterType, filterDate]);

  const openModal = (doc: Document) => {
    setSelectedDoc(doc);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
        <p className="mt-1 text-sm text-slate-500">
          View documents for your company. Content is not rendered (privacy).
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-medium text-slate-900">Document list</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            >
              {DOC_TYPES.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-40"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loading />
            </div>
          ) : documents.length === 0 ? (
            <Empty
              icon="document"
              title="No documents"
              description="No documents match your filters."
            />
          ) : (
            <ul className="divide-y divide-slate-200">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between py-3 first:pt-0"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">{doc.name}</p>
                      <p className="text-xs text-slate-500">
                        {doc.type} · Modified {formatDate(doc.modifiedAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openModal(doc)}
                  >
                    View details
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedDoc?.name}
        footer={
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedDoc && (
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Type:</span> {selectedDoc.type}
            </p>
            <p>
              <span className="text-slate-500">Modified:</span>{" "}
              {formatDate(selectedDoc.modifiedAt)}
            </p>
            <p className="pt-4 text-slate-500 italic">
              Document content is not displayed for privacy reasons.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
