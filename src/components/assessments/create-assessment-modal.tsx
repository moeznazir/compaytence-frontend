"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ModuleType } from "@/lib/types";
import { createAssessment } from "@/lib/api/assessments";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
});

type FormData = z.infer<typeof schema>;

interface CreateAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  moduleType: ModuleType;
  onCreated: () => void;
}

export function CreateAssessmentModal({
  open,
  onClose,
  moduleType,
  onCreated,
}: CreateAssessmentModalProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createAssessment({
        title: data.title,
        moduleType,
      });
      reset();
      toast.success(moduleType === "risk_assessment" ? "Assessment created" : "PSP created");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={moduleType === "risk_assessment" ? "New Risk Assessment" : "New PSP"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={loading}>
            Create
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Title"
          error={errors.title?.message}
          {...register("title")}
          placeholder="e.g. Q1 2024 Risk Assessment"
        />
      </form>
    </Modal>
  );
}
