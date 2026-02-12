import type { Notification } from "@/lib/types";
import { mockGet, mockPost } from "./client";

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "approval",
    title: "Assessment approved",
    message: "Q1 2024 Risk Assessment has been approved.",
    entityId: "ra1",
    entityType: "risk_assessment",
    status: "approved",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "n2",
    type: "rejection",
    title: "PSP rejected",
    message: "PSP Q1 2024 was rejected. You can refill and resubmit.",
    entityId: "psp1",
    entityType: "psp",
    status: "rejected",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

export async function getNotifications(): Promise<Notification[]> {
  return mockGet(MOCK_NOTIFICATIONS);
}

export async function markNotificationRead(id: string): Promise<void> {
  await mockPost(undefined);
}
