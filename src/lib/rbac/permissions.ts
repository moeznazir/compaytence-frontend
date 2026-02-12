import type { UserRole } from "@/lib/types";

export type Permission =
  | "view_dashboard"
  | "view_documents"
  | "upload_csv"
  | "view_risk_assessments"
  | "view_psps"
  | "create_assessment"
  | "create_psp"
  | "submit_assessment"
  | "submit_psp"
  | "approve_reject"
  | "override_submission"
  | "edit_any_company"
  | "edit_own_company"
  | "view_website_sections"
  | "manage_website_sections"
  | "manage_employees"
  | "manage_all_companies"
  | "manage_all_assessments"
  | "add_public_report"
  | "edit_public_report"
  | "crud_improvements"
  | "mark_improvement_complete"
  | "override_improvement"
  | "add_comment"
  | "delete_comment"
  | "view_companies"
  | "view_profile"
  | "edit_profile";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    "view_dashboard",
    "view_documents",
    "upload_csv",
    "view_risk_assessments",
    "view_psps",
    "create_assessment",
    "create_psp",
    "submit_assessment",
    "submit_psp",
    "approve_reject",
    "override_submission",
    "edit_any_company",
    "edit_own_company",
    "view_website_sections",
    "manage_website_sections",
    "manage_employees",
    "manage_all_companies",
    "manage_all_assessments",
    "add_public_report",
    "edit_public_report",
    "crud_improvements",
    "mark_improvement_complete",
    "override_improvement",
    "add_comment",
    "delete_comment",
    "view_companies",
    "view_profile",
    "edit_profile",
  ],
  super_editor: [
    "view_dashboard",
    "view_documents",
    "view_risk_assessments",
    "view_psps",
    "create_assessment",
    "create_psp",
    "submit_assessment",
    "submit_psp",
    "edit_any_company",
    "view_website_sections",
    "manage_website_sections",
    "add_comment",
    "delete_comment",
    "view_companies",
    "view_profile",
    "edit_profile",
  ],
  company_admin: [
    "view_dashboard",
    "view_documents",
    "upload_csv",
    "view_risk_assessments",
    "view_psps",
    "create_assessment",
    "create_psp",
    "submit_assessment",
    "submit_psp",
    "edit_own_company",
    "manage_employees",
    "add_comment",
    "delete_comment",
    "mark_improvement_complete",
    "view_profile",
    "edit_profile",
  ],
  company_employee: [
    "view_dashboard",
    "view_documents",
    "view_risk_assessments",
    "view_psps",
    "create_assessment",
    "create_psp",
    "submit_assessment",
    "submit_psp",
    "add_comment",
    "mark_improvement_complete",
    "view_profile",
    "edit_profile",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
