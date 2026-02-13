"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCompany, updateCompany } from "@/lib/api/companies";
import { getEmployees, updateEmployee } from "@/lib/api/employees";
import type { Company, User } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { hasPermission } from "@/lib/rbac";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Loading } from "@/components/ui/loading";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { toast } from "sonner";

const ROLE_OPTIONS: SelectOption[] = [
  { value: "company_admin", label: "Company Admin" },
  { value: "company_employee", label: "Company Employee" },
  { value: "super_admin", label: "Super Admin" },
  { value: "super_editor", label: "Super Editor" },
];

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const user = useAuthStore((s) => s.user);

  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [employeeModal, setEmployeeModal] = useState<User | null>(null);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeRole, setEmployeeRole] = useState("");
  const [employeeEnabled, setEmployeeEnabled] = useState(true);
  const [searchEmp, setSearchEmp] = useState("");

  const canEditCompany =
    !!user &&
    ((hasPermission(user.role, "edit_own_company") && user.companyId === id) ||
      (hasPermission(user.role, "edit_any_company") && user.companyId !== id) ||
      user.role === "super_admin");

  const canManageEmployees = user && hasPermission(user.role, "manage_employees");

  useEffect(() => {
    getCompany(id)
      .then((c) => {
        setCompany(c ?? null);
        setEditName(c?.name ?? "");
        setEditSlug(c?.slug ?? "");
      })
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getEmployees(id, searchEmp || undefined).then(setEmployees).catch(() => setEmployees([]));
  }, [id, searchEmp]);

  const handleSaveCompany = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await updateCompany(id, { name: editName, slug: editSlug });
      setCompany(updated);
      toast.success("Company updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const openEmployeeModal = (emp: User) => {
    setEmployeeModal(emp);
    setEmployeeName(emp.name);
    setEmployeeRole(emp.role);
    setEmployeeEnabled(emp.enabled);
  };

  const handleSaveEmployee = async () => {
    if (!employeeModal) return;
    setSaving(true);
    try {
      await updateEmployee(employeeModal.id, {
        name: employeeName,
        role: employeeRole as User["role"],
        enabled: employeeEnabled,
      });
      setEmployeeModal(null);
      getEmployees(id, searchEmp || undefined).then(setEmployees);
      toast.success("Employee updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loading size="lg" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
        Company not found.
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900">{company.name}</h1>
      </div>

      <Tabs
        tabs={[
          { id: "details", label: "Details", count: undefined },
          { id: "employees", label: "Employees", count: employees.length },
          {
            id: "website",
            label: "Website sections",
            count: company.websiteSections?.length ?? 0,
          },
        ]}
      >
        <TabPanel>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-slate-900">Company details</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={!canEditCompany}
              />
              <Input
                label="Slug"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                disabled={!canEditCompany}
              />
              {canEditCompany && (
                <Button onClick={handleSaveCompany} isLoading={saving}>
                  Save changes
                </Button>
              )}
            </CardContent>
          </Card>
        </TabPanel>
        <TabPanel>
          {canManageEmployees ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <h2 className="text-lg font-medium text-slate-900">Employees</h2>
                <Input
                  placeholder="Search by name..."
                  value={searchEmp}
                  onChange={(e) => setSearchEmp(e.target.value)}
                  className="w-48"
                />
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-slate-200">
                  {employees.map((emp) => (
                    <li
                      key={emp.id}
                      className="flex items-center justify-between py-3 first:pt-0"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.email}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEmployeeModal(emp)}
                      >
                        Edit
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                You don&apos;t have permission to manage employees.
              </CardContent>
            </Card>
          )}
        </TabPanel>
        <TabPanel>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-slate-900">Website sections</h2>
              {hasPermission(user?.role ?? "company_employee", "manage_website_sections") && (
                <p className="text-sm text-slate-500">Full CRUD supported when wired.</p>
              )}
            </CardHeader>
            <CardContent>
              {company.websiteSections?.length ? (
                <ul className="space-y-2">
                  {company.websiteSections.map((s) => (
                    <li key={s.id} className="border border-slate-200 rounded-lg p-3">
                      <p className="font-medium text-slate-900">{s.title}</p>
                      <p className="text-sm text-slate-500 truncate">{s.content}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">No website sections.</p>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Tabs>

      <Modal
        open={!!employeeModal}
        onClose={() => setEmployeeModal(null)}
        title="Edit employee"
        footer={
          <>
            <Button variant="outline" onClick={() => setEmployeeModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEmployee} isLoading={saving}>
              Save
            </Button>
          </>
        }
      >
        {employeeModal && (
          <div className="space-y-4">
            <Input
              label="Username / Name"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
            />
            <Select
              label="Role"
              options={ROLE_OPTIONS}
              value={employeeRole}
              onChange={(e) => setEmployeeRole(e.target.value)}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={employeeEnabled}
                onChange={(e) => setEmployeeEnabled(e.target.checked)}
              />
              <span className="text-sm">Enabled</span>
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
