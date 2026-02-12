"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCompanies } from "@/lib/api/companies";
import type { Company } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { hasPermission } from "@/lib/rbac";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";
import { RequirePermission } from "@/lib/rbac";
import { Building2, Search } from "lucide-react";

export default function CompaniesPage() {
  const user = useAuthStore((s) => s.user);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const canViewAll = user && hasPermission(user.role, "manage_all_companies");

  useEffect(() => {
    getCompanies(search || undefined)
      .then((list) => {
        if (!canViewAll && user?.companyId) {
          setCompanies(list.filter((c) => c.id === user.companyId));
        } else {
          setCompanies(list);
        }
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, [search, canViewAll, user?.companyId]);

  useEffect(() => {
    if (!user) setCompanies([]);
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>
        <p className="mt-1 text-sm text-slate-500">
          {canViewAll
            ? "View and manage all companies."
            : "View your company details."}
        </p>
      </div>

      <RequirePermission permission="view_companies">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <h2 className="text-lg font-medium text-slate-900">Companies</h2>
            {canViewAll && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loading />
              </div>
            ) : companies.length === 0 ? (
              <Empty
                title="No companies"
                description="No companies match your search."
              />
            ) : (
              <ul className="divide-y divide-slate-200">
                {companies.map((company) => (
                  <li key={company.id} className="py-3 first:pt-0">
                    <Link
                      href={`/companies/${company.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-slate-50"
                    >
                      <Building2 className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900">{company.name}</p>
                        <p className="text-xs text-slate-500">{company.slug}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </RequirePermission>
    </div>
  );
}
