"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { login } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await login(data);
      setAuth(res.user, res.token);
      toast.success("Signed in successfully");
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid email or password";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="text-sm text-slate-500">
          Enter your credentials to access the platform.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="flex items-center justify-between text-sm">
            <Link
              href="/reset-password"
              className="text-slate-600 hover:text-slate-900"
            >
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
