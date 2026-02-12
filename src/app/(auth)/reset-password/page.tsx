"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPassword } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Invalid email"),
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await resetPassword(data);
      setSent(true);
      toast.success("Check your email for reset instructions");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold text-slate-900">Check your email</h1>
          <p className="text-sm text-slate-500">
            If an account exists for that email, we&apos;ve sent reset instructions.
          </p>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h1 className="text-xl font-semibold text-slate-900">Forgot password</h1>
        <p className="text-sm text-slate-500">
          Enter your email and we&apos;ll send you a reset link.
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
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Send reset link
          </Button>
          <p className="text-center text-sm text-slate-500">
            <Link href="/login" className="font-medium text-slate-900 hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
