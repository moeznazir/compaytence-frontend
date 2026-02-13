"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/auth-store";
import { hasPermission } from "@/lib/rbac";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: user
      ? { name: user.name, email: user.email }
      : undefined,
  });

  const canEdit = user && hasPermission(user.role, "edit_profile");

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setSaving(true);
    try {
      setUser({ ...user, name: data.name, email: data.email });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
        Not signed in.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your account details and role.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Account</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {user.role.replace(/_/g, " ")}
            </span>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Name"
              error={errors.name?.message}
              {...register("name")}
              disabled={!canEdit}
            />
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register("email")}
              disabled={!canEdit}
            />
            {canEdit && (
              <Button type="submit" isLoading={saving}>
                Save changes
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
